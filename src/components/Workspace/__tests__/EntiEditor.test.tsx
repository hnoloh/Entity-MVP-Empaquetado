import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EntiEditor } from "../EntiEditor";
import type { Enti } from "../../../domain/enti/Enti";

const getMockEnti = (): Enti => ({
  id: "test-id",
  type: "enti",
  name: "Test Enti",
  harness: {
    function: "Test Function",
    rules: ["rule 1"],
    knowledge: "Test Knowledge",
    workMaterial: "Test Material",
  },
  cognitiveConfig: {
    mode: "unconfigured",
  },
  status: "incomplete",
});

describe("FIA-004 EntiEditor Component", () => {
  it("Carga datos existentes", () => {
    const enti = getMockEnti();
    render(<EntiEditor enti={enti} onSave={() => {}} onClose={() => {}} />);
    
    expect(screen.getByTestId<HTMLInputElement>("input-name").value).toBe(enti.name);
    expect(screen.getByTestId<HTMLTextAreaElement>("input-function").value).toBe(enti.harness.function);
    expect(screen.getByTestId<HTMLTextAreaElement>("input-rules").value).toBe(enti.harness.rules.join("\\n"));
  });

  it("Permite modificar campos de draft sin invocar onSave inmediatamente", () => {
    const enti = getMockEnti();
    const onSave = vi.fn();
    render(<EntiEditor enti={enti} onSave={onSave} onClose={() => {}} />);
    
    const inputName = screen.getByTestId<HTMLInputElement>("input-name");
    fireEvent.change(inputName, { target: { value: "New Name" } });
    
    expect(inputName.value).toBe("New Name");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("Cierra directo si no hay cambios", () => {
    const onClose = vi.fn();
    render(<EntiEditor enti={getMockEnti()} onSave={() => {}} onClose={onClose} />);
    
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    
    expect(screen.queryByTestId("close-dialog")).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalled();
  });

  it("Muestra diálogo Guardar/Descartar/Cancelar si hay cambios", () => {
    render(<EntiEditor enti={getMockEnti()} onSave={() => {}} onClose={() => {}} />);
    
    fireEvent.change(screen.getByTestId("input-name"), { target: { value: "Dirty Name" } });
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    
    expect(screen.getByTestId("close-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("btn-dialog-guardar")).toBeInTheDocument();
    expect(screen.getByTestId("btn-dialog-descartar")).toBeInTheDocument();
    expect(screen.getByTestId("btn-dialog-cancelar")).toBeInTheDocument();
  });

  it("Guardar invoca onSave y onClose", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<EntiEditor enti={getMockEnti()} onSave={onSave} onClose={onClose} />);
    
    fireEvent.change(screen.getByTestId("input-name"), { target: { value: "Dirty Name" } });
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId("btn-dialog-guardar"));
    
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "Dirty Name" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("Descartar cierra sin invocar onSave", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<EntiEditor enti={getMockEnti()} onSave={onSave} onClose={onClose} />);
    
    fireEvent.change(screen.getByTestId("input-name"), { target: { value: "Dirty Name" } });
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId("btn-dialog-descartar"));
    
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("Cancelar aborta cierre y mantiene el draft vivo", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<EntiEditor enti={getMockEnti()} onSave={onSave} onClose={onClose} />);
    
    fireEvent.change(screen.getByTestId("input-name"), { target: { value: "Dirty Name" } });
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId("btn-dialog-cancelar"));
    
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByTestId("close-dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId<HTMLInputElement>("input-name").value).toBe("Dirty Name");
  });
});
