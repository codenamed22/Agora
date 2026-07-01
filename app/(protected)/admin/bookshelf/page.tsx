import { requireAdmin } from "../../../../lib/auth/admin";
import { prisma } from "../../../../lib/prisma";
import { deleteResource } from "../../../../lib/bookshelf/actions";
import DeleteForm from "../../../../components/bookshelf/delete-form";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams?: {
    success?: string;
    error?: string;
  };
}

export default async function BookshelfAdminDashboard({ searchParams }: DashboardPageProps) {
  await requireAdmin();

  const resources = await prisma.resource.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: {
        select: { name: true },
      },
      recommendedBy: {
        select: { name: true },
      },
    },
  });

  return (
    <main className="app-shell wide-card">
      <section className="app-card">
        <p className="section-label">Admin</p>
        <h1>Bookshelf management.</h1>
        <p>Manage all curations and learning resources shared in the ShardUp community.</p>

        {/* Success/Error Alerts */}
        {searchParams?.success === "resource-created" ? (
          <p className="form-message">Resource successfully created!</p>
        ) : null}
        {searchParams?.success === "resource-updated" ? (
          <p className="form-message">Resource successfully updated!</p>
        ) : null}
        {searchParams?.success === "resource-deleted" ? (
          <p className="form-message">Resource successfully deleted.</p>
        ) : null}
        {searchParams?.error === "invalid-id" ? (
          <p className="form-message error">Failed to execute action: Invalid Resource ID.</p>
        ) : null}

        {/* Quick Actions Bar */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", margin: "28px 0" }}>
          <a href="/admin/bookshelf/new" className="button" style={{ textDecoration: "none" }}>
            Create Resource
          </a>
          <a
            href="/admin/bookshelf/categories"
            className="secondary-button"
            style={{ textDecoration: "none" }}
          >
            Manage Categories
          </a>
        </div>

        {/* Resource List */}
        <div style={{ marginTop: "20px" }}>
          <h2
            style={{
              fontSize: "1.5rem",
              marginBottom: "18px",
              borderBottom: "1px solid var(--line)",
              paddingBottom: "8px",
            }}
          >
            Curated Resources
          </h2>

          {resources.length === 0 ? (
            <p>No resources found in the Bookshelf yet.</p>
          ) : (
            <div className="application-list">
              {resources.map((resource) => (
                <article
                  className="application-row"
                  key={resource.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "250px" }}>
                    <h3 style={{ margin: "0 0 6px", fontSize: "1.25rem" }}>{resource.title}</h3>
                    <p
                      style={{
                        margin: "0",
                        fontSize: "0.9rem",
                        color: "var(--muted)",
                        lineHeight: "1.4",
                      }}
                    >
                      <strong>Category:</strong> {resource.category.name} &bull;{" "}
                      <strong>Type:</strong> {resource.type.replace("_", " ")}
                      <br />
                      <strong>Recommended By:</strong> {resource.recommendedBy?.name ?? "Unknown"}{" "}
                      &bull; <strong>Added:</strong>{" "}
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <a
                      href={`/bookshelf/resource/${resource.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="secondary-button"
                      style={{ fontSize: "0.9rem", padding: "6px 12px" }}
                    >
                      View
                    </a>
                    <a
                      href={`/admin/bookshelf/${resource.id}/edit`}
                      className="secondary-button"
                      style={{ fontSize: "0.9rem", padding: "6px 12px" }}
                    >
                      Edit
                    </a>
                    <DeleteForm
                      action={deleteResource}
                      confirmMessage="Are you sure you want to delete this resource?"
                      idName="resourceId"
                      idValue={resource.id}
                      buttonText="Delete"
                      buttonStyle={{
                        fontSize: "0.9rem",
                        color: "#d33f2f",
                        cursor: "pointer",
                        padding: "6px 12px",
                      }}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
