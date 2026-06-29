/* eslint-disable @next/next/no-img-element */

import { Role, UserStatus } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import CompressingImageInput from "../../../compressing-image-input";
import { auth } from "../../../../auth";
import { batchYears, memberDisplayName, memberInitials } from "../../../../lib/members";
import { prisma } from "../../../../lib/prisma";
import { updateMemberProfile } from "./actions";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  invalid: "Check the form fields and try again.",
  photo: "Upload a JPG, PNG, WebP, or SVG photo under 2MB.",
  storage: "Photo storage is not configured yet. Ask an admin to add BLOB_READ_WRITE_TOKEN.",
};

export default async function EditMemberProfilePage({
  params,
  searchParams,
}: Readonly<{ params: { id: string }; searchParams?: { error?: string } }>) {
  const session = await auth();

  if (!session?.user) {
    redirect("/join");
  }

  const member = await prisma.user.findUnique({
    where: { id: params.id },
    include: { profile: true },
  });

  if (!member) {
    notFound();
  }

  const canEdit =
    session.user.id === member.id ||
    (session.user.role === Role.ADMIN && session.user.status === UserStatus.ACTIVE);

  if (!canEdit) {
    redirect(`/members/${member.id}`);
  }

  const name = memberDisplayName(member);
  const currentBatch = member.profile?.batch ?? "";
  const batchOptions =
    currentBatch && !batchYears().includes(currentBatch)
      ? [currentBatch, ...batchYears()]
      : batchYears();

  return (
    <main className="app-shell workspace-shell">
      <section className="app-card workspace-card">
        <p className="section-label">Member profile</p>
        <h1>Edit {name}</h1>
        {searchParams?.error ? (
          <div className="form-message error">{errors[searchParams.error] ?? errors.invalid}</div>
        ) : null}

        <div className="member-edit-preview">
          {member.profile?.photoUrl ? (
            <img className="member-avatar" src={member.profile.photoUrl} alt="" />
          ) : (
            <span className="member-avatar member-avatar-fallback">{memberInitials(name)}</span>
          )}
          <span>Upload a square-ish photo if you have one. Otherwise we show initials.</span>
        </div>

        <form action={updateMemberProfile.bind(null, member.id)} className="stacked-form">
          <label htmlFor="photo">Photo</label>
          <CompressingImageInput id="photo" name="photo" />

          <label htmlFor="displayName">Name</label>
          <input
            id="displayName"
            name="displayName"
            defaultValue={member.profile?.displayName ?? member.name ?? ""}
          />

          <label htmlFor="college">College</label>
          <input id="college" name="college" defaultValue={member.profile?.college ?? ""} />

          <label htmlFor="batch">Batch</label>
          <select id="batch" name="batch" defaultValue={currentBatch}>
            <option value="">Not set</option>
            {batchOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <label htmlFor="branch">Branch</label>
          <input id="branch" name="branch" defaultValue={member.profile?.branch ?? ""} />

          <label htmlFor="bio">Bio</label>
          <textarea id="bio" name="bio" defaultValue={member.profile?.bio ?? ""} rows={6} />

          <label htmlFor="skills">Skills</label>
          <input
            id="skills"
            name="skills"
            defaultValue={member.profile?.skills.join(", ") ?? ""}
            placeholder="Backend, React, DSA"
          />

          <label htmlFor="linkedinUrl">LinkedIn URL</label>
          <input
            id="linkedinUrl"
            name="linkedinUrl"
            defaultValue={member.profile?.linkedinUrl ?? ""}
          />

          <label htmlFor="githubUrl">GitHub URL</label>
          <input id="githubUrl" name="githubUrl" defaultValue={member.profile?.githubUrl ?? ""} />

          <label htmlFor="leetcodeHandle">LeetCode handle</label>
          <input
            id="leetcodeHandle"
            name="leetcodeHandle"
            defaultValue={member.profile?.leetcodeHandle ?? ""}
          />

          <label htmlFor="resumeUrl">Resume URL</label>
          <input id="resumeUrl" name="resumeUrl" defaultValue={member.profile?.resumeUrl ?? ""} />

          <button className="button" type="submit">
            Save profile
          </button>
        </form>
      </section>
    </main>
  );
}
