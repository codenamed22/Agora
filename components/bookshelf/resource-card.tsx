/* eslint-disable @next/next/no-img-element */

export interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    author: string | null;
    type: string;
    resourceLink: string;
    imageUrl: string | null;
    category: {
      name: string;
    };
  };
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <article className={resource.imageUrl ? "resource-card has-resource-image" : "resource-card"}>
      {resource.imageUrl ? (
        <a
          className="resource-image-link"
          href={resource.resourceLink}
          target="_blank"
          rel="noopener noreferrer"
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
          <a
            href={resource.resourceLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {resource.title}
          </a>
        </h2>
        {resource.author ? <p className="resource-author">by {resource.author}</p> : null}
      </div>
    </article>
  );
}
