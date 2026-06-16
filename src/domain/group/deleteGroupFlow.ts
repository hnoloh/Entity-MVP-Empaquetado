import type { Group } from './Group';

export function deleteGroupFlow(
  groups: Group[],
  groupId: string
): Group[] {
  if (!groupId || groupId.trim() === '') {
    return groups;
  }

  const groupExists = groups.some(g => g.id === groupId);
  if (!groupExists) {
    return groups;
  }

  return groups.filter(g => g.id !== groupId);
}
