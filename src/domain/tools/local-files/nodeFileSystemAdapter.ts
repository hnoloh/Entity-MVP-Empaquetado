import type { LocalFileSystemAdapter } from './localFileToolExecutor';

import { readDir, readTextFile, writeTextFile, remove, mkdir, stat, exists } from '@tauri-apps/plugin-fs';

function resolvePath(basePath: string, relativePath: string): string {
  return basePath.replace(/\/$/, '') + '/' + relativePath.replace(/^\//, '');
}

export const nodeFileSystemAdapter: LocalFileSystemAdapter = {
  async list(basePath, relativePath) {
    const target = resolvePath(basePath, relativePath);
    const entries = await readDir(target);
    const files = entries.filter(e => e.isFile || (!e.isFile && !e.isDirectory && !e.isSymlink)).map(e => e.name || 'unknown');
    const directories = entries.filter(e => e.isDirectory).map(e => e.name || 'unknown');
    return { files, directories };
  },
  async read(basePath, relativePath) {
    const target = resolvePath(basePath, relativePath);
    const content = await readTextFile(target);
    const fileStat = await stat(target);
    const extension = target.includes('.') ? target.split('.').pop() || '' : '';
    return { content, metadata: { size: fileStat.size, extension } };
  },
  async write(basePath, relativePath, content, overwrite) {
    const target = resolvePath(basePath, relativePath);
    if (!overwrite) {
      const fileExists = await exists(target);
      if (fileExists) {
        throw new Error(`File already exists and overwrite is false: ${target}`);
      }
    }
    const textContent = typeof content === 'string' ? content : new TextDecoder().decode(content);
    await writeTextFile(target, textContent);
    const bytesWritten = new Blob([textContent]).size;
    return { bytesWritten };
  },
  async delete(basePath, relativePath) {
    const target = resolvePath(basePath, relativePath);
    await remove(target, { recursive: true });
    return { success: true };
  },
  async createDirectory(basePath, relativePath) {
    const target = resolvePath(basePath, relativePath);
    await mkdir(target, { recursive: true });
    return { success: true };
  },
  async getSize(basePath, relativePath) {
    const target = resolvePath(basePath, relativePath);
    const fileStat = await stat(target);
    return fileStat.size;
  }
};
