export interface EntiToolAuthorizationSnapshot {
  entiId: string;
  authorizedToolIds: string[];
}

export interface EntiToolAuthorizationPersistencePayload {
  root: 'tool_authorizations';
  version: string;
  data: EntiToolAuthorizationSnapshot[];
}
