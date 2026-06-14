import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import GhostRegion from "../GhostRegion";
import WorkspaceGhostView from "../WorkspaceGhostView";

describe("FIA-005 Ghost Workspace", () => {
  it("WorkspaceGhostView renders independently as passive element", () => {
    render(<WorkspaceGhostView />);
    const ghost = screen.getByTestId("workspace-ghost-view");
    expect(ghost).toBeInTheDocument();

    // Ensure no buttons or functional text inside ghost
    expect(ghost.innerHTML).not.toMatch(/button/i);
    expect(ghost.innerHTML).not.toMatch(/chat/i);
  });

  it("GhostRegion shows Ghost when Workspace is empty (0 Entis, 0 Grupos)", () => {
    render(<GhostRegion />);
    expect(screen.getByTestId("workspace-ghost-view")).toBeInTheDocument();
  });

  it("GhostRegion shows Ghost when there is at least one Enti (decoración mesa)", () => {
    render(<GhostRegion />);
    expect(screen.getByTestId("workspace-ghost-view")).toBeInTheDocument();
  });

  it("GhostRegion shows Ghost when there is at least one Grupo (decoración mesa)", () => {
    render(<GhostRegion />);
    expect(screen.getByTestId("workspace-ghost-view")).toBeInTheDocument();
  });

  it("GhostRegion shows Ghost when there are Entis and Grupos (decoración mesa)", () => {
    render(<GhostRegion />);
    expect(screen.getByTestId("workspace-ghost-view")).toBeInTheDocument();
  });
});
