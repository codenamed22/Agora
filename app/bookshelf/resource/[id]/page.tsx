import Link from "next/link";
import { notFound } from "next/navigation";
import { getResourceById, getRelatedResources } from "../../../../lib/bookshelf/queries";
import ResourceDetails from "../../../../components/bookshelf/resource-details";
import ResourceCard from "../../../../components/bookshelf/resource-card";

export const dynamic = "force-dynamic";

interface ResourceDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ResourceDetailPage({ params }: ResourceDetailPageProps) {
  const { id } = params;

  const resource = await getResourceById(id);
  if (!resource) {
    notFound();
  }

  // Fetch related resources (scoped to same category, prioritizing same resource type, limit to 3)
  const relatedResources = await getRelatedResources(resource.id, 3);

  return (
    <main className="app-shell wide-card">
      <section className="app-card">
        <ResourceDetails resource={resource} />

        {/* Related Resources Section */}
        {relatedResources.length > 0 ? (
          <div
            style={{ marginTop: "48px", borderTop: "1px solid var(--line)", paddingTop: "32px" }}
          >
            <h2 style={{ fontSize: "1.6rem", margin: "0 0 18px", letterSpacing: "-0.03em" }}>
              Related Resources
            </h2>
            <div className="resource-grid">
              {relatedResources.map((related) => (
                <ResourceCard key={related.id} resource={related} />
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: "36px", borderTop: "1px solid var(--line)", paddingTop: "20px" }}>
          <Link className="text-link" href={`/bookshelf/${resource.category.slug}`}>
            &larr; Back to {resource.category.name}
          </Link>
        </div>
      </section>
    </main>
  );
}
