import React, { useState } from "react";
import "./EntitiesColumnRegion.css";

export interface EntityFixture {
  id: string;
  name: string;
}

export interface EntitiesColumnRegionProps {
  entis?: EntityFixture[];
  grupos?: EntityFixture[];
}

export const EntitiesColumnRegion: React.FC<EntitiesColumnRegionProps> = ({
  entis = [],
  grupos = [],
}) => {
  const [entisOpen, setEntisOpen] = useState(true);
  const [gruposOpen, setGruposOpen] = useState(true);

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
            {entis.length === 0
              ? null
              : entis.map((e) => (
                  <div
                    key={e.id}
                    data-testid={`enti-item-${e.id}`}
                    className="fixture-item"
                  >
                    {e.name}
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
                    className="fixture-item"
                  >
                    {g.name}
                  </div>
                ))}
          </div>
        )}
      </div>
    </div>
  );
};
