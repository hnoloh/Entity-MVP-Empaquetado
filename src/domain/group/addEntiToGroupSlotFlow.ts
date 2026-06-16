import { type Group, isValidGroupSlotId } from './Group';
import type { Enti } from '../enti/Enti';

export function addEntiToGroupSlotFlow(
  groups: Group[],
  entis: Enti[],
  groupId: string,
  entiId: string,
  slotId: string
): Group[] {
  if (!groupId || groupId.trim() === '') return groups;
  if (!entiId || entiId.trim() === '') return groups;
  if (!isValidGroupSlotId(slotId)) return groups;

  const entiExists = entis.some(e => e.id === entiId);
  if (!entiExists) return groups;

  const groupExists = groups.some(g => g.id === groupId);
  if (!groupExists) return groups;

  return groups.map(g => {
    if (g.id === groupId) {
      return {
        ...g,
        slots: {
          ...(g.slots || {}),
          [slotId]: entiId
        }
      };
    }
    return g;
  });
}
