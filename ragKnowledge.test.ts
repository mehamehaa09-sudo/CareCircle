import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { extractTextFromZipBuffer, findRelevantKnowledgeChunks } from './ragKnowledge';

test('extractTextFromZipBuffer includes RAG content and returns relevant chunks for a question', async () => {
  const zip = new JSZip();
  zip.file('project/notes.md', '# RAG project\nThis system uses a retrieval pipeline with embeddings and a vector store.');
  zip.file('project/summary.json', JSON.stringify({
    title: 'Knowledge Assistant',
    overview: 'The team built a chatbot that answers questions from internal documentation using semantic search and chunking.'
  }));

  const archiveBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  const docs = await extractTextFromZipBuffer(archiveBuffer);

  assert.ok(docs.length > 0);
  assert.ok(docs.some((doc) => doc.text.toLowerCase().includes('retrieval')));

  const matches = findRelevantKnowledgeChunks(
    'What retrieval approach did they use?',
    docs,
    2
  );

  assert.ok(matches.some((chunk) => /retrieval|embeddings|vector/i.test(chunk)));
});
