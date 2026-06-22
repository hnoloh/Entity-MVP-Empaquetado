import type { LocalFileWorkspaceDescriptor } from './localFileToolTypes';

export function getDefaultWorkspaceDescriptor(): LocalFileWorkspaceDescriptor {
  // Por instrucción directa del usuario, el workspace base será su Escritorio
  return {
    basePath: '/home/hnoloh/Escritorio'
  };
}
