interface CategoryHeaderProps {
  name: string;
  count: number;
}

export default function CategoryHeader({ name, count }: CategoryHeaderProps) {
  return (
    <header className="category-header" style={{ marginBottom: "32px" }}>
      <p className="section-label">Bookshelf &rsaquo; {name}</p>
      <h1 style={{ marginTop: "8px", marginBottom: "12px" }}>{name}</h1>
      <p className="category-desc" style={{ margin: "0", color: "var(--muted)" }}>
        Curated collection containing {count}{" "}
        {count === 1 ? "learning resource" : "learning resources"}.
      </p>
    </header>
  );
}
