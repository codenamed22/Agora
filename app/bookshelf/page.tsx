import { getCategories, getRecentResources } from "../../lib/bookshelf/queries";
import CategoryCard from "../../components/bookshelf/category-card";
import ResourceCard from "../../components/bookshelf/resource-card";

export const dynamic = "force-dynamic";

export default async function BookshelfLandingPage() {
  const categories = await getCategories();
  const recentResources = await getRecentResources();

  return (
    <main className="app-shell wide-card">
      <section className="app-card">
        <p className="section-label">Bookshelf</p>
        <h1>The ShardUp Bookshelf.</h1>
        <p style={{ margin: "0 0 32px", fontSize: "1.1rem" }}>
          Discover curated books, articles, courses, and learning resources recommended by the ShardUp community.
        </p>

        {/* Browse by Category */}
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

        {/* Recently Added Resources List */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--line)", paddingBottom: "8px", marginBottom: "18px" }}>
            <h2 style={{ fontSize: "1.6rem", margin: 0 }}>Recently Added</h2>
          </div>

          {recentResources.length > 0 ? (
            <div className="resource-grid">
              {recentResources.map((resource) => (
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
                No resources curated yet.
              </h3>
              <p style={{ margin: "0", color: "var(--muted)", fontSize: "1rem" }}>
                Check back later for curated resources.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
