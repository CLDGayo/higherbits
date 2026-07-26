import { CodeSandbox } from "@codesandbox/sdk"
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.join(__dirname, ".env") })
dotenv.config({ path: path.join(__dirname, ".env.local") })

async function main() {
  const sdk = new CodeSandbox(process.env.CSB_API_KEY!)
  console.log("Starting sandbox...")
  try {
    const data = await sdk.sandbox.start("hv8wgy")
    console.log("Success:", data)
  } catch (err) {
    console.error("Error:", err)
  }
}

main()
