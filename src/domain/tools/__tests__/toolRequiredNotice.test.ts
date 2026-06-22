import { describe, it, expect } from 'vitest';
import { generateToolRequiredNoticeForDocument } from '../toolRequiredNotice';
import type { EntiToolAuthorization } from '../entiToolAuthorization';

describe('generateToolRequiredNoticeForDocument', () => {
  const auths: EntiToolAuthorization[] = [
    { entiId: 'enti-1', toolId: 'tool-read-doc', state: 'authorized' }
  ];

  it('returns null if tool is not required (e.g. txt)', () => {
    const notice = generateToolRequiredNoticeForDocument('test.txt', 'text/plain', 'chat_enti', 'enti-2', auths);
    expect(notice).toBeNull();
  });

  it('returns null if tool is required and authorized', () => {
    const notice = generateToolRequiredNoticeForDocument('test.pdf', 'application/pdf', 'chat_enti', 'enti-1', auths);
    expect(notice).toBeNull();
  });

  it('generates notice for chat_enti when not authorized', () => {
    const notice = generateToolRequiredNoticeForDocument('test.pdf', 'application/pdf', 'chat_enti', 'enti-2', auths);
    expect(notice).not.toBeNull();
    expect(notice?.severity).toBe('warning');
    expect(notice?.message).toContain('Actívala en el EntiEditor');
  });

  it('generates notice for harness_enti when not authorized', () => {
    const notice = generateToolRequiredNoticeForDocument('test.docx', '', 'harness_enti', 'enti-2', auths);
    expect(notice).not.toBeNull();
    expect(notice?.message).toContain('conocimiento o material de trabajo');
  });

  it('generates notice for group_sequence when not authorized', () => {
    const notice = generateToolRequiredNoticeForDocument('test.pdf', '', 'group_sequence', 'enti-2', auths);
    expect(notice).not.toBeNull();
    expect(notice?.message).toContain('contexto del Grupo');
  });
});
