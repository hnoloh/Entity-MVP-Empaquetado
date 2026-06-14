import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import WorkspaceShell from "../WorkspaceShell";
import { createEnti } from "../../../domain/enti/createEnti";
import { entiRepository } from "../../../domain/enti/entiRepository";

describe("Workspace Enti Status Integration (FIA-021)", () => {
  beforeEach(() => {
    entiRepository.list().forEach((e) => entiRepository.delete(e.id));
  });

  it("TEST-FIA021-05, 06, 09: Guardar recalcula estado, Descartar conserva estado, y se muestra en listado y editor", () => {
    const enti = createEnti("1", "Test", { function: "", rules: [], knowledge: "", workMaterial: "" }, { mode: "unconfigured" });
    entiRepository.save(enti);

    render(<WorkspaceShell />);

    // initially incomplete
    const item = screen.getByTestId("enti-item-1");
    fireEvent.click(item);

    const listIndicator = screen.getByTestId("status-indicator-1");
    expect(listIndicator).toHaveClass("incomplete");

    const editorIndicator = screen.getByTestId("editor-status-indicator-1");
    expect(editorIndicator).toHaveClass("incomplete");

    // Make changes to make it complete
    const nameInput = screen.getByTestId("input-name");
    fireEvent.change(nameInput, { target: { value: "A name" } });

    // Status in editor updates automatically since it's derived from draft
    expect(screen.getByTestId("editor-status-indicator-1")).toHaveClass("incomplete"); // wait, still incomplete because no brain config!

    const brainTrigger = screen.getByTestId("input-cognitive-mode");
    fireEvent.click(brainTrigger);
    fireEvent.click(screen.getByTestId("option-cloud"));

    const apiKeyInput = screen.getByTestId("input-openai-api-key");
    fireEvent.change(apiKeyInput, { target: { value: "sk-1234" } });
    fireEvent.click(screen.getByTestId("btn-accept-api-key"));

    expect(screen.getByTestId("editor-status-indicator-1")).toHaveClass("complete");

    // But the list still shows incomplete because we haven't saved
    expect(screen.getByTestId("status-indicator-1")).toHaveClass("incomplete");

    // Descartar changes
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId("btn-dialog-descartar"));

    // Should remain incomplete
    expect(screen.getByTestId("status-indicator-1")).toHaveClass("incomplete");

    // Open again, edit, and save
    fireEvent.click(screen.getByTestId("enti-item-1"));
    fireEvent.change(screen.getByTestId("input-name"), { target: { value: "A name" } });
    fireEvent.click(screen.getByTestId("input-cognitive-mode"));
    fireEvent.click(screen.getByTestId("option-cloud"));
    fireEvent.change(screen.getByTestId("input-openai-api-key"), { target: { value: "sk-1234" } });
    fireEvent.click(screen.getByTestId("btn-accept-api-key"));
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId("btn-dialog-guardar"));

    // Now list indicator should be complete
    expect(screen.getByTestId("status-indicator-1")).toHaveClass("complete");
  });

  it("TEST-FIA021-07: Multi-editor mantiene estados aislados entre instancias", () => {
    const enti1 = createEnti("1", "Enti 1", { function: "", rules: [], knowledge: "", workMaterial: "" });
    const enti2 = createEnti("2", "Enti 2", { function: "Func", rules: [], knowledge: "", workMaterial: "" }, { mode: "local", provider: "p", model: "m" });
    entiRepository.save(enti1);
    entiRepository.save(enti2);

    render(<WorkspaceShell />);

    // Open 1
    fireEvent.click(screen.getByTestId("enti-item-1"));
    expect(screen.getByTestId("editor-status-indicator-1")).toHaveClass("incomplete");


    // Open 2
    fireEvent.click(screen.getByTestId("enti-item-2"));
    expect(screen.getByTestId("editor-status-indicator-2")).toHaveClass("complete");

    // Check list indicators
    expect(screen.getByTestId("status-indicator-1")).toHaveClass("incomplete");
    expect(screen.getByTestId("status-indicator-2")).toHaveClass("complete");
  });

  it("TEST-FIA021-08: Eliminar Enti abierto limpia estado asociado", () => {
    const enti = createEnti("1", "Enti 1", { function: "", rules: [], knowledge: "", workMaterial: "" });
    entiRepository.save(enti);

    render(<WorkspaceShell />);
    
    // Check list
    expect(screen.getByTestId("status-indicator-1")).toBeInTheDocument();

    // Delete
    fireEvent.click(screen.getByTestId("btn-delete-enti-1"));
    fireEvent.click(screen.getByTestId("btn-confirm-delete"));

    expect(screen.queryByTestId("status-indicator-1")).not.toBeInTheDocument();
  });
});
