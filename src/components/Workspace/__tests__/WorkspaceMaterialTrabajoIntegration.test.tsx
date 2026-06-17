import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EntiEditor } from "../EntiEditor";
import type { Enti } from "../../../domain/enti/Enti";

describe("Workspace Material de Trabajo Integration (FIA-011)", () => {
  const mockEnti: Enti = {
    id: "test-enti-1",
    type: "enti",
    name: "Test Enti",
    harness: {
      function: "Función original",
      rules: ["Regla 1"],
      workMaterial: "Material inicial",
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

  it("TEST-FIA011-01: Material de Trabajo visible dentro de Harness Base para Enti seleccionado", () => {
    render(<EntiEditor isActive={true} enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const materialInput = screen.getByTestId("input-workMaterial");
    expect(materialInput).toBeInTheDocument();
    expect(materialInput).toHaveValue("Material inicial");
  });

  it("TEST-FIA011-02: editar Material de Trabajo actualiza draft y activa dirty", () => {
    render(<EntiEditor isActive={true} enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const materialInput = screen.getByTestId("input-workMaterial");
    
    // Act
    fireEvent.change(materialInput, { target: { value: "Nuevo material" } });
    
    // Assert value in draft (input)
    expect(materialInput).toHaveValue("Nuevo material");
    
    // Assert no save yet (no autosave)
    expect(mockOnSave).not.toHaveBeenCalled();

    // Trigger close to see dirty state dialog
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    expect(screen.getByTestId("close-dialog")).toBeInTheDocument();
  });

  it("TEST-FIA011-03: Guardar persiste Material de Trabajo mediante EntiRepository existente", () => {
    render(<EntiEditor isActive={true} enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const materialInput = screen.getByTestId("input-workMaterial");
    
    fireEvent.change(materialInput, { target: { value: "Nuevo material" } });
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    
    // Click Guardar
    fireEvent.click(screen.getByTestId("btn-dialog-guardar"));
    
    // Assert onSave was called with new workMaterial
    expect(mockOnSave).toHaveBeenCalledWith({
      ...mockEnti,
      harness: { ...mockEnti.harness, workMaterial: "Nuevo material" }
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("TEST-FIA011-04: Descartar preserva el valor guardado previo", () => {
    render(<EntiEditor isActive={true} enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const materialInput = screen.getByTestId("input-workMaterial");
    
    fireEvent.change(materialInput, { target: { value: "Nuevo material" } });
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    
    // Click Descartar
    fireEvent.click(screen.getByTestId("btn-dialog-descartar"));
    
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("TEST-FIA011-05: Cancelar mantiene editor abierto con draft pendiente", () => {
    render(<EntiEditor isActive={true} enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const materialInput = screen.getByTestId("input-workMaterial");
    
    fireEvent.change(materialInput, { target: { value: "Nuevo material" } });
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    
    // Click Cancelar
    fireEvent.click(screen.getByTestId("btn-dialog-cancelar"));
    
    expect(screen.queryByTestId("close-dialog")).not.toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(materialInput).toHaveValue("Nuevo material");
  });

  it("TEST-FIA011-06: cambio de Enti refresca Material de Trabajo sin arrastre residual", () => {
    const { rerender } = render(<EntiEditor isActive={true} key={mockEnti.id} enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    
    const enti2: Enti = {
      ...mockEnti,
      id: "test-enti-2",
      harness: { ...mockEnti.harness, workMaterial: "Material de Enti 2" }
    };

    rerender(<EntiEditor isActive={true} key={enti2.id} enti={enti2} onSave={mockOnSave} onClose={mockOnClose} />);
    
    const materialInput = screen.getByTestId("input-workMaterial");
    expect(materialInput).toHaveValue("Material de Enti 2");
  });

  it("TEST-FIA011-08: Función y Normas permanecen intactas al editar Material de Trabajo", () => {
    render(<EntiEditor isActive={true} enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const materialInput = screen.getByTestId("input-workMaterial");
    const functionInput = screen.getByTestId("input-function");
    const rulesInput = screen.getByTestId("input-rules");
    
    fireEvent.change(materialInput, { target: { value: "Nuevo material" } });
    
    expect(functionInput).toHaveValue("Función original");
    expect(rulesInput).toHaveValue("Regla 1");
  });
});
