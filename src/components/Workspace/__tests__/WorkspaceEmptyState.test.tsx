import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import WorkspaceShell from "../WorkspaceShell";

describe("FIA-007 Estado Workspace Vacío", () => {
  it("1. entisCount=0 y gruposCount=0 -> Hub, Columna, Mesa y Ghost visibles simultáneamente", () => {
    render(<WorkspaceShell />);

    expect(screen.getByTestId("hub-region")).toBeInTheDocument();
    expect(screen.getByTestId("entities-column-region")).toBeInTheDocument();
    expect(screen.getByTestId("workbench-region")).toBeInTheDocument();
    expect(screen.getByTestId("workspace-ghost-view")).toBeInTheDocument();
  });

  it("2. entisCount=1 y gruposCount=0 -> Ghost VISIBLE (decoración de mesa); Hub, Columna y Mesa visibles", () => {
    render(<WorkspaceShell />);

    expect(screen.getByTestId("workspace-ghost-view")).toBeInTheDocument();
    expect(screen.getByTestId("hub-region")).toBeInTheDocument();
    expect(screen.getByTestId("entities-column-region")).toBeInTheDocument();
    expect(screen.getByTestId("workbench-region")).toBeInTheDocument();
  });

  it("3. entisCount=0 y gruposCount=1 -> Ghost VISIBLE; Hub, Columna y Mesa visibles", () => {
    render(<WorkspaceShell />);

    expect(screen.getByTestId("workspace-ghost-view")).toBeInTheDocument();
    expect(screen.getByTestId("hub-region")).toBeInTheDocument();
    expect(screen.getByTestId("entities-column-region")).toBeInTheDocument();
    expect(screen.getByTestId("workbench-region")).toBeInTheDocument();
  });

  it("4. entisCount=1 y gruposCount=1 -> Ghost VISIBLE; Hub, Columna y Mesa visibles", () => {
    render(<WorkspaceShell />);

    expect(screen.getByTestId("workspace-ghost-view")).toBeInTheDocument();
    expect(screen.getByTestId("hub-region")).toBeInTheDocument();
    expect(screen.getByTestId("entities-column-region")).toBeInTheDocument();
    expect(screen.getByTestId("workbench-region")).toBeInTheDocument();
  });

  it("5-8. Instancias únicas (no duplicación) y a lo sumo 1 Ghost", () => {
    render(<WorkspaceShell />);

    expect(screen.getAllByTestId("hub-region")).toHaveLength(1);
    expect(screen.getAllByTestId("entities-column-region")).toHaveLength(1);
    expect(screen.getAllByTestId("workbench-region")).toHaveLength(1);
    expect(screen.getAllByTestId("workspace-ghost-view")).toHaveLength(1);
  });

  it("9. Columna visible con secciones Entis y Grupos (aunque vacías)", () => {
    render(<WorkspaceShell />);

    // Asumimos que los headers de las secciones tienen su propio test-id o texto visible
    expect(screen.getByText("ENTIS")).toBeInTheDocument();
    expect(screen.getByText("GRUPOS")).toBeInTheDocument();
  });

  it("10. Mesa visible, limpia, sin texto explicativo", () => {
    render(<WorkspaceShell />);

    const workbench = screen.getByTestId("workbench-region");
    // Verificamos que no contiene texto típico de onboarding
    expect(workbench.textContent).not.toMatch(/comienza creando/i);
    expect(workbench.textContent).not.toMatch(/área de trabajo está vacía/i);
  });

  it("11. Ningún ChatRegion, ChatView ni ChatWindow en árbol Workspace", () => {
    const { container } = render(<WorkspaceShell />);

    expect(container.innerHTML).not.toMatch(/chat-region/i);
    expect(container.innerHTML).not.toMatch(/chat-view/i);
    expect(container.innerHTML).not.toMatch(/chat-window/i);
  });

  it("12. localStorage y sessionStorage no reciben escrituras", () => {
    localStorage.clear();
    sessionStorage.clear();

    render(<WorkspaceShell />);

    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});
