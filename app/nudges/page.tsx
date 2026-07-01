import { redirect } from "next/navigation";
import { requireActiveUser } from "../../lib/guards";

export const dynamic = "force-dynamic";

export default async function NudgesPage() {
  const user = await requireActiveUser();
  redirect(`/members/${user.id}#nudges`);
}
