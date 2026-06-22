import React from "react";
import HubLateralView from "./HubLateralView";
import { EntitiesColumnRegion } from "./EntitiesColumnRegion";
import type { Enti } from "../../domain/enti/Enti";
import type { Group } from "../../domain/group/Group";

interface HubRegionProps {
  entis?: Enti[];
  openEntiIds?: string[];
  onCreateEnti?: () => void;
  onSelectEnti?: (id: string) => void;
  onDeleteEnti?: (id: string) => void;
  grupos?: Group[];
  onCreateGrupo?: () => void;
  onSelectGrupo?: (id: string) => void;
  onDeleteGrupo?: (id: string) => void;
  autoChatEnabled?: boolean;
  onToggleAutoChat?: () => void;
}

export const HubRegion: React.FC<HubRegionProps> = ({ entis, openEntiIds, onCreateEnti, onSelectEnti, onDeleteEnti, grupos, onCreateGrupo, onSelectGrupo, onDeleteGrupo, autoChatEnabled, onToggleAutoChat }) => {
  return (
    <div data-testid="hub-region" className="hub-region entities-column">
      <HubLateralView entis={entis} openEntiIds={openEntiIds} onCreateEnti={onCreateEnti} onSelectEnti={onSelectEnti} onDeleteEnti={onDeleteEnti}>
        <EntitiesColumnRegion entis={entis} openEntiIds={openEntiIds} onCreateEnti={onCreateEnti} onSelectEnti={onSelectEnti} onDeleteEnti={onDeleteEnti} grupos={grupos} onCreateGrupo={onCreateGrupo} onSelectGrupo={onSelectGrupo} onDeleteGrupo={onDeleteGrupo} autoChatEnabled={autoChatEnabled} onToggleAutoChat={onToggleAutoChat} />
      </HubLateralView>
    </div>
  );
};
