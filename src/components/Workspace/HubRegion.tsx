import React from 'react';
import HubLateralView from './HubLateralView';
import { EntitiesColumnRegion } from './EntitiesColumnRegion';

export const HubRegion: React.FC = () => {
  return (
    <div data-testid="hub-region" className="hub-region entities-column">
      <HubLateralView>
        <EntitiesColumnRegion />
      </HubLateralView>
    </div>
  );
};
