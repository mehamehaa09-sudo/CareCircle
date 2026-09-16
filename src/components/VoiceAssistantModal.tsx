import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Sparkles,
  CheckCircle2,
  PhoneCall,
  RotateCcw,
  User,
  Clock,
  Pill,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../context/LanguageContext';
import {
  LanguageCode,
  Medication,
  DoseLog,
  UserProfile,
  VoiceChatMessage,
  VoiceAssistantAction,
  VoiceAssistantCitation,
} from '../types';
import { playTone } from '../utils/audioAlarm';
import { CareCircleMascot } from './CareCircleMascot';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  medications: Medication[];
  todayDoses: DoseLog[];
  onUpdateDoseStatus: (doseId: string, status: 'taken' | 'pending' | 'skipped') => void;
  onInitiateCall: () => void;
}

const VOICE_LANG_MAP: Record<LanguageCode, { bcp47: string; name: string; nativeName: string }> = {
  en: { bcp47: 'en-US', name: 'English', nativeName: 'English' },
  ta: { bcp47: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
  hi: { bcp47: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
  ml: { bcp47: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം' },
};

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  medications,
  todayDoses,
  onUpdateDoseStatus,
  onInitiateCall,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [activeVoiceLang, setActiveVoiceLang] = useState<LanguageCode>(language);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [recognitionError, setRecognitionError] = useState('');

  // Chat message history
  const [messages, setMessages] = useState<VoiceChatMessage[]>([]);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync active voice language with app language when modal opens or language changes
  useEffect(() => {
    setActiveVoiceLang(language);
  }, [language, isOpen]);

  // Initial welcome message per language
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessages: Record<LanguageCode, string> = {
        en: `Hello ${userProfile.name}! I am your CareCircle Voice Assistant. Speak or ask me anything in English, Tamil, Hindi, or Malayalam.`,
        ta: `வணக்கம் ${userProfile.name}! நான் உங்கள் கேர்சர்க்கிள் குரல் உதவியாளர். மருந்துகள் பற்றி எதையும் தமிழில் கேளுங்கள்.`,
        hi: `नमस्ते ${userProfile.name}! मैं आपका केयरसर्कल वॉयस असिस्टेंट हूँ। अपनी दवाओं के बारे में कुछ भी हिंदी में पूछें।`,
        ml: `നമസ്കാരം ${userProfile.name}! ഞാൻ നിങ്ങളുടെ കെയർസർക്കിൾ വോയ്‌സ് അസിസ്റ്റന്റാണ്. മരുന്നുകളെക്കുറിച്ച് മലയാളത്തിൽ ചോദിക്കാം.`,
      };

      setMessages([
        {
          id: 'welcome-1',
          sender: 'assistant',
          text: welcomeMessages[activeVoiceLang] || welcomeMessages.en,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [isOpen, activeVoiceLang, userProfile.name]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript, isLoading]);

  // Check browser SpeechRecognition support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Recognition may already be stopped.
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, [isOpen]);

  // Text-To-Speech function using window.speechSynthesis
  const speakText = (text: string, langCode: LanguageCode) => {
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop any active speech

      const utterance = new SpeechSynthesisUtterance(text);
      const bcp = VOICE_LANG_MAP[langCode]?.bcp47 || 'en-US';
      utterance.lang = bcp;
      utterance.rate = 0.92; // Slightly slower, calm cadence for elderly listeners
      utterance.pitch = 1.0;

      // Try finding the matching voice for the language
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find((v) => v.lang.replace('_', '-').startsWith(bcp.slice(0, 2)));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
    }
  };

  // Stop current speech playback
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Start Voice Recognition
  const startListening = () => {
    stopSpeaking();
    setRecognitionError('');
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setRecognitionError(t('voiceAssistanceNotSupported'));
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = VOICE_LANG_MAP[activeVoiceLang]?.bcp47 || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        let hasFinalResult = false;
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
          hasFinalResult = hasFinalResult || event.results[i].isFinal;
        }
        setInterimTranscript(currentTranscript);

        if (hasFinalResult) {
          const finalQuery = currentTranscript.trim();
          setIsListening(false);
          setInterimTranscript('');
          if (finalQuery) {
            handleSendMessage(finalQuery);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setInterimTranscript('');
        const errorMessages: Record<string, string> = {
          'not-allowed': 'Microphone access was blocked. Allow microphone permission for this site and try again.',
          'service-not-allowed': 'Speech recognition is blocked by the browser. Try Chrome or Edge on HTTPS or localhost.',
          'audio-capture': 'No microphone was found. Check that a microphone is connected and enabled.',
          network: 'Speech recognition needs an internet connection. Check your connection and try again.',
          aborted: 'Listening stopped. Tap the microphone to try again.',
        };
        setRecognitionError(errorMessages[event.error] || 'I could not hear you. Check your microphone and try again.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setRecognitionError('I could not start the microphone. Check browser permission and try again.');
    }
  };

  // Stop Voice Recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        recognitionRef.current.abort();
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  // Execute detected assistant action
  const executeAssistantAction = (action?: VoiceAssistantAction) => {
    if (!action || action.type === 'none') return;

    if (action.type === 'mark_taken') {
      // Find pending dose matching the medication name or take the first pending dose
      let targetDose = todayDoses.find(
        (d) =>
          d.status === 'pending' &&
          action.medicationName &&
          medications.find((m) => m.id === d.medicationId)?.name.toLowerCase().includes(action.medicationName.toLowerCase())
      );

      if (!targetDose) {
        targetDose = todayDoses.find((d) => d.status === 'pending');
      }

      if (targetDose) {
        onUpdateDoseStatus(targetDose.id, 'taken');
        playTone('gentle-bell', 0.8);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#F59E0B', '#10B981', '#3B82F6', '#FBBF24'],
        });
      }
    } else if (action.type === 'call_caretaker' || action.type === 'call_senior') {
      setTimeout(() => {
        onInitiateCall();
      }, 800);
    }
  };

  // Send message to backend Gemini Voice Assistant
  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMsg: VoiceChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentDate = now.toISOString().split('T')[0];

      // Prepare medications with names for context
      const preparedMeds = medications.map((m) => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        form: m.form,
        instructions: m.instructions,
        times: m.times.map((t) => ({ time: t.time, label: t.label })),
        notes: m.notes,
        durationDays: m.durationDays,
        durationType: m.durationType,
      }));

      // Prepare today's doses with medication names
      const preparedDoses = todayDoses.map((d) => {
        const med = medications.find((m) => m.id === d.medicationId);
        return {
          medicationId: d.medicationId,
          medicationName: med?.name || 'Medicine',
          time: d.time,
          label: d.label,
          status: d.status,
          takenAt: d.takenAt,
        };
      });

      const response = await fetch('/api/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          language: activeVoiceLang,
          userRole: userProfile.role,
          userName: userProfile.name,
          partnerName: userProfile.role === 'elderly' ? userProfile.caretakerName : userProfile.elderlyName,
          currentTime,
          currentDate,
          medications: preparedMeds,
          todayDoses: preparedDoses,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.replyText || 'I am here to help you with your medications.';
      const action = data.action;
      const citations = Array.isArray(data.citations) ? data.citations as VoiceAssistantCitation[] : [];

      const assistantMsg: VoiceChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        action,
        citations,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Execute any detected action
      if (action && action.type !== 'none') {
        executeAssistantAction(action);
      }

      // Auto-speak response if enabled
      if (autoSpeak) {
        speakText(replyText, activeVoiceLang);
      }
    } catch (err) {
      console.error('Error fetching voice assistant reply:', err);
      const fallbackReplies: Record<LanguageCode, string> = {
        en: `I am here to help! You have ${medications.length} scheduled medications. You can ask what to take next or say "I took my medicine".`,
        ta: `நான் உதவ தயாராக உள்ளேன்! உங்களுக்கு ${medications.length} திட்டமிடப்பட்ட மருந்துகள் உள்ளன. அடுத்த மருந்து என்னவென்று கேட்கலாம்.`,
        hi: `मैं आपकी मदद के लिए यहाँ हूँ! आपकी ${medications.length} दवाएं निर्धारित हैं। आप अगली दवा के बारे में पूछ सकते हैं।`,
        ml: `ഞാൻ സഹായിക്കാൻ ഇവിടെയുണ്ട്! നിങ്ങൾക്ക് ${medications.length} മരുന്നുകൾ ഷെഡ്യൂൾ ചെയ്തിട്ടുണ്ട്. അടുത്ത മരുന്ന് ഏതെന്ന് ചോദിക്കാം.`,
      };

      const fallbackText = fallbackReplies[activeVoiceLang] || fallbackReplies.en;
      const errorMsg: VoiceChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);

      if (autoSpeak) {
        speakText(fallbackText, activeVoiceLang);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Language suggestions
  const getSuggestions = (lang: LanguageCode) => {
    switch (lang) {
      case 'ta':
        return [
          { text: 'எனக்கு அடுத்த மருந்து என்ன?', icon: '💊' },
          { text: 'இன்று காலை மருந்து சாப்பிட்டேனா?', icon: '☀️' },
          { text: 'நான் மருந்தை எடுத்துவிட்டேன்', icon: '✅' },
          { text: 'கவனிப்பாளரை அழைக்கவும்', icon: '📞' },
        ];
      case 'hi':
        return [
          { text: 'मेरी अगली दवा कौन सी है?', icon: '💊' },
          { text: 'क्या मैंने सुबह की दवा ले ली?', icon: '☀️' },
          { text: 'मैंने अपनी दवा ले ली है', icon: '✅' },
          { text: 'देखभालकर्ता को कॉल करें', icon: '📞' },
        ];
      case 'ml':
        return [
          { text: 'എന്റെ അടുത്ത മരുന്ന് ഏതാണ്?', icon: '💊' },
          { text: 'രാവിലത്തെ മരുന്ന് കഴിച്ചോ?', icon: '☀️' },
          { text: 'ഞാൻ മരുന്ന് കഴിച്ചു', icon: '✅' },
          { text: 'കെയർടേക്കറെ വിളിക്കുക', icon: '📞' },
        ];
      case 'en':
      default:
        return [
          { text: 'What is my next medicine?', icon: '💊' },
          { text: 'Did I take my morning medicine?', icon: '☀️' },
          { text: 'I took my medicine', icon: '✅' },
          { text: 'Call my caregiver', icon: '📞' },
        ];
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-amber-50/95 border-2 border-amber-300 rounded-3xl shadow-2xl w-full max-w-xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 px-5 py-4 flex items-center justify-between border-b border-amber-300">
          <div className="flex items-center space-x-3">
            <CareCircleMascot size="md" speaking={isSpeaking || isLoading} />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-amber-950">
                  {t('voiceAssistant')}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/90 text-amber-900 border border-amber-400 flex items-center space-x-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                  <span>Gemini AI</span>
                </span>
              </div>
              <p className="text-xs text-amber-900/90 font-medium">
                Tamil • English • Malayalam • Hindi
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Auto-speak toggle */}
            <button
              type="button"
              id="btn-toggle-auto-speak"
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setAutoSpeak(!autoSpeak);
              }}
              title={autoSpeak ? 'Auto-speak enabled' : 'Auto-speak muted'}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                autoSpeak
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  : 'bg-amber-200/60 text-amber-700/60 line-through'
              }`}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close button */}
            <button
              type="button"
              id="btn-close-voice-assistant"
              onClick={() => {
                stopSpeaking();
                stopListening();
                onClose();
              }}
              className="p-2 rounded-xl bg-amber-200/70 hover:bg-amber-300 text-amber-950 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Language Tabs bar */}
        <div className="bg-amber-100/80 px-4 py-2.5 border-b border-amber-200 flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
            <span>Language:</span>
          </span>
          <div className="flex items-center space-x-1.5">
            {(['en', 'ta', 'ml', 'hi'] as LanguageCode[]).map((code) => {
              const langInfo = VOICE_LANG_MAP[code];
              const isSelected = activeVoiceLang === code;
              return (
                <button
                  key={code}
                  type="button"
                  id={`btn-voice-lang-${code}`}
                  onClick={() => {
                    setActiveVoiceLang(code);
                    setLanguage(code);
                    stopSpeaking();
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-sm scale-105'
                      : 'bg-amber-200/70 text-amber-900 hover:bg-amber-300'
                  }`}
                >
                  {langInfo.nativeName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat message thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[40vh] bg-gradient-to-b from-amber-50/50 to-amber-100/30">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'assistant' && (
                <CareCircleMascot size="sm" speaking={isSpeaking} className="mt-0.5" />
              )}

              <div
                className={`max-w-[82%] rounded-2xl p-3.5 shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-amber-600 text-white rounded-tr-xs'
                    : 'bg-white border border-amber-200/90 text-amber-950 rounded-tl-xs'
                }`}
              >
                <div className="text-sm font-medium leading-relaxed whitespace-pre-line">
                  {msg.text}
                </div>

                {/* Action feedback tag if action was triggered */}
                {msg.action && msg.action.type !== 'none' && (
                  <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center space-x-1.5 text-xs font-bold text-amber-800">
                    {msg.action.type === 'mark_taken' && (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{t('voiceActionDone')}: {msg.action.medicationName || 'Medicine'}</span>
                      </>
                    )}
                    {(msg.action.type === 'call_caretaker' || msg.action.type === 'call_senior') && (
                      <>
                        <PhoneCall className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
                        <span>Initiating call...</span>
                      </>
                    )}
                  </div>
                )}

                {msg.sender === 'assistant' && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-amber-200/60 text-[11px] text-amber-800/80">
                    <div className="font-bold text-amber-900">Sources</div>
                    <div className="mt-1 space-y-1">
                      {msg.citations.map((citation) => (
                        <div key={`${msg.id}-citation-${citation.id}`}>
                          <span className="font-bold">[{citation.id}]</span>{' '}
                          {citation.document || citation.source}
                          {citation.page !== null && citation.page !== undefined ? `, page ${citation.page}` : ''}
                          {citation.section ? `, ${citation.section}` : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Speaker icon for assistant messages */}
                {msg.sender === 'assistant' && (
                  <div className="mt-2 pt-1 flex items-center justify-between text-[11px] text-amber-800/70">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => speakText(msg.text, activeVoiceLang)}
                      title="Read aloud"
                      className="p-1 rounded-md hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">Listen</span>
                    </button>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-amber-700 text-amber-100 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Loading bubble */}
          {isLoading && (
            <div className="flex items-start gap-2.5">
              <CareCircleMascot size="sm" speaking className="mt-0.5" />
              <div className="bg-white border border-amber-200/90 rounded-2xl rounded-tl-xs p-3.5 shadow-xs flex items-center space-x-2 text-amber-800 text-xs font-bold">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-1">{t('processing')}</span>
              </div>
            </div>
          )}

          {/* Live listening interim transcript */}
          {isListening && (
            <div className="flex items-center space-x-2 p-3 bg-amber-200/70 border border-amber-300 rounded-2xl animate-pulse">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
              <div className="text-xs font-bold text-amber-950 italic">
                {interimTranscript || t('listening')}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt suggestions */}
        <div className="px-4 py-2.5 bg-amber-100/60 border-t border-amber-200">
          <div className="text-[11px] font-bold text-amber-900/80 mb-1.5 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>{t('tryAsking')}</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {getSuggestions(activeVoiceLang).map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                id={`btn-voice-suggest-${idx}`}
                onClick={() => handleSendMessage(suggestion.text)}
                disabled={isLoading || isListening}
                className="shrink-0 px-2.5 py-1 rounded-xl bg-white border border-amber-300 hover:bg-amber-200/70 text-amber-950 text-xs font-semibold shadow-2xs transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{suggestion.icon}</span>
                <span>{suggestion.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Voice control and input section */}
        <div className="p-4 bg-white border-t border-amber-200 flex flex-col items-center gap-3">
          {/* Big Elderly-Friendly Microphone Button */}
          <div className="relative flex items-center justify-center">
            {isListening && (
              <div className="absolute w-20 h-20 rounded-full bg-amber-400/40 animate-ping pointer-events-none" />
            )}

            <button
              type="button"
              id="btn-voice-mic-main"
              onClick={() => {
                if (isListening) {
                  stopListening();
                } else {
                  startListening();
                }
              }}
              disabled={isLoading}
              className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95 cursor-pointer ${
                isListening
                  ? 'bg-red-500 text-white shadow-red-300 scale-105 ring-4 ring-red-300'
                  : 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-amber-950 hover:brightness-105 ring-4 ring-amber-200 shadow-amber-200'
              }`}
              title={isListening ? t('stopListening') : t('tapToSpeak')}
            >
              {isListening ? (
                <MicOff className="w-7 h-7 animate-pulse" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </button>
          </div>

          <div className="text-center">
            <span className="text-xs font-bold text-amber-950">
              {isListening ? t('listening') : t('tapToSpeak')}
            </span>
            <p className="text-[11px] text-amber-800/80 mt-0.5">
              {VOICE_LANG_MAP[activeVoiceLang]?.name} •{' '}
              {VOICE_LANG_MAP[activeVoiceLang]?.nativeName}
            </p>
          </div>

          {/* Fallback / typed input field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="w-full flex items-center gap-2 mt-1"
          >
            <input
              type="text"
              id="input-voice-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('askVoiceAssistant')}
              disabled={isLoading || isListening}
              className="flex-1 px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50/50 text-amber-950 text-sm placeholder:text-amber-700/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              id="btn-voice-text-send"
              disabled={!inputText.trim() || isLoading || isListening}
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-amber-950 transition-colors cursor-pointer shrink-0"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {!speechSupported && (
            <p className="text-[10px] text-amber-700 text-center">
              {t('voiceAssistanceNotSupported')}
            </p>
          )}

          {recognitionError && (
            <p role="alert" className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-[11px] font-semibold text-red-700">
              {recognitionError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
