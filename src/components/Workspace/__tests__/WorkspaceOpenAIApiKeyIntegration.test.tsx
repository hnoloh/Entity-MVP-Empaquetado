import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { EntiEditor } from "../EntiEditor";
import type { Enti } from "../../../domain/enti/Enti";

const mockEntiBase: Enti = {
  id: "test-enti-1",
  type: "enti",
  name: "Test API Key",
  status: "complete",
  harness: {
    function: "Función original",
    knowledge: "Conocimientos iniciales",
    rules: ["Regla 1"],
    workMaterial: "Material inicial",
  },
  cognitiveConfig: {
    mode: "cloud",
    apiKey: "sk-previous-key",
  },
};

const mockOnSave = vi.fn();
const mockOnClose = vi.fn();

const openApiKeyInput = () => {
  fireEvent.click(screen.getByTestId("input-cognitive-mode"));
  fireEvent.click(screen.getByTestId("option-cloud"));
};

describe("Workspace API Key OpenAI Integration (FIA-015 modificado)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TEST-FIA015-01: el campo API Key OpenAI aparece en el submenú al seleccionar IA Cloud/OpenAI", () => {
    render(<EntiEditor enti={mockEntiBase} onSave={mockOnSave} onClose={mockOnClose} />);
    expect(screen.queryByTestId("input-openai-api-key")).not.toBeInTheDocument();
    
    openApiKeyInput();
    const apiKeyInput = screen.getByTestId("input-openai-api-key");
    expect(apiKeyInput).toBeInTheDocument();
    expect(apiKeyInput).toHaveAttribute("type", "password");
    expect(apiKeyInput).toHaveValue("sk-previous-key");
  });

  it("TEST-FIA015-02: editar API Key y Aceptar activa dirty sin invocar autosave ni red", () => {
    render(<EntiEditor enti={mockEntiBase} onSave={mockOnSave} onClose={mockOnClose} />);
    
    openApiKeyInput();
    const apiKeyInput = screen.getByTestId("input-openai-api-key");
    fireEvent.change(apiKeyInput, { target: { value: "sk-new-key-123" } });
    fireEvent.click(screen.getByTestId("btn-accept-api-key")); // Cierra menú y guarda en draft
    
    expect(mockOnSave).not.toHaveBeenCalled();

    // Check dirty by trying to close
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    const saveButton = screen.getByTestId("btn-dialog-guardar");
    expect(saveButton).toBeInTheDocument();
  });

  it("TEST-FIA015-03: Guardar persiste el valor modificado por EntiRepository en memoria", () => {
    render(<EntiEditor enti={mockEntiBase} onSave={mockOnSave} onClose={mockOnClose} />);
    
    openApiKeyInput();
    fireEvent.change(screen.getByTestId("input-openai-api-key"), { target: { value: "sk-new-key-123" } });
    fireEvent.click(screen.getByTestId("btn-accept-api-key"));
    
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId("btn-dialog-guardar"));

    expect(mockOnSave).toHaveBeenCalledWith({
      ...mockEntiBase,
      cognitiveConfig: {
        ...mockEntiBase.cognitiveConfig,
        apiKey: "sk-new-key-123",
      },
    });
  });

  it("TEST-FIA015-04: Descartar conserva el valor previo guardado", () => {
    render(<EntiEditor enti={mockEntiBase} onSave={mockOnSave} onClose={mockOnClose} />);
    
    openApiKeyInput();
    fireEvent.change(screen.getByTestId("input-openai-api-key"), { target: { value: "sk-discarded-key" } });
    fireEvent.click(screen.getByTestId("btn-accept-api-key"));
    
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId("btn-dialog-descartar"));

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("TEST-FIA015-05: Cancelar mantiene editor abierto y draft pendiente", () => {
    render(<EntiEditor enti={mockEntiBase} onSave={mockOnSave} onClose={mockOnClose} />);
    
    openApiKeyInput();
    fireEvent.change(screen.getByTestId("input-openai-api-key"), { target: { value: "sk-pending-key" } });
    fireEvent.click(screen.getByTestId("btn-accept-api-key"));

    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    fireEvent.click(screen.getByTestId("btn-dialog-cancelar"));

    expect(mockOnClose).not.toHaveBeenCalled();
    
    // Verificar que el draft sigue teniendo el valor (abriendo de nuevo)
    openApiKeyInput();
    expect(screen.getByTestId("input-openai-api-key")).toHaveValue("sk-pending-key");
  });

  it("TEST-FIA015-06: cambiar de Enti resincroniza el campo sin arrastre residual", () => {
    const { rerender } = render(<EntiEditor key={mockEntiBase.id} enti={mockEntiBase} onSave={mockOnSave} onClose={mockOnClose} />);
    openApiKeyInput();
    fireEvent.change(screen.getByTestId("input-openai-api-key"), { target: { value: "sk-dirty-key" } });
    fireEvent.click(screen.getByTestId("btn-accept-api-key"));

    const newEnti: Enti = {
      ...mockEntiBase,
      id: "test-enti-2",
      cognitiveConfig: {
        mode: "cloud",
        apiKey: "sk-another-key",
      },
    };

    rerender(<EntiEditor key={newEnti.id} enti={newEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    
    openApiKeyInput();
    expect(screen.getByTestId("input-openai-api-key")).toHaveValue("sk-another-key");
  });

  it("TEST-FIA015-07: con IA Local no aparece bloque activo de API Key OpenAI a menos que se cambie", () => {
    const localEnti: Enti = {
      ...mockEntiBase,
      cognitiveConfig: {
        mode: "local",
        model: "llama-3",
      },
    };
    render(<EntiEditor enti={localEnti} onSave={mockOnSave} onClose={mockOnClose} />);
    
    expect(screen.queryByTestId("input-openai-api-key")).not.toBeInTheDocument();
  });

  it("TEST-FIA015-08: forbidden-units scan", () => {
    // Asserting we have no visual buttons to 'validate' or 'chat'
    render(<EntiEditor enti={mockEntiBase} onSave={mockOnSave} onClose={mockOnClose} />);
    
    expect(screen.queryByText(/validar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/conectar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/chat/i)).not.toBeInTheDocument();
  });

  it("TEST-UI: el ojo alterna la visibilidad de la contraseña", () => {
    render(<EntiEditor enti={mockEntiBase} onSave={mockOnSave} onClose={mockOnClose} />);
    openApiKeyInput();

    const input = screen.getByTestId("input-openai-api-key");
    const btn = screen.getByTestId("btn-toggle-api-key");

    expect(input).toHaveAttribute("type", "password");
    fireEvent.click(btn);
    expect(input).toHaveAttribute("type", "text");
    fireEvent.click(btn);
    expect(input).toHaveAttribute("type", "password");
  });
});
