import { render, screen, fireEvent } from "@testing-library/react";
import WorkspaceShell from "../WorkspaceShell";
import { entiRepository } from "../../../domain/enti/entiRepository";
import { createEnti } from "../../../domain/enti/createEnti";
import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach } from "vitest";

describe("FIA-008 Workspace Harness Base Integration", () => {
  beforeEach(() => {
    entiRepository.clear();
  });

  it("TEST-FIA008-01: Editor de Enti seleccionado muestra Harness Base", () => {
    const enti = createEnti("enti-1", "Enti 1", { function: "", rules: [], knowledge: "", workMaterial: "" });
    entiRepository.save(enti);
    
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByTestId("enti-item-enti-1"));
    
    expect(screen.getByTestId("harness-base-section")).toBeInTheDocument();
  });

  it("TEST-FIA008-02: Harness Base contiene Función, Normas, Material de Trabajo y Conocimientos", () => {
    const enti = createEnti("enti-1", "Enti 1", { function: "F1", rules: ["R1"], knowledge: "K1", workMaterial: "M1" });
    entiRepository.save(enti);
    
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByTestId("enti-item-enti-1"));
    
    expect(screen.getByTestId("input-function")).toHaveValue("F1");
    expect(screen.getByTestId("input-rules")).toHaveValue("R1");
    expect(screen.getByTestId("input-knowledge")).toHaveValue("K1");
    expect(screen.getByTestId("input-workMaterial")).toHaveValue("M1");
  });

  it("TEST-FIA008-03: Seleccionar otro Enti no mezcla Harness ni draft del Enti anterior", () => {
    const enti1 = createEnti("enti-1", "Enti 1", { function: "F1", rules: [], knowledge: "", workMaterial: "" });
    const enti2 = createEnti("enti-2", "Enti 2", { function: "F2", rules: [], knowledge: "", workMaterial: "" });
    entiRepository.save(enti1);
    entiRepository.save(enti2);
    
    render(<WorkspaceShell />);
    
    // Seleccionamos enti 1 y modificamos draft
    fireEvent.click(screen.getByTestId("enti-item-enti-1"));
    const inputFunc1 = screen.getAllByTestId("input-function")[0];
    fireEvent.change(inputFunc1, { target: { value: "F1 MODIFIED" } });
    
    // Seleccionamos enti 2 (sin guardar el 1), abre un segundo editor y no los datos del 1
    fireEvent.click(screen.getByTestId("enti-item-enti-2"));
    const inputFunc2 = screen.getAllByTestId("input-function")[0];
    expect(inputFunc2).toHaveValue("F2");
  });

  it("TEST-FIA008-04: Enti sin Brain permite abrir Harness Base", () => {
    const enti = createEnti("enti-1", "Enti No Brain", { function: "", rules: [], knowledge: "", workMaterial: "" });
    entiRepository.save(enti);
    
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByTestId("enti-item-enti-1"));
    
    // Simplemente no falla y se muestra la sección
    expect(screen.getByTestId("harness-base-section")).toBeInTheDocument();
  });

  it("TEST-FIA008-05: Cambios de Harness Base no ejecutan autosave ni escriben repo antes de Guardar", () => {
    const enti = createEnti("enti-1", "Enti 1", { function: "Original", rules: [], knowledge: "", workMaterial: "" });
    entiRepository.save(enti);
    
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByTestId("enti-item-enti-1"));
    
    // Modificamos draft
    fireEvent.change(screen.getByTestId("input-function"), { target: { value: "Draft change" } });
    
    // El repo sigue teniendo Original
    const repoEnti = entiRepository.getById("enti-1");
    expect(repoEnti?.harness.function).toBe("Original");
  });

  it("TEST-FIA008-06: Guardar persiste según EntiRepository y flujo heredado", () => {
    const enti = createEnti("enti-1", "Enti 1", { function: "Original", rules: [], knowledge: "", workMaterial: "" });
    entiRepository.save(enti);
    
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByTestId("enti-item-enti-1"));
    
    fireEvent.change(screen.getByTestId("input-function"), { target: { value: "Saved change" } });
    
    fireEvent.click(screen.getByTestId("btn-close-editor"));
    fireEvent.click(screen.getByTestId("btn-dialog-guardar"));
    
    // Verificar en repo
    const repoEnti = entiRepository.getById("enti-1");
    expect(repoEnti?.harness.function).toBe("Saved change");
  });

  it("TEST-FIA008-07: Descartar conserva estado guardado previo", () => {
    const enti = createEnti("enti-1", "Enti 1", { function: "Original", rules: [], knowledge: "", workMaterial: "" });
    entiRepository.save(enti);
    
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByTestId("enti-item-enti-1"));
    
    fireEvent.change(screen.getByTestId("input-function"), { target: { value: "Draft discard" } });
    
    fireEvent.click(screen.getByTestId("btn-close-editor"));
    fireEvent.click(screen.getByTestId("btn-dialog-descartar"));
    
    // Verificar en repo
    const repoEnti = entiRepository.getById("enti-1");
    expect(repoEnti?.harness.function).toBe("Original");
  });

  it("TEST-FIA008-08: Cancelar conserva Editor abierto y draft pendiente", () => {
    const enti = createEnti("enti-1", "Enti 1", { function: "Original", rules: [], knowledge: "", workMaterial: "" });
    entiRepository.save(enti);
    
    render(<WorkspaceShell />);
    fireEvent.click(screen.getByTestId("enti-item-enti-1"));
    
    fireEvent.change(screen.getByTestId("input-function"), { target: { value: "Draft pending" } });
    
    fireEvent.click(screen.getByTestId("btn-close-editor"));
    fireEvent.click(screen.getByTestId("btn-dialog-cancelar"));
    
    // Editor sigue abierto con draft
    expect(screen.getByTestId("enti-editor")).toBeInTheDocument();
    expect(screen.getByTestId("input-function")).toHaveValue("Draft pending");
    
    // Repo intacto
    const repoEnti = entiRepository.getById("enti-1");
    expect(repoEnti?.harness.function).toBe("Original");
  });

  it("TEST-FIA008-09: Ghost permanece en DOM como decoración permanente", () => {
    const enti = createEnti("enti-1", "Enti 1", { function: "", rules: [], knowledge: "", workMaterial: "" });
    entiRepository.save(enti);
    
    render(<WorkspaceShell />);
    expect(screen.getByTestId("workspace-ghost-view")).toBeInTheDocument();
    
    fireEvent.click(screen.getByTestId("enti-item-enti-1"));
    
    // Editor se abre y muestra Harness Base
    expect(screen.getByTestId("harness-base-section")).toBeInTheDocument();
    
    // Ghost sigue ahí
    expect(screen.getByTestId("workspace-ghost-view")).toBeInTheDocument();
  });

  it("TEST-FIA008-10: Forbidden-units scan", () => {
    render(<WorkspaceShell />);
    
    expect(screen.queryByTestId("chat-region")).not.toBeInTheDocument();
    expect(screen.queryByTestId("runtime-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("brain-provider")).not.toBeInTheDocument();
    // No checkboxes (multi-select) o search inputs
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });
});
