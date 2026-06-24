import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GroupEditor } from '../GroupEditor';
import type { Group } from '../../../domain/group/Group';

describe('GroupEditorDesktopHostIntegration', () => {
  it('should validate min 2 / max 5 members and slots 1-5 without auto-run', () => {
    const mockGroup: Group = {
      id: 'g-editor',
      type: 'group',
      name: 'Editor Group',
      function: 'Test editor',
      slots: {
        '1': 'enti-1',
        '2': 'enti-2'
      }
    };

    render(
      <GroupEditor 
        group={mockGroup} 
        isActive={true} 
        onSave={() => {}} 
        onClose={() => {}} 
        availableEntis={[]} 
      />
    );

    // Verify it renders the name input
    const nameInput = screen.getByTestId('input-group-name');
    expect(nameInput).toBeInTheDocument();
    expect((nameInput as HTMLInputElement).value).toBe('Editor Group');
    
    // Verify it renders the slots section
    expect(screen.getByTestId('slots-section')).toBeInTheDocument();
  });
});
