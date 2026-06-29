import { requireAdmin } from "../../../../../lib/auth/admin";
import { prisma } from "../../../../../lib/prisma";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../../../../lib/bookshelf/actions";
import DeleteForm from "../../../../../components/bookshelf/delete-form";

export const dynamic = "force-dynamic";

interface CategoriesPageProps {
  searchParams?: {
    success?: string;
    error?: string;
    editId?: string;
  };
}

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  await requireAdmin();

  // Load all categories with resource count
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { resources: true },
      },
    },
  });

  // Load edit category if editId is provided
  const editId = searchParams?.editId;
  const editCategory = editId
    ? await prisma.category.findUnique({ where: { id: editId } })
    : null;

  // Bind the edit category ID to update action if editing
  const updateCategoryAction = editCategory
    ? updateCategory.bind(null, editCategory.id)
    : null;

  return (
    <main className="app-shell wide-card">
      <section className="app-card">
        <p className="section-label">Admin &rsaquo; Bookshelf</p>
        <h1>Category management.</h1>
        <p>Organize resources into standard curated categories.</p>

        {/* Error / Success Notifications */}
        {searchParams?.success === "category-created" ? (
          <p className="form-message">Category successfully created!</p>
        ) : null}
        {searchParams?.success === "category-updated" ? (
          <p className="form-message">Category successfully updated!</p>
        ) : null}
        {searchParams?.success === "category-deleted" ? (
          <p className="form-message">Category successfully deleted.</p>
        ) : null}
        {searchParams?.error === "validation-failed" ? (
          <p className="form-message error">
            Failed to save category. Make sure the name is not empty and slug contains only lowercase letters, numbers, and dashes.
          </p>
        ) : null}
        {searchParams?.error === "duplicate-name" ? (
          <p className="form-message error">A category with this name already exists.</p>
        ) : null}
        {searchParams?.error === "duplicate-slug" ? (
          <p className="form-message error">A category with this slug already exists.</p>
        ) : null}
        {searchParams?.error === "category-not-empty" ? (
          <p className="form-message error">
            <strong>Cannot delete:</strong> This category contains active resources. You must delete or move all resources in this category before deleting it.
          </p>
        ) : null}

        <div style={{ display: "flex", gap: "10px", margin: "20px 0" }}>
          <a href="/admin/bookshelf" className="secondary-button" style={{ textDecoration: "none" }}>
            &larr; Back to Bookshelf Admin
          </a>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 340px) 1fr",
            gap: "40px",
            marginTop: "32px",
          }}
          className="categories-layout-grid"
        >
          {/* Form Column */}
          <div>
            {editCategory && updateCategoryAction ? (
              <div style={{ border: "1px solid var(--line)", padding: "20px", background: "var(--surface)" }}>
                <h2 style={{ fontSize: "1.3rem", marginTop: "0", marginBottom: "14px" }}>Edit Category</h2>
                <form action={updateCategoryAction} className="stacked-form">
                  <label>
                    Category Name *
                    <input
                      name="name"
                      required
                      type="text"
                      defaultValue={editCategory.name}
                    />
                  </label>
                  <label>
                    Slug *
                    <input
                      name="slug"
                      required
                      type="text"
                      defaultValue={editCategory.slug}
                      placeholder="e.g. system-design"
                    />
                  </label>
                  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <button className="button" type="submit">
                      Save Changes
                    </button>
                    <a href="/admin/bookshelf/categories" className="secondary-button" style={{ textDecoration: "none" }}>
                      Cancel
                    </a>
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ border: "1px solid var(--line)", padding: "20px", background: "var(--surface)" }}>
                <h2 style={{ fontSize: "1.3rem", marginTop: "0", marginBottom: "14px" }}>Create Category</h2>
                <form action={createCategory} className="stacked-form">
                  <label>
                    Category Name *
                    <input
                      name="name"
                      required
                      type="text"
                      placeholder="e.g. System Design"
                    />
                  </label>
                  <label>
                    Slug *
                    <input
                      name="slug"
                      required
                      type="text"
                      placeholder="e.g. system-design"
                    />
                  </label>
                  <button className="button" type="submit" style={{ marginTop: "10px" }}>
                    Create Category
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* List Column */}
          <div>
            <h2 style={{ fontSize: "1.3rem", marginTop: "0", marginBottom: "18px", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
              Existing Categories
            </h2>

            <div className="application-list">
              {categories.map((category: { id: string; name: string; slug: string; _count: { resources: number } }) => (
                <article
                  className="application-row"
                  key={category.id}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "14px 18px" }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "1.15rem" }}>{category.name}</h3>
                    <p style={{ margin: "0", fontSize: "0.85rem", color: "var(--muted)" }}>
                      Slug: <code>{category.slug}</code> &bull; Resources:{" "}
                      <strong>{category._count.resources}</strong>
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <a
                      href={`/admin/bookshelf/categories?editId=${category.id}`}
                      className="secondary-button"
                      style={{ fontSize: "0.85rem", padding: "4px 10px" }}
                    >
                      Edit
                    </a>
                    <DeleteForm
                      action={deleteCategory}
                      confirmMessage={`Are you sure you want to delete category "${category.name}"? This operation cannot be undone.`}
                      idName="categoryId"
                      idValue={category.id}
                      buttonText="Delete"
                      buttonStyle={{
                        fontSize: "0.85rem",
                        color: "#d33f2f",
                        cursor: "pointer",
                        padding: "4px 10px",
                      }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
