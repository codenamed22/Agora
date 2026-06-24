import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FeedbackWidget, { buildFeedbackMailto } from "../../../app/feedback-widget";

describe("FeedbackWidget", () => {
  it("renders the floating feedback button", () => {
    render(<FeedbackWidget email="team@example.com" />);

    expect(screen.getByRole("button", { name: "Send feedback" })).toBeInTheDocument();
  });

  it("builds a mailto with timestamp, page, and details", () => {
    const mailto = buildFeedbackMailto({
      details: "C++ result looked wrong",
      email: "team@example.com",
      pageUrl: "https://shardup.vercel.app/problems/sum-two-numbers",
      timestamp: "2026-06-24T12:00:00.000Z",
    });

    expect(mailto).toContain("mailto:team@example.com");
    expect(decodeURIComponent(mailto)).toContain("Timestamp: 2026-06-24T12:00:00.000Z");
    expect(decodeURIComponent(mailto)).toContain(
      "Page: https://shardup.vercel.app/problems/sum-two-numbers",
    );
    expect(decodeURIComponent(mailto)).toContain("C++ result looked wrong");
  });
});
