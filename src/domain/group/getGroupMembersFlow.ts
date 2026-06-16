import type { Group, GroupSlotId } from './Group';
import { GROUP_SLOT_IDS, isValidGroupSlotId } from './Group';

export interface GroupMember {
  slotId: GroupSlotId;
  entiId: string;
}

export function getGroupMembersFlow(group: Group): GroupMember[] {
  if (!group || !group.slots) {
    return [];
  }

  const keys = Object.keys(group.slots);
  for (const key of keys) {
    if (!isValidGroupSlotId(key)) {
      return [];
    }
  }

  const members: GroupMember[] = [];

  for (const slotId of GROUP_SLOT_IDS) {
    const entiId = group.slots[slotId];
    if (entiId !== undefined) {
      if (typeof entiId !== 'string' || entiId.trim() === '') {
        return [];
      }
      members.push({ slotId, entiId });
    }
  }

  return members;
}
