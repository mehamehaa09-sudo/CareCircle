import express, { Request, Response } from 'express';
import path from 'node:path';
import { promises as fsPromises } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { composeKnowledgeEvidence, extractTextFromRagIndex, extractTextFromZipBuffer, type KnowledgeCitation, type KnowledgeDocument } from './ragKnowledge.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const execFileAsync = promisify(execFile);
const teammateRagBridge = path.join(process.cwd(), 'rag_bridge.py');
const teammatePython = process.env.RAG_PYTHON_PATH || 'python';

const activeKnowledgeStore: {
  documents: KnowledgeDocument[];
  source: string | null;
  loadedAt: number | null;
} = {
  documents: [],
  source: null,
  loadedAt: null,
};

async function loadKnowledgeFromZipFile(filePath: string): Promise<KnowledgeDocument[]> {
  const buffer = await fsPromises.readFile(filePath);
  return extractTextFromZipBuffer(buffer);
}

async function loadKnowledgeFromIndexFile(filePath: string): Promise<KnowledgeDocument[]> {
  const indexText = await fsPromises.readFile(filePath, 'utf8');
  return extractTextFromRagIndex(indexText);
}

async function loadKnowledgeFromDirectory(directoryPath: string): Promise<KnowledgeDocument[]> {
  const docs: KnowledgeDocument[] = [];
  const entries = await fsPromises.readdir(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filePath = path.join(directoryPath, entry.name);
    const lowerName = entry.name.toLowerCase();
    if (!['.txt', '.md', '.json', '.csv', '.html', '.htm', '.xml', '.yaml', '.yml'].some((extension) => lowerName.endsWith(extension))) {
      continue;
    }

    try {
      const text = (await fsPromises.readFile(filePath, 'utf8')).trim();
      if (text.length >= 20) docs.push({ path: path.relative(process.cwd(), filePath), text });
    } catch {
      // Ignore unreadable supplemental files.
    }
  }

  return docs;
}

async function discoverRagZipPaths(): Promise<string[]> {
  const candidates = new Set<string>();

  if (process.env.RAG_ZIP_PATH) {
    candidates.add(process.env.RAG_ZIP_PATH);
  }

  const rootCandidates = [
    path.join(process.cwd(), 'rag.zip'),
    path.join(process.cwd(), 'knowledge.zip'),
    path.join(process.cwd(), 'dataset.zip'),
    path.join(process.cwd(), 'uploads'),
  ];

  for (const candidate of rootCandidates) {
    try {
      const stat = await fsPromises.stat(candidate);
      if (stat.isDirectory()) {
        const entries = await fsPromises.readdir(candidate, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isFile()) continue;
          const lowerName = entry.name.toLowerCase();
          if (lowerName.endsWith('.zip')) {
            candidates.add(path.join(candidate, entry.name));
          }
        }
      } else if (candidate.toLowerCase().endsWith('.zip')) {
        candidates.add(candidate);
      }
    } catch {
      // Ignore missing files/directories.
    }
  }

  return Array.from(candidates);
}

async function discoverRagKnowledgeSources(): Promise<{ indexPaths: string[]; directories: string[]; zipPaths: string[] }> {
  const indexPaths = [
    process.env.RAG_INDEX_PATH,
    path.join(process.cwd(), 'RAG', 'data', 'rag_index', 'chunks.jsonl'),
  ].filter((candidate): candidate is string => Boolean(candidate));
  const directories = [
    process.env.RAG_KNOWLEDGE_DIR,
    path.join(process.cwd(), 'RAG', 'knowledge'),
  ].filter((candidate): candidate is string => Boolean(candidate));

  return {
    indexPaths: [...new Set(indexPaths)],
    directories: [...new Set(directories)],
    zipPaths: await discoverRagZipPaths(),
  };
}

