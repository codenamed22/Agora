import { createBadge } from "./(protected)/admin/badges/actions";
import CompressingImageInput from "./compressing-image-input";

const errors: Record<string, string> = {
  invalid: "Check the badge name and description.",
  image: "Upload a JPG, PNG, or WebP badge image under 2MB.",
  storage: "Badge image storage is not configured yet. Add BLOB_READ_WRITE_TOKEN.",
};

export default function CreateBadgeModal({
  error,
  returnTo,
}: Readonly<{ error?: string; returnTo: string }>) {
  return (
    <div className="modal-backdrop" id="create-badge">
      <section className="badge-create-modal" aria-label="Create a new badge">
        <a className="modal-close" href={returnTo} aria-label="Close">
          x
        </a>
        <h2>Create a new badge</h2>
        {error ? <div className="form-message error">{errors[error] ?? errors.invalid}</div> : null}
        <form action={createBadge} className="stacked-form">
          <input type="hidden" name="returnTo" value={returnTo} />

          <label htmlFor="badge-name">Name*</label>
          <input id="badge-name" name="name" placeholder="Badge name..." required />

          <label htmlFor="badge-description">Description</label>
          <textarea
            id="badge-description"
            name="description"
            placeholder="Why was this badge awarded?"
            rows={4}
          />

          <label htmlFor="badge-image">Badge photo*</label>
          <div className="badge-upload-row">
            <span className="badge-upload-icon">▣</span>
            <div>
              <strong>Badge photo</strong>
              <small>Maximum 2MB</small>
            </div>
            <CompressingImageInput id="badge-image" name="image" />
          </div>
          <small>The photo should be square. Large images are compressed automatically.</small>

          <div className="modal-actions">
            <a className="text-link" href={returnTo}>
              Cancel
            </a>
            <button className="button" type="submit">
              Create Badge Group
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
