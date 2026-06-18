import React from 'react';
import { render, screen } from '@testing-library/react';
import { EntiToolBelt } from '../EntiToolBelt';
import '@testing-library/jest-dom';

describe('EntiToolBelt Component', () => {
  it('renderiza el cinturón de herramientas si hay un entiId', () => {
    render(<EntiToolBelt entiId="enti-1" />);
    expect(screen.getByTestId('enti-tool-belt')).toBeInTheDocument();
    expect(screen.getByText('Herramientas')).toBeInTheDocument();
  });

  it('no renderiza nada si entiId es group o invalido', () => {
    const { container } = render(<EntiToolBelt entiId="group" />);
    expect(container).toBeEmptyDOMElement();
  });
});
