"use server"
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { auth } from "@clerk/nextjs/server"
import path from "path"
import dotenv from "dotenv"
import { processUploadBuffer } from "./upload-security"
import { assertOwnsR2Path } from "./r2-ownership"

dotenv.config({ path: path.resolve(process.cwd(), ".env") })

let _r2ClientInstance: S3Client | null = null

function getR2Client(): S3Client {
  if (!_r2ClientInstance) {
    if (
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY ||
      !process.env.NEXT_PUBLIC_R2_ENDPOINT
    ) {
      throw new Error(
        "R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and NEXT_PUBLIC_R2_ENDPOINT must be set",
      )
    }

    _r2ClientInstance = new S3Client({
      region: "auto",
      endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      },
    })
  }
  return _r2ClientInstance
}

async function sendWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string,
): Promise<T> {
  let timer: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Timeout after ${timeoutMs}ms: ${operationName}`))
    }, timeoutMs)
  })
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timer!)
  }
}

/**
 * Deletes every object under `prefix`. Used to clean up an artifact's objects
 * when the artifact row goes away (P11-D1).
 *
 * Returns the number of objects deleted, so a caller can log something more
 * useful than "done".
 *
 * **The trailing-slash guard is not decoration.** `Prefix: ""` matches every
 * object in the bucket, and a prefix missing its slash matches sibling keys by
 * string prefix - `ascii/u/artifact1` would also match `ascii/u/artifact10/…`.
 * This function issues bulk deletes, so a prefix bug here empties a production
 * bucket. It refuses rather than trusting its caller.
 */
/**
 * "use server" makes every export in this file a browser-callable RPC, so each
 * one must establish identity itself — an unauthenticated caller could
 * otherwise mint arbitrary R2 write URLs or delete arbitrary prefixes.
 */
const requireUser = async () => {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  return userId
}

export const deleteR2Prefix = async ({
  prefix,
  bucketName,
}: {
  prefix: string
  bucketName: string
}): Promise<number> => {
  const userId = await requireUser()
  await assertOwnsR2Path(userId, prefix, bucketName)

  if (!prefix || !prefix.endsWith("/") || prefix.startsWith("/")) {
    throw new Error(
      `Refusing to delete R2 prefix ${JSON.stringify(prefix)}: must be non-empty and end with "/"`,
    )
  }

  let deleted = 0
  let continuationToken: string | undefined

  do {
    const client = getR2Client()
    const listed = await sendWithTimeout(
      client.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      ),
      15000,
      `ListObjectsV2(${prefix})`,
    )

    const objects = (listed.Contents ?? [])
      .map((object) => object.Key)
      .filter((key): key is string => Boolean(key))
      // Belt and braces: the API should only ever return keys under Prefix,
      // but a bulk delete is not the place to assume that.
      .filter((key) => key.startsWith(prefix))
      .map((Key) => ({ Key }))

    if (objects.length > 0) {
      await sendWithTimeout(
        client.send(
          new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: { Objects: objects, Quiet: true },
          }),
        ),
        15000,
        `DeleteObjects(${objects.length})`,
      )
      deleted += objects.length
    }

    continuationToken = listed.IsTruncated
      ? listed.NextContinuationToken
      : undefined
  } while (continuationToken)

  return deleted
}

export const uploadToR2 = async ({
  file,
  fileKey,
  bucketName,
  contentType = "text/plain",
}: {
  file: {
    name: string
    type: string
    textContent?: string
    encodedContent?: string
  }
  fileKey: string
  bucketName: string
  contentType?: string
}): Promise<string> => {
  console.log(`[R2] uploadToR2 starting for fileKey="${fileKey}", bucket="${bucketName}"`)
  const userId = await requireUser()
  await assertOwnsR2Path(userId, fileKey, bucketName)

  try {
    if (!file.textContent && !file.encodedContent) {
      throw new Error("textContent or encodedContent must be provided")
    }

    const rawBuffer = file.textContent
      ? Buffer.from(file.textContent, "utf-8")
      : Buffer.from(file.encodedContent!, "base64")

    const { sanitizedBuffer, contentType: verifiedContentType } =
      await processUploadBuffer({
        buffer: rawBuffer,
        fileName: file.name,
        declaredContentType: contentType || file.type,
      })

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: sanitizedBuffer,
      ContentType: verifiedContentType,
    })

    const client = getR2Client()
    await sendWithTimeout(client.send(command), 20000, `uploadToR2(${fileKey})`)

    const resultUrl = `${process.env.NEXT_PUBLIC_CDN_URL}/${fileKey}`
    console.log(`[R2] uploadToR2 succeeded: ${resultUrl}`)
    return resultUrl
  } catch (error) {
    console.error(`[R2] Error uploading to R2 (${fileKey}):`, error)
    throw error
  }
}

export const generatePresignedUrl = async ({
  fileKey,
  bucketName,
  contentType = "text/plain",
  expiresIn = 3600, // URL expires in 1 hour by default
}: {
  fileKey: string
  bucketName: string
  contentType?: string
  expiresIn?: number
}): Promise<string> => {
  const userId = await requireUser()
  await assertOwnsR2Path(userId, fileKey, bucketName)

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: contentType,
    })

    const client = getR2Client()
    const presignedUrl = await getSignedUrl(client, command, { expiresIn })
    return presignedUrl
  } catch (error) {
    console.error("Error generating presigned URL:", error)
    throw error
  }
}
