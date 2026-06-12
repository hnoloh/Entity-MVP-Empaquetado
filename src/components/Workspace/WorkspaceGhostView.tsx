import heroImg from '../../assets/hero.png';
import './WorkspaceGhostView.css';

export default function WorkspaceGhostView() {
  return (
    <div data-testid="workspace-ghost-view" className="workspace-ghost-view">
      <img src={heroImg} alt="Ghost" className="ghost-visual-element" />
    </div>
  );
}
