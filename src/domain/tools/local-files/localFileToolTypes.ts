export type LocalFileOperation = 'list' | 'read' | 'write' | 'overwrite' | 'delete' | 'create_directory';

export interface LocalFileWorkspaceDescriptor {
  basePath: string;
}

export interface LocalFileOperationRequest {
  entiId: string;
  operation: LocalFileOperation;
  relativePath: string;
  content?: string | Uint8Array;
  confirmationToken?: boolean;
}

export interface LocalFileOperationPolicyResult {
  allowed: boolean;
  reason?: 
    | 'path_traversal' 
    | 'absolute_path_not_allowed' 
    | 'extension_not_allowed' 
    | 'size_exceeded' 
    | 'confirmation_required' 
    | 'owner_group_not_allowed' 
    | 'tool_not_authorized' 
    | 'invalid_owner' 
    | 'invalid_operation';
}

export interface LocalFileReadResult {
  content: string | Uint8Array;
  metadata: {
    size: number;
    extension: string;
  };
}

export interface LocalFileWriteResult {
  bytesWritten: number;
}

export interface LocalFileDeleteResult {
  success: boolean;
}

export interface LocalFileCreateDirectoryResult {
  success: boolean;
}

export interface LocalFileListResult {
  files: string[];
  directories: string[];
}

export interface LocalFileControlledError {
  error: 'controlled_error';
  message: string;
}

export type LocalFileOperationResult = 
  | { success: true; data?: LocalFileReadResult | LocalFileWriteResult | LocalFileDeleteResult | LocalFileListResult | LocalFileCreateDirectoryResult }
  | { success: false; blocked: true; reason: string }
  | LocalFileControlledError;

export interface LocalFileOperationAuditEntry {
  id: string;
  timestamp: number;
  entiId: string;
  operation: LocalFileOperation;
  relativePath: string;
  status: 'allowed' | 'blocked' | 'error';
  reason?: string;
}
