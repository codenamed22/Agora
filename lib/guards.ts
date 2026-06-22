import { UserStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "../auth";

export async function requireActiveUser() {
  const session = await auth();

  if (!session?.user) {
    redirect("/join");
  }

  if (session.user.status !== UserStatus.ACTIVE) {
    redirect("/apply");
  }

  return session.user;
}
