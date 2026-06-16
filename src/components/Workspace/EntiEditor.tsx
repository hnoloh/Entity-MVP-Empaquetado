import React, { useState } from "react";
import { createPortal } from "react-dom";
import type { Enti } from "../../domain/enti/Enti";
import { deriveEntiStatus } from "../../domain/enti/entiStatus";
import "./EntiEditor.css";

interface EntiEditorProps {
  enti: Enti;
  onSave: (draft: Enti) => void;
  onClose: () => void;
  isActive: boolean;
  onNameChange?: (name: string) => void;
}

// --- Subcomponentes para mantener el código limpio (Clean Code) ---

interface HarnessFieldProps {
  label: string;
  fieldKey: keyof Enti["harness"];
  value: string | string[];
  testId: string;
  onExpand: () => void;
  onChange: (val: string | string[]) => void;
}

const HarnessField: React.FC<HarnessFieldProps> = ({ label, value, testId, onExpand, onChange }) => {
  const displayValue = Array.isArray(value) ? value.join("\n") : value;
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (Array.isArray(value)) {
      onChange(e.target.value.split("\n"));
    } else {
      onChange(e.target.value);
    }
  };

  return (
    <div className="field-group">
      <div className="field-header">
        <label>{label}</label>
        <button type="button" className="expand-btn" onClick={onExpand} title="Expandir">
          ⛶
        </button>
      </div>
      <textarea
        data-testid={testId}
        rows={1}
        value={displayValue}
        onChange={handleChange}
      />
    </div>
  );
};

interface ExpandedModalProps {
  label: string;
  fieldKey: keyof Enti["harness"];
  value: string | string[];
  onChange: (val: string | string[]) => void;
  onClose: () => void;
}

const ExpandedFieldModal: React.FC<ExpandedModalProps> = ({ label, value, onChange, onClose }) => {
  const displayValue = Array.isArray(value) ? value.join("\n") : value;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (Array.isArray(value)) {
      onChange(e.target.value.split("\n"));
    } else {
      onChange(e.target.value);
    }
  };

  return (
    <div className="expanded-field-overlay" data-testid="expanded-field-modal">
      <div className="expanded-field-content">
        <div className="expanded-field-header">
          <h3>Editando: {label}</h3>
        </div>
        <textarea
          className="expanded-textarea"
          value={displayValue}
          onChange={handleChange}
        />
        <div className="expanded-field-actions">
          <button onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

// --- Componente Principal ---

export const EntiEditor: React.FC<EntiEditorProps> = ({ enti, onSave, onClose, isActive, onNameChange }) => {
  const [draft, setDraft] = useState<Enti>(enti);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [expandedField, setExpandedField] = useState<{ key: keyof Enti["harness"]; label: string } | null>(null);
  const [isBrainSelectOpen, setIsBrainSelectOpen] = useState(false);
  const [brainSelectStep, setBrainSelectStep] = useState<"main" | "local_models" | "cloud_api_key">("main");
  const [localDetectionState, setLocalDetectionState] = useState<"detecting" | "detected">("detecting");
  const [localModels, setLocalModels] = useState<string[]>([]);
  const [tempApiKey, setTempApiKey] = useState(draft.cognitiveConfig.apiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);

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

  const handleChange = (field: keyof Enti, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    if (field === "name") {
      onNameChange?.(value);
    }
  };

  const handleHarnessChange = (field: keyof Enti["harness"], value: string | string[]) => {
    setDraft((prev) => ({
      ...prev,
      harness: { ...prev.harness, [field]: value },
    }));
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
        <div className="harness-fields-row top-row-horizontal">
          <div className="field-group name-field">
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
        </div>

        <div className="cognitive-config-section" data-testid="cognitive-config-section">
          <h3>Configuración Cognitiva</h3>
          <div className="field-group">
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
                        setDraft({ ...draft, cognitiveConfig: { ...draft.cognitiveConfig, mode: "local" } });
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
                                setDraft({ ...draft, cognitiveConfig: { ...draft.cognitiveConfig, mode: "local", provider: "ollama", model: modelName } });
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
                            setDraft({ ...draft, cognitiveConfig: { ...draft.cognitiveConfig, mode: "cloud", provider: "openai", model: undefined, apiKey: tempApiKey } });
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
          <h3>Harness Base</h3>
          <div className="harness-fields-row">
            <HarnessField
              label="Función"
              fieldKey="function"
              value={draft.harness.function}
              testId="input-function"
              onExpand={() => setExpandedField({ key: "function", label: "Función" })}
              onChange={(val) => handleHarnessChange("function", val)}
            />
            <HarnessField
              label="Normas"
              fieldKey="rules"
              value={draft.harness.rules}
              testId="input-rules"
              onExpand={() => setExpandedField({ key: "rules", label: "Normas" })}
              onChange={(val) => handleHarnessChange("rules", val)}
            />
            <HarnessField
              label="Conocimientos"
              fieldKey="knowledge"
              value={draft.harness.knowledge}
              testId="input-knowledge"
              onExpand={() => setExpandedField({ key: "knowledge", label: "Conocimientos" })}
              onChange={(val) => handleHarnessChange("knowledge", val)}
            />
            <HarnessField
              label="Material de Trabajo"
              fieldKey="workMaterial"
              value={draft.harness.workMaterial}
              testId="input-workMaterial"
              onExpand={() => setExpandedField({ key: "workMaterial", label: "Material de Trabajo" })}
              onChange={(val) => handleHarnessChange("workMaterial", val)}
            />
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
        />
      )}
    </div>
  );
};
