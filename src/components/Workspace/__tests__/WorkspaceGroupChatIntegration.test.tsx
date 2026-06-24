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
    const enti1Item = screen.getAllByTestId(/^enti-item-/)[0];
    const enti2Item = screen.getAllByTestId(/^enti-item-/)[1];
    
    const enti1Id = enti1Item.dataset.testid!.replace('enti-item-', '');
    const enti2Id = enti2Item.dataset.testid!.replace('enti-item-', '');

    const createDataTransfer = (id: string) => ({
      types: ['application/x-enti-id'],
      getData: (format: string) => format === 'application/x-enti-id' ? id : ''
    });

    fireEvent.drop(screen.getByTestId('slot-dropzone-1'), {
      dataTransfer: createDataTransfer(enti1Id)
    });
    fireEvent.drop(screen.getByTestId('slot-dropzone-2'), {
      dataTransfer: createDataTransfer(enti2Id)
    });
    
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
