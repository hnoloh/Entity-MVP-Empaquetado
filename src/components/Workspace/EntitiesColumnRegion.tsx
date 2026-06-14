import React, { useState } from "react";
import "./EntitiesColumnRegion.css";

export interface EntityFixture {
  id: string;
  name: string;
}

export interface EntitiesColumnRegionProps {
  entis?: { id: string; name: string; status?: string }[];
  grupos?: EntityFixture[];
  openEntiIds?: string[];
  onCreateEnti?: () => void;
  onSelectEnti?: (id: string) => void;
  onDeleteEnti?: (id: string) => void;
  onCreateGrupo?: () => void;
}

export const EntitiesColumnRegion: React.FC<EntitiesColumnRegionProps> = ({
  entis = [],
  grupos = [],
  openEntiIds = [],
  onCreateEnti,
  onSelectEnti,
  onDeleteEnti,
  onCreateGrupo,
}) => {
  const [entisOpen, setEntisOpen] = useState(true);
  const [gruposOpen, setGruposOpen] = useState(true);
  const [entityToDelete, setEntityToDelete] = useState<string | null>(null);

  return (
    <div
      data-testid="entities-column-region"
      className="entities-column-region-inner"
    >
      {/* Sección Entis */}
      <div className="entity-section">
        <div
          data-testid="section-header-entis"
          className="entity-section-header"
          onClick={() => setEntisOpen(!entisOpen)}
        >
          <div className="entity-section-title">
            <span>ENTIS</span>
            <button
              data-testid="btn-create-enti"
              className="btn-create-inline"
              onClick={(e) => {
                e.stopPropagation(); // Evita plegar/desplegar
                if (onCreateEnti) onCreateEnti();
              }}
              title="Crear Enti"
            >
              +
            </button>
          </div>
          <span
            data-testid="collapse-icon-entis"
            className={`collapse-icon ${entisOpen ? "open" : ""}`}
          >
            ›
          </span>
        </div>
        {entisOpen && (
          <div
            data-testid="section-content-entis"
            className="entity-section-content"
          >
            {Array.from(new Map(entis.map((e) => [e.id, e])).values()).map((e) => (
              <div
                key={e.id}
                className={`list-item ${openEntiIds.includes(e.id) ? 'selected' : ''}`}
                data-testid={`enti-item-${e.id}`}
                onClick={() => onSelectEnti?.(e.id)}
              >
                <div className="item-info">
                  <span 
                    className={`status-indicator ${e.status}`} 
                    title={e.status === 'complete' ? 'Estado: Completo' : 'Estado: Incompleto'}
                    data-testid={`status-indicator-${e.id}`}
                  />
                  <span className="item-name">{e.name || "Sin nombre"}</span>
                </div>
                <button
                  data-testid={`btn-delete-enti-${e.id}`}
                  className="btn-delete-inline"
                  onClick={(event) => {
                    event.stopPropagation();
                    setEntityToDelete(e.id);
                  }}
                  title="Eliminar Enti"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="entities-separator" />

      {/* Sección Grupos */}
      <div className="entity-section">
        <div
          data-testid="section-header-grupos"
          className="entity-section-header"
          onClick={() => setGruposOpen(!gruposOpen)}
        >
          <div className="entity-section-title">
            <span>GRUPOS</span>
            <button
              data-testid="btn-create-grupo"
              className="btn-create-inline"
              onClick={(e) => {
                e.stopPropagation(); // Evita plegar/desplegar
                if (onCreateGrupo) onCreateGrupo();
              }}
              title="Crear Grupo"
            >
              +
            </button>
          </div>
          <span
            data-testid="collapse-icon-grupos"
            className={`collapse-icon ${gruposOpen ? "open" : ""}`}
          >
            ›
          </span>
        </div>
        {gruposOpen && (
          <div
            data-testid="section-content-grupos"
            className="entity-section-content"
          >
            {grupos.length === 0
              ? null
              : grupos.map((g) => (
                  <div
                    key={g.id}
                    data-testid={`grupo-item-${g.id}`}
                    className="list-item"
                  >
                    <div className="item-info">
                      {/* Los grupos por ahora pueden no tener status complejo, le ponemos uno genérico o lo omitimos, pero para que se vea igual usamos uno neutro/incompleto */}
                      <span className="status-indicator incomplete" />
                      <span className="item-name">{g.name || "Nuevo Grupo"}</span>
                    </div>
                  </div>
                ))}
          </div>
        )}
      </div>

      {entityToDelete && (
        <div className="delete-dialog-overlay" data-testid="delete-dialog-overlay">
          <div className="delete-dialog" data-testid="delete-dialog">
            <p>¿Estás seguro de que deseas eliminar este Enti?</p>
            <div className="delete-dialog-buttons">
              <button 
                className="btn-confirm" 
                onClick={() => {
                  onDeleteEnti?.(entityToDelete);
                  setEntityToDelete(null);
                }} 
                data-testid="btn-confirm-delete"
              >
                Eliminar
              </button>
              <button 
                className="btn-cancel" 
                onClick={() => setEntityToDelete(null)} 
                data-testid="btn-cancel-delete"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
