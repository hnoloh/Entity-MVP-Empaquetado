export interface LifecycleIntegrationResult {
  operation: 'startup' | 'shutdown' | 'restore' | 'splash_transition';
  status: 'success' | 'blocked' | 'controlled_error';
  timestamp: number;
  details?: string;
  autoRunPrevented?: boolean;
}
