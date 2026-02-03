import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { getPublicSupabaseConfig } from "./supabase-public-env";
import {
  compressCookieValue,
  decompressCookieValue,
  isCompressedCookie,
  shouldCompressCookie,
} from "@/app/shared/core/cookie-compression";

/**
 * If using Fluid compute: Don't put this client in a global variable. Always create a new client within each
 * function when using it.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getPublicSupabaseConfig();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map((c) => {
          if (isCompressedCookie(c.value)) {
            return { ...c, value: decompressCookieValue(c.value) };
          }
          return c;
        });
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieValue =
              typeof value === "string" &&
              !isCompressedCookie(value) &&
              shouldCompressCookie(name, value)
                ? compressCookieValue(value)
                : value;
            cookieStore.set(name, cookieValue, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

export const createSupabaseServerClient = createClient;
