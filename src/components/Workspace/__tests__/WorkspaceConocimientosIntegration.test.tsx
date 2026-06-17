import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EntiEditor } from "../EntiEditor";
import type { Enti } from "../../../domain/enti/Enti";

describe("Workspace Conocimientos Integration (FIA-012)", () => {
  const mockEnti: Enti = {
    id: "test-enti-1",
    type: "enti",
    name: "Test Enti",
    harness: {
      function: "Función original",
      rules: ["Regla 1"],
      workMaterial: "Material inicial",
      knowledge: "Conocimientos iniciales",
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

  it("TEST-FIA012-01: Conocimientos visible dentro de Harness Base para Enti seleccionado", () => {
    render(<EntiEditor isActive={true} enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const knowledgeInput = screen.getByTestId("input-knowledge");
    expect(knowledgeInput).toBeInTheDocument();
    expect(knowledgeInput).toHaveValue("Conocimientos iniciales");
  });

  it("TEST-FIA012-02: edición de Conocimientos activa dirty sin invocar autosave", () => {
    render(<EntiEditor isActive={true} enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const knowledgeInput = screen.getByTestId("input-knowledge");
    
    // Act
    fireEvent.change(knowledgeInput, { target: { value: "Nuevos conocimientos" } });
    
    // Assert value in draft (input)
    expect(knowledgeInput).toHaveValue("Nuevos conocimientos");
    
    // Assert no save yet (no autosave)
    expect(mockOnSave).not.toHaveBeenCalled();

    // Trigger close to see dirty state dialog
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    expect(screen.getByTestId("close-dialog")).toBeInTheDocument();
  });

  it("TEST-FIA012-03: Guardar persiste Conocimientos mediante EntiRepository existente", () => {
    render(<EntiEditor isActive={true} enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const knowledgeInput = screen.getByTestId("input-knowledge");
    
    fireEvent.change(knowledgeInput, { target: { value: "Nuevos conocimientos" } });
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    
    // Click Guardar
    fireEvent.click(screen.getByTestId("btn-dialog-guardar"));
    
    // Assert onSave was called with new knowledge
    expect(mockOnSave).toHaveBeenCalledWith({
      ...mockEnti,
      harness: { ...mockEnti.harness, knowledge: "Nuevos conocimientos" }
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("TEST-FIA012-04: Descartar conserva el valor guardado previo", () => {
    render(<EntiEditor isActive={true} enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const knowledgeInput = screen.getByTestId("input-knowledge");
    
    fireEvent.change(knowledgeInput, { target: { value: "Nuevos conocimientos" } });
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    
    // Click Descartar
    fireEvent.click(screen.getByTestId("btn-dialog-descartar"));
    
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("TEST-FIA012-05: Cancelar mantiene editor abierto con draft pendiente", () => {
    render(<EntiEditor isActive={true} enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const knowledgeInput = screen.getByTestId("input-knowledge");
    
    fireEvent.change(knowledgeInput, { target: { value: "Nuevos conocimientos" } });
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    
    // Click Cancelar
    fireEvent.click(screen.getByTestId("btn-dialog-cancelar"));
    
    expect(screen.queryByTestId("close-dialog")).not.toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(knowledgeInput).toHaveValue("Nuevos conocimientos");
  });

  it("TEST-FIA012-06: cambio de Enti refresca Conocimientos sin carryover", () => {
    const { rerender } = render(<EntiEditor isActive={true} key={mockEnti.id} enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    
    const enti2: Enti = {
      ...mockEnti,
      id: "test-enti-2",
      harness: { ...mockEnti.harness, knowledge: "Conocimientos de Enti 2" }
    };

    rerender(<EntiEditor isActive={true} key={enti2.id} enti={enti2} onSave={mockOnSave} onClose={mockOnClose} />);
    
    const knowledgeInput = screen.getByTestId("input-knowledge");
    expect(knowledgeInput).toHaveValue("Conocimientos de Enti 2");
  });

  it("TEST-FIA012-08: editar Conocimientos no altera Función, Normas ni Material de Trabajo", () => {
    render(<EntiEditor isActive={true} enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const knowledgeInput = screen.getByTestId("input-knowledge");
    const functionInput = screen.getByTestId("input-function");
    const rulesInput = screen.getByTestId("input-rules");
    const materialInput = screen.getByTestId("input-workMaterial");
    
    fireEvent.change(knowledgeInput, { target: { value: "Nuevos conocimientos" } });
    
    expect(functionInput).toHaveValue("Función original");
    expect(rulesInput).toHaveValue("Regla 1");
    expect(materialInput).toHaveValue("Material inicial");
  });
});
