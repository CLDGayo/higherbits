# HigherBits MCP

HigherBits AI is the catalogue product. **HigherBits MCP** is its stdio MCP integration for compatible coding assistants.

This server exposes two tools:

- `search_higherbits_components` searches component metadata. It does not return source or consume a copy allowance.
- `get_higherbits_component_source` retrieves source from HigherBits after the API validates the user's key and copy allowance. The response carries component attribution/license information.

The server does not generate code, include a generative model, or inspect local project files. A connected assistant decides how to use returned metadata or source.

## Local workspace setup

Build from the repository root:

```sh
corepack pnpm --filter @higherbits-dev/cli build
```

Configure the MCP host to launch the generated `packages/ai/dist/index.js` with Node and set `API_KEY` to an API key created by the signed-in user in HigherBits AI. For example:

```json
{
  "mcpServers": {
    "higherbits-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/higherbits/packages/ai/dist/index.js"],
      "env": { "API_KEY": "YOUR_HIGHERBITS_API_KEY" }
    }
  }
}
```

The server checks the key with `https://higherbits.dev/api/magic/check` on startup. Search uses `POST /api/search`; source retrieval uses `POST /api/mcp/component-source`. Do not share or commit an API key.

## npm distribution

The workspace package identity remains `@higherbits-dev/cli` for compatibility. This checkout declares version `1.0.0` and also provides the `higherbits-mcp` executable. Verify the live npm package, its owner, and released version before distributing an `npx` installation command or publishing a new version.
