import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

async function main() {
  try {
    console.log("Checking if file exists in components-code bucket...")
    const command = new HeadObjectCommand({
      Bucket: "components-code",
      Key: "cozy_downloads/test/code.1784013246371.tsx"
    })
    const response = await s3Client.send(command)
    console.log("File exists! ContentLength:", response.ContentLength)
  } catch (error) {
    console.error("Error:", error)
  }
}

main()
