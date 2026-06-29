/* eslint-disable @next/next/no-img-element */
import { ResourceWithRelations } from "../../lib/bookshelf/types";

interface ResourceCardProps {
  resource: ResourceWithRelations;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <article className={resource.imageUrl ? "resource-card has-resource-image" : "resource-card"}>
      {resource.imageUrl ? (
        <a className="resource-image-link" href={`/bookshelf/resource/${resource.id}`}>
          <img className="resource-image" src={resource.imageUrl} alt="" />
        </a>
      ) : null}
      <div className="resource-card-content">
        <div className="resource-meta-tags">
          <a href={`/bookshelf/${resource.category.slug}`} className="resource-category-tag">
            {resource.category.name}
          </a>
          <span className="resource-type-badge">{resource.type.replace("_", " ")}</span>
        </div>
        <h2>
          <a href={`/bookshelf/resource/${resource.id}`}>{resource.title}</a>
        </h2>
        {resource.author ? <p className="resource-author">by {resource.author}</p> : null}
        
        {resource.recommendedBy ? (
          <div className="resource-recommender">
            {resource.recommendedBy.image ? (
              <img
                className="recommender-avatar"
                src={resource.recommendedBy.image}
                alt=""
              />
            ) : (
              <div className="recommender-avatar-fallback" />
            )}
            <span>Recommended by {resource.recommendedBy.name}</span>
          </div>
        ) : null}
      </div>
      <div className="resource-card-actions">
        <a className="secondary-button" href={`/bookshelf/resource/${resource.id}`}>
          Details
        </a>
      </div>
    </article>
  );
}
