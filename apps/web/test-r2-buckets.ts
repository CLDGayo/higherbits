import { S3Client, ListBucketsCommand, CreateBucketCommand } from "@aws-sdk/client-s3"
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
    console.log("Listing buckets...")
    const command = new ListBucketsCommand({})
    const response = await s3Client.send(command)
    console.log("Buckets:", response.Buckets?.map(b => b.Name))
  } catch (error) {
    console.error("Error:", error)
  }
}

main()
