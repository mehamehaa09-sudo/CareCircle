import JSZip from 'jszip';

export interface KnowledgeDocument {
  path: string;
  text: string;
  source?: string;
  document?: string;
  page?: number | null;
  section?: string | null;
}

export interface KnowledgeCitation {
  id: number;
  source: string;
  document?: string;
  page?: number | null;
  section?: string | null;
}

interface IndexedKnowledgeChunk {
  text?: unknown;
  metadata?: {
    source?: unknown;
    document?: unknown;
    page?: unknown;
    section?: unknown;
    chunk_id?: unknown;
    condition?: unknown;
  };
}

const TEXT_FILE_EXTENSIONS = new Set([
  '.txt',
  '.md',
  '.json',
  '.csv',
  '.html',
  '.htm',
  '.xml',
  '.yaml',
  '.yml',
  '.pdf',
  '.doc',
  '.docx',
  '.rtf',
  '.log',
  '.js',
  '.ts',
  '.tsx',
  '.py',
  '.java',
  '.cs',
  '.sql',
]);

const SAFE_TEXT_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'application/json',
  'application/xml',
  'application/javascript',
  'application/x-javascript',
  'text/csv',
  'text/html',
  'text/xml',
  'application/x-yaml',
  'application/yaml',
]);

const QUERY_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'can', 'could', 'does', 'for', 'from', 'how', 'i',
  'is', 'it', 'me', 'of', 'on', 'or', 'please', 'tell', 'that', 'the', 'this',
  'to', 'what', 'when', 'where', 'which', 'who', 'why', 'you',
]);

function normalizeText(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripBinaryNoise(value: string): string {
  const cleaned = value.replace(/\p{C}+/gu, ' ');
  return cleaned.replace(/\s+/g, ' ').trim();
}

function isLikelyTextFile(path: string): boolean {
  const lowerPath = path.toLowerCase();
  if (lowerPath.endsWith('/')) return false;
  const extension = lowerPath.includes('.') ? lowerPath.slice(lowerPath.lastIndexOf('.')) : '';
  return TEXT_FILE_EXTENSIONS.has(extension) || lowerPath.endsWith('readme') || lowerPath.endsWith('readme.md');
}

export async function extractTextFromZipBuffer(buffer: Buffer | ArrayBuffer | Uint8Array): Promise<KnowledgeDocument[]> {
  const zip = await JSZip.loadAsync(buffer);
  const docs: KnowledgeDocument[] = [];

  const fileEntries = Object.values(zip.files).filter((file) => !file.dir);

  for (const file of fileEntries) {
    const path = file.name;
    const lowerPath = path.toLowerCase();
    const isTextCandidate = isLikelyTextFile(lowerPath) || lowerPath.includes('readme') || lowerPath.includes('notes') || lowerPath.includes('summary');

    if (!isTextCandidate) continue;

    try {
      const fileData = await file.async('uint8array');
      const blobText = new TextDecoder('utf-8', { fatal: false }).decode(fileData);
      const text = stripBinaryNoise(blobText);

      if (!text || text.length < 20) continue;
      docs.push({ path, text: normalizeText(text) });
    } catch {
      continue;
    }
  }

  return docs;
}

export function extractTextFromRagIndex(indexText: string): KnowledgeDocument[] {
  return indexText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        const chunk = JSON.parse(line) as IndexedKnowledgeChunk;
        if (typeof chunk.text !== 'string' || chunk.text.trim().length < 20) return [];

        const metadata = chunk.metadata || {};
        const source = typeof metadata.source === 'string' ? metadata.source : 'RAG index';
        const document = typeof metadata.document === 'string' ? metadata.document : '';
        const page = metadata.page !== null && metadata.page !== undefined ? `, page ${metadata.page}` : '';
        const section = typeof metadata.section === 'string' && metadata.section ? `, section ${metadata.section}` : '';

        return [{
          path: `${source}${document ? ` (${document}${page}${section})` : ''}`,
          text: normalizeText(chunk.text),
          source,
          document: document || undefined,
          page: typeof metadata.page === 'number' ? metadata.page : null,
          section: typeof metadata.section === 'string' ? metadata.section : null,
        }];
      } catch {
        return [];
      }
    });
}

export function findRelevantKnowledgeChunks(question: string, docs: KnowledgeDocument[], limit = 5): string[] {
  const questionTokens = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !QUERY_STOP_WORDS.has(token));
  const chunks: Array<{ score: number; chunk: string }> = [];

  for (const doc of docs) {
    const content = doc.text.toLowerCase();
    const uniqueTokens = [...new Set(questionTokens)];
    const matchedTokenCount = uniqueTokens.reduce((sum, token) => sum + (content.includes(token) ? 1 : 0), 0);
    const score = uniqueTokens.reduce((sum, token) => {
      if (!content.includes(token)) return sum;
      const occurrences = content.split(token).length - 1;
      return sum + Math.min(occurrences, 3) + (token.length >= 7 ? 1 : 0);
    }, 0) + (matchedTokenCount === uniqueTokens.length && uniqueTokens.length > 0 ? 4 : 0)
      + (/[/\\]knowledge[/\\]/i.test(doc.path) ? 5 : 0);

    if (score > 0) {
      chunks.push({
        score,
        chunk: `${doc.path}: ${doc.text.slice(0, 500)}`,
      });
    }
  }

  if (chunks.length === 0) {
    return docs.slice(0, limit).map((doc) => `${doc.path}: ${doc.text.slice(0, 500)}`);
  }

  return chunks
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.chunk);
}

export function composeKnowledgeContext(question: string, docs: KnowledgeDocument[], limit = 4): string {
  const relevant = findRelevantKnowledgeChunks(question, docs, limit);
  return relevant.length > 0 ? relevant.join('\n\n---\n\n') : 'No matching knowledge was found in the uploaded archive.';
}

export function composeKnowledgeEvidence(question: string, docs: KnowledgeDocument[], limit = 5): {
  context: string;
  citations: KnowledgeCitation[];
} {
  const questionTokens = question.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2 && !QUERY_STOP_WORDS.has(token));
  const uniqueTokens = [...new Set(questionTokens)];
  const ranked = docs.map((doc, index) => {
    const content = doc.text.toLowerCase();
    const matchedTokenCount = uniqueTokens.reduce((sum, token) => sum + (content.includes(token) ? 1 : 0), 0);
    const score = uniqueTokens.reduce((sum, token) => {
      if (!content.includes(token)) return sum;
      return sum + Math.min(content.split(token).length - 1, 3) + (token.length >= 7 ? 1 : 0);
    }, 0) + (matchedTokenCount === uniqueTokens.length && uniqueTokens.length > 0 ? 4 : 0)
      + (/[/\\]knowledge[/\\]/i.test(doc.path) ? 5 : 0);
    return { doc, index, score };
  }).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);

  const selected = ranked.length > 0 ? ranked : docs.slice(0, limit).map((doc, index) => ({ doc, index, score: 0 }));
  const citations = selected.map((entry, index) => ({
    id: index + 1,
    source: entry.doc.source || entry.doc.path,
    document: entry.doc.document,
    page: entry.doc.page,
    section: entry.doc.section,
  }));
  const context = selected.map((entry, index) => `SOURCE [${index + 1}] ${entry.doc.path}: ${entry.doc.text.slice(0, 900)}`).join('\n\n---\n\n');

  return { context: context || 'No matching knowledge was found in the uploaded archive.', citations };
}
