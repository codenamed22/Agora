import { render, screen } from "@testing-library/react";
import type { Session } from "next-auth";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../auth", () => ({
  auth: vi.fn(),
  signOut: vi.fn(),
}));

import AccountBar from "../../../app/account-bar";

function makeSession(role: "ADMIN" | "MEMBER"): Session {
  return {
    user: { id: "u1", role, status: "ACTIVE", name: "Test", email: "test@example.com" },
    expires: "2999-01-01T00:00:00.000Z",
  } as Session;
}

describe("AccountBar", () => {
  it("shows the Join link when there is no session", async () => {
    const ui = await AccountBar({ session: null });
    render(ui);

    expect(screen.getByRole("link", { name: "Join" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
  });

  it("shows member navigation without the Admin link", async () => {
    const ui = await AccountBar({ session: makeSession("MEMBER") });
    render(ui);

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Masterclass" })).toHaveAttribute(
      "href",
      "/masterclass",
    );
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("shows admin links for admins", async () => {
    const ui = await AccountBar({ session: makeSession("ADMIN") });
    render(ui);

    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute(
      "href",
      "/admin/applications",
    );
    expect(screen.getByRole("link", { name: "Masterclass" })).toHaveAttribute(
      "href",
      "/masterclass",
    );
  });
});
