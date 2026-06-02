import { render, screen } from "@testing-library/react";
import { ViewportBoundaries } from "./ViewportBoundaries";
import { useSystemMetrics } from "@/hooks/useSystemMetrics";
import { useSplitWindow } from "@/hooks/useSplitWindow";

jest.mock("@/hooks/useSystemMetrics");
jest.mock("@/hooks/useSplitWindow");

describe("ViewportBoundaries component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSystemMetrics as jest.Mock).mockReturnValue({
      websocketLatency: 25,
      serverTimeSAST: "09:30:15",
      currentShift: {
        shift: "A",
        label: "Shift A",
        start: "06:00",
        end: "14:00",
      },
      online: true,
    });
    (useSplitWindow as unknown as jest.Mock).mockImplementation(
      (selector: any) => selector({ isOpen: false }),
    );
  });

  it("renders shift information HUD", () => {
    render(<ViewportBoundaries />);
    expect(screen.getByTestId("shift-hud")).toBeInTheDocument();
    expect(screen.getByText("09:30:15")).toBeInTheDocument();
    expect(screen.getByText("Shift A")).toBeInTheDocument();
    expect(screen.getByText("(06:00-14:00)")).toBeInTheDocument();
  });

  it("renders latency and network status HUD", () => {
    render(<ViewportBoundaries />);
    expect(screen.getByTestId("latency-hud")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("25 ms")).toBeInTheDocument();
  });

  it("renders offline status when online is false", () => {
    (useSystemMetrics as jest.Mock).mockReturnValue({
      websocketLatency: 0,
      serverTimeSAST: "02:15:00",
      currentShift: {
        shift: "C",
        label: "Shift C",
        start: "22:00",
        end: "06:00",
      },
      online: false,
    });

    render(<ViewportBoundaries />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("should not apply shift class when split window is closed", () => {
    render(<ViewportBoundaries />);
    const hud = screen.getByTestId("latency-hud");
    expect(hud.className).not.toContain("sm:-translate-x-[400px]");
  });

  it("should apply shift class when split window is open", () => {
    (useSplitWindow as unknown as jest.Mock).mockImplementation(
      (selector: any) => selector({ isOpen: true }),
    );
    render(<ViewportBoundaries />);
    const hud = screen.getByTestId("latency-hud");
    expect(hud.className).toContain("sm:-translate-x-[400px]");
  });
});
