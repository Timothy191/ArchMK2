import { render, screen, fireEvent } from "@testing-library/react";
import { LoginCardShell } from "./LoginCardShell";

jest.mock("@/hooks/useFocusMode", () => ({
  useFocusMode: jest.fn((selector) => selector({ enabled: false })),
}));

jest.mock("./LiquidGlassCanvas", () => ({
  LiquidGlassCanvas: ({ onInitialized }: { onInitialized?: () => void; focusMode: boolean }) => {
    // Expose a button to simulate WebGL initialization in tests
    return (
      <button data-testid="mock-canvas-init" onClick={onInitialized}>
        Init WebGL
      </button>
    );
  },
}));

describe("LoginCardShell", () => {
  it("renders children successfully", () => {
    render(
      <LoginCardShell>
        <div data-testid="test-content">Login Content</div>
      </LoginCardShell>
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
  });

  it("applies the non-WebGL fallback class by default (layer-signin-card)", () => {
    render(
      <LoginCardShell>
        <div>Content</div>
      </LoginCardShell>
    );

    const card = screen.getByTestId("login-card");
    expect(card).toHaveClass("layer-signin-card");
    expect(card).not.toHaveClass("layer-signin-card-webgl");
  });

  it("switches to WebGL class when LiquidGlassCanvas initializes successfully", () => {
    render(
      <LoginCardShell>
        <div>Content</div>
      </LoginCardShell>
    );

    const card = screen.getByTestId("login-card");
    expect(card).toHaveClass("layer-signin-card");

    // fireEvent.click automatically wraps in act()
    fireEvent.click(screen.getByTestId("mock-canvas-init"));

    expect(card).toHaveClass("layer-signin-card-webgl");
    expect(card).not.toHaveClass("layer-signin-card");
  });

  it("renders specular sheen sweep and noise grain overlays", () => {
    render(
      <LoginCardShell>
        <div>Content</div>
      </LoginCardShell>
    );

    const card = screen.getByTestId("login-card");
    
    // Check for the grain overlay layer
    const grainOverlay = card.querySelector(".liquid-grain-overlay");
    expect(grainOverlay).toBeInTheDocument();

    // Check for the sheen sweep layer
    const sheenSweep = card.querySelector(".liquid-sheen-sweep");
    expect(sheenSweep).toBeInTheDocument();
  });
});