async function refreshRagKnowledge(force = false): Promise<KnowledgeDocument[]> {
  if (!force && activeKnowledgeStore.documents.length > 0 && activeKnowledgeStore.loadedAt) {
    return activeKnowledgeStore.documents;
  }

  const { indexPaths, directories, zipPaths } = await discoverRagKnowledgeSources();
  const allDocs: KnowledgeDocument[] = [];

  for (const indexPath of indexPaths) {
    try {
      const docs = await loadKnowledgeFromIndexFile(indexPath);
      if (docs.length > 0) {
        allDocs.push(...docs);
        activeKnowledgeStore.source = indexPath;
      }
    } catch (err) {
      console.warn(`[CareCircle RAG] Could not load indexed knowledge from ${indexPath}:`, err instanceof Error ? err.message : err);
    }
  }

  for (const directoryPath of directories) {
    try {
      const docs = await loadKnowledgeFromDirectory(directoryPath);
      if (docs.length > 0) {
        allDocs.push(...docs);
        activeKnowledgeStore.source = directoryPath;
      }
    } catch (err) {
      console.warn(`[CareCircle RAG] Could not load knowledge files from ${directoryPath}:`, err instanceof Error ? err.message : err);
    }
  }

  for (const zipPath of zipPaths) {
    try {
      const docs = await loadKnowledgeFromZipFile(zipPath);
      if (docs.length > 0) {
        allDocs.push(...docs);
        activeKnowledgeStore.source = zipPath;
      }
    } catch (err) {
      console.warn(`[CareCircle RAG] Could not load ZIP knowledge from ${zipPath}:`, err instanceof Error ? err.message : err);
    }
  }

  activeKnowledgeStore.documents = allDocs;
  activeKnowledgeStore.loadedAt = Date.now();

  if (allDocs.length === 0) {
    activeKnowledgeStore.source = null;
  }

  return allDocs;
}

async function getKnowledgeContextForQuestion(question: string): Promise<{ context: string; citations: KnowledgeCitation[] }> {
  const docs = await refreshRagKnowledge(false);
  if (docs.length === 0) {
    return { context: '', citations: [] };
  }

  return composeKnowledgeEvidence(question, docs, 5);
}

function isQuestionLikeQuery(query: string): boolean {
  const lower = query.toLowerCase();
  return /what|who|which|when|where|why|how|tell|explain|summarize|describe|details|about/i.test(lower);
}

function isTeammateKnowledgeQuestion(query: string): boolean {
  const lower = query.toLowerCase();
  if (!isQuestionLikeQuery(lower)) return false;
  return !/next medicine|upcoming medicine|what medicine|what medication|dose|dosage|schedule|took|taken|take my|call my|caregiver|caretaker/i.test(lower);
}

async function answerWithTeammateRag(question: string): Promise<{
  answer: string;
  citations: Array<{ id: number; source: string; document?: string; page?: number | null; section?: string | null; chunk_id?: string }>;
}> {
  const { stdout } = await execFileAsync(teammatePython, [teammateRagBridge, question], {
    cwd: process.cwd(),
    windowsHide: true,
    maxBuffer: 2 * 1024 * 1024,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  });
  const result = JSON.parse(stdout.trim()) as {
    error?: string;
    answer?: string;
    citations?: Array<{ id: number; source: string; document?: string; page?: number | null; section?: string | null; chunk_id?: string }>;
  };

  if (result.error) throw new Error(result.error);
  if (!result.answer) throw new Error('The teammate RAG pipeline returned no answer.');
  return { answer: result.answer, citations: result.citations || [] };
}

async function checkWithTeammatePrescription(prescriptionA: string, prescriptionB: string) {
  const { stdout } = await execFileAsync(teammatePython, [teammateRagBridge, 'prescription', prescriptionA, prescriptionB], {
    cwd: process.cwd(),
    windowsHide: true,
    maxBuffer: 2 * 1024 * 1024,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  });
  const result = JSON.parse(stdout.trim()) as { error?: string; [key: string]: unknown };
  if (result.error) throw new Error(result.error);
  return result;
}

app.use(express.json({ limit: '12mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
  });
});

app.post('/api/health-question', async (req: Request, res: Response) => {
  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
  if (!question) return res.status(400).json({ error: 'question must be a non-empty string.' });
  try {
    const result = await answerWithTeammateRag(question);
    return res.json({ answer: result.answer, citations: result.citations, model: 'teammate_rag' });
  } catch (error) {
    return res.status(503).json({ error: error instanceof Error ? error.message : 'Unable to generate a health answer.' });
  }
});

