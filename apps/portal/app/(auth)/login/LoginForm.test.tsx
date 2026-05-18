import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { LoginForm } from "./LoginForm";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
}));

jest.mock("@repo/supabase/client", () => ({
  createBrowserSupabaseClient: jest.fn(),
}));

jest.mock("@repo/ui/Input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

jest.mock("@repo/ui/AnimatedButton", () => ({
  AnimatedButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props} />
  ),
}));

const { createBrowserSupabaseClient } = jest.requireMock(
  "@repo/supabase/client",
);
const { useRouter } = jest.requireMock("next/navigation");

describe("LoginForm", () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  it("renders employee ID and password inputs", () => {
    render(<LoginForm />);

    expect(screen.getByPlaceholderText("e.g., admin@plantcor.os")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("submits form and redirects on success", async () => {
    const mockSignIn = jest.fn().mockResolvedValue({ error: null });
    createBrowserSupabaseClient.mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText("e.g., admin@plantcor.os"), {
      target: { value: "PC-12345" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "testpass" },
    });
    fireEvent.submit(screen.getByTestId("login-form"));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        expect.objectContaining({ email: "PC-12345" }),
      );
    });

    expect(mockPush).toHaveBeenCalledWith("/");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("displays error when sign in fails", async () => {
    const mockSignIn = jest.fn().mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    createBrowserSupabaseClient.mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText("e.g., admin@plantcor.os"), {
      target: { value: "PC-12345" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "wrongpass" },
    });
    fireEvent.submit(screen.getByTestId("login-form"));

    await waitFor(() => {
      expect(
        screen.getByText(/Employee ID or password incorrect/i),
      ).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows generic error message for non-invalid-login errors", async () => {
    const mockSignIn = jest.fn().mockResolvedValue({
      error: { message: "Network error" },
    });
    createBrowserSupabaseClient.mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText("e.g., admin@plantcor.os"), {
      target: { value: "PC-12345" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "testpass" },
    });
    fireEvent.submit(screen.getByTestId("login-form"));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("disables button while submitting", async () => {
    let resolveSignIn: (value: { error: null }) => void;
    const signInPromise = new Promise<{ error: null }>((resolve) => {
      resolveSignIn = resolve;
    });

    const mockSignIn = jest.fn().mockReturnValue(signInPromise);
    createBrowserSupabaseClient.mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText("e.g., admin@plantcor.os"), {
      target: { value: "PC-12345" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "testpass" },
    });
    fireEvent.submit(screen.getByTestId("login-form"));

    // Button should be disabled while loading
    await waitFor(() => {
      expect(screen.getByRole("button")).toBeDisabled();
    });

    resolveSignIn!({ error: null });

    // After resolution, button should be enabled
    await waitFor(() => {
      expect(screen.getByRole("button")).not.toBeDisabled();
    });
  });

  it("uses redirect query parameter when present", async () => {
    const { useSearchParams } = jest.requireMock("next/navigation");
    useSearchParams.mockReturnValue({
      get: jest.fn(() => "/dashboard"),
    });

    const mockSignIn = jest.fn().mockResolvedValue({ error: null });
    createBrowserSupabaseClient.mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText("e.g., admin@plantcor.os"), {
      target: { value: "PC-12345" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "testpass" },
    });
    fireEvent.submit(screen.getByTestId("login-form"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });
});
