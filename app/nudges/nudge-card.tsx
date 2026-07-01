import {
  canAccept,
  canCancel,
  canComplete,
  canDecline,
  NUDGE_STATUS_LABEL,
  nudgeStatusTone,
} from "../../lib/nudges";
import { memberDisplayName } from "../../lib/members";
import { acceptNudge, cancelNudge, completeNudge, declineNudge } from "./actions";

type NudgeUser = {
  id: string;
  name: string | null;
  email: string;
  profile?: { displayName: string | null } | null;
};

type NudgeRecord = {
  id: string;
  senderId: string;
  recipientId: string;
  title: string;
  message: string | null;
  link: string | null;
  status: import("@prisma/client").NudgeStatus;
  createdAt: Date;
  completedAt: Date | null;
  sender: NudgeUser;
  recipient: NudgeUser;
  completedBy: NudgeUser | null;
};

type NudgeActionsProps = {
  nudge: NudgeRecord;
  viewerId: string;
  perspective: "received" | "sent";
};

function NudgeActions({ nudge, viewerId, perspective }: NudgeActionsProps) {
  if (perspective === "received" && canAccept(nudge, viewerId)) {
    return (
      <div className="nudge-actions">
        <form action={acceptNudge} className="inline-form">
          <input type="hidden" name="nudgeId" value={nudge.id} />
          <button className="button" type="submit">
            Accept
          </button>
        </form>
        <form action={declineNudge} className="inline-form">
          <input type="hidden" name="nudgeId" value={nudge.id} />
          <button className="secondary-button" type="submit">
            Decline
          </button>
        </form>
      </div>
    );
  }

  if (perspective === "sent" && canCancel(nudge, viewerId)) {
    return (
      <form action={cancelNudge} className="inline-form">
        <input type="hidden" name="nudgeId" value={nudge.id} />
        <button className="secondary-button" type="submit">
          Cancel
        </button>
      </form>
    );
  }

  if (canComplete(nudge, viewerId)) {
    return (
      <form action={completeNudge} className="inline-form">
        <input type="hidden" name="nudgeId" value={nudge.id} />
        <button className="button" type="submit">
          Mark complete
        </button>
      </form>
    );
  }

  return null;
}

type NudgeCardProps = {
  nudge: NudgeRecord;
  viewerId: string;
  perspective: "received" | "sent";
};

export function NudgeCard({ nudge, viewerId, perspective }: NudgeCardProps) {
  const counterparty = perspective === "received" ? nudge.sender : nudge.recipient;
  const counterpartyLabel = perspective === "received" ? "From" : "To";
  const tone = nudgeStatusTone(nudge.status);

  return (
    <article className="nudge-card">
      <div className="nudge-card-main">
        <div className="nudge-card-header">
          <h2>{nudge.title}</h2>
          <span className={`nudge-status nudge-status-${tone}`}>
            {NUDGE_STATUS_LABEL[nudge.status]}
          </span>
        </div>
        <p className="nudge-meta">
          {counterpartyLabel}{" "}
          <a href={`/members/${counterparty.id}`}>{memberDisplayName(counterparty)}</a>
        </p>
        {nudge.message ? <p>{nudge.message}</p> : null}
        {nudge.link ? (
          <p>
            <a className="text-link" href={nudge.link} rel="noreferrer" target="_blank">
              Open link
            </a>
          </p>
        ) : null}
        {nudge.completedAt ? (
          <p className="nudge-meta">
            Completed {nudge.completedBy ? `by ${memberDisplayName(nudge.completedBy)} ` : ""}
            on {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(nudge.completedAt)}
          </p>
        ) : null}
      </div>
      <NudgeActions nudge={nudge} viewerId={viewerId} perspective={perspective} />
    </article>
  );
}
