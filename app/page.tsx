import { LandingPage } from "@/app/(landing-page)/components/landing-page";
import { getAuthenticatedUser } from "@/app/shared/core/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getAuthenticatedUser();

  if (user && user.empresaSlug) {
    redirect(`/${user.empresaSlug}/dashboard`);
  }

  return <LandingPage />;
}