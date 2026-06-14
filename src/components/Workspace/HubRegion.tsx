import React from "react";
import HubLateralView from "./HubLateralView";
import { EntitiesColumnRegion } from "./EntitiesColumnRegion";
import type { Enti } from "../../domain/enti/Enti";

interface HubRegionProps {
  entis?: Enti[];
  openEntiIds?: string[];
  onCreateEnti?: () => void;
  onSelectEnti?: (id: string) => void;
  onDeleteEnti?: (id: string) => void;
  grupos?: { id: string; name: string }[];
  onCreateGrupo?: () => void;
}

export const HubRegion: React.FC<HubRegionProps> = ({ entis, openEntiIds, onCreateEnti, onSelectEnti, onDeleteEnti, grupos, onCreateGrupo }) => {
  return (
    <div data-testid="hub-region" className="hub-region entities-column">
      <HubLateralView entis={entis} openEntiIds={openEntiIds} onCreateEnti={onCreateEnti} onSelectEnti={onSelectEnti} onDeleteEnti={onDeleteEnti}>
        <EntitiesColumnRegion entis={entis} openEntiIds={openEntiIds} onCreateEnti={onCreateEnti} onSelectEnti={onSelectEnti} onDeleteEnti={onDeleteEnti} grupos={grupos} onCreateGrupo={onCreateGrupo} />
      </HubLateralView>
    </div>
  );
};
