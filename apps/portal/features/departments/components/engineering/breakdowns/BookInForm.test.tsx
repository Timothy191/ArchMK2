import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BookInForm } from "./BookInForm";
import type { Breakdown } from "./types";

jest.mock("./actions", () => ({
  createBreakdown: jest.fn(),
}));

jest.mock("@repo/utils", () => ({
  triggerWorkflow: jest.fn(),
}));

const { createBreakdown } = jest.requireMock("./actions");

const ACTIVE_BREAKDOWN: Breakdown = {
  id: "bd-1",
  department_id: "dept-eng",
  fleet_id: "FL-001",
  machine_type: "Excavator",
  date_in: "2026-05-17",
  time_in: "08:00",
  date_out: null,
  time_out: null,
  reason: "Hydraulic failure",
  repair_notes: null,
  status: "active",
  missing_book_in: false,
  created_by: "emp-1",
  completed_by: null,
  deleted_at: null,
  created_at: "2026-05-17T08:00:00Z",
  updated_at: "2026-05-17T08:00:00Z",
};

describe("BookInForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createBreakdown.mockResolvedValue(undefined);
  });

  it("renders form fields and register button", () => {
    render(<BookInForm departmentId="dept-eng" activeBreakdowns={[]} />);

    expect(screen.getByPlaceholderText(/FL-123/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Machine Type/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe the issue/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Register Breakdown/i }),
    ).toBeInTheDocument();
  });

  it("shows 'No active breakdowns' when activeBreakdowns is empty", () => {
    render(<BookInForm departmentId="dept-eng" activeBreakdowns={[]} />);
    expect(screen.getByText(/No active breakdowns/i)).toBeInTheDocument();
  });

  it("renders active breakdowns in the table", () => {
    render(
      <BookInForm
        departmentId="dept-eng"
        activeBreakdowns={[ACTIVE_BREAKDOWN]}
      />,
    );

    expect(screen.getByText("FL-001")).toBeInTheDocument();
    expect(screen.getAllByText("Excavator").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Hydraulic failure")).toBeInTheDocument();
  });

  it("shows count of active breakdowns", () => {
    render(
      <BookInForm
        departmentId="dept-eng"
        activeBreakdowns={[ACTIVE_BREAKDOWN]}
      />,
    );
    expect(screen.getByText("1 machines")).toBeInTheDocument();
  });

  it("shows error when fleet ID is empty on submit", async () => {
    render(<BookInForm departmentId="dept-eng" activeBreakdowns={[]} />);

    fireEvent.submit(screen.getByRole("button", { name: /Register Breakdown/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Fleet ID is required")).toBeInTheDocument();
    });
    expect(createBreakdown).not.toHaveBeenCalled();
  });

  it("shows error when machine type is not selected", async () => {
    render(<BookInForm departmentId="dept-eng" activeBreakdowns={[]} />);

    fireEvent.change(screen.getByPlaceholderText(/FL-123/), {
      target: { value: "FL-200" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /Register Breakdown/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Machine type is required")).toBeInTheDocument();
    });
    expect(createBreakdown).not.toHaveBeenCalled();
  });

  it("shows error when reason is too short", async () => {
    render(<BookInForm departmentId="dept-eng" activeBreakdowns={[]} />);

    fireEvent.change(screen.getByPlaceholderText(/FL-123/), {
      target: { value: "FL-200" },
    });
    fireEvent.change(screen.getByLabelText(/Machine Type/i), {
      target: { value: "Excavator" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Describe the issue/i), {
      target: { value: "hi" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Register Breakdown/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Reason must be at least 5 characters"),
      ).toBeInTheDocument();
    });
  });

  it("submits successfully and shows success message", async () => {
    render(<BookInForm departmentId="dept-eng" activeBreakdowns={[]} />);

    fireEvent.change(screen.getByPlaceholderText(/FL-123/), {
      target: { value: "FL-200" },
    });
    fireEvent.change(screen.getByLabelText(/Machine Type/i), {
      target: { value: "Excavator" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Describe the issue/i), {
      target: { value: "Hydraulic pump failure" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Register Breakdown/i }));

    await waitFor(() => {
      expect(createBreakdown).toHaveBeenCalledWith(
        "dept-eng",
        expect.objectContaining({
          fleet_id: "FL-200",
          machine_type: "Excavator",
          reason: "Hydraulic pump failure",
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText("Machine registered successfully!"),
      ).toBeInTheDocument();
    });
  });

  it("shows error message when createBreakdown throws", async () => {
    createBreakdown.mockRejectedValueOnce(new Error("DB error"));

    render(<BookInForm departmentId="dept-eng" activeBreakdowns={[]} />);

    fireEvent.change(screen.getByPlaceholderText(/FL-123/), {
      target: { value: "FL-200" },
    });
    fireEvent.change(screen.getByLabelText(/Machine Type/i), {
      target: { value: "Excavator" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Describe the issue/i), {
      target: { value: "Hydraulic pump failure" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Register Breakdown/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to register breakdown."),
      ).toBeInTheDocument();
    });
  });
});
