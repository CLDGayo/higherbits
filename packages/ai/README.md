# HigherBits MCP

HigherBits AI is the catalogue product. **HigherBits MCP** is its stdio MCP integration for compatible coding assistants.

This server exposes two tools:

- `search_higherbits_components` searches component metadata. It does not return source or consume a copy allowance.
- `get_higherbits_component_source` retrieves source from HigherBits after the API validates the user's key and copy allowance. The response carries component attribution/license information.

The server does not generate code, include a generative model, or inspect local project files. A connected assistant decides how to use returned metadata or source.

## Install in an MCP host

Create an API key while signed in to [HigherBits AI](https://higherbits.dev/magic/console). Keep it private; the MCP host passes it to this server through the `API_KEY` environment variable.

Use this configuration in a compatible MCP host (macOS/Linux):

```json
{
  "mcpServers": {
    "higherbits-mcp": {
      "command": "npx",
      "args": ["-y", "-p", "@higherbits-dev/cli@1.0.0", "higherbits-mcp"],
      "env": { "API_KEY": "YOUR_HIGHERBITS_API_KEY" }
    }
  }
}
```

On Windows, use `"cmd"` as the command and `["/c", "npx", "-y", "-p", "@higherbits-dev/cli@1.0.0", "higherbits-mcp"]` as the `args` array.

The server validates the key with `https://higherbits.dev/api/magic/check` at startup. Search uses `POST /api/search`; source retrieval uses `POST /api/mcp/component-source`. Search returns metadata only. Source retrieval is authorized and metered by HigherBits. Attribution and license information returned by the API must be retained when reusing source.

## Develop locally

Build from the repository root:

```sh
corepack pnpm --filter @higherbits-dev/cli build
```

## npm distribution

The public package is `@higherbits-dev/cli` and provides the `higherbits-mcp` executable. The installation configuration pins version `1.0.0` so clients do not silently change versions.
