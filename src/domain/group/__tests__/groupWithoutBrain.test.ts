/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { type Group } from '../Group';
import { createGroupFlow } from '../createGroupFlow';
import { editGroupFlow } from '../editGroupFlow';
import { addEntiToGroupSlotFlow } from '../addEntiToGroupSlotFlow';
import { validateGroupCardinalityFlow } from '../validateGroupCardinalityFlow';
import { getGroupMembersFlow } from '../getGroupMembersFlow';
import { getGroupSequenceFlow } from '../getGroupSequenceFlow';

describe('Group without Brain (RV05-FIA-015)', () => {
  it('TEST-FIA015-01: Group no requiere propiedades cognitivas (brainId, provider, etc.)', () => {
    const group: Group = createGroupFlow('g-1', 'Grupo Test');
    
    // Verificamos que TypeScript no exija propiedades extra (esto fallaría en compilación si Group exigiera un brainId)
    expect(group.id).toBe('g-1');
    expect(group.name).toBe('Grupo Test');
    
    // Verificamos que las propiedades cognitivas no se añadan por defecto
     
    expect((group as any).brainId).toBeUndefined();
     
    expect((group as any).provider).toBeUndefined();
     
    expect((group as any).runtimeConfig).toBeUndefined();
  });

  it('TEST-FIA015-02: Edición de nombre y función en Grupo sin Brain', () => {
    const group = createGroupFlow('g-1', 'Grupo Test');
    const updated = editGroupFlow([group], 'g-1', { name: 'Nuevo Nombre', function: 'Nueva Función' })[0];
    
    expect(updated?.name).toBe('Nuevo Nombre');
    expect(updated?.function).toBe('Nueva Función');
  });

  it('TEST-FIA015-03: Gestión de slots y cardinalidad en Grupo sin Brain', () => {
    let group = createGroupFlow('g-1', 'Grupo Test');
    
    // Añadir slots
    group = addEntiToGroupSlotFlow([group], [{ id: 'e-1', name: 'Enti 1', type: 'enti', harness: { function: '', rules: [], knowledge: '', workMaterial: '' }, cognitiveConfig: { mode: 'unconfigured' }, status: 'complete' }], 'g-1', 'e-1', '1')[0] || group;
    group = addEntiToGroupSlotFlow([group], [{ id: 'e-2', name: 'Enti 2', type: 'enti', harness: { function: '', rules: [], knowledge: '', workMaterial: '' }, cognitiveConfig: { mode: 'unconfigured' }, status: 'complete' }], 'g-1', 'e-2', '2')[0] || group;
    
    const isValid = validateGroupCardinalityFlow([group], 'g-1');
    expect(isValid).toBe(true);
    
    const members = getGroupMembersFlow(group).map(m => m.entiId);
    expect(members).toContain('e-1');
    expect(members).toContain('e-2');
    
    const sequence = getGroupSequenceFlow(group);
    expect(sequence).toEqual([{ entiId: 'e-1', slotId: '1' }, { entiId: 'e-2', slotId: '2' }]);
  });
});
