export function validateGroupFunction(func: unknown): boolean {
  if (typeof func !== 'string') return false;
  if (func.trim() === '') return false;
  return true;
}
