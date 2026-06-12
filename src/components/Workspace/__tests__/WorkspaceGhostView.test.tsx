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
    render(<GhostRegion entisCount={0} gruposCount={0} />);
    expect(screen.getByTestId("workspace-ghost-view")).toBeInTheDocument();
  });

  it("GhostRegion does not show Ghost when there is at least one Enti", () => {
    render(<GhostRegion entisCount={1} gruposCount={0} />);
    expect(
      screen.queryByTestId("workspace-ghost-view"),
    ).not.toBeInTheDocument();
  });

  it("GhostRegion does not show Ghost when there is at least one Grupo", () => {
    render(<GhostRegion entisCount={0} gruposCount={1} />);
    expect(
      screen.queryByTestId("workspace-ghost-view"),
    ).not.toBeInTheDocument();
  });

  it("GhostRegion does not show Ghost when there are Entis and Grupos", () => {
    render(<GhostRegion entisCount={1} gruposCount={1} />);
    expect(
      screen.queryByTestId("workspace-ghost-view"),
    ).not.toBeInTheDocument();
  });
});
