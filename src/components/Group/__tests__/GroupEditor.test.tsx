import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GroupEditor } from '../GroupEditor';
import { type Group } from '../../../domain/group/Group';
import type { Enti } from '../../../domain/enti/Enti';

describe('GroupEditor', () => {
  const mockEntis: Enti[] = [
    { id: 'e1', name: 'Enti 1', type: 'enti', status: 'complete', harness: { function: '', rules: [], workMaterial: '', knowledge: '' }, cognitiveConfig: { mode: 'unconfigured' } },
    { id: 'e2', name: 'Enti 2', type: 'enti', status: 'complete', harness: { function: '', rules: [], workMaterial: '', knowledge: '' }, cognitiveConfig: { mode: 'unconfigured' } }
  ];

  const mockGroup: Group = {
    id: 'g1',
    name: 'Grupo 1',
    function: 'Hacer cosas',
    type: 'group',
    slots: {
      '1': 'e1',
      '2': 'e2'
    }
  };

  it('renders correctly for a valid group', () => {
    render(<GroupEditor group={mockGroup} isActive={true} onSave={vi.fn()} onClose={vi.fn()} availableEntis={mockEntis} />);
    expect(screen.getByTestId('group-editor')).toBeInTheDocument();
    expect(screen.getByTestId('input-group-name')).toHaveValue('Grupo 1');
    expect(screen.getByTestId('input-group-function')).toHaveValue('Hacer cosas');
  });

  it('shows slots 1..5', () => {
    render(<GroupEditor group={mockGroup} isActive={true} onSave={vi.fn()} onClose={vi.fn()} availableEntis={mockEntis} />);
    expect(screen.getByTestId('select-slot-1')).toHaveAttribute('data-value', 'e1');
    expect(screen.getByTestId('select-slot-2')).toHaveAttribute('data-value', 'e2');
    expect(screen.getByTestId('select-slot-3')).toHaveAttribute('data-value', '');
    expect(screen.getByTestId('select-slot-4')).toHaveAttribute('data-value', '');
    expect(screen.getByTestId('select-slot-5')).toHaveAttribute('data-value', '');
  });

  it('allows editing name via editGroupFlow', () => {
    render(<GroupEditor group={mockGroup} isActive={true} onSave={vi.fn()} onClose={vi.fn()} availableEntis={mockEntis} />);
    const nameInput = screen.getByTestId('input-group-name');
    fireEvent.change(nameInput, { target: { value: 'Nuevo Grupo' } });
    expect(nameInput).toHaveValue('Nuevo Grupo');
  });

  it('allows editing name to empty string but prevents saving', () => {
    const onSave = vi.fn();
    render(<GroupEditor group={mockGroup} isActive={true} onSave={onSave} onClose={vi.fn()} availableEntis={[]} />);
    const nameInput = screen.getByTestId('input-group-name');
    
    // El usuario debe poder borrar el nombre mientras edita
    fireEvent.change(nameInput, { target: { value: ' ' } });
    expect(nameInput).toHaveValue(' ');

    // Si se intenta guardar, la validación ahora ocurre en GroupEditor
    // mock window.alert to avoid error in test environment
    const originalAlert = window.alert;
    window.alert = vi.fn();
    
    // Simulate close attempt which triggers save if dirty
    fireEvent.click(screen.getByTestId('btn-close-editor'));
    fireEvent.click(screen.getByTestId('btn-dialog-guardar'));
    
    expect(window.alert).toHaveBeenCalledWith("El grupo debe tener un nombre para poder guardarse.");
    expect(onSave).not.toHaveBeenCalled();
    window.alert = originalAlert;
  });

  // Cardinality validation test removed per user request

  it('does not open ChatWindow or use Runtime automatically', () => {
    // Esto se comprueba por ausencia de llamadas a las funciones correspondientes (que no están importadas)
    render(<GroupEditor group={mockGroup} isActive={true} onSave={vi.fn()} onClose={vi.fn()} availableEntis={mockEntis} />);
    expect(screen.queryByTestId('chat-window')).not.toBeInTheDocument();
  });
});
