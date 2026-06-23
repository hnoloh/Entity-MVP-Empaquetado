import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntiEditor } from '../../Workspace/EntiEditor';
import { desktopHostAdapter } from '../../../platform/desktop/desktopHostAdapter';

vi.mock('../../../platform/desktop/desktopHostAdapter', () => ({
  desktopHostAdapter: {
    isDesktopMode: vi.fn().mockReturnValue(false),
    getPlatformName: vi.fn().mockReturnValue('web-fallback')
  }
}));

// Mock EntiToolBelt to prevent real rendering side effects
vi.mock('../EntiToolBelt', () => ({
  EntiToolBelt: () => <div data-testid="mock-enti-tool-belt">Tool Belt</div>
}));

const mockEntiA = {
  id: '1',
  name: 'Enti A',
  capabilities: [],
  goals: [],
  personality: '',
  systemPrompt: '',
  cognitiveConfig: { provider: 'local', model: 'llama3', apiKey: '' },
  harness: { knowledgeAttachments: [], workMaterialAttachments: [] }
};

const mockEntiB = {
  id: '2',
  name: 'Enti B',
  capabilities: [],
  goals: [],
  personality: '',
  systemPrompt: '',
  cognitiveConfig: { provider: 'cloud', model: 'gpt-4', apiKey: 'test' },
  harness: { knowledgeAttachments: [], workMaterialAttachments: [] }
};

describe('EntiEditorDesktopHostIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mounts EntiEditor in desktop mode preserving Harness and Tool Belt', () => {
    vi.mocked(desktopHostAdapter.isDesktopMode).mockReturnValue(true);
    
    render(
      <EntiEditor 
        enti={mockEntiA as React.ComponentProps<typeof EntiEditor>['enti']} 
        onSave={() => {}} 
        onClose={() => {}} 
        isActive={true} 
      />
    );
    
    expect(screen.getByDisplayValue('Enti A')).toBeInTheDocument();
    expect(screen.getByTestId('mock-enti-tool-belt')).toBeInTheDocument();
    expect(desktopHostAdapter.isDesktopMode()).toBe(true);
  });

  it('isolates data between Enti A and Enti B without parallel storage', () => {
    vi.mocked(desktopHostAdapter.isDesktopMode).mockReturnValue(true);
    
    const { rerender } = render(
      <EntiEditor 
        key={mockEntiA.id}
        enti={mockEntiA as React.ComponentProps<typeof EntiEditor>['enti']} 
        onSave={() => {}} 
        onClose={() => {}} 
        isActive={true} 
      />
    );
    
    expect(screen.getByDisplayValue('Enti A')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Enti B')).not.toBeInTheDocument();

    rerender(
      <EntiEditor 
        key={mockEntiB.id}
        enti={mockEntiB as React.ComponentProps<typeof EntiEditor>['enti']} 
        onSave={() => {}} 
        onClose={() => {}} 
        isActive={true} 
      />
    );

    expect(screen.queryByDisplayValue('Enti A')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Enti B')).toBeInTheDocument();
  });
});