app.post('/api/prescription-check', async (req: Request, res: Response) => {
  const prescriptionA = typeof req.body?.prescription_a === 'string' ? req.body.prescription_a.trim() : '';
  const prescriptionB = typeof req.body?.prescription_b === 'string' ? req.body.prescription_b.trim() : '';
  if (!prescriptionA) return res.status(400).json({ error: 'prescription_a must be a non-empty string.' });
  try {
    return res.json(await checkWithTeammatePrescription(prescriptionA, prescriptionB));
  } catch (error) {
    return res.status(503).json({ error: error instanceof Error ? error.message : 'Unable to check the prescriptions.' });
  }
});

app.get('/api/rag-knowledge/status', async (_req: Request, res: Response) => {
  const docs = await refreshRagKnowledge(false);

  return res.json({
    status: docs.length > 0 ? 'loaded' : 'empty',
    source: activeKnowledgeStore.source,
    documentCount: docs.length,
    loadedAt: activeKnowledgeStore.loadedAt,
    paths: (await discoverRagKnowledgeSources()).indexPaths.concat(
      (await discoverRagKnowledgeSources()).directories,
      (await discoverRagKnowledgeSources()).zipPaths,
    ),
  });
});

app.post('/api/rag-knowledge/upload', async (req: Request, res: Response) => {
  try {
    const payload = req.body as { fileName?: string; zipBase64?: string; data?: string; encoding?: 'base64' | 'utf8' };
    const zipSource = payload?.zipBase64 || payload?.data;

    if (!zipSource) {
      return res.status(400).json({ error: 'A ZIP file payload is required.' });
    }

    const binary = Buffer.from(zipSource, payload?.encoding === 'base64' ? 'base64' : 'utf8');
    const docs = await extractTextFromZipBuffer(binary);

    if (!docs.length) {
      return res.status(400).json({ error: 'The uploaded file did not contain readable text content.' });
    }

    activeKnowledgeStore.documents = docs;
    activeKnowledgeStore.source = payload.fileName || 'uploaded-zip';
    activeKnowledgeStore.loadedAt = Date.now();

    return res.json({
      status: 'loaded',
      source: activeKnowledgeStore.source,
      documentCount: docs.length,
      loadedAt: activeKnowledgeStore.loadedAt,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'The uploaded ZIP could not be processed.' });
  }
});

interface VoiceRequestPayload {
  message: string;
  language: 'en' | 'ta' | 'hi' | 'ml';
  userRole?: 'elderly' | 'caretaker';
  userName?: string;
  partnerName?: string;
  currentTime?: string;
  currentDate?: string;
  medications?: Array<{
    id: string;
    name: string;
    dosage: string;
    form: string;
    instructions: string;
    times: Array<{ time: string; label: string }>;
    notes?: string;
    durationDays?: number;
    durationType?: string;
  }>;
  todayDoses?: Array<{
    medicationId: string;
    medicationName?: string;
    time: string;
    label: string;
    status: 'pending' | 'taken' | 'skipped';
    takenAt?: string;
  }>;
}

interface PrescriptionScanPayload {
  imageDataUrl: string;
}

