import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import WorkspaceShell from "../WorkspaceShell";
import { createEnti } from "../../../domain/enti/createEnti";
import { entiRepository } from "../../../domain/enti/entiRepository";

describe("Workspace Enti Incomplete Status Integration (FIA-022)", () => {
  beforeEach(() => {
    entiRepository.list().forEach((e) => entiRepository.delete(e.id));
  });

  it("TEST-FIA022-05, TEST-FIA022-06, TEST-FIA022-09, TEST-FIA022-10: Transiciones bidireccionales y reflejo en listado vs editor", () => {
    // Enti inicial incompleto
    const enti = createEnti("1", "", { function: "", rules: [], knowledge: "", workMaterial: "" }, { mode: "unconfigured" });
    entiRepository.save(enti);

    render(<WorkspaceShell />);

    // Initially incomplete in list
    const listIndicator = screen.getByTestId("status-indicator-1");
    expect(listIndicator).toHaveClass("incomplete");

    // Open editor
    fireEvent.click(screen.getByTestId("enti-item-1"));
    const editorIndicator = screen.getByTestId("editor-status-indicator-1");
    expect(editorIndicator).toHaveClass("incomplete");

    // TEST-FIA022-05: Transition Incompleto -> Completo
    const nameInput = screen.getByTestId("input-name");
    fireEvent.change(nameInput, { target: { value: "Valid Name" } });

    // Set brain directly to cloud to avoid async detection logic
    fireEvent.click(screen.getByTestId("input-cognitive-mode"));
    fireEvent.click(screen.getByTestId("option-cloud"));
    fireEvent.change(screen.getByTestId("input-openai-api-key"), { target: { value: "sk-1234" } });
    fireEvent.click(screen.getByTestId("btn-accept-api-key"));

    expect(screen.getByTestId("editor-status-indicator-1")).toHaveClass("complete");
    // List should still be incomplete because we haven't saved
    expect(screen.getByTestId("status-indicator-1")).toHaveClass("incomplete");

    // TEST-FIA022-06: Transition Completo -> Incompleto in draft
    fireEvent.change(screen.getByTestId("input-name"), { target: { value: "" } });
    expect(screen.getByTestId("editor-status-indicator-1")).toHaveClass("incomplete");

    // Re-fill and save
    fireEvent.change(screen.getByTestId("input-name"), { target: { value: "Valid Name" } });
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId("btn-dialog-guardar"));

    // Now list indicator should be complete
    expect(screen.getByTestId("status-indicator-1")).toHaveClass("complete");
  });

  it("TEST-FIA022-07, TEST-FIA022-08: Descartar y Cancelar", () => {
    // Start complete
    const enti = createEnti("1", "Valid Name", { function: "", rules: [], knowledge: "", workMaterial: "" }, { mode: "cloud", apiKey: "sk-123" });
    entiRepository.save(enti);

    render(<WorkspaceShell />);

    fireEvent.click(screen.getByTestId("enti-item-1"));
    expect(screen.getByTestId("status-indicator-1")).toHaveClass("complete");
    expect(screen.getByTestId("editor-status-indicator-1")).toHaveClass("complete");

    // Make it incomplete in draft
    fireEvent.change(screen.getByTestId("input-name"), { target: { value: "" } });
    expect(screen.getByTestId("editor-status-indicator-1")).toHaveClass("incomplete");

    // Cancelar cierre (TEST-FIA022-08)
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId("btn-dialog-cancelar"));
    // Still in editor, draft still incomplete
    expect(screen.getByTestId("editor-status-indicator-1")).toHaveClass("incomplete");

    // Descartar cambios (TEST-FIA022-07)
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId("btn-dialog-descartar"));
    
    // Editor closed. Reopen to check draft is restored to original
    fireEvent.click(screen.getByTestId("enti-item-1"));
    expect(screen.getByTestId("editor-status-indicator-1")).toHaveClass("complete");
  });

  it("TEST-FIA022-11: Multi-editor mantiene estados aislados", () => {
    const enti1 = createEnti("1", "", { function: "", rules: [], knowledge: "", workMaterial: "" }); // incomplete
    const enti2 = createEnti("2", "Enti 2", { function: "", rules: [], knowledge: "", workMaterial: "" }, { mode: "cloud", apiKey: "sk" }); // complete
    entiRepository.save(enti1);
    entiRepository.save(enti2);

    render(<WorkspaceShell />);

    // Open 1
    fireEvent.click(screen.getByTestId("enti-item-1"));
    expect(screen.getByTestId("editor-status-indicator-1")).toHaveClass("incomplete");


    // Open 2
    fireEvent.click(screen.getByTestId("enti-item-2"));
    expect(screen.getByTestId("editor-status-indicator-2")).toHaveClass("complete");

    // List indicators correct
    expect(screen.getByTestId("status-indicator-1")).toHaveClass("incomplete");
    expect(screen.getByTestId("status-indicator-2")).toHaveClass("complete");
  });

  it("TEST-FIA022-12: Eliminar Enti incompleto limpia estado asociado", () => {
    const enti = createEnti("1", "", { function: "", rules: [], knowledge: "", workMaterial: "" }); // incomplete
    entiRepository.save(enti);

    render(<WorkspaceShell />);
    expect(screen.getByTestId("status-indicator-1")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("btn-delete-enti-1"));
    fireEvent.click(screen.getByTestId("btn-confirm-delete"));

    expect(screen.queryByTestId("status-indicator-1")).not.toBeInTheDocument();
  });

  it("TEST-FIA022-13: Negativos: Función no obligatoria, no persistence visual, no autosave", () => {
    // Función no obligatoria
    const enti = createEnti("1", "Name", { function: "", rules: [], knowledge: "", workMaterial: "" }, { mode: "cloud", apiKey: "sk" });
    entiRepository.save(enti);

    render(<WorkspaceShell />);
    fireEvent.click(screen.getByTestId("enti-item-1"));
    expect(screen.getByTestId("editor-status-indicator-1")).toHaveClass("complete"); // Function is empty, still complete.

    // No autosave checks: when name changed, list indicator shouldn't change until save
    fireEvent.change(screen.getByTestId("input-name"), { target: { value: "" } });
    expect(screen.getByTestId("status-indicator-1")).toHaveClass("complete"); // still complete in list (saved data)
    expect(screen.getByTestId("editor-status-indicator-1")).toHaveClass("incomplete"); // incomplete in draft
  });
});
