import { GoogleGenerativeAI } from "@google/generative-ai"
import { supabaseWithAdminAccess } from "./supabase"
import endent from "endent"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function generateGhlTemplate(demoId: number): Promise<void> {
  console.log(`Starting GHL template generation for demo ${demoId}`)
  
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not defined in the environment variables.")
    }

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
      You are an expert Frontend Developer who specializes in transpiling modern React components into vanilla HTML, JavaScript, and Tailwind CSS.
      
      Your task is to take a React component (and its demo usage) and output a clean, single-file HTML snippet that can be directly pasted into a GoHighLevel (GHL) Custom HTML block.

      CRITICAL INSTRUCTIONS:
      1. Output ONLY the raw HTML string. Do NOT wrap it in Markdown \`\`\`html blocks. Your entire response must be valid HTML.
      2. WRAPPER CONTAINER: GHL users expect the component to be a self-contained widget exactly like the preview. DO NOT let small components (like tabs or separators) stretch elongated across the whole page. If the component is a small block, use \`w-fit mx-auto\` or a fixed \`max-w-md\`.
      3. KEEP the component's internal styling (like \`px-4\`, \`py-2\`, \`gap-4\`, etc.) fully intact.
      4. Include \`<script src="https://cdn.tailwindcss.com"></script>\` at the top. 
      CRITICAL: You MUST disable Tailwind's global preflight to prevent it from destroying the host GHL site's CSS: \`tailwind.config = { corePlugins: { preflight: false }, theme: { ... } }\`.
      5. SCOPED CSS RESET & CARD: Because global preflight is disabled, you MUST inject a \`<style>\` block containing a scoped reset strictly targeting your component wrapper.
      Wrap your ENTIRE component in this exact container to make it an intact card widget: \`<div class="ghl-component-wrapper bg-background text-left text-base font-sans text-foreground antialiased w-fit mx-auto border border-border rounded-xl p-6 shadow-sm">\` and inject this exact CSS block:
      \`\`\`css
      .ghl-component-wrapper *, .ghl-component-wrapper *::before, .ghl-component-wrapper *::after { box-sizing: border-box; border-width: 0; border-style: solid; border-color: hsl(var(--border, 214.3 31.8% 91.4%)); }
      .ghl-component-wrapper hr { height: 0; color: inherit; border-top-width: 1px; margin: 0; }
      .ghl-component-wrapper a { color: inherit; text-decoration: inherit; }
      .ghl-component-wrapper button, .ghl-component-wrapper [role="button"] { cursor: pointer; background: transparent; padding: 0; }
      .ghl-component-wrapper h1, .ghl-component-wrapper h2, .ghl-component-wrapper h3, .ghl-component-wrapper h4, .ghl-component-wrapper h5, .ghl-component-wrapper h6, .ghl-component-wrapper p { margin: 0; font-size: inherit; font-weight: inherit; }
      .ghl-component-wrapper ul, .ghl-component-wrapper ol { list-style: none; margin: 0; padding: 0; }
      .ghl-component-wrapper svg { display: block; }
      \`\`\`
      6. Include the Shadcn default CSS variables (like \`--background\`, \`--primary\`) in your \`<style>\` block so the colors work. Add an HTML comment above the wrapper explaining: \`<!-- To use Dark Mode, add the 'dark' class to the ghl-component-wrapper div below -->\`.
      7. JAVASCRIPT & RADIX PRIMITIVES: Convert all React/Radix logic into Vanilla JS. For interactive elements (like Tabs, Accordions, Dropdowns), Radix UI automatically removed inactive elements from the DOM, but in Vanilla JS you MUST explicitly toggle their visibility. Add a \`hidden\` utility class (or \`style="display: none;"\`) to inactive panels! Relying only on \`data-state="inactive"\` will NOT hide the panel unless you write CSS for it.
      8. Add HTML comments guiding the user where to insert GHL custom variables (like \`{{ custom_values.title }}\`) or bind workflows.
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

    // 3. Call Gemini API
    console.log(`Calling Gemini API to generate GHL template for demo ${demoId}...`)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction,
      generationConfig: { temperature: 0 }
    })
    
    const result = await model.generateContent(userMessage)
    let ghlHtml = result.response.text() || ""

    // Strip markdown formatting if the model accidentally included it
    ghlHtml = ghlHtml.trim()
    if (ghlHtml.startsWith("\`\`\`html")) {
      ghlHtml = ghlHtml.replace(/^\`\`\`html/, "").replace(/\`\`\`$/, "").trim()
    } else if (ghlHtml.startsWith("\`\`\`")) {
      ghlHtml = ghlHtml.replace(/^\`\`\`/, "").replace(/\`\`\`$/, "").trim()
    }

    if (!ghlHtml) {
      throw new Error("Gemini returned an empty string.")
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

  } catch (error) {
    console.error(`Error generating GHL template for demo ${demoId}:`, error)
    // We don't throw the error so it doesn't crash the calling function
  }
}
