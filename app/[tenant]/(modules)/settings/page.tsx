import { redirect } from "next/navigation";

export default async function SettingsPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  redirect(`/${tenant}/settings/detalhes`);
}
