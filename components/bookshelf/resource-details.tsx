/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ResourceWithRelations } from "../../lib/bookshelf/types";

export default function ResourceDetails({ resource }: { resource: ResourceWithRelations }) {
  /* prettier-ignore */
  const metaStyle = { margin: 0, padding: "14px", border: "1px solid var(--line)", borderTop: "4px solid var(--accent)", background: "var(--surface)", color: "var(--ink)", fontWeight: 800, fontSize: "0.95rem" };
  /* prettier-ignore */
  const spanStyle = { display: "block", marginBottom: "6px", color: "var(--accent)", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase" };

  return (
    <article className="resource-details">
      <p className="section-label">
        Bookshelf &rsaquo;{" "}
        <Link href={`/bookshelf/${resource.category.slug}`} className="text-link">
          {resource.category.name}
        </Link>{" "}
        &rsaquo; Details
      </p>
      <h1 style={{ marginBottom: "28px" }}>{resource.title}</h1>

      <div style={{ display: "flex", gap: "36px", flexWrap: "wrap", marginTop: "24px" }}>
        {resource.imageUrl &&
          /* prettier-ignore */
          <div style={{ width: "300px", border: "1px solid var(--line)", boxShadow: "6px 6px 0 var(--ink)", background: "var(--surface)", height: "fit-content" }}>
            <img style={{ display: "block", width: "100%", height: "auto", objectFit: "contain" }} src={resource.imageUrl} alt={`${resource.title} cover`} />
          </div>}

        <div style={{ flex: "1 1 400px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* prettier-ignore */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px" }}>
            {[
              { label: "Type", val: resource.type.replace("_", " ") },
              resource.author && { label: "Author", val: resource.author },
              { label: "Category", val: <Link className="text-link" href={`/bookshelf/${resource.category.slug}`}>{resource.category.name}</Link> }
            ].map((item, idx) => item && (
              <div key={idx} style={metaStyle}>
                <span style={spanStyle}>{item.label}</span>
                {item.val}
              </div>
            ))}
          </div>

          {resource.recommendedBy && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  letterSpacing: "0.05em",
                }}
              >
                Recommended By
              </span>
              {/* prettier-ignore */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", border: "1px solid var(--line)", background: "var(--surface)", width: "fit-content" }}>
                {resource.recommendedBy.image ? (
                  <img style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--line)" }} src={resource.recommendedBy.image} alt={`${resource.recommendedBy.name}'s profile picture`} />
                ) : (
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--line)" }} />
                )}
                <span style={{ fontWeight: 800, fontSize: "1rem" }}>{resource.recommendedBy.name}</span>
              </div>
            </div>
          )}

          {resource.recommendationReason && (
            <div>
              <h3 style={{ margin: "0 0 8px", fontSize: "1.1rem" }}>Why it&apos;s recommended:</h3>
              {/* prettier-ignore */}
              <blockquote style={{ margin: 0, padding: "16px", borderLeft: "4px solid var(--accent)", background: "var(--surface)", fontStyle: "italic", lineHeight: 1.6, color: "var(--ink)", fontSize: "1.05rem" }}>
                &ldquo;{resource.recommendationReason}&rdquo;
              </blockquote>
            </div>
          )}

          {/* prettier-ignore */}
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "12px" }}>
            {resource.resourceLink && <a className="button" href={resource.resourceLink} target="_blank" rel="noopener noreferrer">Access Resource</a>}
            {resource.buyLink && <a className="secondary-button" href={resource.buyLink} target="_blank" rel="noopener noreferrer">Buy Link</a>}
          </div>
        </div>
      </div>
    </article>
  );
}
