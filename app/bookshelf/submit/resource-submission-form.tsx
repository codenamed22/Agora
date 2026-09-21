"use client";

import { useState } from "react";
import { submitResource } from "./actions";

type SubmissionType = "BOOK" | "RESEARCH_PAPER";

export default function ResourceSubmissionForm({
  categories,
}: {
  categories: Array<{ id: string; name: string }>;
}) {
  const [type, setType] = useState<SubmissionType>("RESEARCH_PAPER");
  const isPaper = type === "RESEARCH_PAPER";

  return (
    <form action={submitResource} className="stacked-form bookshelf-submission-form">
      <label>
        Resource type
        <select
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value as SubmissionType)}
        >
          <option value="RESEARCH_PAPER">Research paper</option>
          <option value="BOOK">Book</option>
        </select>
      </label>

      <label>
        Title
        <input name="title" required minLength={3} maxLength={160} />
      </label>

      <label>
        Author
        <input name="author" required minLength={2} maxLength={120} />
      </label>

      <label>
        Category
        <select name="categoryId" required defaultValue="">
          <option value="" disabled>
            Select a category
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Why do you recommend it?
        <textarea name="recommendationReason" required minLength={20} maxLength={1000} />
      </label>

      <label>
        {isPaper ? "Open-access PDF URL" : "Book information URL"}
        <input
          name="resourceLink"
          type="url"
          inputMode="url"
          required
          placeholder={isPaper ? "https://example.org/paper.pdf" : "https://example.org/book"}
        />
        <small>
          {isPaper
            ? "Link directly to a legally accessible PDF. Do not submit pirated copies."
            : "Link to the author or publisher page when possible."}
        </small>
      </label>

      {!isPaper ? (
        <label>
          Buy link (optional)
          <input name="buyLink" type="url" inputMode="url" placeholder="https://…" />
        </label>
      ) : null}

      <label>
        Cover or thumbnail URL (optional)
        <input name="imageUrl" type="url" inputMode="url" placeholder="https://…" />
      </label>

      <button className="button" type="submit">
        Submit for review
      </button>
    </form>
  );
}
