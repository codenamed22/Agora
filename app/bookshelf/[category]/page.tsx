import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getResourcesByCategory } from "../../../lib/bookshelf/queries";
import CategoryHeader from "../../../components/bookshelf/category-header";
import ResourceCard from "../../../components/bookshelf/resource-card";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: slug } = params;

  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const resources = await getResourcesByCategory(slug);

  return (
    <main className="app-shell wide-card">
      <section className="app-card">
        <CategoryHeader name={category.name} count={resources.length} />

        {resources.length > 0 ? (
          <div className="resource-grid">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <div
            style={{
              border: "1px solid var(--line)",
              background: "var(--surface)",
              padding: "40px 20px",
              textAlign: "center",
              marginTop: "24px",
            }}
          >
            <h3 style={{ fontSize: "1.4rem", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
              No resources found.
            </h3>
            <p style={{ margin: "0 0 24px", color: "var(--muted)", fontSize: "1rem" }}>
              There are no resources in this category yet.
            </p>
            <div style={{ display: "flex", gap: "14px", justifyContent: "center" }}>
              <Link
                href="/bookshelf"
                className="button"
                style={{
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  minHeight: "38px",
                  padding: "0 18px",
                }}
              >
                Back to Bookshelf Home
              </Link>
            </div>
          </div>
        )}

        <div style={{ marginTop: "36px" }}>
          <Link className="text-link" href="/bookshelf">
            &larr; Back to Bookshelf
          </Link>
        </div>
      </section>
    </main>
  );
}
