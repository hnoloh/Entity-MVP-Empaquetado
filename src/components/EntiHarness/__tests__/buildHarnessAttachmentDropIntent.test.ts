import { describe, it, expect } from 'vitest';
import { buildHarnessAttachmentDropIntent } from '../buildHarnessAttachmentDropIntent';

describe('buildHarnessAttachmentDropIntent', () => {
  const createMockDataTransfer = (kind: string): DataTransfer => {
    return {
      items: [
        {
          kind,
          getAsFile: () => kind === 'file' ? new File(['test'], 'test.txt') : null
        }
      ] as any
    } as DataTransfer;
  };

  it('construye intención válida para Conocimientos', () => {
    const dt = createMockDataTransfer('file');
    const intent = buildHarnessAttachmentDropIntent(dt, 'enti_knowledge', 'enti');
    expect(intent.status).toBe('valid');
    expect(intent.scope).toBe('enti_knowledge');
    expect(intent.files.length).toBe(1);
  });

  it('construye intención válida para Material de Trabajo', () => {
    const dt = createMockDataTransfer('file');
    const intent = buildHarnessAttachmentDropIntent(dt, 'enti_work_material', 'enti');
    expect(intent.status).toBe('valid');
    expect(intent.scope).toBe('enti_work_material');
  });

  it('bloquea ownerType distinto de enti', () => {
    const dt = createMockDataTransfer('file');
    const intent = buildHarnessAttachmentDropIntent(dt, 'enti_knowledge', 'group');
    expect(intent.status).toBe('blocked');
    expect(intent.reason).toContain('ownerType debe ser enti');
  });

  it('bloquea elementos que no son archivos (ej. texto puro)', () => {
    const dt = createMockDataTransfer('string');
    const intent = buildHarnessAttachmentDropIntent(dt, 'enti_knowledge', 'enti');
    expect(intent.status).toBe('blocked');
    expect(intent.reason).toContain('Contenido inválido');
  });

  it('bloquea datatransfer vacio', () => {
    const intent = buildHarnessAttachmentDropIntent(null, 'enti_knowledge', 'enti');
    expect(intent.status).toBe('blocked');
  });
});
