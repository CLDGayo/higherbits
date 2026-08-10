require("dotenv").config({ path: ".env.local" });
console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 5) + "...");
