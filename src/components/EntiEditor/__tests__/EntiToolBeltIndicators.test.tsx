
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { EntiToolBelt } from '../EntiToolBelt';
import { toolIndicatorRepository } from '../../../domain/tools/toolIndicatorRepository';
import { toolAuthorizationRepository } from '../../../domain/tools/toolAuthorizationRepository';

describe('EntiToolBelt Indicators Integration', () => {
  beforeEach(() => {
    toolIndicatorRepository.clearIndicator('enti-1', 'tool-read-doc');
    toolAuthorizationRepository.clear();
  });

  it('renders required_not_active indicator when state is set globally', () => {
    // Simulamos que el tool es autorizado primero para que aparezca en la lista
    toolAuthorizationRepository.save([
      { entiId: 'enti-1', toolId: 'tool-read-doc', state: 'authorized' }
    ]);
    
    // Forzamos el estado a required_not_active
    toolIndicatorRepository.setIndicator('enti-1', 'tool-read-doc', 'required_not_active');
    
    render(<EntiToolBelt entiId="enti-1" />);

    const icon = screen.getByTestId('tool-icon-tool-read-doc');
    expect(icon.className).toContain('indicator-required_not_active');
  });

  it('renders in_use indicator', () => {
    toolAuthorizationRepository.save([
      { entiId: 'enti-1', toolId: 'tool-read-doc', state: 'authorized' }
    ]);
    
    toolIndicatorRepository.setIndicator('enti-1', 'tool-read-doc', 'in_use');
    
    render(<EntiToolBelt entiId="enti-1" />);

    const icon = screen.getByTestId('tool-icon-tool-read-doc');
    expect(icon.className).toContain('indicator-in_use');
  });
});