function generateRuleBasedReply(payload: VoiceRequestPayload, knowledgeContext?: string): {
  replyText: string;
  action?: {
    type: 'mark_taken' | 'call_caretaker' | 'call_senior' | 'read_schedule' | 'none';
    medicationName?: string;
    doseTime?: string;
    confirmationMessage?: string;
  };
} {
  const query = (payload.message || '').toLowerCase();
  const lang = payload.language || 'en';
  const meds = payload.medications || [];
  const doses = payload.todayDoses || [];
  const seniorName = payload.userRole === 'elderly' ? (payload.userName || 'Senior') : (payload.partnerName || 'Senior');
  const caretakerName = payload.userRole === 'caretaker' ? (payload.userName || 'Caregiver') : (payload.partnerName || 'Caregiver');

  if (knowledgeContext && knowledgeContext.trim() && !knowledgeContext.includes('No matching knowledge') && isQuestionLikeQuery(query)) {
    const cleaned = knowledgeContext.replace(/\s+/g, ' ').trim();
    const summary = cleaned.length > 500 ? `${cleaned.slice(0, 500)}...` : cleaned;
    const replies = {
      en: `Based on the uploaded knowledge base, ${summary}`,
      ta: `பதிவேற்றப்பட்ட அறிவுக் களஞ்சியத்தை அடிப்படையாகக் கொண்டு, ${summary}`,
      hi: `अपलोड की गई knowledge base के आधार पर, ${summary}`,
      ml: `അപ്ലോഡ് ചെയ്ത വിജ്ഞാന ശേഖരത്തെ അടിസ്ഥാനമാക്കി, ${summary}`,
    };

    return { replyText: replies[lang] || replies.en };
  }

  if (
    query.includes('call') ||
    query.includes('அழை') ||
    query.includes('கால்') ||
    query.includes('कॉल') ||
    query.includes('फोन') ||
    query.includes('വിളിക്ക') ||
    query.includes('കോൾ')
  ) {
    if (payload.userRole === 'elderly') {
      const replies = {
        en: `Calling your caregiver ${caretakerName} now...`,
        ta: `உங்கள் கவனிப்பாளர் ${caretakerName}-ஐ இப்போது அழைக்கிறேன்...`,
        hi: `आपके देखभालकर्ता ${caretakerName} को अभी कॉल किया जा रहा है...`,
        ml: `നിങ്ങളുടെ പരിചാരകൻ ${caretakerName}-നെ ഇപ്പോൾ വിളിക്കുന്നു...`,
      };
      return {
        replyText: replies[lang],
        action: { type: 'call_caretaker', confirmationMessage: replies[lang] },
      };
    }

    const replies = {
      en: `Calling ${seniorName} now...`,
      ta: `${seniorName}-ஐ இப்போது அழைக்கிறேன்...`,
      hi: `${seniorName} को अभी कॉल किया जा रहा है...`,
      ml: `${seniorName}-നെ ഇപ്പോൾ വിളിക്കുന്നു...`,
    };
    return {
      replyText: replies[lang],
      action: { type: 'call_senior', confirmationMessage: replies[lang] },
    };
  }

  const isTakeIntent =
    query.includes('took') ||
    query.includes('taken') ||
    query.includes('take') ||
    query.includes('எடுத்தேன்') ||
    query.includes('சாப்பிட்டேன்') ||
    query.includes('எடுத்துவிட்டேன்') ||
    query.includes('ले ली') ||
    query.includes('खा ली') ||
    query.includes('लिया') ||
    query.includes('കഴിച്ചു') ||
    query.includes('എടുത്തു');

  if (isTakeIntent) {
    let matchedMed = meds.find((m) => query.includes(m.name.toLowerCase()));
    let pendingDose = doses.find((d) => d.status === 'pending');
    if (!matchedMed && pendingDose) {
      matchedMed = meds.find((m) => m.id === pendingDose?.medicationId);
    }

    const medName = matchedMed ? matchedMed.name : (meds[0]?.name || 'Medicine');
    const replies = {
      en: `Great job! I've marked your dose of ${medName} as taken. Stay healthy!`,
      ta: `மிக நன்று! உங்கள் ${medName} மருந்தை உட்கொண்டதாக குறித்துவிட்டேன். நலம் பெறுங்கள்!`,
      hi: `बहुत अच्छा! मैंने आपकी ${medName} दवा को ली गई के रूप में चिह्नित कर दिया है। स्वस्थ रहें!`,
      ml: `വളരെ നല്ലത്! നിങ്ങളുടെ ${medName} മരുന്ന് കഴിച്ചതായി രേഖപ്പെടുത്തിയിട്ടുണ്ട്. ആരോഗ്യം കാത്തുസൂക്ഷിക്കുക!`,
    };

    return {
      replyText: replies[lang],
      action: {
        type: 'mark_taken',
        medicationName: medName,
        doseTime: pendingDose?.time,
        confirmationMessage: replies[lang],
      },
    };
  }

  const isNextIntent =
    query.includes('next') ||
    query.includes('upcoming') ||
    query.includes('அடுத்த') ||
    query.includes('அடுத்து') ||
    query.includes('अगली') ||
    query.includes('आगे') ||
    query.includes('അടുത്ത');

  const pendingDoses = doses.filter((d) => d.status === 'pending');

  if (isNextIntent || query.includes('schedule') || query.includes('ஷெட்யூல்') || query.includes('दवा')) {
    if (pendingDoses.length === 0) {
      const allDoneReplies = {
        en: `All scheduled doses for today are already taken! Have a wonderful day.`,
        ta: `இன்றைய திட்டமிடப்பட்ட அனைத்து மருந்துகளும் உட்கொள்ளப்பட்டுவிட்டன! உங்கள் நாள் இனிதாக அமையட்டும்.`,
        hi: `आज की सभी निर्धारित दवाएं पहले ही ली जा चुकी हैं! आपका दिन शुभ हो।`,
        ml: `ഇന്നത്തെ എല്ലാ മരുന്നുകളും കഴിച്ചു കഴിഞ്ഞിരിക്കുന്നു! നല്ലൊരു ദിവസം ആശംസിക്കുന്നു.`,
      };
      return { replyText: allDoneReplies[lang] };
    }

    const nextDose = pendingDoses[0];
    const med = meds.find((m) => m.id === nextDose.medicationId);
    const medName = med ? `${med.name} (${med.dosage})` : 'your scheduled medicine';
    const time = nextDose.time;
    const foodInstruction = med?.instructions?.replace('_', ' ') || 'as directed';

    const replies = {
      en: `Your next medicine is ${medName} scheduled for ${time}. Remember to take it ${foodInstruction}.`,
      ta: `உங்கள் அடுத்த மருந்து ${medName}. நேரம்: ${time}. ${foodInstruction} எடுத்துக் கொள்ளவும்.`,
      hi: `आपकी अगली दवा ${medName} है, जिसका समय ${time} है। इसे ${foodInstruction} लेना याद रखें।`,
      ml: `നിങ്ങളുടെ അടുത്ത മരുന്ന് ${medName} ആണ്, സമയം: ${time}. ${foodInstruction} കഴിക്കാൻ മറക്കരുത്.`,
    };
    return {
      replyText: replies[lang],
      action: { type: 'read_schedule' },
    };
  }

  if (query.includes('morning') || query.includes('காலை') || query.includes('सुबह') || query.includes('രാവിലെ')) {
    const morningDose = doses.find((d) => d.label.toLowerCase().includes('morning') || d.time < '12:00');
    if (morningDose) {
      const isTaken = morningDose.status === 'taken';
      const med = meds.find((m) => m.id === morningDose.medicationId);
      const mName = med?.name || 'morning tablet';

      if (isTaken) {
        const takenReplies = {
          en: `Yes! You already took your morning ${mName} at ${morningDose.takenAt || morningDose.time}.`,
          ta: `ஆம்! உங்கள் காலை ${mName} மருந்தை ஏற்கனவே எடுத்துக்கொண்டுவிட்டீர்கள்.`,
          hi: `हाँ! आपने अपनी सुबह की ${mName} दवा पहले ही ले ली है।`,
          ml: `അതെ! നിങ്ങൾ രാവിലത്തെ ${mName} മരുന്ന് നേരത്തെ തന്നെ കഴിച്ചിട്ടുണ്ട്.`,
        };
        return { replyText: takenReplies[lang] };
      }

      const notTakenReplies = {
        en: `Not yet! Your morning ${mName} is scheduled for ${morningDose.time}. Would you like to take it now?`,
        ta: `இன்னும் இல்லை! உங்கள் காலை ${mName} மருந்து ${morningDose.time} மணிக்கு திட்டமிடப்பட்டுள்ளது. இப்போது உட்கொள்கிறீர்களா?`,
        hi: `अभी तक नहीं! आपकी सुबह की ${mName} दवा ${morningDose.time} के लिए निर्धारित है। क्या आप इसे अभी लेना चाहते हैं?`,
        ml: `ഇതുവരെ ഇല്ല! നിങ്ങളുടെ രാവിലത്തെ ${mName} மரുന്ന് ${morningDose.time}-ൽ കഴിക്കേണ്ടതാണ്. ഇപ്പോൾ കഴിക്കാമോ?`,
      };
      return { replyText: notTakenReplies[lang] };
    }
  }

  const generalReplies = {
    en: `Hello ${payload.userName || 'there'}! I am your CareCircle Voice Assistant. You have ${meds.length} scheduled medications and ${pendingDoses.length} pending doses today. You can ask me what to take, check food instructions, or say "I took my medicine".`,
    ta: `வணக்கம் ${payload.userName || ''}! நான் உங்கள் கேர்சர்க்கிள் குரல் உதவியாளர். உங்களுக்கு இன்று ${meds.length} மருந்துகள் மற்றும் ${pendingDoses.length} எடுக்க வேண்டிய அளவுகள் உள்ளன. நீங்கள் அடுத்த மருந்து பற்றி கேட்கலாம் அல்லது "மருந்து எடுத்துவிட்டேன்" என்று கூறலாம்.`,
    hi: `नमस्ते ${payload.userName || ''}! मैं आपका केयरसर्कल वॉयस असिस्टेंट हूँ। आज आपकी ${meds.length} दवाएं और ${pendingDoses.length} बची हुई खुराकें हैं। आप मुझसे अगली दवा पूछ सकते हैं या कह सकते हैं "मैंने दवा ले ली"।`,
    ml: `നമസ്കാരം ${payload.userName || ''}! ഞാൻ നിങ്ങളുടെ കെയർസർക്കിൾ വോയ്‌സ് അസിസ്റ്റന്റാണ്. ഇന്ന് നിങ്ങൾക്ക് ${meds.length} മരുന്നുകളും ${pendingDoses.length} ബാക്കി ഡോസുകളുമുണ്ട്. അടുത്ത മരുന്ന് ഏതെന്ന് ചോദിക്കുകയോ "മരുന്ന് കഴിച്ചു" എന്ന് പറയുകയോ ചെയ്യാം.`,
  };

  return { replyText: generalReplies[lang] };
}

