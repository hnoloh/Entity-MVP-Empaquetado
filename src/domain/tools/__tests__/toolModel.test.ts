
import type { EntiToolDefinition } from '../entiToolDefinition';
import type { EntiToolAuthorization } from '../entiToolAuthorization';
import { isToolAuthorized, validateToolOwnership } from '../toolPolicy';
import * as fs from 'fs';
import * as path from 'path';

describe('Tool Model', () => {
  describe('EntiToolDefinition validación', () => {
    it('Debe crear definiciones válidas para tipos permitidos', () => {
      const readDoc: EntiToolDefinition = {
        id: 'tool-read',
        kind: 'document_read',
        name: 'Leer Documentos',
        description: 'Permite leer contenido de PDF y DOCX',
        riskLevel: 'low',
      };
      
      const genPdf: EntiToolDefinition = {
        id: 'tool-gen-pdf',
        kind: 'generate_pdf',
        name: 'Generar PDF',
        description: 'Genera artefacto PDF',
        riskLevel: 'medium',
      };
      
      const genDocx: EntiToolDefinition = {
        id: 'tool-gen-docx',
        kind: 'generate_docx',
        name: 'Generar DOCX',
        description: 'Genera artefacto DOCX',
        riskLevel: 'medium',
      };
      
      const genTxt: EntiToolDefinition = {
        id: 'tool-gen-txt',
        kind: 'generate_text_artifact',
        name: 'Generar TXT',
        description: 'Genera artefacto de texto',
        riskLevel: 'medium',
      };
      
      const dlArtifact: EntiToolDefinition = {
        id: 'tool-dl',
        kind: 'download_generated_artifact',
        name: 'Descargar',
        description: 'Descargar artefacto',
        riskLevel: 'low',
      };

      const internet: EntiToolDefinition = {
        id: 'tool-net',
        kind: 'internet',
        name: 'Acceso a Internet',
        description: 'Permite peticiones externas',
        riskLevel: 'high',
      };

      const localFs: EntiToolDefinition = {
        id: 'tool-fs',
        kind: 'local_filesystem',
        name: 'Archivos Locales',
        description: 'Acceso al disco local',
        riskLevel: 'critical',
      };

      expect(readDoc.kind).toBe('document_read');
      expect(genPdf.kind).toBe('generate_pdf');
      expect(genDocx.kind).toBe('generate_docx');
      expect(genTxt.kind).toBe('generate_text_artifact');
      expect(dlArtifact.kind).toBe('download_generated_artifact');
      expect(internet.riskLevel).toBe('high');
      expect(localFs.riskLevel).toBe('critical');
    });
  });

  describe('EntiToolAuthorization', () => {
    it('Debe crear autorizaciones válidas que diferencien estados', () => {
      const authAvailable: EntiToolAuthorization = {
        entiId: 'enti-1',
        toolId: 'tool-read',
        state: 'available',
      };
      
      const authAuthorized: EntiToolAuthorization = {
        entiId: 'enti-1',
        toolId: 'tool-read',
        state: 'authorized',
      };
      
      const authInUse: EntiToolAuthorization = {
        entiId: 'enti-1',
        toolId: 'tool-read',
        state: 'in_use',
      };
      
      const authBlocked: EntiToolAuthorization = {
        entiId: 'enti-1',
        toolId: 'tool-read',
        state: 'blocked',
      };
      
      const authError: EntiToolAuthorization = {
        entiId: 'enti-1',
        toolId: 'tool-read',
        state: 'controlled_error',
      };

      expect(authAvailable.state).toBe('available');
      expect(authAuthorized.state).toBe('authorized');
      expect(authInUse.state).toBe('in_use');
      expect(authBlocked.state).toBe('blocked');
      expect(authError.state).toBe('controlled_error');
      expect(authAvailable.state).not.toBe(authAuthorized.state);
    });
  });

  describe('toolPolicy', () => {
    it('Debe autorizar herramientas si el estado es authorized', () => {
      const auths: EntiToolAuthorization[] = [
        { entiId: 'enti-1', toolId: 'tool-1', state: 'authorized' },
        { entiId: 'enti-1', toolId: 'tool-2', state: 'available' },
      ];
      expect(isToolAuthorized('enti-1', 'tool-1', auths)).toBe(true);
      expect(isToolAuthorized('enti-1', 'tool-2', auths)).toBe(false);
      expect(isToolAuthorized('enti-2', 'tool-1', auths)).toBe(false);
    });

    it('Debe validar ownership correctamente', () => {
      const groupOwner = validateToolOwnership('group', 'group-1');
      expect(groupOwner.success).toBe(false);
      expect(groupOwner.reason).toBe('group_owner_not_allowed');

      const noEntiId = validateToolOwnership('enti', '');
      expect(noEntiId.success).toBe(false);
      expect(noEntiId.reason).toBe('invalid_owner');

      const validEnti = validateToolOwnership('enti', 'enti-123');
      expect(validEnti.success).toBe(true);
      expect(validEnti.reason).toBeUndefined();
    });
  });
});

describe('Anti-Drift / Anti-Scope-Creep Tools', () => {
  it('Ninguna función importa módulos prohibidos (React, provider, Runtime, etc)', () => {
    const srcDir = path.join(__dirname, '..');
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.ts') && f !== 'index.ts');
    
    files.forEach(file => {
      const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
      expect(content).not.toMatch(/from ['"]react['"]/);
      expect(content).not.toMatch(/from ['"].*provider.*['"]/);
      expect(content).not.toMatch(/from ['"].*runtime.*['"]/);
      expect(content).not.toMatch(/from ['"].*prompt-engine.*['"]/);
      expect(content).not.toMatch(/import .*fs.* from ['"]fs['"]/);
      expect(content).not.toMatch(/XMLHttpRequest|fetch/);
    });
  });
});
