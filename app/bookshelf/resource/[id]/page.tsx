import Link from "next/link";
import { notFound } from "next/navigation";
import { getResourceById } from "../../../../lib/bookshelf/queries";
import ResourceDetails from "../../../../components/bookshelf/resource-details";

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

  return (
    <main className="app-shell wide-card">
      <section className="app-card">
        <ResourceDetails resource={resource} />

        <div style={{ marginTop: "36px", borderTop: "1px solid var(--line)", paddingTop: "20px" }}>
          <Link className="text-link" href={`/bookshelf/${resource.category.slug}`}>
            &larr; Back to {resource.category.name}
          </Link>
        </div>
      </section>
    </main>
  );
}
