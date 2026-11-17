export type IdeOption = "cursor" | "windsurf" | "cline"
export type OsType = "windows" | "mac" | "linux"

export const MCP_SERVER_NAME = "higherbits-mcp"
export const MCP_PACKAGE_NAME = "@higherbits-dev/cli"
export const MCP_EXECUTABLE_NAME = "higherbits-mcp"

export const createPlatformCommand = (
  args: string[],
  osType: OsType = "mac",
) =>
  osType === "windows"
    ? { command: "cmd", args: ["/c", "npx", ...args] }
    : { command: "npx", args }

export const getMcpConfig = (apiKey: string, osType: OsType = "mac") => ({
  ...createPlatformCommand(
    ["-y", "-p", `${MCP_PACKAGE_NAME}@latest`, MCP_EXECUTABLE_NAME],
    osType,
  ),
  env: { API_KEY: apiKey },
})

export const getMcpConfigJson = (
  apiKey: string,
  osType: OsType = "mac",
): string =>
  JSON.stringify(
    { mcpServers: { [MCP_SERVER_NAME]: getMcpConfig(apiKey, osType) } },
    null,
    2,
  )

// Compatibility name: this stdio package provides no installer subcommand.
export const getInstallCommand = (
  _ide: IdeOption,
  apiKey: string,
  osType: OsType = "mac",
) => getMcpConfigJson(apiKey, osType)
