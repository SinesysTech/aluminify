import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle errors from Google
  if (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(
      new URL(
        `/professor/configuracoes/integracoes?error=${encodeURIComponent(error)}`,
        request.url,
      ),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(
        "/professor/configuracoes/integracoes?error=missing_params",
        request.url,
      ),
    );
  }

  try {
    // Parse state to get professorId
    const { professorId } = JSON.parse(decodeURIComponent(state));

    if (!professorId) {
      throw new Error("Missing professorId in state");
    }

    // Exchange code for tokens
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/integrations/google/callback`;

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange error:", errorText);
      throw new Error("Failed to exchange code for tokens");
    }

    const tokens = await tokenResponse.json();

    // Calculate token expiry
    const tokenExpiry = new Date(
      Date.now() + tokens.expires_in * 1000,
    ).toISOString();

    // Save tokens to database
    const supabase = await createClient();

    const { error: upsertError } = await supabase
      .from("agendamento_integracoes")
      .upsert(
        {
          professor_id: professorId,
          provider: "google",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: tokenExpiry,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "professor_id",
        },
      );

    if (upsertError) {
      console.error("Database error:", upsertError);
      throw new Error("Failed to save integration");
    }

    return NextResponse.redirect(
      new URL(
        "/professor/configuracoes/integracoes?success=google",
        request.url,
      ),
    );
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/professor/configuracoes/integracoes?error=${encodeURIComponent(String(error))}`,
        request.url,
      ),
    );
  }
}
