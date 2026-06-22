import React from 'react';

interface Props {
  operation: 'overwrite' | 'delete';
  targetPath: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LocalFileToolConfirmation: React.FC<Props> = ({ operation, targetPath, onConfirm, onCancel }) => {
  return (
    <div className="local-file-confirmation" data-testid="local-file-confirmation">
      <p>
        The tool is requesting to <strong>{operation}</strong> the file <code>{targetPath}</code>.
        This action requires your confirmation.
      </p>
      <div className="actions">
        <button onClick={onCancel} data-testid="btn-cancel">Cancel</button>
        <button onClick={onConfirm} data-testid="btn-confirm">Confirm {operation}</button>
      </div>
    </div>
  );
};
