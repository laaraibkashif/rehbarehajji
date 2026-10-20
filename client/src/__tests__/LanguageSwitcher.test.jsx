import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

// ── Mock i18n with reactive language getter ──
const mockChangeLanguage = vi.fn();
let currentLanguage = "en";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key,
    i18n: {
      changeLanguage: (code) => {
        currentLanguage = code;
        mockChangeLanguage(code);
      },
      get language() {
        return currentLanguage;
      },
    },
  }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: null, logout: vi.fn(), loading: false }),
}));

vi.mock("../components/Alert", () => ({
  useAlert: () => ({ addAlert: vi.fn() }),
}));

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  },
}));

import { Navbar } from "../App";

// ── Helper: find a dropdown option button by its accessible name ──
// Uses closest(".absolute") to scope queries to dropdown containers only,
// avoiding the language toggle button whose label text could also match.
function findDropdownOption(text) {
  const dropdowns = screen
    .getAllByRole("button")
    .reduce((acc, btn) => {
      const parent = btn.closest(".absolute");
      if (parent && !acc.includes(parent)) acc.push(parent);
      return acc;
    }, []);

  for (const dd of dropdowns) {
    const btn = within(dd).queryByRole("button", { name: text });
    if (btn) return btn;
  }
  return null;
}

describe("Language Switcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentLanguage = "en";
  });

  test("renders the language switcher button", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const langButtons = screen.getAllByRole("button");
    expect(langButtons.length).toBeGreaterThan(0);
  });

  test("changes language when a language option is clicked", async () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    // Open the language dropdown
    const buttons = screen.getAllByRole("button");
    const langToggles = buttons.filter(
      (btn) => btn.querySelector("svg") && !btn.textContent?.includes("Logout")
    );
    expect(langToggles.length).toBeGreaterThan(0);
    fireEvent.click(langToggles[0]);

    // Click Arabic option
    await waitFor(() => {
      const arabicOption = findDropdownOption("العربية");
      expect(arabicOption).toBeTruthy();
      fireEvent.click(arabicOption);
    });

    expect(mockChangeLanguage).toHaveBeenCalledWith("ar");
  });

  test("desktop nav shows three language options in dropdown", async () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const buttons = screen.getAllByRole("button");
    const langToggles = buttons.filter(
      (btn) => btn.querySelector("svg") && !btn.textContent?.includes("Logout")
    );
    expect(langToggles.length).toBeGreaterThan(0);
    fireEvent.click(langToggles[0]);

    await waitFor(() => {
      expect(findDropdownOption("English")).toBeTruthy();
      expect(findDropdownOption("العربية")).toBeTruthy();
      expect(findDropdownOption("اردو")).toBeTruthy();
    });
  });

  test("switches to Urdu and triggers language change", async () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const buttons = screen.getAllByRole("button");
    const langToggles = buttons.filter(
      (btn) => btn.querySelector("svg") && !btn.textContent?.includes("Logout")
    );
    expect(langToggles.length).toBeGreaterThan(0);
    fireEvent.click(langToggles[0]);

    await waitFor(() => {
      const urduOption = findDropdownOption("اردو");
      expect(urduOption).toBeTruthy();
      fireEvent.click(urduOption);
    });

    expect(mockChangeLanguage).toHaveBeenCalledWith("ur");
  });

  test("switches back to English from a different language", async () => {
    // Start from Urdu so the toggle label shows "اردو", not "English"
    // This avoids accessible-name collision with the English dropdown option
    currentLanguage = "ur";

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const buttons = screen.getAllByRole("button");
    const langToggles = buttons.filter(
      (btn) => btn.querySelector("svg") && !btn.textContent?.includes("Logout")
    );
    expect(langToggles.length).toBeGreaterThan(0);
    fireEvent.click(langToggles[0]);

    await waitFor(() => {
      const englishOption = findDropdownOption("English");
      expect(englishOption).toBeTruthy();
      fireEvent.click(englishOption);
    });

    expect(mockChangeLanguage).toHaveBeenCalledWith("en");
  });
});
