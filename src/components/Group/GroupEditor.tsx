import React, { useState } from "react";
import { createPortal } from "react-dom";
import { type Group, GROUP_SLOT_IDS } from "../../domain/group/Group";
import type { Enti } from "../../domain/enti/Enti";
import { addEntiToGroupSlotFlow } from "../../domain/group/addEntiToGroupSlotFlow";
import { validateGroupGapsFlow } from "../../domain/group/validateGroupGapsFlow";
import { removeEntiFromGroupSlotFlow } from "../../domain/group/removeEntiFromGroupSlotFlow";


interface ExpandedModalProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onClose: () => void;
}

const ExpandedFieldModal: React.FC<ExpandedModalProps> = ({ label, value, onChange, onClose }) => {
  return (
    <div className="expanded-field-overlay" data-testid="expanded-field-modal">
      <div className="expanded-field-content">
        <div className="expanded-field-header">
          <h3>Editando: {label}</h3>
        </div>
        <textarea
          className="expanded-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="expanded-field-actions">
          <button onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

interface GroupEditorProps {
  group: Group;
  isActive: boolean;
  onSave: (draft: Group) => void;
  onClose: () => void;
  availableEntis: Enti[];
  onDraftChange?: (draft: Group) => void;
}

export const GroupEditor: React.FC<GroupEditorProps> = ({ group, isActive, onSave, onClose, availableEntis, onDraftChange }) => {
  const [draft, setDraft] = useState<Group>(group);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [expandedField, setExpandedField] = useState<{ key: string; label: string } | null>(null);
  const [openSlotDropdown, setOpenSlotDropdown] = useState<string | null>(null);

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenSlotDropdown(null);
  };

  const isDirty = JSON.stringify(draft) !== JSON.stringify(group);

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
    if (!draft.name || draft.name.trim() === '') {
      alert("El grupo debe tener un nombre para poder guardarse.");
      return;
    }
    const membersCount = Object.values(draft.slots || {}).filter(Boolean).length;
    if (membersCount < 2) {
      alert("El grupo debe tener un mínimo de 2 integrantes para poder guardarse.");
      return;
    }
    const gapsValidation = validateGroupGapsFlow(draft);
    if (!gapsValidation.valid) {
      alert("No se puede guardar el grupo porque los integrantes no están ordenados secuencialmente (hay huecos en la secuencia).");
      return;
    }
    onSave(draft);
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

  const handleChangeName = (name: string) => {
    setDraft(prev => {
      const next = { ...prev, name };
      onDraftChange?.(next);
      return next;
    });
  };

  const handleChangeFunction = (func: string) => {
    setDraft(prev => {
      const next = { ...prev, function: func };
      onDraftChange?.(next);
      return next;
    });
  };

  const handleAddEntiToSlot = (slotId: string, entiId: string) => {
    if (!entiId) {
       const updated = removeEntiFromGroupSlotFlow([draft], draft.id, slotId)[0];
       if (updated) {
         setDraft(updated);
         onDraftChange?.(updated);
       }
    } else {
       const updated = addEntiToGroupSlotFlow([draft], availableEntis, draft.id, entiId, slotId)[0];
       if (updated) {
         setDraft(updated);
         onDraftChange?.(updated);
       }
    }
  };



  const membersCountForStatus = Object.values(draft.slots || {}).filter(Boolean).length;
  const isComplete = membersCountForStatus >= 2 && draft.name && draft.name.trim() !== "" && draft.function && draft.function.trim() !== "" && validateGroupGapsFlow(draft).valid;
  const statusClass = isComplete ? "complete" : "incomplete";

  // Usamos las clases de EntiEditor.css para mantener simetría perfecta
  return (
    <div className={`enti-editor ${!isActive ? "hidden" : ""}`} data-testid="group-editor" style={{ display: isActive ? undefined : 'none' }}>
      <div className="editor-header">
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className={`status-indicator ${statusClass}`} data-testid={`editor-status-indicator-${draft.id}`} />
          <h2 className="editor-title">Edición de Grupo</h2>
        </div>
        <div className="window-controls">
          <button 
            style={{ display: 'none' }}
            onClick={() => handleCloseAttempt()} 
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
            <button onClick={handleSave} data-testid="btn-dialog-guardar">Guardar</button>
            <button onClick={handleDiscard} data-testid="btn-dialog-descartar">Descartar</button>
            <button onClick={handleCancel} data-testid="btn-dialog-cancelar">Cancelar</button>
          </div>
        </div>,
        document.body
      )}

      {openSlotDropdown && (
        <div className="global-transparent-overlay" onClick={handleOverlayClick} />
      )}

      <div className="editor-body">
        <div className="harness-fields-row" style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <div className="field-group name-field" style={{ flex: 1, margin: 0, gap: '4px' }}>
            <label style={{ margin: 0 }}>Nombre del Grupo</label>
            <input 
              type="text" 
              data-testid="input-group-name" 
              value={draft.name} 
              onChange={e => handleChangeName(e.target.value)} 
              className="harness-input" 
              placeholder="Nuevo Grupo"
            />
          </div>
          <div className="field-group" style={{ flex: 1, margin: 0, gap: '4px' }}>
            <div className="field-header">
              <label style={{ margin: 0 }}>Función del Grupo</label>
            </div>
            <div className="textarea-wrapper">
              <textarea 
                rows={1}
                data-testid="input-group-function" 
                value={draft.function || ""} 
                onChange={e => handleChangeFunction(e.target.value)} 
                className="harness-input" 
              />
              <button type="button" className="expand-btn" onClick={() => setExpandedField({ key: "function", label: "Función del Grupo" })} title="Expandir">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="harness-base-section horizontal-harness" data-testid="slots-section">
          <h3>Secuencia de grupo</h3>
          <div className="harness-fields-row slots-fields-row">
            {GROUP_SLOT_IDS.map(slotId => (
              <div key={slotId} className="field-group slot-field-group">
                <label className="slot-label">{slotId}</label>
                <div className="custom-select-container" style={{ zIndex: openSlotDropdown === slotId ? 100 : 1 }}>
                  <div 
                    className="custom-select-trigger"
                    data-testid={`select-slot-${slotId}`} 
                    data-value={draft.slots?.[slotId] || ""}
                    onClick={() => setOpenSlotDropdown(openSlotDropdown === slotId ? null : slotId)}
                  >
                    {draft.slots?.[slotId] ? (availableEntis.find(e => e.id === draft.slots![slotId])?.name || draft.slots![slotId]) : "-- Sin Enti --"}
                    <span className="dropdown-arrow">▼</span>
                  </div>
                  {openSlotDropdown === slotId && (
                    <ul className="custom-select-options">
                      <li onClick={() => { handleAddEntiToSlot(slotId, ""); setOpenSlotDropdown(null); }}>
                        -- Sin Enti --
                      </li>
                      {availableEntis.filter(e => {
                        const isSelectedInOtherSlot = Object.entries(draft.slots || {}).some(([sId, eId]) => sId !== slotId && eId === e.id);
                        return !isSelectedInOtherSlot;
                      }).map(e => (
                        <li key={e.id} onClick={() => { handleAddEntiToSlot(slotId, e.id); setOpenSlotDropdown(null); }}>
                          {e.name || e.id}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      
      {expandedField && (
        <ExpandedFieldModal
          label={expandedField.label}
          value={draft.function || ""}
          onChange={handleChangeFunction}
          onClose={() => setExpandedField(null)}
        />
      )}
    </div>
  );
};
