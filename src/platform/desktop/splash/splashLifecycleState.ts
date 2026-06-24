export type SplashLifecycleState = 
  | 'initializing'
  | 'checking'
  | 'downloading'
  | 'validating'
  | 'ready'
  | 'blocked'
  | 'controlled_error';
