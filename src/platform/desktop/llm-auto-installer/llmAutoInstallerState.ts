export type LLMAutoInstallerState =
  | 'pending'
  | 'checking'
  | 'downloading'
  | 'validating'
  | 'ready'
  | 'blocked'
  | 'controlled_error';
