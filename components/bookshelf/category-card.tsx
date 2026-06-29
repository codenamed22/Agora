import { CategoryWithCount } from "../../lib/bookshelf/types";

interface CategoryCardProps {
  category: CategoryWithCount;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const count = category._count.resources;
  return (
    <a href={`/bookshelf/${category.slug}`} className="category-card-link">
      <div className="pillar">
        <div style={{ width: "100%" }}>
          <div style={{ fontSize: "1.2rem", marginBottom: "4px" }}>{category.name}</div>
          <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--muted)" }}>
            {count} {count === 1 ? "resource" : "resources"}
          </div>
        </div>
      </div>
    </a>
  );
}
