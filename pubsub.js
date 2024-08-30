import { createClient } from 'redis'

const dataClient = createClient({ url: process.env.REDIS_URL })
const subClient = dataClient.duplicate()

export async function connectToRedis() {
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
}

export async function publish() {
  dataClient.publish('dictaphone:timestamp', new Date().toISOString())
}

export async function subscribe(callback) {
  subClient.subscribe('dictaphone:timestamp', callback)
}