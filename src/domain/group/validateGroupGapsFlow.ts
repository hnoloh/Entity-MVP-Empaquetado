import { type Group, GROUP_SLOT_IDS, isValidGroupSlotId } from './Group';

export interface GroupGapValidationResult {
  valid: boolean;
  reason?: "GROUP_GAP_DETECTED" | "INVALID_SLOT_STRUCTURE";
  gapSlot?: string;
  occupiedAfterGap?: string[];
}

export function validateGroupGapsFlow(group: Group): GroupGapValidationResult {
  if (!group) {
    return { valid: false, reason: 'INVALID_SLOT_STRUCTURE' };
  }

  if (group.slots) {
    for (const key of Object.keys(group.slots)) {
      if (!isValidGroupSlotId(key)) {
        return { valid: false, reason: 'INVALID_SLOT_STRUCTURE' };
      }
    }
  }

  let foundEmpty = false;
  let firstEmptySlotId: string | undefined = undefined;
  const occupiedAfterGap: string[] = [];

  for (const slotId of GROUP_SLOT_IDS) {
    const entiId = group.slots?.[slotId];
    const isOccupied = typeof entiId === 'string' && entiId.trim() !== '';

    if (!isOccupied) {
      if (!foundEmpty) {
        foundEmpty = true;
        firstEmptySlotId = slotId;
      }
    } else {
      if (foundEmpty) {
        occupiedAfterGap.push(slotId);
      }
    }
  }

  if (occupiedAfterGap.length > 0) {
    return {
      valid: false,
      reason: 'GROUP_GAP_DETECTED',
      gapSlot: firstEmptySlotId,
      occupiedAfterGap
    };
  }

  return { valid: true };
}
