import { notFound } from 'next/navigation'
import { NextResponse } from 'next/server'
import { S3, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

export async function GET(request) {
  try {
    const data = await S3.send(new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: request.params.name
    }))

    let headers = { "Content-Type": data.ContentType }

    let { start, end } = request.range()[0] || {}
    if (end) {
      end = Math.min(end, data.ContentLength - 1)
      if (end < start) return new NextResponse({ status: 416 })

      headers["Content-Range"] = `bytes ${start}-${end}/${data.ContentLength}`
      headers["Accept-Ranges"] = "bytes"
      headers["Content-Length"] = end - start + 1
      return new NextResponse(await data.Body.transformToByteArray(), { headers, status: 206 })
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
    const data = await S3.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: request.params.name,
      Body: request.body,
      ContentType: request.headers["content-type"]
    }))

    await db.query("INSERT INTO clips (name) VALUES ($1)", [request.params.name])

    return new NextResponse.json(data)
  } catch (err) {
    console.error(err)
    console.error(err.stack)
    return NextResponse.json(err, { status: 500, headers: { "Content-Type": "application/json" } })
  }
}

export async function DELETE(request) {
  try {
    const data = await S3.send(new DeleteObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: request.params.name
    }))

    await db.query("DELETE FROM clips WHERE name = $1", [request.params.name])

    return new NextResponse.json(data)
  } catch (err) {
    console.error(err)
    console.error(err.stack)
    return NextResponse.json(err, { status: 500, headers: { "Content-Type": "application/json" } })
  }
}
