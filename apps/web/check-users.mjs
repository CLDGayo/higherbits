import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
    },
  },
);

async function checkUsers() {
  const { data, error } = await supabaseAdmin.from("users").select("*");
  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log("Users in DB:");
  data.forEach((u) => {
    console.log(`ID: ${u.id}, email: ${u.email}, is_admin: ${u.is_admin}`);
  });
}

checkUsers();
