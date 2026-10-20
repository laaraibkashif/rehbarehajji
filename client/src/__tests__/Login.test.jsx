import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import Login from "../pages/Login";
import "../__tests__/mocks/i18n";

// ── Mocks ──

const mockLogin = vi.fn();
const mockNavigate = vi.fn();
const mockAddAlert = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin, user: null, loading: false }),
}));

vi.mock("../components/Alert", () => ({
  useAlert: () => ({ addAlert: mockAddAlert }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// ── Helper ──

function renderLogin() {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
}

describe("Login Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders the login form with email and password fields", () => {
    renderLogin();

    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  test("shows error message when login fails with invalid credentials", async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: { error: "Invalid email or password." } },
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password.")).toBeInTheDocument();
    });
    expect(mockLogin).toHaveBeenCalledWith("wrong@example.com", "wrongpassword");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("shows fallback error message when no server error provided", async () => {
    mockLogin.mockRejectedValueOnce({
      response: { data: {} },
    });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password.")).toBeInTheDocument();
    });
  });

  test("navigates to dashboard on successful login", async () => {
    mockLogin.mockResolvedValueOnce();

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "correctpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
    expect(mockAddAlert).toHaveBeenCalledWith(
      expect.stringContaining("successful"),
      "success"
    );
  });

  test("disables submit button while submitting", async () => {
    // Don't resolve immediately to keep submitting state
    mockLogin.mockImplementation(() => new Promise(() => {}));

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /logging in/i })).toBeDisabled();
    });
  });

  test("has a link to the registration page", () => {
    renderLogin();

    const createLink = screen.getByRole("link", { name: /create one/i });
    expect(createLink).toBeInTheDocument();
    expect(createLink.getAttribute("href")).toBe("/register");
  });
});
