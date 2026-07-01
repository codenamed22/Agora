import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getPaginatedCategoryResources } from "../../../lib/bookshelf/queries";
import CategoryHeader from "../../../components/bookshelf/category-header";
import ResourceCard from "../../../components/bookshelf/resource-card";
import BookshelfSearch from "../../../components/bookshelf/bookshelf-search";
import BookshelfFilters from "../../../components/bookshelf/bookshelf-filters";
import BookshelfSort from "../../../components/bookshelf/bookshelf-sort";
import Pagination from "../../../components/bookshelf/pagination";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: {
    category: string;
  };
  searchParams?: {
    q?: string;
    type?: string;
    sort?: string;
    page?: string;
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category: slug } = params;

  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const q = searchParams?.q;
  const type = searchParams?.type;
  const sort = searchParams?.sort;
  const page = searchParams?.page;

  const isFiltered = Boolean(q || type || sort);

  // Fetch paginated resources and counts scoped to category directly from DB
  const { resources, total, totalPages, currentPage } = await getPaginatedCategoryResources(slug, {
    q,
    type,
    sort,
    page,
  });

  return (
    <main className="app-shell wide-card">
      <section className="app-card">
        <CategoryHeader name={category.name} count={category._count.resources} />

        {/* Interactive Search Panel */}
        <BookshelfSearch />

        {/* Type Filters & Sorting Controls */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--line)",
            paddingBottom: "8px",
            marginBottom: "28px",
          }}
        >
          <BookshelfFilters />
          <BookshelfSort />
        </div>

        {/* Dynamic Resource Count Header */}
        {total > 0 ? (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "18px" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--muted)", fontWeight: "bold" }}>
              {isFiltered
                ? `Showing ${resources.length} of ${total} Resources (Total: ${category._count.resources})`
                : `${total} Curated Resources`}
            </span>
          </div>
        ) : null}

        {/* Resources Grid / Empty States */}
        {resources.length > 0 ? (
          <>
            <div className="resource-grid">
              {resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </>
        ) : (
          /* Polished Empty State Block */
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
              No resources found in this category matching your filters.
            </h3>
            <p style={{ margin: "0 0 24px", color: "var(--muted)", fontSize: "1rem" }}>
              Try adjusting your query, select type, or reset filters to see all category
              recommendations.
            </p>
            <div style={{ display: "flex", gap: "14px", justifyContent: "center" }}>
              <Link
                href={`/bookshelf/${slug}`}
                className="button"
                style={{
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  minHeight: "38px",
                  padding: "0 18px",
                }}
              >
                Clear Filters
              </Link>
              <Link
                href="/bookshelf"
                className="secondary-button"
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
