
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ChatView } from '../ChatView';
import { chatRepository, createChatFlow } from '../../../domain/chat';
import * as fs from 'fs';
import * as path from 'path';

describe('ChatViewGroupSingleChat - RV-03/FIA-016', () => {
  beforeEach(() => {
    chatRepository.clear();
    vi.restoreAllMocks();
  });
  
  afterEach(() => {
    cleanup();
  });

  it('TEST-FIA016-UI-01: Render owner Grupo con Chat existente', () => {
    const chatG = createChatFlow('grupo', 'G1');
    render(<ChatView chatId={chatG.id} />);
    
    // Debería renderizar la UI básica sin petar
    expect(screen.getByTestId(`chat-view-${chatG.id}`)).toBeInTheDocument();
  });

  it('TEST-FIA016-UI-02: Reapertura/selección del mismo Grupo no duplica representación lógica', () => {
    const chatG = createChatFlow('grupo', 'G1');
    
    // Renderizamos dos veces simulando un re-render o multi-panel, 
    // pero ambos apuntan al mismo id real porque createChatFlow para grupo devuelve el mismo.
    const chatG_again = createChatFlow('grupo', 'G1');
    
    expect(chatG.id).toBe(chatG_again.id);
  });

  it('TEST-FIA016-UI-03: No ChatWindow operativo ni ChatRegion operativo', () => {
    const filesToCheck = [
      '../ChatView.tsx'
    ];
    
    for (const relativePath of filesToCheck) {
      const code = fs.readFileSync(path.join(__dirname, relativePath), 'utf-8');
      expect(code).not.toContain('ChatWindow');
      expect(code).not.toContain('ChatRegion');
      expect(code).not.toContain('RV-04');
    }
  });
});
