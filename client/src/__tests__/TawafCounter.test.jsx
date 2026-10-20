import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import "../__tests__/mocks/i18n";

// ── Mocks ──

const mockAddAlert = vi.fn();
let mockCountData = { type: "tawaf", count: 0, lastUpdated: null };

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { _id: "user123", fullName: "Test User" },
    loading: false,
  }),
}));

vi.mock("../components/Alert", () => ({
  useAlert: () => ({ addAlert: mockAddAlert }),
}));

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn().mockImplementation(() => Promise.resolve({ data: mockCountData })),
    post: vi.fn().mockImplementation((url) => {
      // Simulate incrementing count on the server
      mockCountData = { ...mockCountData, count: mockCountData.count + 1 };
      return Promise.resolve({ data: { ...mockCountData } });
    }),
    patch: vi.fn().mockImplementation(() => {
      mockCountData = { ...mockCountData, count: 0 };
      return Promise.resolve({ data: { ...mockCountData } });
    }),
  },
}));

// ── Import after mocks ──
import TawafCounter from "../pages/TawafCounter";

function renderCounter() {
  return render(
    <MemoryRouter>
      <TawafCounter />
    </MemoryRouter>
  );
}

describe("Tawaf Counter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCountData = { type: "tawaf", count: 0, lastUpdated: null };
  });

  test("renders the counter with initial count of 0", async () => {
    renderCounter();

    // Wait for the initial loading to complete
    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    expect(screen.getByText("Tawaf & Sa'i Counter")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tap to count/i })).toBeInTheDocument();
  });

  test("clicking tap button increments the displayed count", async () => {
    renderCounter();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    // Find and click the tap button
    const tapButton = screen.getByRole("button", { name: /tap to count/i });
    fireEvent.click(tapButton);

    // Wait for the count to update
    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  test("count increments multiple times correctly", async () => {
    renderCounter();

    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    const tapButton = screen.getByRole("button", { name: /tap to count/i });

    fireEvent.click(tapButton);
    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    fireEvent.click(tapButton);
    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    fireEvent.click(tapButton);
    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  test("shows completion alert when count reaches 7", async () => {
    mockCountData = { type: "tawaf", count: 6, lastUpdated: new Date() };

    renderCounter();

    await waitFor(() => {
      expect(screen.getByText("6")).toBeInTheDocument();
    });

    const tapButton = screen.getByRole("button", { name: /tap to count/i });
    fireEvent.click(tapButton);

    await waitFor(() => {
      expect(mockAddAlert).toHaveBeenCalledWith(
        expect.stringMatching(/complete/i),
        "success"
      );
    });
  });

  test("resets count to 0 when reset button is clicked", async () => {
    mockCountData = { type: "tawaf", count: 5, lastUpdated: new Date() };

    renderCounter();

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    // Find and click reset button
    const resetButton = screen.getByRole("button", { name: /reset/i });
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  test("toggles between Tawaf and Sa'i modes", async () => {
    renderCounter();

    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    // Find the Sa'i toggle button
    const saiButton = screen.getByRole("button", { name: /sa'i/i });
    fireEvent.click(saiButton);

    // After switching mode, the loadCount uses the new 'sai' mode
    // The count should load from the api (which is currently 0 for new mode)
    // But since we reset mockCountData to 'tawaf', sai will load 0
    // The key test is that the mode toggle works
    await waitFor(() => {
      // The Sa'i button should be visually active (the active class)
      expect(saiButton.className).toContain("text-emerald-700");
    });
  });

  test("undo decrements the count locally", async () => {
    renderCounter();

    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    // Tap a few times
    const tapButton = screen.getByRole("button", { name: /tap to count/i });
    fireEvent.click(tapButton);
    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    // Undo
    const undoButton = screen.getByRole("button", { name: /undo/i });
    fireEvent.click(undoButton);

    // After undo, count should go back to 0
    await waitFor(() => {
      expect(screen.queryByText("1")).not.toBeInTheDocument();
    });
  });
});
