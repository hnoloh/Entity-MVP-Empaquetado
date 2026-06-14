import { render, screen, fireEvent } from "@testing-library/react";
import WorkspaceShell from "../WorkspaceShell";
import { entiRepository } from "../../../domain/enti/entiRepository";
import { createEnti } from "../../../domain/enti/createEnti";
import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach } from "vitest";

describe("FIA-005 Workspace Delete Enti Integration", () => {
  beforeEach(() => {
    entiRepository.clear();
    const enti1 = createEnti("enti-1", "Primer Enti", { function: "", rules: [], knowledge: "", workMaterial: "" });
    const enti2 = createEnti("enti-2", "Segundo Enti", { function: "", rules: [], knowledge: "", workMaterial: "" });
    entiRepository.save(enti1);
    entiRepository.save(enti2);
  });

  it("TEST-FIA005-01: Eliminar Enti lo quita de la lista y del repositorio", () => {
    render(<WorkspaceShell />);
    
    // Verificar que existen ambos
    expect(screen.getByText("Primer Enti")).toBeInTheDocument();
    expect(screen.getByText("Segundo Enti")).toBeInTheDocument();
    
    // Eliminar el primer Enti
    const deleteBtn = screen.getByTestId("btn-delete-enti-enti-1");
    fireEvent.click(deleteBtn);
    fireEvent.click(screen.getByTestId("btn-confirm-delete"));
    
    // Verificar que desapareció
    expect(screen.queryByText("Primer Enti")).not.toBeInTheDocument();
    expect(entiRepository.getById("enti-1")).toBeNull();
    
    // El segundo Enti sigue ahí
    expect(screen.getByText("Segundo Enti")).toBeInTheDocument();
    expect(entiRepository.getById("enti-2")).not.toBeNull();
  });

  it("TEST-FIA005-02: Eliminar el Enti abierto limpia la selección y cierra el editor", () => {
    render(<WorkspaceShell />);
    
    // Abrir el editor seleccionando enti-1
    fireEvent.click(screen.getByTestId("enti-item-enti-1"));
    expect(screen.getByTestId("enti-editor")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Primer Enti")).toBeInTheDocument();
    
    // Eliminar enti-1 desde la lista
    const deleteBtn = screen.getByTestId("btn-delete-enti-enti-1");
    fireEvent.click(deleteBtn);
    fireEvent.click(screen.getByTestId("btn-confirm-delete"));
    
    // Verificar que el editor se cerró
    expect(screen.queryByTestId("enti-editor")).not.toBeInTheDocument();
  });

  it("TEST-FIA005-03: Eliminar un Enti no seleccionado no cierra el editor actual", () => {
    render(<WorkspaceShell />);
    
    // Abrir el editor seleccionando enti-2
    fireEvent.click(screen.getByTestId("enti-item-enti-2"));
    expect(screen.getByTestId("enti-editor")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Segundo Enti")).toBeInTheDocument();
    
    // Eliminar enti-1 desde la lista
    const deleteBtn = screen.getByTestId("btn-delete-enti-enti-1");
    fireEvent.click(deleteBtn);
    fireEvent.click(screen.getByTestId("btn-confirm-delete"));
    
    // Verificar que el editor de enti-2 sigue abierto
    expect(screen.getByTestId("enti-editor")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Segundo Enti")).toBeInTheDocument();
  });
  
  it("TEST-FIA005-04: No hay unidades prohibidas (Chat, Storage, Papelera)", () => {
    render(<WorkspaceShell />);
    
    expect(screen.queryByTestId("chat-region")).not.toBeInTheDocument();
    expect(screen.queryByTestId("chat-window")).not.toBeInTheDocument();
    expect(screen.queryByTestId("trash-can")).not.toBeInTheDocument();
    expect(screen.queryByTestId("undo-button")).not.toBeInTheDocument();
    
    // El ghost sigue presente
    expect(screen.getByTestId("workspace-ghost-view")).toBeInTheDocument();
  });
});
