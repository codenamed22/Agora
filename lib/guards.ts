import { Role, UserStatus } from "@prisma/client";
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

export async function requireAdmin() {
  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== Role.ADMIN ||
    session.user.status !== UserStatus.ACTIVE
  ) {
    redirect("/dashboard");
  }

  return session.user;
}
