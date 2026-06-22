import type { LocalFileSystemAdapter } from './localFileToolExecutor';
import type { 
  LocalFileListResult, 
  LocalFileReadResult, 
  LocalFileWriteResult, 
  LocalFileDeleteResult, 
  LocalFileCreateDirectoryResult 
} from './localFileToolTypes';

async function fsCall(operation: string, basePath: string, relativePath: string, content?: string) {
  // Join basePath and relativePath properly
  const targetPath = basePath.replace(/\/$/, '') + '/' + relativePath.replace(/^\//, '');
  
  const res = await fetch('/api/fs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation, targetPath, content })
  });
  
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error);
  }
  return json.data;
}

export const nodeFileSystemAdapter: LocalFileSystemAdapter = {
  async list(basePath, relativePath) {
    return fsCall('list', basePath, relativePath) as Promise<LocalFileListResult>;
  },
  async read(basePath, relativePath) {
    return fsCall('read', basePath, relativePath) as Promise<LocalFileReadResult>;
  },
  async write(basePath, relativePath, content) {
    // Only handling string content for now since fetch body is stringified JSON
    const textContent = typeof content === 'string' ? content : new TextDecoder().decode(content);
    return fsCall('write', basePath, relativePath, textContent) as Promise<LocalFileWriteResult>;
  },
  async delete(basePath, relativePath) {
    return fsCall('delete', basePath, relativePath) as Promise<LocalFileDeleteResult>;
  },
  async createDirectory(basePath, relativePath) {
    return fsCall('create_directory', basePath, relativePath) as Promise<LocalFileCreateDirectoryResult>;
  },
  async getSize(basePath, relativePath) {
    return fsCall('getSize', basePath, relativePath) as Promise<number>;
  }
};
