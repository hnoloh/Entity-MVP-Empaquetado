import { render, screen, fireEvent } from "@testing-library/react";
import WorkspaceShell from "../WorkspaceShell";
import { entiRepository } from "../../../domain/enti/entiRepository";
import { createEnti } from "../../../domain/enti/createEnti";
import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach } from "vitest";

describe("FIA-006 Workspace Entis List Integration", () => {
  beforeEach(() => {
    entiRepository.clear();
  });

  it("TEST-FIA006-01: Listado vacío válido", () => {
    render(<WorkspaceShell />);
    expect(screen.getByText("ENTIS")).toBeInTheDocument(); // Header section
    // No items should be rendered
    const listItems = screen.queryAllByTestId(/enti-item-/);
    expect(listItems.length).toBe(0);
  });

  it("TEST-FIA006-02: Listado con un Enti", () => {
    const enti = createEnti("enti-single", "Single Enti", { function: "", rules: [], knowledge: "", workMaterial: "" });
    entiRepository.save(enti);
    render(<WorkspaceShell />);
    
    expect(screen.getByTestId("enti-item-enti-single")).toBeInTheDocument();
    expect(screen.getByText("Single Enti")).toBeInTheDocument();
  });

  it("TEST-FIA006-03: Listado múltiple sin duplicados", () => {
    const enti1 = createEnti("enti-1", "Enti One", { function: "", rules: [], knowledge: "", workMaterial: "" });
    const enti2 = createEnti("enti-2", "Enti Two", { function: "", rules: [], knowledge: "", workMaterial: "" });
    entiRepository.save(enti1);
    entiRepository.save(enti2);
    // Intentar forzar guardado duplicado
    entiRepository.save(enti1);
    
    render(<WorkspaceShell />);
    
    const items = screen.getAllByTestId(/enti-item-/);
    expect(items.length).toBe(2);
    expect(screen.getByText("Enti One")).toBeInTheDocument();
    expect(screen.getByText("Enti Two")).toBeInTheDocument();
  });

  it("TEST-FIA003-02: 'crear Enti' abre el editor y al guardar añade un ítem a la lista", () => {
    render(<WorkspaceShell />);
    const createBtn = screen.getByTestId("btn-create-enti");
    
    // Al hacer click, NO se añade directamente
    fireEvent.click(createBtn);
    expect(screen.queryByTestId(/enti-item-/)).not.toBeInTheDocument();
    
    // Pero se abre el editor
    expect(screen.getByTestId("enti-editor")).toBeInTheDocument();
    
    // Cambiamos el nombre para ensuciarlo
    const inputName = screen.getByTestId("input-name");
    fireEvent.change(inputName, { target: { value: "Mi Nuevo Enti" } });
    
    // Intentamos cerrar y guardamos
    fireEvent.click(screen.getByTestId("btn-close-editor"));
    fireEvent.click(screen.getByTestId("btn-dialog-guardar"));
    
    // AHORA sí debe aparecer en la lista
    const items = screen.getAllByTestId(/enti-item-/);
    expect(items.length).toBe(1);
    expect(items[0]).toHaveTextContent("Mi Nuevo Enti");
  });

  it("TEST-FIA006-05: Editar nombre visible y guardar actualiza el item", () => {
    const enti = createEnti("enti-edit", "Original Name", { function: "", rules: [], knowledge: "", workMaterial: "" });
    entiRepository.save(enti);
    
    render(<WorkspaceShell />);
    expect(screen.getByText("Original Name")).toBeInTheDocument();
    
    // Seleccionar y abrir editor
    fireEvent.click(screen.getByTestId("enti-item-enti-edit"));
    
    // Cambiar nombre
    const nameInput = screen.getByTestId("input-name");
    fireEvent.change(nameInput, { target: { value: "Updated Name" } });
    
    // Guardar cerrando el editor
    fireEvent.click(screen.getByTestId("btn-close-editor"));
    fireEvent.click(screen.getByTestId("btn-dialog-guardar"));
    
    // El listado debe reflejar el nuevo nombre
    expect(screen.getByText("Updated Name")).toBeInTheDocument();
    expect(screen.queryByText("Original Name")).not.toBeInTheDocument();
  });

  it("TEST-FIA006-06: Eliminar Enti lo retira del listado", () => {
    const enti = createEnti("enti-del", "To Delete", { function: "", rules: [], knowledge: "", workMaterial: "" });
    entiRepository.save(enti);
    
    render(<WorkspaceShell />);
    expect(screen.getByText("To Delete")).toBeInTheDocument();
    
    const deleteBtn = screen.getByTestId("btn-delete-enti-enti-del");
    fireEvent.click(deleteBtn);
    fireEvent.click(screen.getByTestId("btn-confirm-delete"));
    
    expect(screen.queryByText("To Delete")).not.toBeInTheDocument();
    expect(screen.queryAllByTestId(/enti-item-/).length).toBe(0);
  });

  it("TEST-FIA006-07: Enti sin Brain permanece listable", () => {
    const enti = createEnti("enti-nobrain", "No Brain", { function: "", rules: [], knowledge: "", workMaterial: "" });
    // Simulamos un enti que no tiene configuración de brain. Actualmente no hay un provider de Brain real,
    // pero el Enti es listable y visible simplemente con existir en el repo.
    entiRepository.save(enti);
    
    render(<WorkspaceShell />);
    expect(screen.getByTestId("enti-item-enti-nobrain")).toBeInTheDocument();
  });

  it("TEST-FIA006-08: No side effects en otras áreas (chat, runtime, persistencia)", () => {
    render(<WorkspaceShell />);
    
    expect(screen.queryByTestId("chat-region")).not.toBeInTheDocument();
    expect(screen.queryByTestId("runtime-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("brain-provider")).not.toBeInTheDocument();
    expect(screen.getByTestId("workspace-ghost-view")).toBeInTheDocument();
  });
});
