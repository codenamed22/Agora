import { redirect } from "next/navigation";

export default async function TeachingSessionPage({
  params,
}: Readonly<{ params: { id: string } }>) {
  redirect(`/masterclass/${params.id}`);
}
