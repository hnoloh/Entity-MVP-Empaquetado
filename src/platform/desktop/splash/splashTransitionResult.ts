export interface SplashTransitionResult {
  success: boolean;
  state: 'ready' | 'controlled_error' | 'blocked';
  errorDetails?: string;
}
