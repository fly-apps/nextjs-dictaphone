import express from "express"
import expressWs from "express-ws"
import next from 'next'
import { parse } from 'url'
import * as db from './db.js'
import { connectToRedis, publish, subscribe } from './pubsub.js'

const { app, getWss } = expressWs(express())
const port = 3000

async function broadcast(clients = null) {
  const clips = await db.query('SELECT name, text FROM clips ORDER BY id')
  for (const wsClient of clients || getWss().clients) {
    try { wsClient.send(JSON.stringify(clips.rows)) } catch { };
  }
}

// Define web socket route
app.ws('/websocket', async ws => {
  // update client on a best effort basis
  try {
    broadcast([ws])
  } catch (error) {
    console.error(error)
  }

  // We don’t expect any messages on websocket, but log any ones we do get.
  ws.on('message', console.log)
})

const nextApp = next({ dev: process.env.NODE_ENV !== "production" })
nextApp.prepare().then(async () => {
  await connectToRedis()

  subscribe(broadcast);

  // route requests to Next.js; publish timestamp on PUT and DELETE
  let handler = nextApp.getRequestHandler()
  app.use(async (request, response) => {
    await handler(request, response, parse(request.url, true))

    if (request.method === 'PUT' || request.method === 'DELETE') {
      await publish()
    }
  })
})

// Start the server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
