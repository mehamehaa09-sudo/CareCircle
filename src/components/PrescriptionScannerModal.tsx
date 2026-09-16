import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, LoaderCircle, RotateCcw, ScanText, X } from 'lucide-react';
import { createWorker, PSM } from 'tesseract.js';

interface PrescriptionScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTextExtracted: (text: string) => void;
}

export const PrescriptionScannerModal: React.FC<PrescriptionScannerModalProps> = ({
  isOpen,
  onClose,
  onTextExtracted,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setExtractedText('');
      setError('');
      setProgress(0);
    }

    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    setError('');
    setIsStartingCamera(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is unavailable. Open the site on HTTPS or localhost.');
      }

      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (cameraError) {
      const message = cameraError instanceof DOMException && cameraError.name === 'NotAllowedError'
        ? 'Camera permission was blocked. Allow camera access in the browser address bar and try again.'
        : cameraError instanceof Error
          ? cameraError.message
          : 'Could not open the camera.';
      setError(message);
    } finally {
      setIsStartingCamera(false);
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      setError('Wait for the camera preview to load before capturing.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL('image/png'));
    stopCamera();
    setError('');
  };

  const prepareImageForOcr = (imageDataUrl: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(2, 2400 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          reject(new Error('Could not prepare the prescription image.'));
          return;
        }

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = pixels.data;
        for (let index = 0; index < data.length; index += 4) {
          const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
          const contrast = Math.max(0, Math.min(255, (gray - 128) * 1.55 + 128));
          data[index] = contrast;
          data[index + 1] = contrast;
          data[index + 2] = contrast;
        }
        context.putImageData(pixels, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      image.onerror = () => reject(new Error('Could not load the captured prescription.'));
      image.src = imageDataUrl;
    });

  const scanImage = async () => {
    if (!capturedImage) return;

    setIsScanning(true);
    setProgress(0);
    setError('');
    try {
      const visionResponse = await fetch('/api/scan-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: capturedImage }),
      });

      if (visionResponse.ok) {
        const visionResult = await visionResponse.json();
        if (visionResult.text?.trim()) {
          setExtractedText(visionResult.text.trim());
          setProgress(100);
          return;
        }
      }

      // Keep local OCR available when the vision API is unavailable or not configured.
      const preparedImage = await prepareImageForOcr(capturedImage);
      const worker = await createWorker('eng', 1, {
        logger: (message) => {
          if (message.status === 'recognizing text') setProgress(Math.round(message.progress * 100));
        },
      });
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        preserve_interword_spaces: '1',
      });
      const result = await worker.recognize(preparedImage);

      // Sparse-text mode helps when the prescription has separated medication rows.
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
      const sparseResult = await worker.recognize(preparedImage);
      await worker.terminate();
      const structuredText = result.data.text.trim();
      const sparseText = sparseResult.data.text.trim();
      setExtractedText(sparseText.length > structuredText.length ? sparseText : structuredText);
    } catch (scanError) {
      console.error('Prescription OCR error:', scanError);
      setError('I could not read this image. Retake it with the prescription flat, bright, and in focus.');
    } finally {
      setIsScanning(false);
    }
  };

  const useText = () => {
    if (extractedText.trim()) {
      onTextExtracted(extractedText.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border-2 border-yellow-300 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-yellow-100 bg-amber-50/80 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-amber-950">
              <ScanText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-amber-950">Scan Prescription</h2>
              <p className="text-xs text-amber-800/80">Capture it, review the text, then send it to your report tool.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close scanner" className="rounded-lg p-2 text-amber-700 hover:bg-amber-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4 sm:p-6">
          {!capturedImage ? (
            <div className="overflow-hidden rounded-2xl border-2 border-dashed border-amber-300 bg-slate-950">
              <video ref={videoRef} className="aspect-[4/3] w-full object-cover" playsInline muted />
              <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-950 p-3">
                <button type="button" onClick={startCamera} disabled={isStartingCamera} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-amber-950 disabled:opacity-50">
                  {isStartingCamera ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  {isStartingCamera ? 'Opening camera...' : 'Open Camera'}
                </button>
                <button type="button" onClick={captureImage} disabled={!streamRef.current} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
                  <Camera className="h-4 w-4" />
                  Capture Prescription
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <img src={capturedImage} alt="Captured prescription" className="max-h-72 w-full rounded-2xl border border-amber-200 bg-slate-50 object-contain" />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { setCapturedImage(null); setExtractedText(''); setProgress(0); }} className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950">
                  <RotateCcw className="h-4 w-4" /> Retake
                </button>
                <button type="button" onClick={scanImage} disabled={isScanning} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-amber-950 disabled:opacity-50">
                  {isScanning ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ScanText className="h-4 w-4" />}
                  {isScanning ? `Reading ${progress}%` : 'Read Prescription'}
                </button>
              </div>
            </div>
          )}

          {extractedText && (
            <div className="space-y-2">
              <label htmlFor="prescription-ocr-text" className="text-xs font-bold text-amber-950">Review extracted text</label>
              <textarea id="prescription-ocr-text" value={extractedText} onChange={(event) => setExtractedText(event.target.value)} rows={7} className="w-full rounded-2xl border border-amber-300 bg-amber-50/30 p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400" />
              <button type="button" onClick={useText} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white">
                <Check className="h-4 w-4" /> Use This Text
              </button>
            </div>
          )}

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p>}
          <p className="text-[11px] text-slate-500">OCR can make mistakes. Always review the extracted prescription before using it for medication decisions.</p>
        </div>
      </div>
    </div>
  );
};
