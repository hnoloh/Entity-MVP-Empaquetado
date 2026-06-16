import type { Group } from './Group';

export function createGroupFlow(id: string, name?: string): Group {
  if (!id || id.trim() === '') {
    throw new Error('Group ID is required and cannot be empty.');
  }

  return {
    id,
    type: 'group',
    name: name || ''
  };
}
