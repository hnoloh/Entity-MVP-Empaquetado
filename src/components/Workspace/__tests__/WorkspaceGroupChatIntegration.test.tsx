import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import WorkspaceShell from '../WorkspaceShell';
import { chatRepository } from '../../../domain/chat/chatRepository';

describe('WorkspaceGroupChatIntegration - RV-05/FIA-017', () => {
  beforeEach(() => {
    chatRepository.clear();
  });

  it('TEST-FIA017-01: Abrir chat de grupo desde HubRegion no duplica chats ni crea chats para los integrantes', () => {
    render(<WorkspaceShell />);
    
    // Crear Enti 1 y guardarlo
    fireEvent.click(screen.getByTestId('btn-create-enti'));
    fireEvent.change(screen.getAllByTestId('input-name')[0], { target: { value: 'Enti 1' } });
    fireEvent.change(screen.getAllByTestId('input-function')[0], { target: { value: 'Fun 1' } });
    fireEvent.click(screen.getByTestId('btn-close-editor'));
    fireEvent.click(screen.getByTestId('btn-dialog-guardar'));

    // Crear Enti 2 y guardarlo
    fireEvent.click(screen.getByTestId('btn-create-enti'));
    fireEvent.change(screen.getAllByTestId('input-name')[0], { target: { value: 'Enti 2' } });
    fireEvent.change(screen.getAllByTestId('input-function')[0], { target: { value: 'Fun 2' } });
    fireEvent.click(screen.getByTestId('btn-close-editor'));
    fireEvent.click(screen.getByTestId('btn-dialog-guardar'));

    // Crear Grupo 1
    fireEvent.click(screen.getByTestId('btn-create-grupo'));
    fireEvent.change(screen.getAllByTestId('input-group-name')[0], { target: { value: 'Grupo Prueba' } });
    fireEvent.change(screen.getAllByTestId('input-group-function')[0], { target: { value: 'Func Grupo' } });
    
    // Asignar Entis
    fireEvent.click(screen.getByTestId('select-slot-1'));
    fireEvent.click(screen.getAllByText('Enti 1')[screen.getAllByText('Enti 1').length - 1]);
    fireEvent.click(screen.getByTestId('select-slot-2'));
    fireEvent.click(screen.getAllByText('Enti 2')[screen.getAllByText('Enti 2').length - 1]);
    
    // Guardar grupo
    fireEvent.click(screen.getByTestId('btn-close-editor'));
    fireEvent.click(screen.getByTestId('btn-dialog-guardar'));
    
    expect(chatRepository.list()).toHaveLength(0); // El chat se abre al crearlo/seleccionarlo en el hub
    
    // Click en la tarjeta del grupo en el hub
    const groupCard = screen.getByText('Grupo Prueba').closest('.list-item');
    fireEvent.click(groupCard!);

    // Debe existir un único chat de grupo en el repositorio
    const chats = chatRepository.list();
    expect(chats).toHaveLength(1);
    expect(chats[0].owner.type).toBe('grupo');

    // Clickearlo de nuevo no debe crear otro chat
    fireEvent.click(groupCard!);
    expect(chatRepository.list()).toHaveLength(1);
  });
});
