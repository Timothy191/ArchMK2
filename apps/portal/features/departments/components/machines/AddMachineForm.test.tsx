import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddMachineForm } from "./AddMachineForm";

jest.mock("~/lib/machines", () => ({
  addMachine: jest.fn(),
}));

jest.mock("@repo/ui/SecondaryButton", () => ({
  SecondaryButton: ({
    children,
    onClick,
    type,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    type?: "submit" | "button";
    disabled?: boolean;
  }) => (
    <button type={type ?? "button"} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

jest.mock("@repo/ui/Input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

const { addMachine } = jest.requireMock("~/lib/machines");

describe("AddMachineForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Add Machine button in closed state", () => {
    render(<AddMachineForm departmentId="dept-1" />);
    expect(
      screen.getByRole("button", { name: /Add Machine/i }),
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Haul Truck 3/i)).not.toBeInTheDocument();
  });

  it("opens form when Add Machine button is clicked", () => {
    render(<AddMachineForm departmentId="dept-1" />);
    fireEvent.click(screen.getByRole("button", { name: /\+ Add Machine/i }));
    expect(screen.getByPlaceholderText(/Haul Truck 3/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/dump_truck/i)).toBeInTheDocument();
  });

  it("closes form when Cancel is clicked", () => {
    render(<AddMachineForm departmentId="dept-1" />);
    fireEvent.click(screen.getByRole("button", { name: /\+ Add Machine/i }));
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(screen.queryByPlaceholderText(/Haul Truck 3/i)).not.toBeInTheDocument();
  });

  it("shows Bin Factor field when machine type is a dumper type", () => {
    render(<AddMachineForm departmentId="dept-1" />);
    fireEvent.click(screen.getByRole("button", { name: /\+ Add Machine/i }));

    const typeInput = screen.getByPlaceholderText(/dump_truck/i);
    fireEvent.change(typeInput, { target: { value: "rigid dumper" } });

    expect(screen.getByPlaceholderText(/25\.5/i)).toBeInTheDocument();
    expect(screen.getByText(/Bank Cubic Meters/i)).toBeInTheDocument();
  });

  it("does not show Bin Factor field for non-dumper types", () => {
    render(<AddMachineForm departmentId="dept-1" />);
    fireEvent.click(screen.getByRole("button", { name: /\+ Add Machine/i }));

    const typeInput = screen.getByPlaceholderText(/dump_truck/i);
    fireEvent.change(typeInput, { target: { value: "excavator" } });

    expect(screen.queryByPlaceholderText(/25\.5/i)).not.toBeInTheDocument();
  });

  it("calls addMachine with form data on success", async () => {
    addMachine.mockResolvedValue({ success: true });

    render(<AddMachineForm departmentId="dept-99" />);
    fireEvent.click(screen.getByRole("button", { name: /\+ Add Machine/i }));

    const nameInput = screen.getByPlaceholderText(/Haul Truck 3/i);
    fireEvent.change(nameInput, { target: { value: "Excavator A" } });

    const typeInput = screen.getByPlaceholderText(/dump_truck/i);
    fireEvent.change(typeInput, { target: { value: "excavator" } });

    fireEvent.submit(screen.getByRole("button", { name: /^Add Machine$/i }).closest("form")!);

    await waitFor(() => {
      expect(addMachine).toHaveBeenCalledTimes(1);
    });
  });

  it("displays error message when addMachine returns an error", async () => {
    addMachine.mockResolvedValue({ error: "Missing required fields" });

    render(<AddMachineForm departmentId="dept-1" />);
    fireEvent.click(screen.getByRole("button", { name: /\+ Add Machine/i }));

    fireEvent.submit(
      screen.getByRole("button", { name: /^Add Machine$/i }).closest("form")!,
    );

    await waitFor(() => {
      expect(screen.getByText("Missing required fields")).toBeInTheDocument();
    });
  });

  it("shows 'Adding...' while submitting", async () => {
    let resolve: (v: { success: boolean }) => void;
    addMachine.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );

    render(<AddMachineForm departmentId="dept-1" />);
    fireEvent.click(screen.getByRole("button", { name: /\+ Add Machine/i }));
    fireEvent.submit(
      screen.getByRole("button", { name: /^Add Machine$/i }).closest("form")!,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Adding\.\.\./i })).toBeDisabled();
    });

    resolve!({ success: true });
  });
});
