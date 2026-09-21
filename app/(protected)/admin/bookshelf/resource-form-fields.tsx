import PdfCoverCapture from "../../../../components/bookshelf/pdf-cover-capture";
import { formatBytes } from "../../../../lib/bookshelf/format";
import { RESOURCE_TYPE_VALUES } from "../../../../lib/bookshelf/validators";

const typeLabels: Record<string, string> = {
  BOOK: "Book",
  ARTICLE: "Article",
  COURSE: "Course",
  VIDEO: "Video",
  RESEARCH_PAPER: "Research paper",
};

export default function ResourceFormFields({
  categories,
  defaults,
  pdf,
}: {
  categories: { id: string; name: string }[];
  defaults?: {
    title?: string;
    author?: string | null;
    type?: string;
    categoryId?: string;
    recommendationReason?: string | null;
  };
  pdf?: { url: string; sizeBytes: number | null } | null;
}) {
  return (
    <>
      <label htmlFor="title">Title</label>
      <input id="title" name="title" defaultValue={defaults?.title} required />

      <label htmlFor="author">Author</label>
      <input id="author" name="author" defaultValue={defaults?.author ?? ""} />

      <label htmlFor="type">Type</label>
      <select id="type" name="type" defaultValue={defaults?.type ?? "BOOK"}>
        {RESOURCE_TYPE_VALUES.map((type) => (
          <option key={type} value={type}>
            {typeLabels[type]}
          </option>
        ))}
      </select>

      <label htmlFor="categoryId">Category</label>
      <select id="categoryId" name="categoryId" defaultValue={defaults?.categoryId} required>
        <option value="" disabled>
          Select a category
        </option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <label htmlFor="recommendationReason">Why it&apos;s recommended</label>
      <textarea
        id="recommendationReason"
        name="recommendationReason"
        rows={4}
        defaultValue={defaults?.recommendationReason ?? ""}
      />

      {pdf ? (
        <>
          <span className="badge-group-image badge-image-fallback">PDF</span>
          <small>
            Current PDF: {formatBytes(pdf.sizeBytes)} ·{" "}
            <a href={pdf.url} target="_blank" rel="noopener noreferrer">
              {pdf.url}
            </a>
          </small>
        </>
      ) : null}

      <label htmlFor="pdf">PDF file{pdf ? " (replace)" : ""}</label>
      <input id="pdf" name="pdf" type="file" accept="application/pdf,.pdf" />
      <small>Full PDF, up to 50MB. Stored in Vercel Blob and read in the built-in reader.</small>
      <PdfCoverCapture />
    </>
  );
}
