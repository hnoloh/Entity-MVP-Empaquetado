import React from "react";
import "./HubLateralView.css";
import type { Enti } from "../../domain/enti/Enti";

interface HubLateralViewProps {
  children?: React.ReactNode;
  entis?: Enti[];
  openEntiIds?: string[];
  onCreateEnti?: () => void;
  onSelectEnti?: (id: string) => void;
  onDeleteEnti?: (id: string) => void;
}

const HubLateralView: React.FC<HubLateralViewProps> = ({ children }) => {
  return (
    <div data-testid="hub-lateral-view" className="hub-lateral-view">
      <div className="hub-lateral-content">{children}</div>
    </div>
  );
};

export default HubLateralView;
