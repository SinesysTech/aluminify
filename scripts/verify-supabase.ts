import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load .env.local manually since we are running a script
const envPath = path.resolve(process.cwd(), ".env.local");
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const url = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const key = envConfig.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;

console.log("Testing Supabase Connection...");
console.log("URL:", url);
console.log("Key:", key);

if (!url || !key) {
  console.error("Missing URL or Key in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function testConnection() {
  try {
    const { data: _data, count, error } = await supabase
      .from("alunos")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    if (error) {
      console.error("Connection failed or query error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
    } else {
      console.log("Connection successful!");
      console.log("Count:", count);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

testConnection();
