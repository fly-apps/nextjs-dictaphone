import { notFound } from 'next/navigation'
import { NextResponse } from 'next/server'
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { buffer } from 'node:stream/consumers'
import * as db from '../../../db.js'
import { publish } from '../../../pubsub.js'

const S3 = new S3Client()

export async function GET(request) {
  try {
    const name = decodeURIComponent(request.nextUrl.pathname.split('/')[2])

    const data = await S3.send(new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: name
    }))

    let headers = { "Content-Type": data.ContentType }

    let range = request.headers.range || "bytes=0-"
    let positions = range.replace(/bytes=/, "").split("-")
    let start = positions[0] ? parseInt(positions[0]) : 0
    let end = positions[1] ? parseInt(positions[1]) : data.ContentLength - 1
    if (start > 0 || end < data.ContentLength - 1) {
      end = Math.min(end, data.ContentLength - 1)
      if (end < start) return new NextResponse({ status: 416 })

      headers["Content-Range"] = `bytes ${start}-${end}/${data.ContentLength}`
      headers["Accept-Ranges"] = "bytes"
      headers["Content-Length"] = end - start + 1
      return new NextResponse(
        (await data.Body.transformToByteArray()).slice(start, end + 1),
        { headers, status: 206 }
      )
    } else {
      return new NextResponse(data.Body, { headers })
    }
  } catch (err) {
    if (err.name === "NoSuchKey") return notFound()
    console.error(err)
    console.error(err.stack)
    return NextResponse.json(err, { status: 500, headers: { "Content-Type": "application/json" } })
  }
}

export async function PUT(request) {
  try {
    const name = decodeURIComponent(request.nextUrl.pathname.split('/')[2])

    const data = await S3.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: name,
      Body: await buffer(request.body),
      ContentType: request.headers["content-type"]
    }))

    await db.query("INSERT INTO clips (name) VALUES ($1)", [name])

    if (process.env.WHISPER_URL) transcribe(name)

    return Response.json(data)
  } catch (err) {
    console.error(err)
    console.error(err.stack)
    return NextResponse.json(err, { status: 500, headers: { "Content-Type": "application/json" } })
  }
}

export async function DELETE(request) {
  try {
    const name = decodeURIComponent(request.nextUrl.pathname.split('/')[2])

    const data = await S3.send(new DeleteObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: name
    }))

    await db.query("DELETE FROM clips WHERE name = $1", [name])

    return Response.json(data)
  } catch (err) {
    console.error(err)
    console.error(err.stack)
    return NextResponse.json(err, { status: 500, headers: { "Content-Type": "application/json" } })
  }
}

async function transcribe(name) {
  // Fetch the presigned URL to download this clip
  let clip_url = await getSignedUrl(
    S3,
    new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: name
    }),
    { expiresIn: 3600 }
  )

  // Send the clip to the Whisper API for transcription
  let input = { audio: clip_url }
  let response = await fetch(process.env.WHISPER_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input })
  })
  let results = await response.json()

  // Update the database with the transcription
  await db.query(
    "UPDATE clips SET text = $1 WHERE name = $2",
    [results.output.transcription, name]
  )

  // Publish the update to all clients
  await publish()
}