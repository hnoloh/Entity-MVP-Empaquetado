import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WorkspaceShell from "../WorkspaceShell";
import { entiRepository } from "../../../domain/enti/entiRepository";
import { createEnti } from "../../../domain/enti/createEnti";

describe("WorkspaceLocalBrainDetectionIntegration", () => {
  beforeEach(() => {
    entiRepository.clear();
  });

  afterEach(() => {
    entiRepository.clear();
  });

  it("TEST-FIA014-01: Renderiza bloque de Detección Brains Locales en EntiEditor cuando el Enti está en IA Local", async () => {
    const enti = createEnti("enti-local", "Test Local", {
      function: "",
      rules: [],
      workMaterial: "",
      knowledge: "",
    });
    enti.cognitiveConfig.mode = "local";
    entiRepository.save(enti);

    render(<WorkspaceShell />);
    
    // Select the Enti
    fireEvent.click(screen.getByTestId("enti-item-enti-local"));
    
    // Check that the trigger shows IA Local mode
    expect(screen.getByText(/IA Local/)).toBeInTheDocument();
    
    // Open the dropdown
    fireEvent.click(screen.getByTestId("input-cognitive-mode"));
    
    // Ensure "IA Local" option is visible and click it to go to models step
    fireEvent.click(screen.getByTestId("option-local"));

    // Check if the detection block is visible inside the dropdown
    expect(screen.getByTestId("local-brain-detection-block")).toBeInTheDocument();
  });

  it("TEST-FIA014-02: Muestra lista controlada/stub de modelos locales detectados sin ejecución", async () => {
    const enti = createEnti("enti-local-2", "Test Local 2", {
      function: "",
      rules: [],
      workMaterial: "",
      knowledge: "",
    });
    enti.cognitiveConfig.mode = "local";
    entiRepository.save(enti);

    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByTestId("enti-item-enti-local-2"));
    
    // Open the dropdown and click IA Local
    fireEvent.click(screen.getByTestId("input-cognitive-mode"));
    fireEvent.click(screen.getByTestId("option-local"));

    // Wait for the mock list to appear
    await waitFor(() => {
      expect(screen.getByTestId("local-models-list")).toBeInTheDocument();
    });

    const listItems = screen.getAllByTestId("local-model-item");
    expect(listItems.length).toBeGreaterThan(0);
  });

  it("TEST-FIA014-04: En modo IA Cloud/OpenAI no queda activo el flujo de detección local", async () => {
    const enti = createEnti("enti-cloud", "Test Cloud", {
      function: "",
      rules: [],
      workMaterial: "",
      knowledge: "",
    });
    enti.cognitiveConfig.mode = "cloud";
    entiRepository.save(enti);

    render(<WorkspaceShell />);
    
    fireEvent.click(screen.getByTestId("enti-item-enti-cloud"));
    
    // Should not show the detection block initially
    expect(screen.queryByTestId("local-brain-detection-block")).not.toBeInTheDocument();
    
    // Even if we open the dropdown, the first step is the main selection, not the detection block
    fireEvent.click(screen.getByTestId("input-cognitive-mode"));
    expect(screen.queryByTestId("local-brain-detection-block")).not.toBeInTheDocument();
  });

  it("TEST-FIA014-05: Cambiar de Enti refresca detección sin arrastre residual", async () => {
    const entiLocal = createEnti("enti-local-3", "Test Local 3", {
      function: "",
      rules: [],
      workMaterial: "",
      knowledge: "",
    });
    entiLocal.cognitiveConfig.mode = "local";
    entiRepository.save(entiLocal);

    const entiCloud = createEnti("enti-cloud-2", "Test Cloud 2", {
      function: "",
      rules: [],
      workMaterial: "",
      knowledge: "",
    });
    entiCloud.cognitiveConfig.mode = "cloud";
    entiRepository.save(entiCloud);

    render(<WorkspaceShell />);
    
    // Select Local Enti
    fireEvent.click(screen.getByTestId("enti-item-enti-local-3"));
    
    // Open dropdown and trigger local models
    fireEvent.click(screen.getByTestId("input-cognitive-mode"));
    fireEvent.click(screen.getByTestId("option-local"));
    expect(screen.getByTestId("local-brain-detection-block")).toBeInTheDocument();

    // Close the first editor so it doesn't pollute the DOM
    fireEvent.click(screen.getAllByTestId('btn-close-editor')[0]);
    // Si estaba dirty aparecería el modal, si no se cierra solo.
    // Vamos a forzar un cambio para que esté dirty por si acaso, o simplemente verificar
    const dialogBtn = screen.queryByTestId('btn-dialog-descartar');
    if (dialogBtn) {
      fireEvent.click(dialogBtn);
    }

    // Select Cloud Enti
    fireEvent.click(screen.getByTestId("enti-item-enti-cloud-2"));
    
    // Verify detection block is gone
    expect(screen.queryByTestId("local-brain-detection-block")).not.toBeInTheDocument();
  });
});
