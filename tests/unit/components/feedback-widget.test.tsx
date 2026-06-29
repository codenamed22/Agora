import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FeedbackWidget, { buildFeedbackIssueUrl } from "../../../app/feedback-widget";

describe("FeedbackWidget", () => {
  it("renders the floating feedback button", () => {
    render(<FeedbackWidget />);

    expect(screen.getByRole("button", { name: "Send feedback" })).toBeInTheDocument();
  });

  it("builds a GitHub issue with timestamp, page, and details", () => {
    const issueUrl = buildFeedbackIssueUrl({
      details: "C++ result looked wrong",
      pageUrl: "https://shardup.vercel.app/problems/sum-two-numbers",
      timestamp: "2026-06-24T12:00:00.000Z",
    });

    const url = new URL(issueUrl);

    expect(`${url.origin}${url.pathname}`).toBe("https://github.com/codenamed22/Agora/issues/new");
    expect(url.searchParams.get("title")).toBe("Feedback: C++ result looked wrong");
    expect(url.searchParams.get("labels")).toBe("feedback");
    expect(url.searchParams.get("body")).toContain("Timestamp: 2026-06-24T12:00:00.000Z");
    expect(url.searchParams.get("body")).toContain(
      "Page: https://shardup.vercel.app/problems/sum-two-numbers",
    );
    expect(url.searchParams.get("body")).toContain("C++ result looked wrong");
  });
});
