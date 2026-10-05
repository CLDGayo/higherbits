export type IdeOption = "cursor" | "windsurf" | "cline"
export type OsType = "windows" | "mac" | "linux"

export const createPlatformCommand = (args: string[], osType: OsType = "mac") =>
  osType === "windows" ? { command: "cmd", args: ["/c", "npx", ...args] } : { command: "npx", args }

export const getMcpConfig = (apiKey: string, osType: OsType = "mac") => ({
  ...createPlatformCommand(["-y", "@higherbits-dev/cli@latest"], osType),
  env: { API_KEY: apiKey },
})

export const getMcpConfigJson = (apiKey: string, osType: OsType = "mac"): string =>
  JSON.stringify({ mcpServers: { "@higherbits-dev/cli": getMcpConfig(apiKey, osType) } }, null, 2)

// Compatibility name: this stdio package provides no installer subcommand.
export const getInstallCommand = (_ide: IdeOption, apiKey: string, osType: OsType = "mac") =>
  getMcpConfigJson(apiKey, osType)
