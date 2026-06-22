import { describe, it, expect } from 'vitest';
import { evaluateDocumentReadToolRequirement } from '../documentReadToolRequirement';

describe('evaluateDocumentReadToolRequirement', () => {
  it('detects PDF extension', () => {
    const req = evaluateDocumentReadToolRequirement('document.pdf', 'application/octet-stream');
    expect(req.requiresTool).toBe(true);
    expect(req.toolId).toBe('tool-read-doc');
  });

  it('detects DOCX extension', () => {
    const req = evaluateDocumentReadToolRequirement('report.docx', '');
    expect(req.requiresTool).toBe(true);
    expect(req.toolId).toBe('tool-read-doc');
  });

  it('detects PDF mimeType', () => {
    const req = evaluateDocumentReadToolRequirement('unknown_ext', 'application/pdf');
    expect(req.requiresTool).toBe(true);
    expect(req.toolId).toBe('tool-read-doc');
  });

  it('detects DOCX mimeType', () => {
    const req = evaluateDocumentReadToolRequirement('unknown_ext', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(req.requiresTool).toBe(true);
  });

  it('ignores TXT', () => {
    const req = evaluateDocumentReadToolRequirement('notes.txt', 'text/plain');
    expect(req.requiresTool).toBe(false);
  });

  it('ignores MD', () => {
    const req = evaluateDocumentReadToolRequirement('README.md', 'text/markdown');
    expect(req.requiresTool).toBe(false);
  });
});
