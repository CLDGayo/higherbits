import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const thumbnailsDir = path.resolve(process.cwd(), "apps/web/public/thumbnails");

async function main() {
  if (!fs.existsSync(thumbnailsDir)) {
    console.error("Thumbnails directory not found:", thumbnailsDir);
    process.exit(1);
  }

  // Get all unique slugs from existing PNGs (handling old .png or existing -dark.png)
  const allFiles = fs.readdirSync(thumbnailsDir).filter((file) => file.endsWith(".png"));
  if (allFiles.length === 0) {
    console.log("No thumbnails found to process.");
    return;
  }
  
  const slugs = Array.from(new Set(allFiles.map(file => {
    let slug = path.basename(file, ".png");
    slug = slug.replace(/-dark$/, "").replace(/-light$/, "");
    return slug;
  })));

  console.log(`Found ${slugs.length} components to regenerate (light and dark passes).`);

  const browser = await chromium.launch({ headless: true });

  const passes = [
    { colorScheme: 'dark', suffix: '-dark' },
    { colorScheme: 'light', suffix: '-light' }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const pass of passes) {
    console.log(`\n=== Starting ${pass.colorScheme.toUpperCase()} pass ===`);
    const context = await browser.newContext({
      viewport: { width: 1200, height: 900 },
      deviceScaleFactor: 2,
      colorScheme: pass.colorScheme,
    });
    const page = await context.newPage();

    for (const slug of slugs) {
      const targetUrl = `http://localhost:3000/shadcn/${slug}/default`;
      const targetPath = path.join(thumbnailsDir, `${slug}${pass.suffix}.png`);
      
      console.log(`Processing [${pass.colorScheme}]: ${slug}`);
      try {
        await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 15000 });
        await page.waitForTimeout(2000);
        
        const boundingBox = {
          x: 32,
          y: 153, 
          width: 780, 
          height: 585 
        };

        await page.screenshot({ path: targetPath, clip: boundingBox });
        console.log(`✅ Captured ${slug}${pass.suffix}.png`);
        successCount++;
      } catch (err) {
        console.error(`❌ Failed to capture ${slug}${pass.suffix}.png:`, err.message);
        failCount++;
      }
    }
    await context.close();
  }

  await browser.close();

  // Cleanup old un-suffixed png files
  for (const file of allFiles) {
    if (!file.endsWith("-dark.png") && !file.endsWith("-light.png")) {
      const oldPath = path.join(thumbnailsDir, file);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
        console.log(`🗑️ Cleaned up old file: ${file}`);
      }
    }
  }

  console.log(`\nFinished regenerating thumbnails.`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
