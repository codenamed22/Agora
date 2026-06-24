/* eslint-disable @next/next/no-img-element */
import { ResourceWithRelations } from "../../lib/bookshelf/queries";

interface ResourceCardProps {
  resource: ResourceWithRelations;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <article className={resource.imageUrl ? "resource-card has-resource-image" : "resource-card"}>
      {resource.imageUrl ? (
        <a
          className="resource-image-link"
          href={resource.resourceLink}
          target="_blank"
          rel="noreferrer"
        >
          <img className="resource-image" src={resource.imageUrl} alt="" />
        </a>
      ) : null}
      <div className="resource-card-content">
        <div className="resource-meta-tags">
          <span className="resource-category-tag">{resource.category.name}</span>
          <span className="resource-type-badge">{resource.type.replace("_", " ")}</span>
        </div>
        <h2>
          <a href={resource.resourceLink} target="_blank" rel="noreferrer">
            {resource.title}
          </a>
        </h2>
        {resource.author ? <p className="resource-author">by {resource.author}</p> : null}
      </div>
      <div className="resource-card-actions">
        <a
          className="secondary-button"
          href={resource.resourceLink}
          target="_blank"
          rel="noreferrer"
        >
          Open Resource
        </a>
      </div>
    </article>
  );
}
