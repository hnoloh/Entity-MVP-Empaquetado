import WorkspaceGhostView from "./WorkspaceGhostView";

export default function GhostRegion() {
  // El fantasma es decoración de la mesa, siempre visible hasta que un Editor lo tape.
  return (
    <div data-testid="ghost-region" className="ghost-region">
      <WorkspaceGhostView />
    </div>
  );
}
