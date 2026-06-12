import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EntitiesColumnRegion } from "../EntitiesColumnRegion";

describe("EntitiesColumnRegion - FIA-003", () => {
  it("renders correctly inside its region and prevents duplication", () => {
    render(<EntitiesColumnRegion />);
    const region = screen.getByTestId("entities-column-region");
    expect(region).toBeInTheDocument();
  });

  it("contains exactly two contractual sections: Entis and Grupos, both visible and expanded by default", () => {
    render(<EntitiesColumnRegion />);
    expect(screen.getByText("ENTIS")).toBeInTheDocument();
    expect(screen.getByText("GRUPOS")).toBeInTheDocument();

    // By default they should be expanded (content container is in DOM)
    expect(screen.getByTestId("section-content-entis")).toBeInTheDocument();
    expect(screen.getByTestId("section-content-grupos")).toBeInTheDocument();
  });

  it("allows collapsing and expanding Entis without side effects", () => {
    render(<EntitiesColumnRegion />);
    const header = screen.getByTestId("section-header-entis");

    // Default is open
    expect(screen.getByTestId("section-content-entis")).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(header);
    expect(
      screen.queryByTestId("section-content-entis"),
    ).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(header);
    expect(screen.getByTestId("section-content-entis")).toBeInTheDocument();
  });

  it("allows collapsing and expanding Grupos without side effects", () => {
    render(<EntitiesColumnRegion />);
    const header = screen.getByTestId("section-header-grupos");

    expect(screen.getByTestId("section-content-grupos")).toBeInTheDocument();

    fireEvent.click(header);
    expect(
      screen.queryByTestId("section-content-grupos"),
    ).not.toBeInTheDocument();

    fireEvent.click(header);
    expect(screen.getByTestId("section-content-grupos")).toBeInTheDocument();
  });

  it("keeps both sections visible even in empty state", () => {
    render(<EntitiesColumnRegion entis={[]} grupos={[]} />);
    expect(screen.getByText("ENTIS")).toBeInTheDocument();
    expect(screen.getByText("GRUPOS")).toBeInTheDocument();
    expect(screen.getByTestId("section-content-entis")).toBeEmptyDOMElement();
    expect(screen.getByTestId("section-content-grupos")).toBeEmptyDOMElement();
  });

  it("renders fixture items as purely presentational elements", () => {
    const mockEntis = [{ id: "e1", name: "Enti 1" }];
    const mockGrupos = [{ id: "g1", name: "Grupo 1" }];

    render(<EntitiesColumnRegion entis={mockEntis} grupos={mockGrupos} />);

    expect(screen.getByTestId("enti-item-e1")).toHaveTextContent("Enti 1");
    expect(screen.getByTestId("grupo-item-g1")).toHaveTextContent("Grupo 1");
  });

  it("ensures + controls do not trigger section collapse (no side effects)", () => {
    render(<EntitiesColumnRegion />);
    const btnEnti = screen.getByTestId("btn-create-enti");

    fireEvent.click(btnEnti);
    // Should still be expanded
    expect(screen.getByTestId("section-content-entis")).toBeInTheDocument();
  });

  it("ensures there are no Chats embedded within the column", () => {
    render(<EntitiesColumnRegion />);
    const region = screen.getByTestId("entities-column-region");
    // Ensure "Chat" is not part of the HTML or text inside the region
    expect(region.innerHTML).not.toMatch(/chat/i);
  });
});
