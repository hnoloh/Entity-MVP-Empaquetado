/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EntiHarnessAttachmentDropZone } from '../EntiHarnessAttachmentDropZone';
import * as HookModule from '../useEntiHarnessAttachmentDrop';

describe('EntiHarnessAttachmentDropZone', () => {
  it('renderiza el contenido base sin overlay en estado idle', () => {
    vi.spyOn(HookModule, 'useEntiHarnessAttachmentDrop').mockReturnValue({
      dropState: 'idle',
      errorMessage: null,
      handlers: {} as any
    });
    render(
      <EntiHarnessAttachmentDropZone ownerId="enti-1" scope="enti_knowledge">
        <div>Contenido test</div>
      </EntiHarnessAttachmentDropZone>
    );
    expect(screen.getByText('Contenido test')).toBeDefined();
    expect(screen.queryByText('Soltar archivo aquí')).toBeNull();
  });

  it('renderiza valid overlay en dragging_valid', () => {
    vi.spyOn(HookModule, 'useEntiHarnessAttachmentDrop').mockReturnValue({
      dropState: 'dragging_valid',
      errorMessage: null,
      handlers: {} as any
    });
    const { container } = render(
      <EntiHarnessAttachmentDropZone ownerId="enti-1" scope="enti_knowledge">
        <div>Contenido test</div>
      </EntiHarnessAttachmentDropZone>
    );
    expect(container.querySelector('.harness-drop-overlay.valid')).toBeDefined();
  });
});
