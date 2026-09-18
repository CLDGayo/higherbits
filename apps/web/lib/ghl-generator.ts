import OpenAI from "openai"
import { supabaseWithAdminAccess } from "./supabase"
import endent from "endent"

/**
 * Robustly clean and extract raw embeddable HTML from model output.
 * Strips markdown code blocks, surrounding prose, and accidental document wrappers (<!DOCTYPE>, <html>, <body>).
 */
export function cleanGhlHtml(raw: string): string {
  let text = (raw || "").trim()

  if (!text || (!text.includes("<div") && !text.includes("<button") && !text.includes("<section") && !text.includes("<style") && !text.includes("<script"))) {
    return ""
  }

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

  // 8. Auto-heal missing closing tags if accidentally omitted
  const openScripts = (text.match(/<script\b/gi) || []).length
  const closeScripts = (text.match(/<\/script>/gi) || []).length
  if (openScripts > closeScripts) {
    text += "\n</script>"
  }
  const openDivs = (text.match(/<div\b/gi) || []).length
  const closeDivs = (text.match(/<\/div>/gi) || []).length
  if (openDivs > closeDivs) {
    text += "\n" + "</div>".repeat(openDivs - closeDivs)
  }

  return text.trim()
}

export async function generateGhlTemplate(demoId: number, forceRegenerate = false): Promise<string> {
  console.log(`Starting GHL template generation for demo ${demoId} (forceRegenerate: ${forceRegenerate})`)
  
  try {
    const relmioToken = process.env.RELMIO_AUTH_TOKEN
    const apiKey = process.env.OPENAI_API_KEY
    if (!relmioToken && (!apiKey || apiKey === "sk-placeholder")) {
      throw new Error("Neither RELMIO_AUTH_TOKEN nor OPENAI_API_KEY is configured in .env.local. Please configure at least one provider.")
    }

    let openai: OpenAI | null = null
    if (apiKey && apiKey !== "sk-placeholder") {
      const defaultHeaders: Record<string, string> = {}
      if (process.env.OPENAI_BASE_URL?.includes("openrouter.ai")) {
        defaultHeaders["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL || "https://higherbits.dev"
        defaultHeaders["X-Title"] = "HigherBits"
      }

      openai = new OpenAI({
        apiKey,
        baseURL: process.env.OPENAI_BASE_URL || undefined,
        defaultHeaders: Object.keys(defaultHeaders).length ? defaultHeaders : undefined,
      })
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
      You are an expert Frontend Developer who specializes in transpiling modern React components into vanilla HTML, JavaScript, and Tailwind CSS for GoHighLevel (GHL) Custom HTML blocks.

      Your task is to take a React component (and its demo usage) and output a clean, single-file HTML snippet that can be directly pasted into a GoHighLevel Custom HTML element.

      CRITICAL RULES:
      1. OUTPUT FORMAT:
      - Output ONLY the raw embeddable HTML snippet.
      - DO NOT wrap the output in Markdown code blocks (NO \`\`\`html and NO \`\`\`).
      - DO NOT include <!DOCTYPE html>, <html>, <head>, or <body> tags. This is an embedded snippet for an existing page.

      2. FONTS & SCRIPTS:
      - Include font preconnect & Inter stylesheet:
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
      - Include Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>

      3. SCOPED STYLES & ZERO-SPECIFICITY RESETS:
      Include a <style> block with CSS variables, keyframe animations, and reset:
      <style>
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
        :where(.ghl-component-wrapper) :where(button, [role="button"]) {
          cursor: pointer;
          background-color: transparent;
          border-width: 0;
          padding: 0;
          color: inherit;
        }
      </style>

      4. WRAPPER CONTAINER & BACKGROUNDS:
      Wrap the entire component markup inside:
      <div class="ghl-component-wrapper w-full">
      - NEVER add artificial borders, rounded corners, padding, or shadow to this outer wrapper.
      - Preserve the component's internal styling, background colors (e.g. dark bg-[#030712] or light bg-white), text colors, padding, and layout completely intact.
      - NO SPLIT-SCREEN VIEWPORT BLOCKS: Do NOT include awkward, off-center viewport-bleed background blocks (e.g. w-[100vw], -right-[50vw], -left-[50vw]).

      5. ICONS & SVGS:
      - Convert all React SVG icon components (Lucide icons, custom SVG components) into inline <svg> elements.
      - Keep their width, height, viewBox, stroke, fill, and className attributes intact.

      6. INTERACTIVITY & JAVASCRIPT:
      - Convert React interactive state and animations (spotlights, mouse tracking, ripples, magnetic cursor pull, tabs, dropdowns, accordions, mobile navigation menu toggle) into clean Vanilla JavaScript inside a <script> block at the bottom.
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

    let rawOutput = ""

    // Option A: Use local ChatGPT subscription via Relmio Codex Chat Adapter if configured
    if (relmioToken) {
      const relmioEndpoint = process.env.RELMIO_CHAT_ENDPOINT || "http://127.0.0.1:14501/chat"
      console.log(`Calling Relmio Codex Chat Adapter (${relmioEndpoint}) using ChatGPT subscription for demo ${demoId}...`)
      try {
        const relmioRes = await fetch(relmioEndpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${relmioToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: `${systemInstruction}\n\n${userMessage}`,
          }),
        })

        if (!relmioRes.ok) {
          const errorText = await relmioRes.text().catch(() => "")
          throw new Error(`Relmio request failed (${relmioRes.status}): ${errorText}`)
        }

        const relmioData = await relmioRes.json()
        rawOutput = relmioData.output || ""
      } catch (relmioErr) {
        if (openai) {
          console.warn("Relmio call failed; falling back to OpenAI/OpenRouter...", relmioErr)
        } else {
          throw relmioErr
        }
      }
    }

    // Option B: OpenAI / OpenRouter API
    if (!rawOutput && openai) {
      let model = process.env.OPENAI_MODEL || "minimax/minimax-m3"
      if (model === "minimax/minimax-m3:free") {
        model = "minimax/minimax-m3"
      }
      const configuredMaxTokens = Number(process.env.OPENAI_MAX_TOKENS) || 8192

      const executeCompletion = async (targetModel: string, tokens: number) => {
        console.log(`Calling OpenAI/OpenRouter API (${targetModel}, max_tokens: ${tokens}) to generate GHL template for demo ${demoId}...`)
        
        const extraBody: Record<string, any> = {}
        if (targetModel.includes("minimax") || targetModel.includes("deepseek") || targetModel.includes("r1")) {
          // Limit reasoning effort so tokens are dedicated to actual HTML generation
          extraBody.reasoning = { effort: "minimal" }
        }

        const completion = await openai.chat.completions.create({
          model: targetModel,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userMessage },
          ],
          max_tokens: tokens,
          temperature: 0.1,
          // @ts-ignore
          extra_body: Object.keys(extraBody).length ? extraBody : undefined,
        })

        const choice = completion.choices[0]
        if (choice?.finish_reason === "length") {
          throw new Error(`Model ${targetModel} hit token limit (${tokens} tokens) and output was truncated.`)
        }

        let output = choice?.message?.content || ""

        // If content was empty/null but model put code inside reasoning, extract code from reasoning
        if (!output) {
          const reasoningText = (choice?.message as any)?.reasoning || ""
          const codeBlockMatch = reasoningText.match(/```(?:html|xml)?\s*([\s\S]*?)\s*```/i)
          if (codeBlockMatch && codeBlockMatch[1]) {
            output = codeBlockMatch[1]
          }
        }
        return output
      }

      try {
        rawOutput = await executeCompletion(model, configuredMaxTokens)
      } catch (err: any) {
        const errMsg = String(err?.message || "")
        console.warn(`OpenAI/OpenRouter call to ${model} failed:`, errMsg)

        // 1. If OpenRouter returned 402 with affordable token count, retry with what's affordable
        const affordMatch = errMsg.match(/can only afford (\d+)/i)
        if (affordMatch && affordMatch[1]) {
          const affordable = parseInt(affordMatch[1], 10)
          const retryTokens = Math.max(1500, Math.min(affordable - 250, configuredMaxTokens))
          console.log(`OpenRouter 402 credit threshold detected. Retrying ${model} with affordable max_tokens: ${retryTokens}...`)
          try {
            rawOutput = await executeCompletion(model, retryTokens)
          } catch (retryErr: any) {
            console.warn(`Retry with reduced tokens failed:`, retryErr?.message)
          }
        }

        // 2. If still no output (or output was truncated due to token limit, 402 credits, or 429 rate limit), fallback to verified free OpenRouter models with high token budget
        if (!rawOutput && (errMsg.includes("402") || errMsg.includes("credits") || errMsg.includes("429") || errMsg.includes("truncated") || err?.status === 402)) {
          const fallbackCandidates = [
            process.env.OPENAI_FALLBACK_MODEL,
            "google/gemma-4-31b-it:free",
            "deepseek/deepseek-v4-flash-0731:free",
          ].filter(Boolean) as string[]

          for (const fallbackModel of fallbackCandidates) {
            console.log(`Attempting fallback to free model (${fallbackModel}, max_tokens: 16384)...`)
            try {
              rawOutput = await executeCompletion(fallbackModel, 16384)
              if (rawOutput) break
            } catch (fallbackErr: any) {
              console.warn(`Fallback to ${fallbackModel} failed:`, fallbackErr?.message)
            }
          }

          if (!rawOutput) {
            throw new Error(
              `OpenRouter generation failed across primary and fallback models (${errMsg}). Please top up credits or try again.`
            )
          }
        } else if (!rawOutput) {
          throw err
        }
      }
    }

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
