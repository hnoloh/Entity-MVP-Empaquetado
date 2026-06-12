import WorkspaceGhostView from "./WorkspaceGhostView";

interface GhostRegionProps {
  entisCount?: number;
  gruposCount?: number;
}

export default function GhostRegion({
  entisCount = 0,
  gruposCount = 0,
}: GhostRegionProps) {
  const isWorkspaceEmpty = entisCount === 0 && gruposCount === 0;

  return (
    <div data-testid="ghost-region" className="ghost-region">
      {isWorkspaceEmpty && <WorkspaceGhostView />}
    </div>
  );
}
