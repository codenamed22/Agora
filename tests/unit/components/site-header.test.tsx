import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SiteHeader from "../../../app/site-header";

describe("SiteHeader", () => {
  it("renders the brand and primary nav links", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: "ShardUp home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Community" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Events" })).toHaveAttribute("href", "/events");
    expect(screen.getByRole("link", { name: "Practice" })).toHaveAttribute("href", "/problems");
  });

  it("shows the Join link by default", () => {
    render(<SiteHeader />);

    expect(screen.getByRole("link", { name: "Join" })).toHaveAttribute("href", "/join");
  });

  it("replaces the default action with provided children", () => {
    render(
      <SiteHeader>
        <a href="/dashboard">Dashboard</a>
      </SiteHeader>,
    );

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Join" })).not.toBeInTheDocument();
  });
});
