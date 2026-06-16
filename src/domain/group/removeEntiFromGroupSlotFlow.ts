import { type Group, isValidGroupSlotId } from './Group';

export function removeEntiFromGroupSlotFlow(
  groups: Group[],
  groupId: string,
  slotId: string
): Group[] {
  if (!groupId || groupId.trim() === '') return groups;
  if (!isValidGroupSlotId(slotId)) return groups;

  const groupExists = groups.some(g => g.id === groupId);
  if (!groupExists) return groups;

  let mutated = false;

  const result = groups.map(g => {
    if (g.id === groupId && g.slots && slotId in g.slots) {
      mutated = true;
      const restSlots = { ...g.slots };
      delete restSlots[slotId];
      return {
        ...g,
        slots: restSlots
      };
    }
    return g;
  });

  return mutated ? result : groups;
}
