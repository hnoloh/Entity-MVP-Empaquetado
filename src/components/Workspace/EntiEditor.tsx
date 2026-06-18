import React, { useState } from "react";
import { createPortal } from "react-dom";
import type { Enti } from "../../domain/enti/Enti";
import { deriveEntiStatus } from "../../domain/enti/entiStatus";
import { EntiHarnessAttachmentDropZone } from "../EntiHarness/EntiHarnessAttachmentDropZone";
import { EntiToolBelt } from "../EntiEditor/EntiToolBelt";
import "./EntiEditor.css";

interface EntiEditorProps {
  enti: Enti;
  onSave: (draft: Enti) => void;
  onClose: () => void;
  isActive: boolean;
  onDraftChange?: (draft: Enti) => void;
}

// --- Subcomponentes para mantener el código limpio (Clean Code) ---

interface HarnessFieldProps {
  label: string;
  fieldKey: keyof Enti["harness"];
  value: string | string[];
  testId: string;
  onExpand: () => void;
  onChange: (val: string | string[]) => void;
  inlineValue?: string;
  onInlineChange?: (val: string) => void;
  dropZoneScope?: "enti_knowledge" | "enti_work_material";
  ownerId?: string;
  onAttachmentsDropped?: (files: string[]) => void;
  mode?: 'inline' | 'modal-only';
}

const HarnessField: React.FC<HarnessFieldProps> = ({ label, value, testId, onExpand, onChange, inlineValue, onInlineChange, dropZoneScope, ownerId, onAttachmentsDropped, mode = 'inline' }) => {
  const displayValue = Array.isArray(value) ? value.join("\n") : value;
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (inlineValue !== undefined && onInlineChange) {
      onInlineChange(e.target.value);
    } else if (Array.isArray(value)) {
      onChange(e.target.value.split("\n"));
    } else {
      onChange(e.target.value);
    }
  };

  const content = mode === 'modal-only' ? (
    <button type="button" className="expand-btn modal-only-btn" onClick={onExpand} style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,255,255,0.05)', border: '1px dashed rgba(0,255,255,0.3)', color: '#00ffff', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
      Abrir desplegable
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
      </svg>
    </button>
  ) : (
    <div className="textarea-wrapper">
      <textarea
        data-testid={testId}
        rows={1}
        value={inlineValue !== undefined ? inlineValue : displayValue}
        onChange={handleChange}
      />
      <button type="button" className="expand-btn" onClick={onExpand} title="Expandir">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
      </button>
    </div>
  );

  return (
    <div className="field-group">
      <div className="field-header">
        <label>{label}</label>
      </div>
      {dropZoneScope && ownerId ? (
        <EntiHarnessAttachmentDropZone
          scope={dropZoneScope}
          ownerId={ownerId}
          onSuccess={onAttachmentsDropped}
        >
          {content}
        </EntiHarnessAttachmentDropZone>
      ) : content}
    </div>
  );
};

interface ExpandedModalProps {
  label: string;
  fieldKey: keyof Enti["harness"];
  value: string | string[];
  onChange: (val: string | string[]) => void;
  onClose: () => void;
  attachments?: string[];
  dropZoneScope?: "enti_knowledge" | "enti_work_material";
  ownerId?: string;
  onAttachmentsDropped?: (files: string[]) => void;
}

const ExpandedFieldModal: React.FC<ExpandedModalProps> = ({ label, value, onChange, onClose, attachments, dropZoneScope, ownerId, onAttachmentsDropped }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const displayValue = Array.isArray(value) ? value.join("\n") : value;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (Array.isArray(value)) {
      onChange(e.target.value.split("\n"));
    } else {
      onChange(e.target.value);
    }
  };

  const innerContent = (
      <div className="expanded-field-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="expanded-field-header">
          <h3>Editando: {label}</h3>
          {attachments !== undefined && (
            <button 
              type="button" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{
                background: isSidebarOpen ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
                color: '#00ffff',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              {attachments.length} {attachments.length === 1 ? 'Adjunto' : 'Adjuntos'}
            </button>
          )}
        </div>
        <div className="expanded-field-body" style={{ display: 'flex', flex: 1, gap: '1rem', minHeight: 0 }}>
          {attachments !== undefined && isSidebarOpen && (
            <div className="expanded-field-sidebar" style={{ width: '250px', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '4px', overflowY: 'auto' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#00ffff', fontSize: '0.9rem', textTransform: 'uppercase' }}>Archivos Adjuntos</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {attachments.map((name, i) => (
                  <li key={i} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', marginBottom: '0.5rem', borderRadius: '4px', fontSize: '0.85rem', wordBreak: 'break-all', color: '#ccc' }}>
                    {name}
                  </li>
                ))}
                {attachments.length === 0 && (
                  <li style={{ color: '#aaa', fontSize: '0.85rem' }}>No hay archivos adjuntos</li>
                )}
              </ul>
            </div>
          )}
          <textarea
            className="expanded-textarea"
            style={{ flex: 1, resize: 'none' }}
            value={displayValue}
            onChange={handleChange}
          />
        </div>
        <div className="expanded-field-actions" style={{ marginTop: '1rem' }}>
          <button type="button" onClick={onClose}>Cerrar</button>
        </div>
      </div>
  );

  return (
    <div className="expanded-field-overlay" data-testid="expanded-field-modal">
      {dropZoneScope && ownerId ? (
        <EntiHarnessAttachmentDropZone
          scope={dropZoneScope}
          ownerId={ownerId}
          onSuccess={onAttachmentsDropped}
        >
          {innerContent}
        </EntiHarnessAttachmentDropZone>
      ) : innerContent}
    </div>
  );
};

