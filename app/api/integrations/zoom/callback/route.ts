import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";

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
    const clientId = process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/integrations/zoom/callback`;

    if (!clientId || !clientSecret) {
      throw new Error("Zoom OAuth credentials not configured");
    }

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

    // Save tokens to database
    const supabase = await createClient();

    const { error: upsertError } = await supabase
      .from("agendamento_integracoes")
      .upsert(
        {
          professor_id: professorId,
          provider: "zoom",
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
      new URL("/professor/configuracoes/integracoes?success=zoom", request.url),
    );
  } catch (error) {
    console.error("Zoom OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/professor/configuracoes/integracoes?error=${encodeURIComponent(String(error))}`,
        request.url,
      ),
    );
  }
}
