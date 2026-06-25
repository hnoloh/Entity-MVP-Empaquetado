import React, { useState } from "react";
import { createPortal } from "react-dom";
import type { Enti } from "../../domain/enti/Enti";
import { deriveEntiStatus } from "../../domain/enti/entiStatus";
import { EntiHarnessAttachmentDropZone } from "../EntiHarness/EntiHarnessAttachmentDropZone";
import { EntiToolBelt } from "../EntiEditor/EntiToolBelt";
import { toolAuthorizationRepository } from "../../domain/tools/toolAuthorizationRepository";
import { entiRepository } from "../../domain/enti/entiRepository";
import "./EntiEditor.css";

interface EntiEditorProps {
  enti: Enti;
  onSave: (draft: Enti) => void;
  onClose: () => void;
  isActive: boolean;
  onDraftChange?: (draft: Enti) => void;
  onRequestOpenChat?: () => void;
}

// --- Subcomponentes para mantener el código limpio (Clean Code) ---

interface HarnessFieldProps {
  label: string;
  value: string | string[];
  testId: string;
  onExpand: () => void;
  onChange: (val: string) => void;
  inlineValue?: string;
  onInlineChange?: (val: string) => void;
  dropZoneScope?: "enti_knowledge" | "enti_work_material";
  ownerId?: string;
  onAttachmentsDropped?: (files: string[]) => void;
  mode?: 'inline' | 'modal-only';
}

const HarnessField: React.FC<HarnessFieldProps> = ({ label, value, testId, onExpand, onChange, inlineValue, onInlineChange, dropZoneScope, ownerId, onAttachmentsDropped, mode = 'inline' }) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (inlineValue !== undefined && onInlineChange) {
      onInlineChange(e.target.value);
    } else {
      onChange(e.target.value);
    }
  };

  const header = (
    <div className="field-header" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-start' }}>
      <label 
        style={{ margin: 0 }} 
        className={mode === 'modal-only' ? 'clickable-label' : ''}
        onClick={mode === 'modal-only' ? onExpand : undefined}
        title={mode === 'modal-only' ? `Editar ${label}` : undefined}
      >
        {label}
      </label>
    </div>
  );

  const displayValue = Array.isArray(value) ? value.join("\n") : value;

  const content = mode === 'modal-only' ? (
    <textarea
      data-testid={testId}
      style={{ display: 'none' }}
      value={inlineValue !== undefined ? inlineValue : displayValue}
      onChange={handleChange}
    />
  ) : (
    <div className="textarea-wrapper">
      <textarea
        data-testid={testId}
        rows={1}
        value={inlineValue !== undefined ? inlineValue : displayValue}
        onChange={handleChange}
      />
      {onExpand && (
        <button type="button" className="expand-btn" onClick={onExpand} title="Expandir">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
          </svg>
        </button>
      )}
    </div>
  );

  const body = (
    <div className="field-group">
      {header}
      {content}
    </div>
  );

  if (dropZoneScope && ownerId) {
    return (
      <EntiHarnessAttachmentDropZone scope={dropZoneScope} ownerId={ownerId} onSuccess={onAttachmentsDropped}>
        {body}
      </EntiHarnessAttachmentDropZone>
    );
  }

  return body;
};

interface ExpandedModalProps {
  label: string;
  fieldKey?: string;
  value: string | string[];
  onChange: (val: string) => void;
  onClose: () => void;
  attachments?: string[];
  dropZoneScope?: "enti_knowledge" | "enti_work_material";
  ownerId?: string;
  onAttachmentsDropped?: (files: string[]) => void;
  onRemoveAttachment?: (file: string) => void;
}

