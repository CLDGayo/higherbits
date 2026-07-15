import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"
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
    console.log("Listing bucket contents...")
    const command = new ListObjectsV2Command({
      Bucket: "21st-dev", // Or wait, what is the bucket name?
    })
    const response = await s3Client.send(command)
    console.log("Files:", response.Contents?.slice(0, 10).map(c => c.Key))
  } catch (error) {
    console.error("Error:", error)
  }
}

main()
