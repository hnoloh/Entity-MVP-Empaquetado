import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EntiEditor } from "../EntiEditor";
import type { Enti } from "../../../domain/enti/Enti";

describe("Workspace Normas Integration (FIA-010)", () => {
  const mockEnti: Enti = {
    id: "test-enti-1",
    type: "enti",
    name: "Test Enti",
    harness: {
      function: "Función original",
      rules: ["Regla 1", "Regla 2"],
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

  it("TEST-FIA010-01: Normas visible dentro de Harness Base para Enti seleccionado", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const rulesInput = screen.getByTestId("input-rules");
    expect(rulesInput).toBeInTheDocument();
    expect(rulesInput).toHaveValue("Regla 1\nRegla 2");
  });

  it("TEST-FIA010-02: edición textual de Normas activa dirty sin autosave", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const rulesInput = screen.getByTestId("input-rules");
    
    // Act
    fireEvent.change(rulesInput, { target: { value: "Nueva regla" } });
    
    // Assert value in draft (input)
    expect(rulesInput).toHaveValue("Nueva regla");
    
    // Assert no save yet (no autosave)
    expect(mockOnSave).not.toHaveBeenCalled();

    // Trigger close to see dirty state dialog
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    expect(screen.getByTestId("close-dialog")).toBeInTheDocument();
  });

  it("TEST-FIA010-03: Guardar persiste Normas por EntiRepository", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const rulesInput = screen.getByTestId("input-rules");
    
    fireEvent.change(rulesInput, { target: { value: "Nueva regla\nOtra regla" } });
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    
    // Click Guardar
    fireEvent.click(screen.getByTestId("btn-dialog-guardar"));
    
    // Assert onSave was called with new rules
    expect(mockOnSave).toHaveBeenCalledWith({
      ...mockEnti,
      harness: { ...mockEnti.harness, rules: ["Nueva regla", "Otra regla"] }
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("TEST-FIA010-04: Descartar preserva el valor guardado previo", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const rulesInput = screen.getByTestId("input-rules");
    
    fireEvent.change(rulesInput, { target: { value: "Nueva regla" } });
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    
    // Click Descartar
    fireEvent.click(screen.getByTestId("btn-dialog-descartar"));
    
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("TEST-FIA010-05: Cancelar mantiene editor abierto y draft vivo", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const rulesInput = screen.getByTestId("input-rules");
    
    fireEvent.change(rulesInput, { target: { value: "Nueva regla" } });
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    
    // Click Cancelar
    fireEvent.click(screen.getByTestId("btn-dialog-cancelar"));
    
    expect(screen.queryByTestId("close-dialog")).not.toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(rulesInput).toHaveValue("Nueva regla");
  });

  it("TEST-FIA010-06: cambiar de Enti no arrastra Normas del anterior", () => {
    const { rerender } = render(<EntiEditor key={mockEnti.id} enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    
    const enti2: Enti = {
      ...mockEnti,
      id: "test-enti-2",
      harness: { ...mockEnti.harness, rules: ["Norma Enti 2"] }
    };

    rerender(<EntiEditor key={enti2.id} enti={enti2} onSave={mockOnSave} onClose={mockOnClose} />);
    
    const rulesInput = screen.getByTestId("input-rules");
    expect(rulesInput).toHaveValue("Norma Enti 2");
  });

  it("TEST-FIA010-08: Función permanece intacta al editar Normas", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const rulesInput = screen.getByTestId("input-rules");
    const functionInput = screen.getByTestId("input-function");
    
    fireEvent.change(rulesInput, { target: { value: "Nueva regla" } });
    
    expect(functionInput).toHaveValue("Función original");
  });
});
