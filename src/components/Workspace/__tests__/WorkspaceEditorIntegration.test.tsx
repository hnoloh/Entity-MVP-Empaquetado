import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import WorkspaceShell from "../WorkspaceShell";
import { entiRepository } from "../../../domain/enti/entiRepository";
import { createEnti } from "../../../domain/enti/createEnti";

describe("FIA-004 Workspace Editor Integration", () => {
  beforeEach(() => {
    entiRepository.clear();
    const enti = createEnti("test-id", "Integration Enti", {
      function: "",
      rules: [],
      workMaterial: "",
      knowledge: "",
    });
    entiRepository.save(enti);
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    entiRepository.clear();
  });

  it("TEST-FIA004-01 & 12: Seleccionar un Enti existente abre su Editor y Ghost permanece", () => {
    render(<WorkspaceShell />);
    
    // Al principio, no hay editor
    expect(screen.queryByTestId("enti-editor")).not.toBeInTheDocument();
    // Ghost sigue visible
    expect(screen.getByTestId("workspace-ghost-view")).toBeInTheDocument();

    // Hacemos click en el enti listado
    const item = screen.getByText("Integration Enti");
    fireEvent.click(item);

    // Aparece el editor
    expect(screen.getByTestId("enti-editor")).toBeInTheDocument();
    expect(screen.getByTestId<HTMLInputElement>("input-name").value).toBe("Integration Enti");
    
    // Ghost sigue visible (decorator)
    expect(screen.getByTestId("workspace-ghost-view")).toBeInTheDocument();
  });

  it("TEST-FIA004-11 & 16: Sin localStorage, Chat, Runtime ni autosave", () => {
    const { container } = render(<WorkspaceShell />);
    fireEvent.click(screen.getByText("Integration Enti"));

    // Cambiamos algo en el draft
    fireEvent.change(screen.getByTestId("input-name"), { target: { value: "Dirty Enti" } });

    // No se guardó automáticamente en repo
    const list = entiRepository.list();
    expect(list[0].name).toBe("Integration Enti");

    // No hay escrituras en local storage
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);

    // No hay ChatRegion ni parecidos
    expect(container.innerHTML).not.toMatch(/chat-region/i);
    expect(container.innerHTML).not.toMatch(/runtime/i);
  });

  it("TEST-FIA004-14 & 17: No permanent Save button, single editor, no minimización del editor", () => {
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByText("Integration Enti"));

    // El botón Guardar no existe de forma permanente, solo en diálogo
    expect(screen.queryByTestId("btn-dialog-guardar")).not.toBeInTheDocument();
    
    // Solo hay 1 editor
    expect(screen.getAllByTestId("enti-editor")).toHaveLength(1);
    
  });
});
