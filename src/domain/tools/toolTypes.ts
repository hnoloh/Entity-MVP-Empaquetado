export type ToolId = string;
export type ToolKind = 'document_read' | 'generate_pdf' | 'generate_docx' | 'generate_html' | 'generate_text_artifact' | 'download_generated_artifact' | 'internet' | 'local_filesystem';
export type ToolRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ToolState = 'available' | 'authorized' | 'in_use' | 'blocked' | 'controlled_error';
export type ToolOperationResult = 'success' | 'blocked' | 'controlled_error';
export type ToolBlockedReason = 'unknown_tool' | 'invalid_owner' | 'group_owner_not_allowed' | 'risk_not_authorized' | 'tool_not_authorized' | 'invalid_state';
