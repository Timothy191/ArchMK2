import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { GlassCard } from "@repo/ui/GlassCard";

describe("GlassCard", () => {
  it("renders with default variant and children", () => {
    render(<GlassCard>Default Content</GlassCard>);
    expect(screen.getByText("Default Content")).toBeInTheDocument();
  });

  it("renders with window variant and title", () => {
    render(
      <GlassCard variant="window" title="Test Window">
        Window Content
      </GlassCard>,
    );
    expect(screen.getByText("Test Window")).toBeInTheDocument();
    expect(screen.getByText("Window Content")).toBeInTheDocument();
  });

  it("renders spotlight variant and handles mouse movement", () => {
    const { container } = render(
      <GlassCard variant="spotlight">Spotlight Content</GlassCard>,
    );
    expect(screen.getByText("Spotlight Content")).toBeInTheDocument();

    const element = container.firstChild;
    expect(element).toBeInTheDocument();

    if (element) {
      fireEvent.mouseMove(element, { clientX: 100, clientY: 100 });
    }
  });

  it("renders glowborder variant with custom animation duration", () => {
    const { container } = render(
      <GlassCard variant="glowborder" animationDuration={10}>
        GlowBorder Content
      </GlassCard>,
    );
    expect(screen.getByText("GlowBorder Content")).toBeInTheDocument();
    expect(container.firstChild).toBeInTheDocument();
  });
});
