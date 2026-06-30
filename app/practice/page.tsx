import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function PracticeLandingPage() {
  const [boardCount, problemCount] = await Promise.all([
    prisma.board.count(),
    prisma.problem.count({ where: { published: true } }),
  ]);

  return (
    <main className="app-shell wide-card workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Practice</p>
        <h1>Practice at ShardUp</h1>
        <p>Sharpen your skills with collaborative design boards and DSA problems.</p>

        <div className="practice-landing-grid">
          <a className="practice-landing-card" href="/practice/design">
            <h2>Design Boards</h2>
            <p>
              Create and share Excalidraw whiteboards for system design and group projects. Anyone
              at ShardUp can open and learn from them.
            </p>
            <span className="practice-landing-meta">{boardCount} boards created</span>
          </a>

          <a className="practice-landing-card" href="/problems">
            <h2>DSA Practice</h2>
            <p>
              Solve curated data-structures and algorithms problems, submit solutions, and climb the
              leaderboard.
            </p>
            <span className="practice-landing-meta">{problemCount} problems</span>
          </a>
        </div>
      </section>
    </main>
  );
}
