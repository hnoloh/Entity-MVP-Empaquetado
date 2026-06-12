import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import WorkbenchRegion from "../WorkbenchRegion";

describe("WorkbenchRegion - FIA-004", () => {
  it("renders correctly and is visible", () => {
    render(<WorkbenchRegion />);
    const region = screen.getByTestId("workbench-region");
    expect(region).toBeInTheDocument();
  });

  it("displays a stable empty state when no editor active", () => {
    render(<WorkbenchRegion />);
    const emptyState = screen.getByTestId("workbench-empty-state");
    expect(emptyState).toBeInTheDocument();

    // Ensure no functional elements like buttons
    expect(emptyState.innerHTML).not.toMatch(/button/i);
    expect(emptyState.innerHTML).not.toMatch(/chat/i);
  });

  it("renders a passive host correctly when an editor stub is provided", () => {
    const stub = <div data-testid="test-editor-stub">Stub</div>;
    render(<WorkbenchRegion editorStub={stub} />);

    expect(screen.getByTestId("editor-host-region")).toBeInTheDocument();
    expect(screen.getByTestId("test-editor-stub")).toBeInTheDocument();
    expect(
      screen.queryByTestId("workbench-empty-state"),
    ).not.toBeInTheDocument();
  });

  it("ensures no Chats are embedded within Workbench", () => {
    render(<WorkbenchRegion />);
    const region = screen.getByTestId("workbench-region");
    expect(region.innerHTML).not.toMatch(/chat/i);
  });
});
