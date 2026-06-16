export function validateGroupName(name: unknown): boolean {
  if (typeof name !== 'string') return false;
  if (name.trim() === '') return false;
  return true;
}
