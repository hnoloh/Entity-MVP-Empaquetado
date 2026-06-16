import type { Group, GroupSlotId } from './Group';
import { GROUP_SLOT_IDS, isValidGroupSlotId } from './Group';

export interface GroupSequenceEntry {
  slotId: GroupSlotId;
  entiId: string;
}

export function getGroupSequenceFlow(group: Group): GroupSequenceEntry[] {
  if (!group || !group.slots) {
    return [];
  }

  const keys = Object.keys(group.slots);
  for (const key of keys) {
    if (!isValidGroupSlotId(key)) {
      return [];
    }
  }

  const sequence: GroupSequenceEntry[] = [];

  for (const slotId of GROUP_SLOT_IDS) {
    const entiId = group.slots[slotId];
    if (entiId !== undefined) {
      if (typeof entiId !== 'string' || entiId.trim() === '') {
        return [];
      }
      sequence.push({ slotId, entiId });
    }
  }

  return sequence;
}
