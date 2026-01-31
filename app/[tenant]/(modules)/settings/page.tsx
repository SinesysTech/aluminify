import { redirect } from "next/navigation";

export default function SettingsPage({ params }: { params: { tenant: string } }) {
  redirect(`/${params.tenant}/settings/detalhes`);
}
