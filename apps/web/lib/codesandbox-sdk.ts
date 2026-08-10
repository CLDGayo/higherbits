import { CodeSandbox } from "@codesandbox/sdk"
export * from "./sandbox-templates"

export const codesandboxSdk = new CodeSandbox(process.env.CSB_API_KEY!)
