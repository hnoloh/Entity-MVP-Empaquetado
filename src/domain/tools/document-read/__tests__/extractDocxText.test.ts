import { describe, it, expect } from 'vitest';
import { extractDocxText } from '../extractDocxText';

describe('extractDocxText', () => {
  it('throws file_corrupt on invalid docx blob', async () => {
    const fakeFile = new File(['   '], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    
    // Al pasar un archivo falso, mammoth fallará al leer el zip structure
    await expect(extractDocxText(fakeFile)).rejects.toThrow('file_corrupt');
  });
});
