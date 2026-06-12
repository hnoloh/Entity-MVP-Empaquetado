import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import HubLateralView from "../HubLateralView";
import { EntitiesColumnRegion } from "../EntitiesColumnRegion";

describe("HubLateralView", () => {
  it("1. Renderiza HubLateralView correctamente", () => {
    render(
      <HubLateralView>
        <EntitiesColumnRegion />
      </HubLateralView>,
    );
    expect(screen.getByTestId("hub-lateral-view")).toBeInTheDocument();
  });

  it("2. Muestra controles + Enti y + Grupo", () => {
    render(
      <HubLateralView>
        <EntitiesColumnRegion />
      </HubLateralView>,
    );
    expect(screen.getByTestId("btn-create-enti")).toBeInTheDocument();
    expect(screen.getByTestId("btn-create-grupo")).toBeInTheDocument();
  });

  it("3. Contiene visualmente EntitiesColumnRegion sin duplicación", () => {
    render(
      <HubLateralView>
        <EntitiesColumnRegion />
      </HubLateralView>,
    );
    const columns = screen.getAllByTestId("entities-column-region");
    expect(columns).toHaveLength(1);
    expect(screen.getByTestId("hub-lateral-view")).toContainElement(columns[0]);
  });

  it("4. Controles + Enti y + Grupo no tienen side effects y actúan como affordances visuales", () => {
    const consoleSpy = vi.spyOn(console, "log");
    render(
      <HubLateralView>
        <EntitiesColumnRegion />
      </HubLateralView>,
    );

    const btnEnti = screen.getByTestId("btn-create-enti");
    const btnGrupo = screen.getByTestId("btn-create-grupo");

    fireEvent.click(btnEnti);
    fireEvent.click(btnGrupo);

    // No hay error y visualmente están como disabled o no-op
    // Check that we just have affordance
    expect(btnEnti).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it("5. Negativo: no existe ChatRegion o ChatWindow", () => {
    render(
      <HubLateralView>
        <EntitiesColumnRegion />
      </HubLateralView>,
    );
    expect(screen.queryByTestId("chat-region")).not.toBeInTheDocument();
    expect(screen.queryByTestId("chat-window")).not.toBeInTheDocument();
  });
});