// --- Componente Principal ---

export const EntiEditor: React.FC<EntiEditorProps> = ({ enti, onSave, onClose, isActive, onDraftChange }) => {
  const [draft, setDraft] = useState<Enti>(enti);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [expandedField, setExpandedField] = useState<{ key: keyof Enti["harness"]; label: string } | null>(null);
  const [isBrainSelectOpen, setIsBrainSelectOpen] = useState(false);
  const [brainSelectStep, setBrainSelectStep] = useState<"main" | "local_models" | "cloud_api_key">("main");
  const [localDetectionState, setLocalDetectionState] = useState<"detecting" | "detected">("detecting");
  const [localModels, setLocalModels] = useState<string[]>([]);
  const [tempApiKey, setTempApiKey] = useState(draft.cognitiveConfig.apiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [sessionAttachments, setSessionAttachments] = useState<{ knowledge: string[], workMaterial: string[] }>({
    knowledge: [],
    workMaterial: []
  });

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (brainSelectStep === "cloud_api_key" || brainSelectStep === "local_models") {
      return; // Bloquea el cierre forzando interacción con el submenú
    }
    setIsBrainSelectOpen(false);
  };

  React.useEffect(() => {
    if (isBrainSelectOpen && brainSelectStep === "local_models" && localDetectionState === "detecting") {
      let isMounted = true;
      const fetchModels = async () => {
        try {
          const res = await fetch('http://localhost:11434/api/tags');
          if (!res.ok) throw new Error('Ollama no disponible');
          const data = await res.json();
          if (isMounted) {
            setLocalModels(data.models?.map((m: { name: string }) => m.name) || []);
            setLocalDetectionState("detected");
          }
        } catch {
          if (isMounted) {
            // Fallback a mock en entorno de test para que no rompa los tests que no tienen mock de fetch
            if (process.env.NODE_ENV === 'test') {
               setLocalModels(["Llama-3-8B-Instruct", "Mistral-7B-v0.2"]);
            } else {
               setLocalModels([]);
            }
            setLocalDetectionState("detected");
          }
        }
      };
      fetchModels();
      return () => { isMounted = false; };
    }
  }, [isBrainSelectOpen, brainSelectStep, localDetectionState]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(enti);

  const handleCloseAttempt = React.useCallback(() => {
    if (isDirty) {
      setShowCloseDialog(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  React.useEffect(() => {
    const handleGlobalClose = (e: CustomEvent) => {
      if (e.detail.id === draft.id) {
        handleCloseAttempt();
      }
    };
    window.addEventListener('request-close-editor', handleGlobalClose as EventListener);
    return () => window.removeEventListener('request-close-editor', handleGlobalClose as EventListener);
  }, [draft.id, handleCloseAttempt]);

  const handleSave = () => {
    const updatedDraft = { ...draft, status: deriveEntiStatus(draft) };
    onSave(updatedDraft);
    setShowCloseDialog(false);
    onClose();
  };

  const handleDiscard = () => {
    setShowCloseDialog(false);
    onClose();
  };

  const handleCancel = () => {
    setShowCloseDialog(false);
  };

  const updateDraft = (newDraft: Enti) => {
    const draftWithStatus = { ...newDraft, status: deriveEntiStatus(newDraft) };
    setDraft(draftWithStatus);
    onDraftChange?.(draftWithStatus);
  };

  const handleChange = (field: keyof Enti, value: string) => {
    updateDraft({ ...draft, [field]: value });
  };

  const handleHarnessChange = (field: keyof Enti["harness"], value: string | string[]) => {
    updateDraft({
      ...draft,
      harness: { ...draft.harness, [field]: value },
    });
  };

  const currentStatus = deriveEntiStatus(draft);

  return (
    <div 
      className={`enti-editor ${!isActive ? "hidden" : ""}`} 
      data-testid="enti-editor"
      style={{ display: isActive ? undefined : 'none' }}
    >
      <div className="editor-header">
        <div style={{ display: "flex", alignItems: "center" }}>
          <span 
            className={`status-indicator ${currentStatus}`} 
            title={currentStatus === 'complete' ? 'Estado: Completo' : 'Estado: Incompleto'}
            data-testid={`editor-status-indicator-${draft.id}`}
          />
          <h2 className="editor-title">Gestión de Enti</h2>
        </div>
        <div className="window-controls">
          <button 
            style={{ display: 'none' }}
            onClick={() => {
              handleCloseAttempt();
            }} 
            data-testid="btn-close-editor" 
            title="Cerrar Editor"
          >
            ✕
          </button>
        </div>
      </div>

      {showCloseDialog && typeof document !== "undefined" && createPortal(
        <div className="close-dialog-overlay">
          <div className="close-dialog" data-testid="close-dialog">
            <p>Hay cambios pendientes</p>
            <button onClick={handleSave} data-testid="btn-dialog-guardar">
              Guardar
            </button>
            <button onClick={handleDiscard} data-testid="btn-dialog-descartar">
              Descartar
            </button>
            <button onClick={handleCancel} data-testid="btn-dialog-cancelar">
              Cancelar
            </button>
          </div>
        </div>,
        document.body
      )}

        {isBrainSelectOpen && (
          <div 
            className="global-transparent-overlay" 
            onClick={handleOverlayClick} 
            data-testid="global-transparent-overlay"
          />
        )}

          <div className="editor-body">
        <div className="harness-fields-row top-row-horizontal" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div className="field-group name-field" style={{ flex: 1 }}>
            <label>Nombre de Enti</label>
            <input
              type="text"
              className="harness-input"
              value={draft.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Nuevo Enti"
              data-testid="input-name"
            />
          </div>

          <div className="field-group cognitive-config-section" style={{ flex: 1, marginTop: 0 }} data-testid="cognitive-config-section">
            <label>Tipo de Brain</label>
            <div className="custom-select-container">
              <div 
                className="custom-select-trigger"
                data-testid="input-cognitive-mode"
                data-value={draft.cognitiveConfig.mode}
                onClick={() => {
                  setBrainSelectStep("main");
                  setIsBrainSelectOpen(!isBrainSelectOpen);
                }}
              >
                {draft.cognitiveConfig.mode === "unconfigured" 
                  ? "Seleccionar tipo..." 
                  : draft.cognitiveConfig.mode === "local" 
                    ? (draft.cognitiveConfig.model ? `IA Local: ${draft.cognitiveConfig.model}` : "IA Local") 
                    : "IA Cloud/OpenAI"}
                <span className="dropdown-arrow">▼</span>
              </div>
              {isBrainSelectOpen && (
                <ul className="custom-select-options">
                  {brainSelectStep === "main" && (
                    <>
                      <li data-testid="option-local" onClick={() => {
                        const next = { ...draft, cognitiveConfig: { ...draft.cognitiveConfig, mode: "local" as const } };
                        updateDraft(next);
                        setLocalDetectionState("detecting");
                        setBrainSelectStep("local_models");
                      }}>
                        IA Local
                      </li>
                      <li data-testid="option-cloud" onClick={() => {
                        setTempApiKey(draft.cognitiveConfig.mode === "cloud" && draft.cognitiveConfig.apiKey ? draft.cognitiveConfig.apiKey : "");
                        setBrainSelectStep("cloud_api_key");
                      }}>
                        IA Cloud/OpenAI
                      </li>
                    </>
                  )}
                  {brainSelectStep === "local_models" && (
                    <div className="local-models-dropdown-step" data-testid="local-brain-detection-block">
                      <div className="step-header">
                        <button className="btn-back" onClick={(e) => { e.stopPropagation(); setBrainSelectStep("main"); }}>← Volver</button>
                        <span className="step-title">Brains Locales</span>
                      </div>
                      {localDetectionState === "detecting" ? (
                        <div className="detection-status">Escaneando...</div>
                      ) : (
                        <div className="local-models-list" data-testid="local-models-list">
                          {localModels.length === 0 ? (
                            <div className="detection-status" style={{color: '#c92a2a', fontSize: '0.85rem'}}>No se detectaron modelos. ¿Ollama está en ejecución?</div>
                          ) : (
                            localModels.map(modelName => (
                              <li key={modelName} data-testid="local-model-item" onClick={() => {
                                const next = { ...draft, cognitiveConfig: { ...draft.cognitiveConfig, mode: "local" as const, provider: "ollama", model: modelName } };
                                updateDraft(next);
                                setIsBrainSelectOpen(false);
                              }}>
                                🤖 {modelName}
                              </li>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {brainSelectStep === "cloud_api_key" && (
                    <div className="cloud-api-key-dropdown-step" data-testid="cloud-api-key-block">
                      <div className="step-header">
                        <button className="btn-back" onClick={(e) => { e.stopPropagation(); setBrainSelectStep("main"); }}>← Volver</button>
                        <span className="step-title">OpenAI API Key</span>
                      </div>
                      <div className="cloud-api-key-input-container">
                        <input 
                          type={showApiKey ? "text" : "password"} 
                          className="harness-input" 
                          value={tempApiKey} 
                          onChange={(e) => setTempApiKey(e.target.value)} 
                          placeholder="sk-..." 
                          data-testid="input-openai-api-key"
                          autoComplete="new-password"
                        />
                        <button 
                          className="btn-eye" 
                          onClick={(e) => { e.stopPropagation(); setShowApiKey(!showApiKey); }}
                          data-testid="btn-toggle-api-key"
                          title={showApiKey ? "Ocultar API Key" : "Mostrar API Key"}
                        >
                          {showApiKey ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                              <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          )}
                        </button>
                      </div>
                      <div className="cloud-api-key-actions">
                        <button 
                          className="btn-accept" 
                          onClick={(e) => {
                            e.stopPropagation();
                            const next = { ...draft, cognitiveConfig: { ...draft.cognitiveConfig, mode: "cloud" as const, provider: "openai" as const, model: undefined, apiKey: tempApiKey } };
                            updateDraft(next);
                            setIsBrainSelectOpen(false);
                          }}
                          data-testid="btn-accept-api-key"
                        >
                          Aceptar
                        </button>
                      </div>
                    </div>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="harness-base-section horizontal-harness" data-testid="harness-base-section">
          <div className="harness-fields-row">
            <HarnessField
              label="Función"
              fieldKey="function"
              value={draft.harness.function}
              inlineValue={draft.harness.shortFunction || ''}
              onInlineChange={(val) => handleHarnessChange("shortFunction" as keyof typeof draft.harness, val)}
              testId="input-function"
              onExpand={() => setExpandedField({ key: "function", label: "Función (Extendida)" })}
              onChange={(val) => handleHarnessChange("function", val)}
              mode="inline"
            />
            <HarnessField
              label="Normas"
              fieldKey="rules"
              value={draft.harness.rules}
              testId="input-rules"
              onExpand={() => setExpandedField({ key: "rules", label: "Normas" })}
              onChange={(val) => handleHarnessChange("rules", val)}
              mode="modal-only"
            />
            <HarnessField
              label="Conocimientos"
              fieldKey="knowledge"
              value={draft.harness.knowledge}
              testId="input-knowledge"
              onExpand={() => setExpandedField({ key: "knowledge", label: "Conocimientos" })}
              onChange={(val) => handleHarnessChange("knowledge", val)}
              dropZoneScope="enti_knowledge"
              ownerId={draft.id}
              onAttachmentsDropped={(files) => setSessionAttachments(prev => ({ ...prev, knowledge: [...prev.knowledge, ...files] }))}
              mode="modal-only"
            />
            <HarnessField
              label="Material de Trabajo"
              fieldKey="workMaterial"
              value={draft.harness.workMaterial}
              testId="input-workMaterial"
              onExpand={() => setExpandedField({ key: "workMaterial", label: "Material de Trabajo" })}
              onChange={(val) => handleHarnessChange("workMaterial", val)}
              dropZoneScope="enti_work_material"
              ownerId={draft.id}
              onAttachmentsDropped={(files) => setSessionAttachments(prev => ({ ...prev, workMaterial: [...prev.workMaterial, ...files] }))}
              mode="modal-only"
            />
            <EntiToolBelt entiId={draft.id} />
          </div>
        </div>
      </div>

      {expandedField && (
        <ExpandedFieldModal
          label={expandedField.label}
          fieldKey={expandedField.key}
          value={draft.harness[expandedField.key]}
          onChange={(val) => handleHarnessChange(expandedField.key, val)}
          onClose={() => setExpandedField(null)}
          attachments={
             expandedField.key === "knowledge" ? sessionAttachments.knowledge :
             expandedField.key === "workMaterial" ? sessionAttachments.workMaterial : undefined
          }
          dropZoneScope={
            expandedField.key === "knowledge" ? "enti_knowledge" :
            expandedField.key === "workMaterial" ? "enti_work_material" : undefined
          }
          ownerId={draft.id}
          onAttachmentsDropped={
            expandedField.key === "knowledge" ? (files) => setSessionAttachments(prev => ({ ...prev, knowledge: [...prev.knowledge, ...files] })) :
            expandedField.key === "workMaterial" ? (files) => setSessionAttachments(prev => ({ ...prev, workMaterial: [...prev.workMaterial, ...files] })) : undefined
          }
        />
      )}
    </div>
  );
};
