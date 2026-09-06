import { hasUserPurchasedDemo } from "@/lib/api/server/demos"
import { getComponentInstallPrompt } from "@/lib/prompts"
import {
  resolveRegistryDependenciesV2,
  transformToFlatDependencyTree,
} from "@/lib/registry"
import { PromptType, PROMPT_TYPES } from "@/types/global"
import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function fetchCode(urlOrCode: string) {
  if (!urlOrCode) {
    return ""
  }
  if (!urlOrCode.startsWith("http://") && !urlOrCode.startsWith("https://")) {
    return urlOrCode
  }
  try {
    const response = await fetch(urlOrCode)
    if (!response.ok) {
      console.error(`Failed to fetch code from ${urlOrCode}:`, response.statusText)
      throw new Error(`Failed to fetch code: ${response.statusText}`)
    }
    return response.text()
  } catch (error) {
    console.error(`Error fetching or parsing URL ${urlOrCode}:`, error)
    // If it still failed, it might be raw code that somehow contains http/https
    return urlOrCode
  }
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key")
  const internalToken = request.headers.get("x-internal-token")
  const isInternalRequest = internalToken === process.env.INTERNAL_API_SECRET

  if (!isInternalRequest && !apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 401 })
  }

  if (!isInternalRequest && apiKey) {
    const { data: keyCheck, error: keyError } = await supabase.rpc(
      "check_api_key",
      { api_key: apiKey },
    )

    if (keyError || !keyCheck?.valid) {
      return NextResponse.json(
        { error: keyCheck?.error || "Invalid API key" },
        { status: 401 },
      )
    }
  }

  try {
    const body = await request.json()
    const { prompt_type, demo_id, rule_id, additional_context } = body
    const { userId } = await auth()

    const hasPurchased = await hasUserPurchasedDemo(userId, demo_id)
    if (!hasPurchased) {
      return NextResponse.json(
        { error: "Component not purchased" },
        { status: 403 },
      )
    }

    console.log("Received request:", {
      prompt_type,
      demo_id,
      rule_id,
      additional_context,
    })

    if (!prompt_type || !demo_id) {
      return NextResponse.json(
        { error: "prompt_type and demo_id are required" },
        { status: 400 },
      )
    }

    console.log("Fetching demo data for:", demo_id)

    // Fetch component data from Supabase
    const { data: demo, error: demoError } = await supabase
      .from("demos")
      .select(
        `
        *,
        component:components(*),
        user:users(username)
      `,
      )
      .eq("id", demo_id)
      .single()

    if (demoError) {
      console.error("Demo fetch error:", demoError)
      return NextResponse.json(
        { error: "Error fetching demo data" },
        { status: 500 },
      )
    }

    if (!demo) {
      return NextResponse.json({ error: "Demo not found" }, { status: 404 })
    }

    if (!demo.component) {
      return NextResponse.json(
        { error: "Component data not found" },
        { status: 404 },
      )
    }

    if (!demo.demo_code || !demo.component.code) {
      return NextResponse.json(
        { error: "Demo or component code is missing" },
        { status: 400 },
      )
    }

    const [demoCode, componentCode, tailwindConfig, globalCss, indexCss] =
      await Promise.all([
        fetchCode(demo.demo_code),
        fetchCode(demo.component.code),
        fetchCode(demo.component.tailwind_config_extension),
        fetchCode(demo.component.global_css_extension),
        fetchCode(demo.component.index_css_url),
      ])

    const resolvedComponentRegistryDependencies =
      await resolveRegistryDependenciesV2(
        demo?.component?.direct_registry_dependencies,
      )

    const resolvedDemoRegistryDependenciesK =
      await resolveRegistryDependenciesV2(
        demo?.demo_direct_registry_dependencies,
      )

    console.log(
      "Resolved component registry dependencies:",
      resolvedComponentRegistryDependencies,
    )
    console.log(
      "resolvedDemoRegistryDependencies,",
      resolvedDemoRegistryDependenciesK,
    )

    const transformedFlatRegistryDependencies = {
      ...transformToFlatDependencyTree(resolvedComponentRegistryDependencies),
      ...transformToFlatDependencyTree(resolvedDemoRegistryDependenciesK),
    }

    const resolvedFlatRegistryDependencies = Object.values(
      transformedFlatRegistryDependencies,
    ).reduce(
      (acc, component) => {
        acc[component.fullSlug] = component.code || ""
        return acc
      },
      {} as Record<string, string>,
    )
    const npmDependenciesOfRegistryDependencies = Object.values(
      transformedFlatRegistryDependencies,
    ).reduce(
      (acc, component) => {
        Object.entries(component.dependencies).forEach(([key, value]) => {
          acc[key] = value
        })
        return acc
      },
      {} as Record<string, string>,
    )

    console.log(
      "Resolved flat registry dependencies:",
      resolvedFlatRegistryDependencies,
    )

    // If rule_id is provided, fetch the rule template
    let ruleData = null
    if (rule_id) {
      console.log("Fetching rule template for rule_id:", rule_id)
      const { data: rule, error: ruleError } = await supabase
        .from("prompt_rules")
        .select("tech_stack, theme, additional_context")
        .eq("id", rule_id)
        .single()

      if (ruleError) {
        console.error("Error fetching rule:", ruleError)
      }

      if (rule) {
        console.log("Found rule data:", JSON.stringify(rule, null, 2))
        ruleData = rule
      }
    }

    // Generate base prompt
    const promptParams = {
      promptType: prompt_type as PromptType,
      codeFileName: (demo.component.component_slug || "component") + ".tsx",
      demoCodeFileName: demo.file_name || "demo.tsx",
      code: componentCode,
      demoCode: demoCode,
      npmDependencies: demo.component.dependencies || {},
      npmDependenciesOfRegistryDependencies:
        npmDependenciesOfRegistryDependencies,
      registryDependencies: resolvedFlatRegistryDependencies,
      // TODO: aggregate tailwind config from all dependencies
      tailwindConfig: tailwindConfig,
      // TODO: aggregate global css from all dependencies
      globalCss: globalCss,
      indexCss: indexCss,
      userAdditionalContext: additional_context,
      ...(ruleData && {
        promptRule: {
          id: rule_id,
          user_id: "",
          name: "",
          tech_stack: ruleData.tech_stack,
          theme: ruleData.theme,
          additional_context: ruleData.additional_context,
          created_at: "",
          updated_at: "",
        },
      }),
    }

    let prompt = ""

    if (prompt_type === PROMPT_TYPES.GOHIGHLEVEL) {
      if (demo.ghl_html_content) {
        prompt = demo.ghl_html_content
        console.log("Returned pre-generated HTML for GHL template.")
      } else {
        return NextResponse.json(
          { error: "GoHighLevel template is still generating or not available. Please wait a moment or try again later." },
          { status: 400 },
        )
      }
    } else {
      // Fallback to standard prompt generation for all AI types
      if (!prompt) {
        prompt = getComponentInstallPrompt(promptParams)
        console.log("Generated prompt content:", prompt.substring(0, 500) + "...")
        console.log("Base prompt generated")
      }
    }

    return NextResponse.json({
      prompt,
      debug: {
        ruleApplied: !!ruleData,
        contextApplied: !!(additional_context || ruleData?.additional_context),
      },
    })
  } catch (error) {
    console.error("Full error details:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
