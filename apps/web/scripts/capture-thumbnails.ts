import { createClient } from "@supabase/supabase-js"
import { chromium } from "playwright"
import fs from "fs"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log("Fetching shadcn components...")
  const { data: components, error } = await supabase
    .from("components")
    .select("id, component_slug, bundle_html_url")
    .eq("user_id", "user_shadcn")

  if (error) {
    console.error("Error fetching components:", error)
    process.exit(1)
  }

  if (!components || components.length === 0) {
    console.log("No components found.")
    return
  }

  console.log(`Found ${components.length} components.`)

  const browser = await chromium.launch({ headless: true })
  
  const thumbnailsDir = path.resolve(process.cwd(), "public/thumbnails")
  if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true })
  }

  for (const component of components) {
    console.log(`Capturing ${component.component_slug}...`)
    
    const context = await browser.newContext({
      viewport: { width: 800, height: 450 },
      deviceScaleFactor: 2, // Retina resolution for sharper thumbnails
    })
    
    const page = await context.newPage()
    
    try {
      const url = `http://localhost:3000/component-thumbnail/${component.component_slug}`
        
      await page.goto(url, { waitUntil: "networkidle", timeout: 25000 })
      
      // Wait a bit for any react rendering or animations (like spinner)
      // Sandpack preview usually takes a few seconds to boot
      await page.waitForTimeout(5000)
      
      // Hide the sandpack error overlay if it appears for some reason
      await page.evaluate(() => {
        const style = document.createElement('style');
        style.innerHTML = `
          .sp-error-overlay { display: none !important; }
        `;
        document.head.appendChild(style);
        
        // Also force background to be white since we removed the hardcoded background earlier
        document.body.style.backgroundColor = "#ffffff";
      });

      const thumbnailPath = path.join(thumbnailsDir, `${component.component_slug}.png`)
      await page.screenshot({ path: thumbnailPath })
      
      // Update DB with the new preview URL
      const newPreviewUrl = `/thumbnails/${component.component_slug}.png`
      await supabase
        .from("components")
        .update({ preview_url: newPreviewUrl })
        .eq("id", component.id)
        
      console.log(`Saved ${thumbnailPath} and updated DB.`)
    } catch (err) {
      console.error(`Failed to capture ${component.component_slug}:`, err)
    } finally {
      await context.close()
    }
  }

  await browser.close()
  console.log("Done capturing all thumbnails.")
}

main().catch(console.error)
