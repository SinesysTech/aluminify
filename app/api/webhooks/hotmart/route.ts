import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createFinancialService } from "@/app/[tenant]/(dashboard)/financeiro/services";
import type { HotmartWebhookPayload } from "@/app/[tenant]/(dashboard)/financeiro/services/financial.types";

/**
 * Hotmart Webhook Handler
 *
 * This endpoint receives webhook notifications from Hotmart.
 * It processes purchase events and creates/updates transactions.
 *
 * The endpoint uses a service role client to bypass RLS since
 * webhooks are not authenticated with user tokens.
 *
 * Webhook URL format: /api/webhooks/hotmart?empresaId=<empresa_id>
 */

// Create a service role client for webhook processing
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase configuration");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get webhook secret for the empresa
 * Returns the hottok configured for Hotmart integration
 */
async function getWebhookSecret(
  client: ReturnType<typeof getServiceClient>,
  empresaId: string
): Promise<string | null> {
  const { data, error } = await client
    .from("payment_providers")
    .select("webhook_secret")
    .eq("empresa_id", empresaId)
    .eq("provider", "hotmart")
    .eq("active", true)
    .single();

  if (error || !data) return null;
  return data.webhook_secret;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get empresaId from query parameter
    const empresaId = request.nextUrl.searchParams.get("empresaId");

    if (!empresaId) {
      console.error("[Hotmart Webhook] Missing empresaId parameter");
      return NextResponse.json(
        { error: "Missing empresaId parameter" },
        { status: 400 }
      );
    }

    // Parse webhook payload
    let payload: HotmartWebhookPayload;
    try {
      payload = await request.json();
    } catch {
      console.error("[Hotmart Webhook] Invalid JSON payload");
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Log webhook receipt (without sensitive data)
    console.log("[Hotmart Webhook] Received:", {
      empresaId,
      event: payload.event,
      transaction: payload.data?.purchase?.transaction,
      timestamp: new Date().toISOString(),
    });

    // Get service client
    const client = getServiceClient();

    // Get webhook secret for this empresa
    const webhookSecret = await getWebhookSecret(client, empresaId);

    if (!webhookSecret) {
      console.error("[Hotmart Webhook] No active Hotmart integration for empresa:", empresaId);
      // Return 200 to prevent Hotmart from retrying
      // (misconfigured webhook, not a transient error)
      return NextResponse.json({
        success: false,
        message: "No active Hotmart integration configured for this empresa",
      });
    }

    // Process webhook
    const financialService = createFinancialService(client);
    const result = await financialService.processHotmartWebhook(
      empresaId,
      payload,
      webhookSecret
    );

    const processingTime = Date.now() - startTime;
    console.log("[Hotmart Webhook] Processed:", {
      empresaId,
      event: payload.event,
      success: result.success,
      message: result.message,
      transactionId: result.transaction?.id,
      processingTime: `${processingTime}ms`,
    });

    if (!result.success) {
      // Return 401 for invalid signature
      if (result.message === "Invalid webhook signature") {
        return NextResponse.json(
          { error: result.message },
          { status: 401 }
        );
      }
    }

    // Always return 200 for processed events (even if skipped)
    // This prevents Hotmart from retrying
    return NextResponse.json({
      success: result.success,
      message: result.message,
      transactionId: result.transaction?.id,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error("[Hotmart Webhook] Error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: `${processingTime}ms`,
    });

    // Return 500 for actual errors (Hotmart will retry)
    return NextResponse.json(
      { error: "Internal server error processing webhook" },
      { status: 500 }
    );
  }
}

// Handle GET requests (for testing/verification)
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "Hotmart Webhook Handler",
    usage: "POST /api/webhooks/hotmart?empresaId=<empresa_id>",
  });
}
