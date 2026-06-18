import { type Group, GROUP_SLOT_IDS } from './Group';

export function validateGroupCardinalityFlow(
  groups: Group[],
  groupId: string
): boolean {
  if (!groupId || groupId.trim() === '') return false;

  const group = groups.find(g => g.id === groupId);
  if (!group) return false;

  if (!group.slots) return false;

  // Check for corrupted structure (slots outside 1..5)
  const actualKeys = Object.keys(group.slots);
  for (const key of actualKeys) {
    if (!GROUP_SLOT_IDS.includes(key as typeof GROUP_SLOT_IDS[number])) {
      return false;
    }
  }

  let occupiedCount = 0;
  for (const slotId of GROUP_SLOT_IDS) {
    const entiId = group.slots[slotId];
    if (typeof entiId === 'string' && entiId.trim() !== '') {
      occupiedCount++;
    }
  }

  return occupiedCount >= 2 && occupiedCount <= 5;
}
