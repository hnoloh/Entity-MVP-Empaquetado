import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EntiEditor } from "../EntiEditor";
import type { Enti } from "../../../domain/enti/Enti";

describe("Workspace Tipo de Brain Integration (FIA-013)", () => {
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

  it("TEST-FIA013-01: renderiza Tipo de Brain en EntiEditor", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const modeSelect = screen.getByTestId("input-cognitive-mode");
    expect(modeSelect).toBeInTheDocument();
    
    // Verificamos el label también si es posible, aunque con el testId basta para el selector
    expect(screen.getByText("Tipo de Brain")).toBeInTheDocument();
  });

  it("TEST-FIA013-02: muestra solo IA Local e IA Cloud/OpenAI (además del unconfigured placeholder)", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const trigger = screen.getByTestId("input-cognitive-mode");
    fireEvent.click(trigger);

    const optionLocal = screen.getByTestId("option-local");
    const optionCloud = screen.getByTestId("option-cloud");
    
    expect(optionLocal).toBeInTheDocument();
    expect(optionCloud).toBeInTheDocument();
    expect(trigger).toHaveTextContent("Seleccionar tipo...");
  });

  it("TEST-FIA013-03: Local activa dirty sin autosave", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const trigger = screen.getByTestId("input-cognitive-mode");
    
    fireEvent.click(trigger);
    fireEvent.click(screen.getByTestId("option-local"));
    
    expect(trigger).toHaveTextContent("IA Local");
    expect(mockOnSave).not.toHaveBeenCalled();

    // Trigger close to verify dirty
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    expect(screen.getByTestId("close-dialog")).toBeInTheDocument();
  });

  it("TEST-FIA013-04: Cloud/OpenAI activa dirty sin pedir ni validar API Key", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const trigger = screen.getByTestId("input-cognitive-mode");
    
    fireEvent.click(trigger);
    fireEvent.click(screen.getByTestId("option-cloud"));
    fireEvent.click(screen.getByTestId("btn-accept-api-key"));
    
    expect(trigger).toHaveTextContent("IA Cloud/OpenAI");
    expect(mockOnSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    expect(screen.getByTestId("close-dialog")).toBeInTheDocument();
  });

  it("TEST-FIA013-05: Guardar persiste modalidad en el Enti correcto", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const trigger = screen.getByTestId("input-cognitive-mode");
    
    fireEvent.click(trigger);
    fireEvent.click(screen.getByTestId("option-local"));
    
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId("btn-dialog-guardar"));
    
    expect(mockOnSave).toHaveBeenCalledWith({
      ...mockEnti,
      cognitiveConfig: { ...mockEnti.cognitiveConfig, mode: "local" }
    });
  });

  it("TEST-FIA013-06: Descartar conserva valor previo", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const trigger = screen.getByTestId("input-cognitive-mode");
    
    fireEvent.click(trigger);
    fireEvent.click(screen.getByTestId("option-cloud"));
    fireEvent.click(screen.getByTestId("btn-accept-api-key"));
    
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId("btn-dialog-descartar"));
    
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("TEST-FIA013-07: Cancelar mantiene editor abierto con draft pendiente", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const trigger = screen.getByTestId("input-cognitive-mode");
    
    fireEvent.click(trigger);
    fireEvent.click(screen.getByTestId("option-cloud"));
    fireEvent.click(screen.getByTestId("btn-accept-api-key"));
    
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId("btn-dialog-cancelar"));
    
    expect(screen.queryByTestId("close-dialog")).not.toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(trigger).toHaveTextContent("IA Cloud/OpenAI");
  });

  it("TEST-FIA013-08: cambio de selectedEntiId resincroniza sin carryover", () => {
    const { rerender } = render(<EntiEditor key={mockEnti.id} enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const trigger = screen.getByTestId("input-cognitive-mode");
    
    fireEvent.click(trigger);
    fireEvent.click(screen.getByTestId("option-cloud"));
    fireEvent.click(screen.getByTestId("btn-accept-api-key"));
    
    const enti2: Enti = {
      ...mockEnti,
      id: "test-enti-2",
      cognitiveConfig: { ...mockEnti.cognitiveConfig, mode: "local" }
    };

    rerender(<EntiEditor key={enti2.id} enti={enti2} onSave={mockOnSave} onClose={mockOnClose} />);
    
    const newTrigger = screen.getByTestId("input-cognitive-mode");
    expect(newTrigger).toHaveTextContent("IA Local");
  });

  it("TEST-FIA013-11: Harness textual intacto al cambiar Tipo de Brain", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const trigger = screen.getByTestId("input-cognitive-mode");
    const functionInput = screen.getByTestId("input-function");
    
    fireEvent.click(trigger);
    fireEvent.click(screen.getByTestId("option-cloud"));
    
    expect(functionInput).toHaveValue("Función original");
  });
});
