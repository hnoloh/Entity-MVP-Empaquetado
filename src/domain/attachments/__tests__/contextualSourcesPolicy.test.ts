import { contextualSourcesPolicy } from '../contextualSourcesPolicy';

describe('contextualSourcesPolicy', () => {
  it('allows valid enti attachment with allowed scopes', () => {
    const result1 = contextualSourcesPolicy({ ownerType: 'enti', scope: 'chat_context' });
    expect(result1.status).toBe('success');

    const result2 = contextualSourcesPolicy({ ownerType: 'enti', scope: 'enti_knowledge' });
    expect(result2.status).toBe('success');

    const result3 = contextualSourcesPolicy({ ownerType: 'enti', scope: 'enti_work_material' });
    expect(result3.status).toBe('success');
  });

  it('blocks non-enti ownerType', () => {
    const result = contextualSourcesPolicy({ ownerType: 'group', scope: 'chat_context' });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') {
      expect(result.reason).toContain('ownerType must be enti');
    }
  });

  it('blocks unknown scopes', () => {
    const result = contextualSourcesPolicy({ ownerType: 'enti', scope: 'unknown_scope' });
    expect(result.status).toBe('blocked');
    if (result.status === 'blocked') {
      expect(result.reason).toContain('Invalid scope');
    }
  });

  it('blocks records with blob, content, rawText, snapshot', () => {
    const result1 = contextualSourcesPolicy({ ownerType: 'enti', scope: 'chat_context', blob: new Blob() });
    expect(result1.status).toBe('blocked');

    const result2 = contextualSourcesPolicy({ ownerType: 'enti', scope: 'chat_context', content: 'hello' });
    expect(result2.status).toBe('blocked');

    const result3 = contextualSourcesPolicy({ ownerType: 'enti', scope: 'chat_context', rawText: 'hello' });
    expect(result3.status).toBe('blocked');

    const result4 = contextualSourcesPolicy({ ownerType: 'enti', scope: 'chat_context', snapshot: {} });
    expect(result4.status).toBe('blocked');
  });
});
