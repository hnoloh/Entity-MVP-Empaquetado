export type GroupSlotId = '1' | '2' | '3' | '4' | '5';

export const GROUP_SLOT_IDS: GroupSlotId[] = ['1', '2', '3', '4', '5'];

export function isValidGroupSlotId(slotId: string): slotId is GroupSlotId {
  return GROUP_SLOT_IDS.includes(slotId as GroupSlotId);
}

export interface Group {
  id: string;
  type: "group";
  name: string;
  slots?: Partial<Record<GroupSlotId, string>>;
  function?: string;
}
