/* eslint-disable @next/next/no-img-element */
import { ResourceWithRelations } from "../../lib/bookshelf/types";

interface ResourceDetailsProps {
  resource: ResourceWithRelations;
}

export default function ResourceDetails({ resource }: ResourceDetailsProps) {
  return (
    <article className="resource-details">
      <p className="section-label">
        Bookshelf &rsaquo;{" "}
        <a href={`/bookshelf/${resource.category.slug}`} className="text-link">
          {resource.category.name}
        </a>{" "}
        &rsaquo; Details
      </p>
      <h1 style={{ marginBottom: "28px" }}>{resource.title}</h1>
      
      <div className="resource-detail-grid">
        {resource.imageUrl ? (
          <div className="resource-detail-image-container">
            <img className="resource-detail-image" src={resource.imageUrl} alt={resource.title} />
          </div>
        ) : null}
        
        <div className="resource-detail-info">
          <div className="resource-detail-meta-box">
            <p>
              <span>Type</span>
              {resource.type.replace("_", " ")}
            </p>
            {resource.author ? (
              <p>
                <span>Author</span>
                {resource.author}
              </p>
            ) : null}
            <p>
              <span>Category</span>
              <a className="text-link" href={`/bookshelf/${resource.category.slug}`}>
                {resource.category.name}
              </a>
            </p>
          </div>

          {resource.recommendedBy ? (
            <div className="resource-recommender-detail">
              <span className="recommender-detail-label">Recommended By</span>
              <div className="recommender-profile-box">
                {resource.recommendedBy.image ? (
                  <img
                    className="recommender-avatar-large"
                    src={resource.recommendedBy.image}
                    alt=""
                  />
                ) : (
                  <div className="recommender-avatar-large-fallback" />
                )}
                <span className="recommender-name">{resource.recommendedBy.name}</span>
              </div>
            </div>
          ) : null}

          {resource.recommendationReason ? (
            <div className="resource-recommendation-reason">
              <h3>Why it&apos;s recommended:</h3>
              <blockquote className="recommendation-quote">
                &ldquo;{resource.recommendationReason}&rdquo;
              </blockquote>
            </div>
          ) : null}

          <div className="resource-action-buttons">
            {resource.resourceLink ? (
              <a
                className="button"
                href={resource.resourceLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Access Resource
              </a>
            ) : null}
            {resource.buyLink ? (
              <a
                className="secondary-button"
                href={resource.buyLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buy Link
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
