import { generateHtmlArtifact } from '../generateHtmlArtifact';
import { describe, expect, it } from 'vitest';

describe('generateHtmlArtifact', () => {
  it('produces GeneratedToolArtifact with mime: text/html and blob', () => {
    const entiId = 'enti-123';
    const toolId = 'html-generation';
    const filename = 'report.html';
    const htmlContent = '<h1>Test</h1>';

    const result = generateHtmlArtifact(entiId, toolId, htmlContent, filename);

    expect(result.artifactId).toMatch(/^html-\d+-/);
    expect(result.entiId).toBe('enti-123');
    expect(result.toolId).toBe('html-generation');
    expect(result.mimeType).toBe('text/html');
    expect(result.filename).toBe('report.html');
    expect(result.status).toBe('success');
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.blob?.type).toBe('text/html');
  });
});
