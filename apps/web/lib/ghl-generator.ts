import OpenAI from "openai"
import { supabaseWithAdminAccess } from "./supabase"
import endent from "endent"

/**
 * Robustly clean and extract raw embeddable HTML from model output.
 * Strips markdown code blocks, surrounding prose, and accidental document wrappers (<!DOCTYPE>, <html>, <body>).
 */
export function cleanGhlHtml(raw: string): string {
  let text = raw.trim()

  // 1. Extract content from markdown code blocks if present
  const codeBlockMatch = text.match(/```(?:html|xml)?\s*([\s\S]*?)\s*```/i)
  if (codeBlockMatch && codeBlockMatch[1]) {
    text = codeBlockMatch[1].trim()
  } else {
    // Strip leading fence (e.g. ```html) and trailing fence (```) even if trailing fence was omitted
    text = text.replace(/^```[a-zA-Z0-9_-]*\s*/i, "").replace(/\s*```\s*$/i, "").trim()
  }

  // 2. If the model accidentally outputted full document tags (<!DOCTYPE html>, <html>, <head>, <body>),
  // extract and concatenate head content + body content to make it a valid embedded snippet
  if (/<!DOCTYPE/i.test(text) || /<html/i.test(text) || /<body/i.test(text)) {
    const headMatch = text.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
    const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i)

    if (bodyMatch && bodyMatch[1]) {
      const headContent = headMatch && headMatch[1] ? headMatch[1].trim() : ""
      const bodyContent = bodyMatch[1].trim()
      text = headContent ? `${headContent}\n${bodyContent}` : bodyContent
    } else {
      text = text
        .replace(/<!DOCTYPE[^>]*>/gi, "")
        .replace(/<\/?(?:html|head|body)[^>]*>/gi, "")
        .trim()
    }
  }

  // 3. Ensure Inter Google Font stylesheet is loaded at the very top
  if (!text.includes("fonts.googleapis.com/css2?family=Inter")) {
    const fontLinks = `<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">\n`
    text = fontLinks + text
  }

  // 4. Auto-heal any high-specificity button resets (replace with zero-specificity :where)
  text = text.replace(
    /\.ghl-component-wrapper\s+button,\s*\.ghl-component-wrapper\s+\[role=["']?button["']?\]\s*\{[^}]*background:\s*transparent[^}]*padding:\s*0[^}]*\}/gi,
    `:where(.ghl-component-wrapper) :where(button, [role="button"]) {
    cursor: pointer;
    background-color: transparent;
    background-image: none;
    border-style: solid;
    border-width: 0;
    padding: 0;
    color: inherit;
  }`
  )

  // 5. Ensure .ghl-component-wrapper has isolation: isolate to protect stacking context
  if (text.includes(".ghl-component-wrapper {") && !text.includes("isolation: isolate;")) {
    text = text.replace(".ghl-component-wrapper {", ".ghl-component-wrapper {\n    isolation: isolate;")
  }

  // 6. Ensure font-family Inter is protected on the component wrapper and all children
  if (text.includes(".ghl-component-wrapper {") && !text.includes("font-family: 'Inter'") && !text.includes('font-family: "Inter"')) {
    text = text.replace(
      ".ghl-component-wrapper {",
      `.ghl-component-wrapper, .ghl-component-wrapper * {
    font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
  }
  .ghl-component-wrapper {`
    )
  }

  // 7. Strip accidental/awkward split-screen viewport bleed blocks that cut across the hero (e.g. w-[100vw], -right-[50vw], -left-[50vw])
  text = text.replace(/<div[^>]*?(?:w-\[100vw\]|-right-\[50vw\]|-left-\[50vw\])[^>]*?>\s*(?:<\/div>)?/gi, "")

  return text.trim()
}

export async function generateGhlTemplate(demoId: number, forceRegenerate = false): Promise<string> {
  console.log(`Starting GHL template generation for demo ${demoId} (forceRegenerate: ${forceRegenerate})`)
  
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey === "sk-placeholder") {
      throw new Error("OPENAI_API_KEY is not configured in .env.local. Please add your OpenAI API key.")
    }

    const defaultHeaders: Record<string, string> = {}
    if (process.env.OPENAI_BASE_URL?.includes("openrouter.ai")) {
      defaultHeaders["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL || "https://higherbits.dev"
      defaultHeaders["X-Title"] = "HigherBits"
    }

    const openai = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
      defaultHeaders: Object.keys(defaultHeaders).length ? defaultHeaders : undefined,
    })

    // 1. Fetch demo data
    const { data: demo, error } = await supabaseWithAdminAccess
      .from("demos")
      .select(`
        *,
        component:components(*)
      `)
      .eq("id", demoId)
      .single()

    if (error || !demo) {
      throw new Error(`Failed to fetch demo ${demoId}: ${error?.message}`)
    }

    if (!demo.demo_code || !demo.component?.code) {
      throw new Error(`Demo ${demoId} is missing code or component code.`)
    }

    // Helper to fetch code if it's a URL
    const fetchCode = async (urlOrCode: string) => {
      if (!urlOrCode) return ""
      if (!urlOrCode.startsWith("http://") && !urlOrCode.startsWith("https://")) {
        return urlOrCode
      }
      try {
        const response = await fetch(urlOrCode)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.text()
      } catch (error) {
        console.error(`Error fetching URL ${urlOrCode}:`, error)
        return urlOrCode
      }
    }

    const componentCode = await fetchCode(demo.component.code)
    const demoCode = await fetchCode(demo.demo_code)

    // 2. Construct the system prompt
    const systemInstruction = endent`
      You are an expert Frontend Developer who specializes in transpiling modern React components into vanilla HTML, JavaScript, and Tailwind CSS for GoHighLevel (GHL) Custom HTML blocks.

      Your task is to take a React component (and its demo usage) and output a clean, single-file HTML snippet that can be directly pasted into a GoHighLevel Custom HTML element.

      CRITICAL RULES:
      1. OUTPUT FORMAT:
      - Output ONLY the raw embeddable HTML snippet.
      - DO NOT wrap the output in Markdown code blocks (NO \`\`\`html and NO \`\`\`).
      - DO NOT include <!DOCTYPE html>, <html>, <head>, or <body> tags. This is an embedded snippet for an existing page.

      2. FONTS, TAILWIND CONFIG & CDN:
      Place this EXACT font & script block at the very top of your snippet:
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
      <script>
        window.tailwind = window.tailwind || {};
        window.tailwind.config = {
          corePlugins: { preflight: false },
          theme: {
            extend: {
              fontFamily: {
                sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
              },
              colors: {
                border: "hsl(var(--border, 214.3 31.8% 91.4%))",
                input: "hsl(var(--input, 214.3 31.8% 91.4%))",
                ring: "hsl(var(--ring, 222.2 84% 4.9%))",
                background: "hsl(var(--background, 0 0% 100%))",
                foreground: "hsl(var(--foreground, 222.2 84% 4.9%))",
                primary: {
                  DEFAULT: "hsl(var(--primary, 222.2 47.4% 11.2%))",
                  foreground: "hsl(var(--primary-foreground, 210 40% 98%))",
                },
                secondary: {
                  DEFAULT: "hsl(var(--secondary, 210 40% 96.1%))",
                  foreground: "hsl(var(--secondary-foreground, 222.2 47.4% 11.2%))",
                },
                destructive: {
                  DEFAULT: "hsl(var(--destructive, 0 84.2% 60.2%))",
                  foreground: "hsl(var(--destructive-foreground, 210 40% 98%))",
                },
                muted: {
                  DEFAULT: "hsl(var(--muted, 210 40% 96.1%))",
                  foreground: "hsl(var(--muted-foreground, 215.4 16.3% 46.9%))",
                },
                accent: {
                  DEFAULT: "hsl(var(--accent, 210 40% 96.1%))",
                  foreground: "hsl(var(--accent-foreground, 222.2 47.4% 11.2%))",
                },
                popover: {
                  DEFAULT: "hsl(var(--popover, 0 0% 100%))",
                  foreground: "hsl(var(--popover-foreground, 222.2 84% 4.9%))",
                },
                card: {
                  DEFAULT: "hsl(var(--card, 0 0% 100%))",
                  foreground: "hsl(var(--card-foreground, 222.2 84% 4.9%))",
                },
              },
              borderRadius: {
                lg: "var(--radius, 0.5rem)",
                md: "calc(var(--radius, 0.5rem) - 2px)",
                sm: "calc(var(--radius, 0.5rem) - 4px)",
              },
            }
          }
        };
      </script>
      <script src="https://cdn.tailwindcss.com"></script>

      3. SCOPED STYLES & ZERO-SPECIFICITY RESET:
      Directly below the scripts, include this exact style block:
      <style>
        :root {
          --background: 0 0% 100%;
          --foreground: 222.2 84% 4.9%;
          --card: 0 0% 100%;
          --card-foreground: 222.2 84% 4.9%;
          --popover: 0 0% 100%;
          --popover-foreground: 222.2 84% 4.9%;
          --primary: 222.2 47.4% 11.2%;
          --primary-foreground: 210 40% 98%;
          --secondary: 210 40% 96.1%;
          --secondary-foreground: 222.2 47.4% 11.2%;
          --muted: 210 40% 96.1%;
          --muted-foreground: 215.4 16.3% 46.9%;
          --accent: 210 40% 96.1%;
          --accent-foreground: 222.2 47.4% 11.2%;
          --destructive: 0 84.2% 60.2%;
          --destructive-foreground: 210 40% 98%;
          --border: 214.3 31.8% 91.4%;
          --input: 214.3 31.8% 91.4%;
          --ring: 222.2 84% 4.9%;
          --radius: 0.5rem;
        }
        .dark {
          --background: 222.2 84% 4.9%;
          --foreground: 210 40% 98%;
          --card: 222.2 84% 4.9%;
          --card-foreground: 210 40% 98%;
          --popover: 222.2 84% 4.9%;
          --popover-foreground: 210 40% 98%;
          --primary: 210 40% 98%;
          --primary-foreground: 222.2 47.4% 11.2%;
          --secondary: 217.2 32.6% 17.5%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217.2 32.6% 17.5%;
          --muted-foreground: 215 20.2% 65.1%;
          --accent: 217.2 32.6% 17.5%;
          --accent-foreground: 210 40% 98%;
          --destructive: 0 62.8% 30.6%;
          --destructive-foreground: 210 40% 98%;
          --border: 217.2 32.6% 17.5%;
          --input: 217.2 32.6% 17.5%;
          --ring: 212.7 26.8% 83.9%;
        }
        .ghl-component-wrapper,
        .ghl-component-wrapper * {
          font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }
        .ghl-component-wrapper {
          position: relative;
          width: 100%;
          box-sizing: border-box;
          isolation: isolate;
        }
        :where(.ghl-component-wrapper) :where(*, *::before, *::after) {
          box-sizing: border-box;
        }
        :where(.ghl-component-wrapper) :where(a) {
          color: inherit;
          text-decoration: inherit;
        }
        :where(.ghl-component-wrapper) :where(button, [role="button"]) {
          cursor: pointer;
          background-color: transparent;
          background-image: none;
          border-style: solid;
          border-width: 0;
          padding: 0;
          color: inherit;
        }
        :where(.ghl-component-wrapper) :where(h1, h2, h3, h4, h5, h6, p) {
          margin: 0;
        }
        :where(.ghl-component-wrapper) :where(ul, ol) {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        :where(.ghl-component-wrapper) :where(img, video) {
          max-width: 100%;
          height: auto;
          display: block;
        }
        :where(.ghl-component-wrapper) :where(svg) {
          display: inline-block;
          vertical-align: middle;
        }
      </style>

      4. WRAPPER CONTAINER & BACKGROUNDS:
      Wrap the entire component markup inside:
      <div class="ghl-component-wrapper w-full">
      - NEVER add artificial borders, rounded corners, padding, or shadow to this outer wrapper.
      - NEVER use w-fit on the outer wrapper for sections, heroes, navbars, footers, or full grids. Keep it w-full.
      - Preserve the component's internal styling, background colors (e.g. dark bg-[#030712] or light bg-white), text colors, padding, and layout completely intact.
      - SECTION BACKGROUND UNIFORMITY: Ensure the hero/section background matches the visual preview (e.g., if the preview has a uniform white background, keep it solid white).
      - NO SPLIT-SCREEN VIEWPORT BLOCKS: Do NOT include awkward, off-center viewport-bleed background blocks (such as elements with w-[100vw], -right-[50vw], or -left-[50vw] that cut abruptly through text or the hero section). If such elements exist in the React source with -z-10 or -z-20 (meaning they were hidden behind the container's background in the original preview), OMIT them entirely so the background remains clean and uniform.
      - For intentional subtle glows or radial blur gradients (e.g. blur-3xl rounded-full) that sit behind content, position them cleanly without overflowing the section or cutting across text.

      5. ICONS & SVGS:
      - Convert all React SVG icon components (Lucide icons, custom SVG components) into inline <svg> elements.
      - Keep their width, height, viewBox, stroke, fill, and className attributes intact.

      6. INTERACTIVITY & JAVASCRIPT:
      - Convert React interactive state (tabs, dropdowns, accordions, mobile navigation menu toggle) into clean Vanilla JavaScript inside a <script> block at the bottom.
      - For tabs, accordions, or hidden menus, toggle the \`hidden\` class or style display property dynamically on click.

      7. COMPLETION GUARANTEE:
      - You MUST generate the ENTIRE component completely from top to bottom. Never cut off or truncate. Every tag opened must be closed.
    `

    const userMessage = endent`
      Convert the following React component and its demo into a production-ready GoHighLevel HTML snippet following the critical instructions.

      Component Code:
      \`\`\`tsx
      ${componentCode}
      \`\`\`

      Demo Usage:
      \`\`\`tsx
      ${demoCode}
      \`\`\`
    `

    // 3. Call OpenAI API (ChatGPT / OpenRouter)
    const model = process.env.OPENAI_MODEL || "minimax/minimax-m3:free"
    console.log(`Calling OpenAI API (${model}) to generate GHL template for demo ${demoId}...`)
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userMessage },
      ],
      max_tokens: 8192,
      temperature: 0.1,
    })
    
    const rawOutput = completion.choices[0]?.message?.content || ""
    const ghlHtml = cleanGhlHtml(rawOutput)

    if (!ghlHtml) {
      throw new Error("AI returned an empty response.")
    }

    // 4. Save to database
    console.log(`Saving generated GHL HTML to demo ${demoId}...`)
    const { error: updateError } = await supabaseWithAdminAccess
      .from("demos")
      .update({ ghl_html_content: ghlHtml })
      .eq("id", demoId)

    if (updateError) {
      throw new Error(`Failed to update demo ${demoId} with GHL HTML: ${updateError.message}`)
    }

    console.log(`Successfully generated and saved GHL template for demo ${demoId}`)
    return ghlHtml
  } catch (error) {
    console.error(`Error generating GHL template for demo ${demoId}:`, error)
    throw error
  }
}
