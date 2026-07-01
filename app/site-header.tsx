import ThemeToggle from "./theme-toggle";

export default function SiteHeader({
  children,
}: Readonly<{
  children?: React.ReactNode;
}>) {
  return (
    <header className="site-shell site-header" aria-label="Main navigation">
      <a className="brand" href="/" aria-label="ShardUp home">
        ShardUp
      </a>
      <nav className="nav-links">
        <a href="/#about">About</a>
        <a href="/members">Members</a>
        <a href="/events">Events</a>
        <a href="/practice">Practice</a>
        <a href="/contests">Contests</a>
        <a href="/bookshelf">Bookshelf</a>
        {children ?? <a href="/join">Join</a>}
        <ThemeToggle />
      </nav>
    </header>
  );
}
