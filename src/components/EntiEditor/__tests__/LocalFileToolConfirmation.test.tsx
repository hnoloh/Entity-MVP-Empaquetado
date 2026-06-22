
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LocalFileToolConfirmation } from '../LocalFileToolConfirmation';

describe('LocalFileToolConfirmation', () => {
  it('renders confirmation message and buttons', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<LocalFileToolConfirmation operation="delete" targetPath="test.txt" onConfirm={onConfirm} onCancel={onCancel} />);
    
    expect(screen.getAllByText(/delete/i).length).toBeGreaterThan(0);
    expect(screen.getByText('test.txt')).toBeInTheDocument();
    expect(screen.getByTestId('btn-cancel')).toBeInTheDocument();
    expect(screen.getByTestId('btn-confirm')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<LocalFileToolConfirmation operation="overwrite" targetPath="test.txt" onConfirm={onConfirm} onCancel={onCancel} />);
    
    fireEvent.click(screen.getByTestId('btn-confirm'));
    expect(onConfirm).toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<LocalFileToolConfirmation operation="overwrite" targetPath="test.txt" onConfirm={onConfirm} onCancel={onCancel} />);
    
    fireEvent.click(screen.getByTestId('btn-cancel'));
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
