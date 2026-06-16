import { type Group, GROUP_SLOT_IDS } from './Group';

/**
 * Toma el estado funcional de un Group y devuelve una representación
 * determinista purgada, ideal para persistencia (round-trip), garantizando
 * la conservación estricta de las posiciones estructurales (slots) sin 
 * aplicar compactación, reordenamiento ni auto-fix de huecos.
 */
export function persistGroupMemberPositionsFlow(group: Group): Group {
  if (!group || group.type !== 'group' || !group.id) {
    throw new Error('Invalid input: must be a valid Group entity.');
  }

  // Construir objeto base purgado
  const persistentGroup: Group = {
    id: group.id,
    type: 'group',
    name: group.name || '',
  };

  if (group.function !== undefined) {
    persistentGroup.function = group.function;
  }

  // Preservar estado de slots explícitamente 1..5
  if (group.slots) {
    persistentGroup.slots = {};
    for (const slotId of GROUP_SLOT_IDS) {
      const entiId = group.slots[slotId];
      if (entiId && typeof entiId === 'string' && entiId.trim() !== '') {
        persistentGroup.slots[slotId] = entiId.trim();
      }
    }
  }

  return persistentGroup;
}