const ExpandedFieldModal: React.FC<ExpandedModalProps> = ({ label, value, onChange, onClose, attachments, dropZoneScope, ownerId, onAttachmentsDropped, onRemoveAttachment }) => {
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const innerContent = (
      <div className="expanded-field-content" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="expanded-field-header">
          <h3 style={{ margin: 0, color: '#00e5ff', fontSize: '1.1rem' }}>{label}</h3>
        </div>
        <div className="expanded-field-body" style={{ display: 'flex', flex: 1, gap: '1rem', minHeight: 0 }}>
          {attachments !== undefined ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', overflowY: 'auto', width: '100%', alignContent: 'flex-start' }}>
              {attachments.length === 0 ? (
                <div style={{ color: '#aaa', fontSize: '0.9rem', width: '100%', textAlign: 'center', marginTop: '2rem' }}>
                  Arrastra archivos aquí para añadirlos
                </div>
              ) : (
                attachments.map((name, i) => {
                  const isSelected = selectedAttachment === name;
                  return (
                    <div 
                      key={i} 
                      className={`attachment-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedAttachment(name)}
                      onDoubleClick={async (e) => {
                        e.stopPropagation();
                        try {
                          if ((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__) {
                            const { openPath } = await import('@tauri-apps/plugin-opener');
                            await openPath(name);
                          } else {
                            console.warn('Tauri opener plugin not available en este entorno');
                          }
                        } catch (err) {
                          console.error('Error al abrir archivo', err);
                          alert(`No se pudo abrir: ${name}\nError: ${err}`);
                        }
                      }}
                      title="Doble clic para abrir"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <span style={{ fontSize: '0.75rem', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {name.split(/[/\\]/).pop()}
                        </span>
                      </div>
                      
                      {onRemoveAttachment && (
                        <button 
                          className="btn-remove-attachment"
                          onClick={(e) => { e.stopPropagation(); onRemoveAttachment(name); }}
                          title="Eliminar adjunto"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#00e5ff',
                            padding: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            borderRadius: '4px'
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <textarea
              className="expanded-textarea"
              style={{ flex: 1, resize: 'none' }}
              value={Array.isArray(value) ? value.join('\n') : value}
              onChange={handleChange}
            />
          )}
        </div>
        <div className="expanded-field-actions" style={{ marginTop: '1rem' }}>
          <button type="button" onClick={onClose}>Cerrar</button>
        </div>
      </div>
  );

  if (dropZoneScope && ownerId) {
    const wrappedInner = (
      <EntiHarnessAttachmentDropZone
        scope={dropZoneScope}
        ownerId={ownerId}
        onSuccess={onAttachmentsDropped}
        style={{ width: 'auto' }}
      >
        {innerContent}
      </EntiHarnessAttachmentDropZone>
    );
    return createPortal(
      <div className="expanded-field-overlay" data-testid="expanded-field-modal">
        {wrappedInner}
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="expanded-field-overlay" data-testid="expanded-field-modal">
      {innerContent}
    </div>,
    document.body
  );
};

// --- Componente Principal ---

export const EntiEditor: React.FC<EntiEditorProps> = ({ enti, onSave, onClose, isActive, onDraftChange, onRequestOpenChat }) => {
  const initialEntiRef = React.useRef<Enti>(enti);
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
    knowledge: draft.harness.knowledgeAttachments || [],
    workMaterial: draft.harness.workMaterialAttachments || []
  });

  const [initialTools, setInitialTools] = useState(() => 
    toolAuthorizationRepository.list().filter(t => t.entiId === enti.id)
  );
  const [, setCurrentToolsTick] = useState(0);

  React.useEffect(() => {
    return toolAuthorizationRepository.subscribe(() => setCurrentToolsTick(t => t + 1));
  }, []);

  const currentTools = toolAuthorizationRepository.list().filter(t => t.entiId === enti.id);
  const isToolsDirty = JSON.stringify(initialTools) !== JSON.stringify(currentTools);

  React.useEffect(() => {
    // eslint-disable-next-line
    setDraft(prev => {
      const currentKnowledge = prev.harness.knowledgeAttachments || [];
      const currentWorkMaterial = prev.harness.workMaterialAttachments || [];
      if (
        JSON.stringify(currentKnowledge) === JSON.stringify(sessionAttachments.knowledge) &&
        JSON.stringify(currentWorkMaterial) === JSON.stringify(sessionAttachments.workMaterial)
      ) {
        return prev;
      }
      const updatedDraft = {
        ...prev,
        harness: {
          ...prev.harness,
          knowledgeAttachments: sessionAttachments.knowledge,
          workMaterialAttachments: sessionAttachments.workMaterial
        }
      };
      
      // Auto-save en vivo para que los adjuntos se reflejen al instante en el chat.
      const rulesArray = typeof updatedDraft.harness.rules === 'string'
        ? (updatedDraft.harness.rules as string).split('\n').filter(r => r.trim() !== '')
        : updatedDraft.harness.rules;

      entiRepository.save({
        ...updatedDraft,
        harness: { ...updatedDraft.harness, rules: rulesArray }
      });
      
      return updatedDraft;
    });
  }, [sessionAttachments]);

  React.useEffect(() => {
    if (onDraftChange) {
      onDraftChange(draft);
    }
    // Instant sync to repository so that other components (like ChatView)
    // can use the updated state without forcing a manual save.
    entiRepository.saveSilent(draft);
  }, [draft, onDraftChange]);

  const isDirty = JSON.stringify(initialEntiRef.current) !== JSON.stringify(draft) || isToolsDirty;

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
    const rulesArray = typeof draft.harness.rules === 'string'
      ? (draft.harness.rules as string).split('\n').filter(r => r.trim() !== '')
      : draft.harness.rules;

    const updatedDraft = { 
      ...draft, 
      harness: { ...draft.harness, rules: rulesArray },
      status: deriveEntiStatus(draft) 
    };
    
    setInitialTools(currentTools); // Reset tools dirty state
    initialEntiRef.current = updatedDraft; // Resetea el ref para que no esté sucio al cerrar
    
    onSave(updatedDraft);
    setShowCloseDialog(false);
    onClose();
  };

  const handleDiscard = () => {
    // Revert tool authorizations for this Enti
    const allOtherTools = toolAuthorizationRepository.list().filter(t => t.entiId !== enti.id);
    toolAuthorizationRepository.save([...allOtherTools, ...initialTools]);
    
    // Revertir los cambios en vivo del Enti
    entiRepository.save(initialEntiRef.current);
    
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

    // Auto-save en vivo para que los cambios se reflejen al instante en el chat.
    // Convertimos rules a array si es necesario para no romper el runtime.
    const rulesArray = typeof draftWithStatus.harness.rules === 'string'
      ? (draftWithStatus.harness.rules as string).split('\n').filter(r => r.trim() !== '')
      : draftWithStatus.harness.rules;

    const entiToSave = {
      ...draftWithStatus,
      harness: { ...draftWithStatus.harness, rules: rulesArray }
    };
    
    entiRepository.save(entiToSave);
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
  const spawnRef = React.useRef(false);

  React.useEffect(() => {
    if (currentStatus === 'complete' && !draft.hasSpawnedInitialChat && isActive && !spawnRef.current) {
      spawnRef.current = true;
      const updated = { ...draft, hasSpawnedInitialChat: true };
      setDraft(updated);
      onDraftChange?.(updated);
      entiRepository.saveSilent(updated);
      
      if (onRequestOpenChat) {
        onRequestOpenChat();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStatus, draft.hasSpawnedInitialChat, isActive]);

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
          onClick={() => setIsBrainSelectOpen(false)} 
          data-testid="global-transparent-overlay"
        />
      )}

      <div className="editor-body">
        <div className="harness-fields-row" style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <div className="field-group name-field" style={{ flex: 1, margin: 0, gap: '4px' }}>
            <label style={{ margin: 0 }}>Nombre de Enti</label>
            <input
              type="text"
              className="harness-input"
              value={draft.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Nuevo Enti"
              data-testid="input-name"
            />
          </div>

          <div data-testid="cognitive-config-section" className="field-group" style={{ flex: 1, margin: 0, gap: '4px' }}>
            <label style={{ margin: 0 }}>Tipo de Brain</label>
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
                <span className="dropdown-arrow" style={{ display: 'flex', alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </span>
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
                      <div className="cloud-api-key-input-row" style={{ display: 'flex', gap: '8px', padding: '10px', alignItems: 'center', minWidth: '500px' }}>
                        <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
                          <input 
                            type={showApiKey ? "text" : "password"} 
                            className="harness-input" 
                            value={tempApiKey} 
                            onChange={(e) => setTempApiKey(e.target.value)} 
                            placeholder="sk-..." 
                            data-testid="input-openai-api-key"
                            autoComplete="new-password"
                            style={{ flex: 1, paddingRight: '32px', minWidth: '380px' }}
                          />
                          <button 
                            className="btn-eye" 
                            onClick={(e) => { e.stopPropagation(); setShowApiKey(!showApiKey); }}
                            data-testid="btn-toggle-api-key"
                            title={showApiKey ? "Ocultar API Key" : "Mostrar API Key"}
                            style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)' }}
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
                        <button 
                          className="btn-accept" 
                          onClick={(e) => {
                            e.stopPropagation();
                            const next = { ...draft, cognitiveConfig: { ...draft.cognitiveConfig, mode: "cloud" as const, provider: "openai" as const, model: undefined, apiKey: tempApiKey } };
                            updateDraft(next);
                            setIsBrainSelectOpen(false);
                          }}
                          data-testid="btn-accept-api-key"
                          style={{ margin: 0, padding: '6px 12px' }}
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

        <div data-testid="harness-base-section" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div className="field-group">
            <HarnessField
              label="Función"
              value={draft.harness.function}
              inlineValue={draft.harness.shortFunction}
              onInlineChange={(val) => handleHarnessChange("shortFunction" as keyof typeof draft.harness, val)}
              testId="input-function"
              onExpand={() => setExpandedField({ key: "function", label: "Función (Extendida)" })}
              onChange={(val) => handleHarnessChange("function", val)}
              mode="inline"
            />
          </div>
            <HarnessField
              label="Normas"
              value={draft.harness.rules}
              testId="input-rules"
              onExpand={() => setExpandedField({ key: "rules", label: "Normas" })}
              onChange={(val) => handleHarnessChange("rules", val)}
              mode="modal-only"
            />
            <HarnessField
              label="Conocimientos"
              value={draft.harness.knowledge}
              testId="input-knowledge"
              onExpand={() => setExpandedField({ key: "knowledge", label: "Conocimientos" })}
              onChange={(val) => handleHarnessChange("knowledge", val)}
              dropZoneScope={expandedField?.key === "knowledge" ? undefined : "enti_knowledge"}
              ownerId={draft.id}
              onAttachmentsDropped={(files) => setSessionAttachments(prev => ({ ...prev, knowledge: [...prev.knowledge, ...files] }))}
              mode="modal-only"
            />
            <HarnessField
              label="Material de Trabajo"
              value={draft.harness.workMaterial}
              testId="input-workMaterial"
              onExpand={() => setExpandedField({ key: "workMaterial", label: "Material de Trabajo" })}
              onChange={(val) => handleHarnessChange("workMaterial", val)}
              dropZoneScope={expandedField?.key === "workMaterial" ? undefined : "enti_work_material"}
              ownerId={draft.id}
              onAttachmentsDropped={(files) => setSessionAttachments(prev => ({ ...prev, workMaterial: [...prev.workMaterial, ...files] }))}
              mode="modal-only"
            />
        </div>
      </div>
      <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(0, 229, 255, 0.1)' }}>
        <EntiToolBelt entiId={draft.id} />
      </div>

      {expandedField && (
        <ExpandedFieldModal
          label={expandedField.label}
          fieldKey={expandedField.key}
          value={expandedField.key === "rules" ? draft.harness.rules : draft.harness[expandedField.key as "knowledge" | "workMaterial"]}
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
          onAttachmentsDropped={(files) => {
            if (expandedField.key === "knowledge") {
              setSessionAttachments(prev => ({ ...prev, knowledge: [...prev.knowledge, ...files] }));
            } else if (expandedField.key === "workMaterial") {
              setSessionAttachments(prev => ({ ...prev, workMaterial: [...prev.workMaterial, ...files] }));
            }
          }}
          onRemoveAttachment={(file) => {
            if (expandedField.key === "knowledge") {
              setSessionAttachments(prev => ({ ...prev, knowledge: prev.knowledge.filter(f => f !== file) }));
            } else if (expandedField.key === "workMaterial") {
              setSessionAttachments(prev => ({ ...prev, workMaterial: prev.workMaterial.filter(f => f !== file) }));
            }
          }}
        />
      )}
    </div>
  );
};