app.post('/api/scan-prescription', async (req: Request, res: Response) => {
  const payload = req.body as PrescriptionScanPayload;
  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyAvailable = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0);

  if (!payload?.imageDataUrl?.startsWith('data:image/')) {
    return res.status(400).json({ error: 'A prescription image is required.' });
  }

  if (!isKeyAvailable) {
    return res.status(503).json({ error: 'Prescription vision scanning is not configured.' });
  }

  try {
    const match = payload.imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);
    if (!match) {
      return res.status(400).json({ error: 'The prescription image format is invalid.' });
    }

    const [, mimeType, imageData] = match;
    const ai = new GoogleGenAI({ apiKey });
    const prompt = 'Transcribe this prescription image exactly and completely for a medication safety workflow.\n\nRules:\n- Read printed text and handwriting if legible.\n- Preserve medicine names, strength, dosage, frequency, route, duration, food instructions, and doctor notes.\n- Keep each medicine on its own line.\n- Do not guess or invent unclear text. Write [unclear] where a word or number cannot be read.\n- Return only the transcription, with no explanation or medical advice.';

    const response = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: imageData } },
          ],
        }],
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Prescription scan timed out.')), 20000)),
    ]);

    const text = (response as any).text?.trim();
    if (!text) {
      return res.status(422).json({ error: 'The vision model could not read the prescription.' });
    }

    return res.json({ text, provider: 'gemini-vision' });
  } catch (error: any) {
    console.warn('[CareCircle Prescription Scan] Vision scan failed:', error?.message || error);
    return res.status(502).json({ error: 'The prescription could not be read by the vision service.' });
  }
});

