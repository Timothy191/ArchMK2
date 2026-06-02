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

jest.mock("next/link", () => ({
  __esModule: true,
  default: jest.fn(
    ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    ),
  ),
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
  AnimatedButton: ({
    children,
    disabled,
    className,
    type,
    onClick,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    className?: string;
    type?: "button" | "submit" | "reset";
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
  }) => (
    <button
      type={type}
      disabled={disabled}
      className={className}
      onClick={onClick}
    >
      {children}
    </button>
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

    expect(
      screen.getByPlaceholderText("e.g., admin@arch.os"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your password"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign/i })).toBeInTheDocument();
  });

  it("submits form and redirects on success", async () => {
    const mockSignIn = jest.fn().mockResolvedValue({ error: null });
    createBrowserSupabaseClient.mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText("e.g., admin@arch.os"), {
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

    fireEvent.change(screen.getByPlaceholderText("e.g., admin@arch.os"), {
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

    fireEvent.change(screen.getByPlaceholderText("e.g., admin@arch.os"), {
      target: { value: "PC-12345" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "testpass" },
    });
    fireEvent.submit(screen.getByTestId("login-form"));

    await waitFor(() => {
      expect(
        screen.getByText(/Network error. Please check your connection/i),
      ).toBeInTheDocument();
    });
  });

  it("disables button while submitting", async () => {
    let resolveSignIn: (_value: { error: null }) => void;
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

    fireEvent.change(screen.getByPlaceholderText("e.g., admin@arch.os"), {
      target: { value: "PC-12345" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "testpass" },
    });
    fireEvent.submit(screen.getByTestId("login-form"));

    // Button should be disabled while loading
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sign/i })).toBeDisabled();
    });

    resolveSignIn!({ error: null });

    // After resolution, button should be enabled
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sign/i })).not.toBeDisabled();
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

    fireEvent.change(screen.getByPlaceholderText("e.g., admin@arch.os"), {
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

  it("toggles password visibility when the eye button is clicked", () => {
    render(<LoginForm />);
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    const toggleButton = screen.getByRole("button", { name: /show password/i });

    expect(passwordInput).toHaveAttribute("type", "password");

    // Click toggle button to show password
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(toggleButton).toHaveAttribute("aria-label", "Hide password");

    // Click toggle button to hide password again
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(toggleButton).toHaveAttribute("aria-label", "Show password");
  });

  it("detects Caps Lock key down and up states", () => {
    render(<LoginForm />);
    const passwordInput = screen.getByPlaceholderText("Enter your password");

    // Press key with CapsLock active
    const keyDownEvent = new KeyboardEvent("keydown", {
      key: "a",
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(keyDownEvent, "getModifierState", {
      value: (key: string) => key === "CapsLock",
    });
    fireEvent(passwordInput, keyDownEvent);

    expect(screen.getByText("Caps Lock is on")).toBeInTheDocument();

    // Release key with CapsLock disabled
    const keyUpEvent = new KeyboardEvent("keyup", {
      key: "a",
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(keyUpEvent, "getModifierState", {
      value: (_key: string) => false,
    });
    fireEvent(passwordInput, keyUpEvent);

    expect(screen.queryByText("Caps Lock is on")).not.toBeInTheDocument();
  });

  it("locks out submission after 5 failed attempts", async () => {
    const mockSignIn = jest.fn().mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    createBrowserSupabaseClient.mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
    });

    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText("e.g., admin@arch.os");
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    const form = screen.getByTestId("login-form");

    fireEvent.change(emailInput, { target: { value: "PC-12345" } });
    fireEvent.change(passwordInput, { target: { value: "wrong" } });

    // Submit 5 times
    for (let i = 0; i < 5; i++) {
      fireEvent.submit(form);
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledTimes(i + 1);
      });
    }

    // Now, failed attempts is 5.
    // Try to submit again
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        screen.getByText("Too many failed attempts. Please wait before trying again.")
      ).toBeInTheDocument();
    });

    // The submit button is disabled
    expect(screen.getByRole("button", { name: /sign/i })).toBeDisabled();
    // signInWithPassword was NOT called a 6th time
    expect(mockSignIn).toHaveBeenCalledTimes(5);
  });

  it("moves Supabase keys to sessionStorage when Remember Me is unchecked", async () => {
    const mockSignIn = jest.fn().mockResolvedValue({ error: null });
    createBrowserSupabaseClient.mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
    });

    // Setup mock stores
    const localStore: Record<string, string> = {
      "sb-access-token": "token-123",
      "sb-refresh-token": "refresh-123",
      "other-key": "other-value",
    };
    const sessionStore: Record<string, string> = {};

    const spyLocalGet = jest.spyOn(Storage.prototype, "getItem").mockImplementation((key) => localStore[key] || null);
    const spyLocalRemove = jest.spyOn(Storage.prototype, "removeItem").mockImplementation((key) => {
      delete localStore[key];
    });
    const spySessionSet = jest.spyOn(Storage.prototype, "setItem").mockImplementation((key, val) => {
      sessionStore[key] = val;
    });

    const localStoreKeys = ["sb-access-token", "sb-refresh-token", "other-key"];
    const originalKeys = Object.keys;
    const spyKeys = jest.spyOn(Object, "keys").mockImplementation((obj) => {
      if (obj === localStorage) return localStoreKeys;
      return originalKeys(obj);
    });

    render(<LoginForm />);

    // Uncheck "Remember Me"
    const checkbox = screen.getByLabelText("Remember me");
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();

    fireEvent.change(screen.getByPlaceholderText("e.g., admin@arch.os"), {
      target: { value: "PC-12345" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "testpass" },
    });
    fireEvent.submit(screen.getByTestId("login-form"));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });

    // Verify tokens were moved to sessionStorage and deleted from localStorage
    expect(sessionStore["sb-access-token"]).toBe("token-123");
    expect(sessionStore["sb-refresh-token"]).toBe("refresh-123");
    expect(localStore["sb-access-token"]).toBeUndefined();
    expect(localStore["sb-refresh-token"]).toBeUndefined();
    // Non-sb keys are untouched
    expect(localStore["other-key"]).toBe("other-value");

    spyLocalGet.mockRestore();
    spyLocalRemove.mockRestore();
    spySessionSet.mockRestore();
    spyKeys.mockRestore();
  });

  it("rejects invalid page redirects (external or static files) and defaults to '/'", async () => {
    const { useSearchParams } = jest.requireMock("next/navigation");
    
    const testRedirect = async (path: string, expectedTarget: string) => {
      useSearchParams.mockReturnValue({
        get: jest.fn((key) => (key === "redirect" ? path : null)),
      });

      const mockSignIn = jest.fn().mockResolvedValue({ error: null });
      createBrowserSupabaseClient.mockReturnValue({
        auth: {
          signInWithPassword: mockSignIn,
        },
      });

      const { unmount } = render(<LoginForm />);

      fireEvent.change(screen.getByPlaceholderText("e.g., admin@arch.os"), {
        target: { value: "PC-12345" },
      });
      fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
        target: { value: "testpass" },
      });
      fireEvent.submit(screen.getByTestId("login-form"));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(expectedTarget);
      });

      unmount();
      jest.clearAllMocks();
    };

    // Test external domain redirect
    await testRedirect("https://malicious.com/dashboard", "/");
    // Test relative double-slash protocol bypass
    await testRedirect("//malicious.com/dashboard", "/");
    // Test static files (css, js, images)
    await testRedirect("/styles.css", "/");
    await testRedirect("/image.png", "/");
    // Test valid pages
    await testRedirect("/drilling/operations", "/drilling/operations");
  });
});
