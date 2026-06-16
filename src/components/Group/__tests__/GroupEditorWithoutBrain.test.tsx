import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GroupEditor } from '../GroupEditor';
import { type Group } from '../../../domain/group/Group';

describe('GroupEditor without Brain (RV05-FIA-015)', () => {
  const mockGroup: Group = {
    id: 'g-1',
    type: 'group',
    name: 'Grupo Simple',
    function: 'Solo texto descriptivo'
  };

  it('TEST-FIA015-04: GroupEditor renderiza sin selector de Brain y no lo exige', () => {
    render(
      <GroupEditor 
        group={mockGroup}
        isActive={true}
        availableEntis={[]}
        onSave={() => {}}
        onClose={() => {}}
      />
    );

    // Verificamos elementos base
    expect(screen.getByTestId('input-group-name')).toBeInTheDocument();
    expect(screen.getByTestId('input-group-function')).toBeInTheDocument();
    expect(screen.getByTestId('slots-section')).toBeInTheDocument();

    // Verificamos ausencia explícita de selectores cognitivos o de Brain
    const htmlContent = screen.getByTestId('group-editor').innerHTML.toLowerCase();
    expect(htmlContent).not.toContain('brain');
    expect(htmlContent).not.toContain('provider');
    expect(htmlContent).not.toContain('runtime');
  });
});
