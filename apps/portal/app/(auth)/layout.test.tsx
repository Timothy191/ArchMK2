/* eslint-disable no-console */
import { render } from "@testing-library/react";
import AuthLayout from "./layout";

describe("AuthLayout", () => {
  let originalConsoleError: typeof console.error;

  beforeAll(() => {
    originalConsoleError = console.error;
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it("renders children correctly", () => {
    const { getByText } = render(
      <AuthLayout>
        <div>Test Child</div>
      </AuthLayout>
    );
    expect(getByText("Test Child")).toBeInTheDocument();
  });

  it("applies responsive glass sizing classes to prevent viewport edge overlap on small screens", () => {
    const { container } = render(
      <AuthLayout>
        <div>Test Child</div>
      </AuthLayout>
    );

    const outerContainer = container.firstChild;
    expect(outerContainer).toHaveClass("p-6");
    expect(outerContainer).toHaveClass("lg:p-12");
    expect(outerContainer).toHaveClass("overflow-y-auto");

    const innerContainer = outerContainer?.firstChild;
    expect(innerContainer).toHaveClass("w-full");
    expect(innerContainer).toHaveClass("max-w-md");
  });

  it("suppresses console.error messages containing 'Invalid Refresh Token' or 'Refresh Token Not Found'", () => {
    const mockError = jest.fn();
    console.error = mockError;

    const { unmount } = render(
      <AuthLayout>
        <div>Test Child</div>
      </AuthLayout>
    );

    // Call console.error with suppressed errors
    console.error("Invalid Refresh Token error occurred");
    console.error("Refresh Token Not Found error occurred");
    console.error({ message: "Invalid Refresh Token" });
    console.error({ message: "Refresh Token Not Found" });

    // Call console.error with non-suppressed errors
    console.error("Some other error");
    console.error({ message: "Different error message" });

    expect(mockError).toHaveBeenCalledTimes(2);
    expect(mockError).toHaveBeenNthCalledWith(1, "Some other error");
    expect(mockError).toHaveBeenNthCalledWith(2, { message: "Different error message" });

    // Unmount to clean up
    unmount();
  });

  it("restores original console.error when unmounted", () => {
    const mockError = jest.fn();
    console.error = mockError;

    const { unmount } = render(
      <AuthLayout>
        <div>Test Child</div>
      </AuthLayout>
    );

    expect(console.error).not.toBe(mockError);

    unmount();

    expect(console.error).toBe(mockError);
  });
});
