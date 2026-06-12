import React from "react";
import "./HubLateralView.css";

interface HubLateralViewProps {
  children?: React.ReactNode;
}

const HubLateralView: React.FC<HubLateralViewProps> = ({ children }) => {
  return (
    <div data-testid="hub-lateral-view" className="hub-lateral-view">
      <div className="hub-lateral-content">{children}</div>
    </div>
  );
};

export default HubLateralView;
