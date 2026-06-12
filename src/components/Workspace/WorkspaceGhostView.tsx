import ghostImg from '../../assets/ghost.jpeg';
import './WorkspaceGhostView.css';

export default function WorkspaceGhostView() {
  return (
    <div data-testid="workspace-ghost-view" className="workspace-ghost-view">
      <div className="ghost-animator">
        <img src={ghostImg} alt="Ghost" className="ghost-visual-element" />
      </div>
    </div>
  );
}
