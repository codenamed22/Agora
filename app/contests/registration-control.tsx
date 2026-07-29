import { UserStatus } from "@/prisma-client";
import { registerForContest, unregisterFromContest } from "./[slug]/actions";

type ContestRegistrationControlProps = {
  contestSlug: string;
  userStatus?: UserStatus;
  isRegistered: boolean;
  phase: string;
};

export default function ContestRegistrationControl({
  contestSlug,
  userStatus,
  isRegistered,
  phase,
}: ContestRegistrationControlProps) {
  // Registration is only meaningful before the contest ends. Once a registered
  // member is inside the live window they see the problems instead of a button.
  if (phase !== "upcoming" && phase !== "running") {
    return null;
  }

  if (!userStatus) {
    return (
      <a className="button" href="/join">
        Sign in to register
      </a>
    );
  }

  if (userStatus === UserStatus.PENDING) {
    return (
      <a className="secondary-button" href="/apply">
        Membership pending
      </a>
    );
  }

  if (userStatus !== UserStatus.ACTIVE) {
    return <p className="event-note">Only active members can register.</p>;
  }

  if (isRegistered) {
    // Backing out is only allowed while the contest is still upcoming.
    if (phase !== "upcoming") {
      return null;
    }

    return (
      <div className="inline-form">
        <span className="event-note">You&apos;re registered.</span>
        <form action={unregisterFromContest} className="inline-form">
          <input type="hidden" name="contestSlug" value={contestSlug} />
          <button className="secondary-button" type="submit">
            Cancel registration
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={registerForContest} className="inline-form">
      <input type="hidden" name="contestSlug" value={contestSlug} />
      <button className="button" type="submit">
        {phase === "running" ? "Register & start" : "Register"}
      </button>
    </form>
  );
}
