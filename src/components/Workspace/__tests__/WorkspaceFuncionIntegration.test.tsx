import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EntiEditor } from "../EntiEditor";
import type { Enti } from "../../../domain/enti/Enti";

describe("Workspace Función Integration (FIA-009)", () => {
  const mockEnti: Enti = {
    id: "test-enti-1",
    type: "enti",
    name: "Test Enti",
    harness: {
      function: "Función original",
      rules: [],
      workMaterial: "",
      knowledge: "",
    },
    cognitiveConfig: {
      mode: "unconfigured",
    },
    status: "incomplete",
  };

  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TEST-FIA009-01: Campo Función visible dentro de Harness Base", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const functionInput = screen.getByTestId("input-function");
    expect(functionInput).toBeInTheDocument();
    expect(functionInput).toHaveValue("Función original");
  });

  it("TEST-FIA009-02: Modificación de Función actualiza draft local y activa dirty", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const functionInput = screen.getByTestId("input-function");
    
    // Act
    fireEvent.change(functionInput, { target: { value: "Nueva función" } });
    
    // Assert value in draft (input)
    expect(functionInput).toHaveValue("Nueva función");
    
    // Assert no save yet (no autosave)
    expect(mockOnSave).not.toHaveBeenCalled();

    // Trigger close to see dirty state dialog
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    expect(screen.getByTestId("close-dialog")).toBeInTheDocument();
  });

  it("TEST-FIA009-03: Guardar persiste Función en EntiRepository mediante flujo existente", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const functionInput = screen.getByTestId("input-function");
    
    fireEvent.change(functionInput, { target: { value: "Nueva función" } });
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    
    // Click Guardar
    fireEvent.click(screen.getByTestId("btn-dialog-guardar"));
    
    // Assert onSave was called with new function
    expect(mockOnSave).toHaveBeenCalledWith({
      ...mockEnti,
      harness: { ...mockEnti.harness, function: "Nueva función" }
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("TEST-FIA009-04: Descartar preserva el valor previamente guardado", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const functionInput = screen.getByTestId("input-function");
    
    fireEvent.change(functionInput, { target: { value: "Nueva función" } });
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    
    // Click Descartar
    fireEvent.click(screen.getByTestId("btn-dialog-descartar"));
    
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("TEST-FIA009-05: Cancelar mantiene editor abierto y draft vivo", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const functionInput = screen.getByTestId("input-function");
    
    fireEvent.change(functionInput, { target: { value: "Nueva función" } });
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    
    // Click Cancelar
    fireEvent.click(screen.getByTestId("btn-dialog-cancelar"));
    
    expect(screen.queryByTestId("close-dialog")).not.toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(functionInput).toHaveValue("Nueva función");
  });

  it("TEST-FIA009-06: Cambiar selección no mezcla Función entre Entis", () => {
    const { rerender } = render(<EntiEditor key={mockEnti.id} enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    
    const enti2: Enti = {
      ...mockEnti,
      id: "test-enti-2",
      harness: { ...mockEnti.harness, function: "Función de Enti 2" }
    };

    rerender(<EntiEditor key={enti2.id} enti={enti2} onSave={mockOnSave} onClose={mockOnClose} />);
    
    const functionInput = screen.getByTestId("input-function");
    expect(functionInput).toHaveValue("Función de Enti 2");
  });
});
