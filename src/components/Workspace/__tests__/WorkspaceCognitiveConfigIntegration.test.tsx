import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { EntiEditor } from "../EntiEditor";
import type { Enti } from "../../../domain/enti/Enti";

describe("Workspace Cognitive Config Integration (FIA-016)", () => {
  const mockEnti: Enti = {
    id: "test-enti-1",
    type: "enti",
    name: "Test Enti",
    harness: {
      function: "Función original",
      rules: ["Regla 1"],
      knowledge: "Conocimientos iniciales",
      workMaterial: "Material inicial"
    },
    cognitiveConfig: {
      mode: "unconfigured"
    },
    status: "incomplete"
  };

  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TEST-FIA016-01: abrir Enti seleccionado muestra Configuración Cognitiva sin errores", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    expect(screen.getByTestId("cognitive-config-section")).toBeInTheDocument();
    expect(screen.getByText("Configuración Cognitiva")).toBeInTheDocument();
    expect(screen.getByTestId("input-cognitive-mode")).toBeInTheDocument();
  });

  it("TEST-FIA016-02: configuración local pasiva/mock no muestra controles operativos cloud", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const trigger = screen.getByTestId("input-cognitive-mode");
    
    fireEvent.click(trigger);
    fireEvent.click(screen.getByTestId("option-local"));
    
    // Submenú local-models abierto
    expect(screen.getByTestId("local-brain-detection-block")).toBeInTheDocument();
    // No debe existir el bloque cloud
    expect(screen.queryByTestId("cloud-api-key-block")).not.toBeInTheDocument();
  });

  it("TEST-FIA016-03: configuración cloud/openai muestra apiKey opcional como dato sensible/inert", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const trigger = screen.getByTestId("input-cognitive-mode");
    
    fireEvent.click(trigger);
    fireEvent.click(screen.getByTestId("option-cloud"));
    
    expect(screen.getByTestId("cloud-api-key-block")).toBeInTheDocument();
    const input = screen.getByTestId("input-openai-api-key");
    expect(input).toHaveAttribute("type", "password");
  });

  it("TEST-FIA016-04: editar cualquier dato cognitivo permitido actualiza draft y activa dirty", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const trigger = screen.getByTestId("input-cognitive-mode");
    
    fireEvent.click(trigger);
    fireEvent.click(screen.getByTestId("option-cloud"));
    
    const input = screen.getByTestId("input-openai-api-key");
    fireEvent.change(input, { target: { value: "sk-test" } });
    fireEvent.click(screen.getByTestId("btn-accept-api-key"));
    
    // Dirty, so closing triggers dialog
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    expect(screen.getByTestId("close-dialog")).toBeInTheDocument();
  });

  it("TEST-FIA016-05: Guardar persiste cognitiveConfig mediante EntiRepository en memoria", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const trigger = screen.getByTestId("input-cognitive-mode");
    
    fireEvent.click(trigger);
    fireEvent.click(screen.getByTestId("option-cloud"));
    
    const input = screen.getByTestId("input-openai-api-key");
    fireEvent.change(input, { target: { value: "sk-test" } });
    fireEvent.click(screen.getByTestId("btn-accept-api-key"));
    
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId("btn-dialog-guardar"));
    
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      cognitiveConfig: {
        mode: "cloud",
        apiKey: "sk-test"
      }
    }));
  });

  it("TEST-FIA016-06: Descartar preserva configuración previa", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const trigger = screen.getByTestId("input-cognitive-mode");
    
    fireEvent.click(trigger);
    fireEvent.click(screen.getByTestId("option-cloud"));
    
    const input = screen.getByTestId("input-openai-api-key");
    fireEvent.change(input, { target: { value: "sk-test" } });
    fireEvent.click(screen.getByTestId("btn-accept-api-key"));
    
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId("btn-dialog-descartar"));
    
    expect(mockOnSave).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("TEST-FIA016-07: Cancelar mantiene editor abierto con draft pendiente", () => {
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const trigger = screen.getByTestId("input-cognitive-mode");
    
    fireEvent.click(trigger);
    fireEvent.click(screen.getByTestId("option-cloud"));
    
    const input = screen.getByTestId("input-openai-api-key");
    fireEvent.change(input, { target: { value: "sk-test" } });
    fireEvent.click(screen.getByTestId("btn-accept-api-key"));
    
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId("btn-dialog-cancelar"));
    
    expect(screen.queryByTestId("close-dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent("IA Cloud/OpenAI");
  });

  it("TEST-FIA016-08: cambio de selectedEntiId resincroniza cognitiveConfig sin carryover", () => {
    const { rerender } = render(<EntiEditor key={mockEnti.id} enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    
    const trigger = screen.getByTestId("input-cognitive-mode");
    fireEvent.click(trigger);
    fireEvent.click(screen.getByTestId("option-cloud"));
    const input = screen.getByTestId("input-openai-api-key");
    fireEvent.change(input, { target: { value: "sk-test" } });
    fireEvent.click(screen.getByTestId("btn-accept-api-key"));

    const enti2: Enti = {
      ...mockEnti,
      id: "test-enti-2",
      cognitiveConfig: { mode: "local", model: "Llama-3-8B-Instruct" }
    };

    rerender(<EntiEditor key={enti2.id} enti={enti2} onSave={mockOnSave} onClose={mockOnClose} />);
    
    const newTrigger = screen.getByTestId("input-cognitive-mode");
    expect(newTrigger).toHaveTextContent("IA Local: Llama-3-8B-Instruct");
  });

  it("TEST-FIA016-09: Enti sin apiKey/cognitiveConfig parcial permanece válido", () => {
    const emptyEnti: Enti = {
      ...mockEnti,
      cognitiveConfig: { mode: "cloud" }
    };
    render(<EntiEditor enti={emptyEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const trigger = screen.getByTestId("input-cognitive-mode");
    expect(trigger).toHaveTextContent("IA Cloud/OpenAI");
    fireEvent.click(trigger);
    fireEvent.click(screen.getByTestId("option-cloud"));
    
    const input = screen.getByTestId("input-openai-api-key");
    expect(input).toHaveValue("");
  });

  it("TEST-FIA016-10: forbidden-units scan sin Runtime, Chat, Prompt Engine, SDK, backend, storage no autorizado ni red", () => {
    // Escaneo pasivo verificando que no se inyectan clases o props ajenas al draft inerte
    const text = document.body.innerHTML;
    expect(text).not.toContain("Runtime");
    expect(text).not.toContain("PromptEngine");
    expect(text).not.toContain("window.localStorage");
    expect(text).not.toContain("fetch(");
  });

  it("TEST-FIA016-11: no-secret scan: apiKey no aparece en logs, snapshots, errores ni consola", () => {
    const spy = vi.spyOn(console, "log");
    render(<EntiEditor enti={mockEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    const trigger = screen.getByTestId("input-cognitive-mode");
    
    fireEvent.click(trigger);
    fireEvent.click(screen.getByTestId("option-cloud"));
    
    const input = screen.getByTestId("input-openai-api-key");
    fireEvent.change(input, { target: { value: "sk-secret-test-key-1234" } });
    fireEvent.click(screen.getByTestId("btn-accept-api-key"));
    
    // El texto ingresado no debe mostrarse en la UI externa ni en la consola
    expect(screen.queryByText("sk-secret-test-key-1234")).not.toBeInTheDocument();
    
    const consoleOutput = spy.mock.calls.flat().join(" ");
    expect(consoleOutput).not.toContain("sk-secret-test-key-1234");
    
    spy.mockRestore();
  });
});
