"use client"

import { Code } from "@/components/ui/code"
import { PROMPT_TYPES } from "@/types/global"

export function ApiDocs() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Search returns metadata only and is unmetered. Source exports share two free copies
        per day across code, prompts, CLI and MCP, resetting at 00:00 UTC. Pro copies are
        unlimited; component access permissions still apply.
      </p>
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Authentication</h2>
        <Code code="Authorization: Bearer your_api_key_here" language="text" display="block" fontSize="sm" />
        <p className="text-sm text-muted-foreground">Send credentials in headers, never in URLs.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Search metadata — POST /api/search</h2>
        <Code code={JSON.stringify({search:"hero section",page:1,per_page:20},null,2)} language="json" display="block" fontSize="sm" />
        <Code code={JSON.stringify({results:[{demo_id:123,component_id:456,name:"Default",component_data:{id:456,name:"Animated hero",description:"An animated hero"}}],metadata:{pagination:{page:1,per_page:20,total:1,total_pages:1}}},null,2)} language="json" display="block" fontSize="sm" />
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Copy prompt — POST /api/prompts</h2>
        <Code code={JSON.stringify({prompt_type:PROMPT_TYPES.EXTENDED,demo_id:123,requestId:"f47ac10b-58cc-4372-a567-0e02b2c3d479"},null,2)} language="json" display="block" fontSize="sm" />
        <p className="text-sm text-muted-foreground">Returns a prompt string. Use a fresh UUID for each intentional copy; reuse it only when retrying the same request within two minutes.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-medium">MCP source — POST /api/mcp/component-source</h2>
        <Code code={JSON.stringify({componentId:456,demoId:123,requestId:"f47ac10b-58cc-4372-a567-0e02b2c3d479"},null,2)} language="json" display="block" fontSize="sm" />
        <p className="text-sm text-muted-foreground">Returns authorized files and dependencies. MCP tools: search_higherbits_components for metadata, get_higherbits_component_source for one source copy.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Install — POST /api/copy-grants</h2>
        <p className="text-sm text-muted-foreground">Send componentId and a fresh requestId UUID. The returned registryUrl works with shadcn@4.15.0 and expires after five minutes. Issuing or copying the command is free; its first source release uses one copy. One complete CLI retry is supported. Keep the capability URL private.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Errors</h2>
        <p className="text-sm text-muted-foreground">401: sign in or check API key. 403/404: source unavailable. 409: changed target or reused issuance ID. 410: expired command. 429: daily, issuance or retry limit reached. 503: temporarily unavailable. Failed preparation does not use a copy; failed clipboard or network delivery after admission may use one.</p>
      </section>
    </div>
  )
}
