import { getCategories, getPaginatedResources } from "../../lib/bookshelf/queries";
import CategoryCard from "../../components/bookshelf/category-card";
import ResourceCard from "../../components/bookshelf/resource-card";
import BookshelfSearch from "../../components/bookshelf/bookshelf-search";
import BookshelfFilters from "../../components/bookshelf/bookshelf-filters";
import BookshelfSort from "../../components/bookshelf/bookshelf-sort";
import Pagination from "../../components/bookshelf/pagination";

export const dynamic = "force-dynamic";

interface LandingPageProps {
  searchParams?: {
    q?: string;
    type?: string;
    sort?: string;
    page?: string;
  };
}

export default async function BookshelfLandingPage({ searchParams }: LandingPageProps) {
  const categories = await getCategories();

  const q = searchParams?.q;
  const type = searchParams?.type;
  const sort = searchParams?.sort;
  const page = searchParams?.page;

  const isFiltered = Boolean(q || type || sort);

  const { resources, total, totalPages, currentPage } = await getPaginatedResources({
    q,
    type,
    sort,
    page,
  });

  return (
    <main className="app-shell wide-card">
      <section className="app-card">
        <p className="section-label">Bookshelf</p>
        <h1>The ShardUp Bookshelf.</h1>
        <p style={{ margin: "0 0 32px", fontSize: "1.1rem" }}>
          Discover curated books, articles, courses, and learning resources recommended by the ShardUp community.
        </p>

        {/* Interactive Search Panel */}
        <BookshelfSearch />
        
        {/* Type Filters & Sorting Controls */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: "8px", marginBottom: "28px" }}>
          <BookshelfFilters />
          <BookshelfSort />
        </div>

        {/* Popular Categories (Only show if not filtering search results) */}
        {!isFiltered ? (
          <div style={{ marginBottom: "48px" }}>
            <h2 style={{ fontSize: "1.6rem", marginBottom: "18px", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
              Browse by Category
            </h2>
            <div className="category-grid">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))
              ) : (
                <div className="form-message">No categories found.</div>
              )}
            </div>
          </div>
        ) : null}

        {/* Curated Resources List */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--line)", paddingBottom: "8px", marginBottom: "18px" }}>
            <h2 style={{ fontSize: "1.6rem", margin: 0 }}>
              {isFiltered ? "Search Results" : "Recently Added"}
            </h2>
            {total > 0 ? (
              <span style={{ fontSize: "0.9rem", color: "var(--muted)", fontWeight: "bold" }}>
                {isFiltered
                  ? `Showing ${resources.length} of ${total} Resources`
                  : `${total} Resources Curated`}
              </span>
            ) : null}
          </div>

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
                No resources match your filters.
              </h3>
              <p style={{ margin: "0 0 24px", color: "var(--muted)", fontSize: "1rem" }}>
                Try adjusting your search terms or type filters to find what you&apos;re looking for.
              </p>
              <div style={{ display: "flex", gap: "14px", justifyContent: "center" }}>
                <a href="/bookshelf" className="button" style={{ textDecoration: "none", fontSize: "0.9rem", minHeight: "38px", padding: "0 18px" }}>
                  Clear Filters
                </a>
                <a href="/bookshelf" className="secondary-button" style={{ textDecoration: "none", fontSize: "0.9rem", minHeight: "38px", padding: "0 18px" }}>
                  Back to Bookshelf Home
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
