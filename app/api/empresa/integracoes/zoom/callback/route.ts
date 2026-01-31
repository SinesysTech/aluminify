import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/shared/core/server";
import { getOAuthCredentials } from "@/app/shared/core/services/oauth-credentials";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle errors from Zoom
  if (error) {
    console.error("Zoom OAuth error:", error);
    return NextResponse.redirect(
      new URL(
        `/settings/integracoes?error=${encodeURIComponent(error)}`,
        request.url,
      ),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(
        "/settings/integracoes?error=missing_params",
        request.url,
      ),
    );
  }

  try {
    // Parse state to get professorId, empresaId, and tenantSlug
    const { professorId, empresaId, tenantSlug } = JSON.parse(
      decodeURIComponent(state),
    );

    if (!professorId || !empresaId) {
      throw new Error("Missing professorId or empresaId in state");
    }

    // Fetch tenant-specific OAuth credentials from the database
    const credentials = await getOAuthCredentials(empresaId, "zoom");
    if (!credentials) {
      throw new Error("Zoom OAuth credentials not configured for this tenant");
    }

    const { clientId, clientSecret } = credentials;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/empresa/integracoes/zoom/callback`;

    // Zoom uses Basic auth with client credentials
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );

    const tokenResponse = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Zoom token exchange error:", errorText);
      throw new Error("Failed to exchange code for tokens");
    }

    const tokens = await tokenResponse.json();

    // Calculate token expiry (Zoom tokens typically last 1 hour)
    const tokenExpiry = new Date(
      Date.now() + (tokens.expires_in || 3600) * 1000,
    ).toISOString();

    // Save tokens to database with tenant scope
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertError } = await (supabase as any)
      .from("professor_integracoes")
      .upsert(
        {
          professor_id: professorId,
          empresa_id: empresaId,
          provider: "zoom",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: tokenExpiry,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "professor_id,empresa_id,provider",
        },
      );

    if (upsertError) {
      console.error("Database error:", upsertError);
      throw new Error("Failed to save integration");
    }

    const redirectPath = tenantSlug
      ? `/${tenantSlug}/settings/integracoes?success=zoom`
      : `/settings/integracoes?success=zoom`;

    return NextResponse.redirect(
      new URL(redirectPath, request.url),
    );
  } catch (error) {
    console.error("Zoom OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/settings/integracoes?error=${encodeURIComponent(String(error))}`,
        request.url,
      ),
    );
  }
}
