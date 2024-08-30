import express from "express"
import expressWs from "express-ws"
import next from 'next'
import { createClient } from 'redis'
import { parse } from 'url'
import * as db from './db.js'

var dataClient = createClient({ url: process.env.REDIS_URL })
var subClient = dataClient.duplicate()

const { app, getWss } = expressWs(express())
const port = 3000

// Define web socket route
app.ws('/websocket', async ws => {
  // update client on a best effort basis
  try {
    const clips = await db.query('SELECT name, text FROM clips ORDER BY id')
    ws.send(JSON.stringify(clips.rows))
  } catch (error) {
    console.error(error)
  }

  // We don’t expect any messages on websocket, but log any ones we do get.
  ws.on('message', console.log)
})

const nextApp = next({ dev: process.env.NODE_ENV !== "production" })
nextApp.prepare().then(async () => {
  // Connect to Redis and subscribe to timestamp updates
  await dataClient.connect()

  dataClient.on('error', err => {
    console.error('Redis server error', err);
    process.exit(1);
  });

  await subClient.connect();

  subClient.on('error', err => {
    console.error('Redis server error', err);
    process.exit(1);
  });

  subClient.subscribe('dictaphone:timestamp', async _message => {
    const clips = await db.query('SELECT name, text FROM clips ORDER BY id')
    for (const wsClient of getWss().clients) {
      try { wsClient.send(JSON.stringify(clips.rows)) } catch { };
    }
  });

  // route requests to Next.js; publish timestamp on PUT and DELETE
  let handler = nextApp.getRequestHandler()
  app.use(async (request, response) => {
    await handler(request, response, parse(request.url, true))

    if (request.method === 'PUT' || request.method === 'DELETE') {
      dataClient.publish('dictaphone:timestamp', new Date().toISOString())
    }
  })
})

// Start the server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
