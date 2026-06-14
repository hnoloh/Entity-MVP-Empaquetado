import type { Group } from './Group';

export function editGroupFlow(
  groups: Group[],
  groupId: string,
  patch: Partial<Pick<Group, 'name'>>
): Group[] {
  if (!groupId || groupId.trim() === '') {
    return groups;
  }
  
  if (!patch || Object.keys(patch).length === 0) {
    return groups;
  }

  const keys = Object.keys(patch);
  const allowedKeys = ['name'];
  const hasInvalidKeys = keys.some(key => !allowedKeys.includes(key));
  
  if (hasInvalidKeys) {
    return groups;
  }

  const groupExists = groups.some(g => g.id === groupId);
  if (!groupExists) {
    return groups;
  }

  return groups.map(g => {
    if (g.id === groupId) {
      return { ...g, ...patch };
    }
    return g;
  });
}