app.post('/api/voice-assistant', async (req: Request, res: Response) => {
  const payload: VoiceRequestPayload = req.body;
  const { message, language = 'en', userRole = 'elderly', userName = 'User', partnerName = 'Partner', medications = [], todayDoses = [], currentTime = '', currentDate = '' } = payload;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (isTeammateKnowledgeQuestion(message)) {
    try {
      const grounded = await answerWithTeammateRag(message.trim());
      return res.json({
        replyText: grounded.answer,
        action: { type: 'none' },
        language,
        provider: 'teammate_rag',
        citations: grounded.citations,
      });
    } catch (error) {
      console.error('[CareCircle Voice RAG] Teammate pipeline failed:', error instanceof Error ? error.message : error);
      return res.status(503).json({
        error: 'The teammate RAG pipeline is unavailable. No ungrounded answer was generated.',
      });
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyAvailable = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0);
  const knowledgeContext = { context: '', citations: [] as KnowledgeCitation[] };

  if (!isKeyAvailable) {
    const fallback = generateRuleBasedReply(payload, knowledgeContext.context);
    return res.json({
      replyText: fallback.replyText,
      action: fallback.action || { type: 'none' },
      language,
      provider: 'rule_fallback',
      citations: knowledgeContext.citations,
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const languageGuidelines: Record<string, string> = {
      ta: 'Reply ONLY in fluent, polite Tamil script (தமிழ்). Speak warmly as an elderly companion.',
      hi: 'Reply ONLY in fluent, polite Hindi in Devanagari script (हिन्दी). Speak respectfully as an elderly companion.',
      ml: 'Reply ONLY in fluent, polite Malayalam script (മലയാളം). Speak warmly and respectfully as an elderly companion.',
      en: 'Reply in clear, simple, warm English suitable for seniors.',
    };

    const targetLangGuideline = languageGuidelines[language] || languageGuidelines.en;
    const systemPrompt = `You are CareCircle's AI Voice Assistant, a compassionate, polite, and reassuring medical assistant supporting seniors and their caregivers.
User Role: ${userRole} (Name: ${userName})
Partner Name: ${partnerName}
Current Date: ${currentDate || new Date().toISOString().split('T')[0]}
Current Time: ${currentTime || new Date().toLocaleTimeString()}

KNOWLEDGE BASE FROM THE UPLOADED ZIP (if available):
${knowledgeContext.context || 'No project-specific knowledge archive was loaded yet. Answer questions using the medication context only.'}

MEDICATIONS CONFIGURED:
${JSON.stringify(medications, null, 2)}

TODAY'S DOSES & STATUS:
${JSON.stringify(todayDoses, null, 2)}

TARGET LANGUAGE REQUIREMENT:
${targetLangGuideline}

STRICT OUTPUT FORMAT:
You MUST respond with valid JSON ONLY matching this structure:
{
  "replyText": "<concise, spoken text in the target language to be read aloud (keep under 3 sentences for comfortable speech)",
  "action": {
    "type": "mark_taken" | "call_caretaker" | "call_senior" | "read_schedule" | "none",
    "medicationName": "<name of medication if user says they took it, else null>",
    "doseTime": "<scheduled time HH:MM if applicable, else null>",
    "confirmationMessage": "<short confirmation text in target language>"
  }
}

RULES:
1. If user indicates they took their medication (e.g. "I took my Dolo", "நான் மாத்திரை எடுத்துட்டேன்", "मैंने दवाई ले ली", "ഞാൻ മരുന്ന് കഴിച്ചു"), set action.type to "mark_taken" and specify the medicationName.
2. If user asks to call caregiver or family, set action.type to "call_caretaker".
3. If user asks what to take next, answer clearly with the medication name, dose, scheduled time, and whether to take it before or after food.
4. Keep the replyText natural, warm, and easy to understand when spoken aloud.
5. If the user question is truly about the uploaded RAG materials in the knowledge base, answer from that content, not only the medication schedule.
6. For knowledge-base answers, cite factual claims inline using the supplied source numbers, for example [1] or [2].
7. Output ONLY the JSON object, no markdown codeblocks, no prefix, no postfix.`;

    const candidateModels = ['gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let parsedData: any = null;
    let selectedModel = '';

    for (const model of candidateModels) {
      try {
        const geminiPromise = ai.models.generateContent({
          model,
          contents: [{
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nUser spoken input: "${message}"` }],
          }],
          config: { responseMimeType: 'application/json' },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout with ${model} after 5000ms`)), 5000),
        );

        const response = (await Promise.race([geminiPromise, timeoutPromise])) as any;
        const responseText = response.text || '';

        try {
          parsedData = JSON.parse(responseText.trim());
        } catch {
          const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsedData = JSON.parse(cleaned);
        }

        if (parsedData && parsedData.replyText) {
          selectedModel = model;
          break;
        }
      } catch (err: any) {
        console.warn(`[CareCircle Voice AI] ${model} unavailable (${err?.status || err?.message || 'error'}), trying next model...`);
      }
    }

    if (parsedData && parsedData.replyText) {
      return res.json({
        replyText: parsedData.replyText,
        action: parsedData.action || { type: 'none' },
        language,
        provider: selectedModel,
        citations: knowledgeContext.citations,
      });
    }

    const fallback = generateRuleBasedReply(payload, knowledgeContext.context);
    return res.json({
      replyText: fallback.replyText,
      action: fallback.action || { type: 'none' },
      language,
      provider: 'rule_fallback',
      citations: knowledgeContext.citations,
    });
  } catch (error: any) {
    console.warn('[CareCircle Voice AI] Handling request via robust rule fallback:', error?.message || error);
    const fallback = generateRuleBasedReply(payload, knowledgeContext.context);
    return res.json({
      replyText: fallback.replyText,
      action: fallback.action || { type: 'none' },
      language,
      provider: 'rule_fallback',
      citations: knowledgeContext.citations,
    });
  }
});

async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CareCircle Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
