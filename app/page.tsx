import { auth } from "../auth";
import AccountBar from "./account-bar";

const communityPillars = [
  "Build with peers",
  "Learn from mentors",
  "Share real work",
];

export default async function Home() {
  const session = await auth();
  const primaryAction = session?.user
    ? { href: "/dashboard", label: "Go to dashboard" }
    : { href: "/join", label: "Join the community" };

  return (
    <>
      <AccountBar session={session} />
      <main className="site-shell">
        <section id="top" className="hero">
          <h1>A technical community built on mentorship and real work.</h1>
          <p className="hero-copy">
            ShardUp brings alumni and students together to learn, build, and grow
            through hands-on collaboration and steady feedback.
          </p>
          <div className="hero-actions" aria-label="Primary actions">
            <a className="button" href={primaryAction.href}>
              {primaryAction.label}
            </a>
            <a className="text-link" href="#about">
              Learn more
            </a>
          </div>
        </section>

      <section id="about" className="section about-section">
        <div>
          <p className="section-label">About us</p>
          <h2>Connecting shards of talent into a stronger community.</h2>
        </div>
        <div className="section-copy">
          <p>
            ShardUp is a mentorship-driven technical community. We connect
            students with alumni and peers who care about building strong
            skills, better habits, and real confidence.
          </p>
          <p>
            The focus is simple: learn together, work on meaningful projects,
            and create a culture where people keep showing up for each other.
          </p>
        </div>
      </section>

      <section id="community" className="section community-section">
        <p className="section-label">What we care about</p>
        <div className="pillar-list">
          {communityPillars.map((pillar) => (
            <div className="pillar" key={pillar}>
              {pillar}
            </div>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <p>Built for the ShardUp community.</p>
        <a href="https://www.linkedin.com/company/shardup">LinkedIn</a>
      </footer>
      </main>
    </>
  );
}
