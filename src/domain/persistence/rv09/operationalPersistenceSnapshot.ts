import type { OperationalRestorePayload } from '../operationalRestore';
import type { MultiWindowPersistenceSnapshot } from './multiWindowPersistenceSnapshot';

export interface OperationalPersistenceSnapshot_RV09 {
  root: 'operational_restore_rv09';
  version: '1.0';
  basePayload: OperationalRestorePayload;
  multiWindowPayload?: MultiWindowPersistenceSnapshot;
}
