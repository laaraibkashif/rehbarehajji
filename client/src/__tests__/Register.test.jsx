import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import Register from "../pages/Register";
import "../__tests__/mocks/i18n";

// ── Mocks ──

const mockRegister = vi.fn();
const mockVerifyEmail = vi.fn();
const mockNavigate = vi.fn();
const mockAddAlert = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    register: mockRegister,
    verifyEmail: mockVerifyEmail,
    user: null,
    loading: false,
  }),
}));

vi.mock("../components/Alert", () => ({
  useAlert: () => ({ addAlert: mockAddAlert }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

// ── Helper ──

function renderRegister() {
  return render(
    <BrowserRouter>
      <Register />
    </BrowserRouter>
  );
}

function fillRegistrationForm() {
  fireEvent.change(screen.getByPlaceholderText("Your full name"), {
    target: { value: "Test User" },
  });
  fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
    target: { value: "test@example.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), {
    target: { value: "password123" },
  });
  fireEvent.change(screen.getByPlaceholderText("Repeat your password"), {
    target: { value: "password123" },
  });
}

describe("Register Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders the registration form", () => {
    renderRegister();

    expect(screen.getByText("Create Your Account")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Your full name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("At least 6 characters")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Repeat your password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i })
    ).toBeInTheDocument();
  });

  test("shows 'Account already exists' error on duplicate email", async () => {
    mockRegister.mockRejectedValueOnce({
      response: { data: { error: "Account already exists. Please Login." } },
    });

    renderRegister();
    fillRegistrationForm();
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Account already exists. Please Login.")
      ).toBeInTheDocument();
    });
    expect(mockRegister).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("shows fallback error when no server error details", async () => {
    mockRegister.mockRejectedValueOnce({
      response: { data: {} },
    });

    renderRegister();
    fillRegistrationForm();
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Registration failed. Please try again.")
      ).toBeInTheDocument();
    });
  });

  test("shows password mismatch error", async () => {
    renderRegister();

    fireEvent.change(screen.getByPlaceholderText("Your full name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repeat your password"), {
      target: { value: "differentpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test("transitions to verification step on successful registration", async () => {
    mockRegister.mockResolvedValueOnce();

    renderRegister();
    fillRegistrationForm();
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText("Verify Your Email")).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText("Enter 6-digit code")).toBeInTheDocument();
  });

  test("successful verification navigates to login", async () => {
    // First register successfully
    mockRegister.mockResolvedValueOnce();

    renderRegister();
    fillRegistrationForm();
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    // Wait for verification screen
    await waitFor(() => {
      expect(screen.getByText("Verify Your Email")).toBeInTheDocument();
    });

    // Fill verification code and submit
    fireEvent.change(screen.getByPlaceholderText("Enter 6-digit code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify & continue/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
    expect(mockAddAlert).toHaveBeenCalledWith(
      expect.stringContaining("verified"),
      "success"
    );
  });

  test("has a link to the login page", () => {
    renderRegister();

    const loginLink = screen.getByRole("link", { name: /log in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.getAttribute("href")).toBe("/login");
  });
});
