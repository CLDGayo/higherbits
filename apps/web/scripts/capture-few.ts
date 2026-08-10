import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function capture() {
  const toCapture = ["chart", "form", "sidebar"];
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 800, height: 600 });
  await page.emulateMedia({ colorScheme: 'dark' });

  for (const slug of toCapture) {
    console.log(`Capturing ${slug}...`);
    try {
      await page.goto(`http://localhost:3000/component-thumbnail/${slug}`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(4000);
      const thumbnailPath = path.join(process.cwd(), "public", "thumbnails", `${slug}.png`);
      await page.screenshot({ path: thumbnailPath });
      console.log(`Saved ${slug}.png`);
    } catch (e) {
      console.error(`Failed ${slug}`, e);
    }
  }

  await browser.close();
}
capture();
