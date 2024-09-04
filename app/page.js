'use client'

import { dictaphone, deleteAction, renameAction } from "./dictaphone.js"
import React, { useEffect } from 'react'
import useWebSocket from "react-use-websocket"

export default function Home() {
  useEffect(() => { dictaphone() }, []);

  let lastJsonMessage = []
  if (typeof window !== 'undefined') {
    let protocol = window.location.protocol.replace('http', 'ws')

    lastJsonMessage = useWebSocket.default(
      `${protocol}//${window.location.host}/websocket`,
      {
        share: false,
        shouldReconnect: () => true,
        reconnectAttempts: Infinity
      },
    ).lastJsonMessage
  }

  return <>
    <div className="wrapper">
      <header>
        <h1>Web dictaphone</h1>
      </header>

      <section className="main-controls">
        <canvas className="visualizer" height="60px"></canvas>
        <div id="buttons">
          <button className="record">Record</button>
          <button className="stop">Stop</button>
        </div>
      </section>

      <section className="sound-clips">
        {(lastJsonMessage || []).map(clip => (
          <article className="clip">
            <audio controls src={`/audio/${encodeURI(clip.name)}`} preload="none"></audio>
            <p onClick={renameAction}>{clip.name}</p>
            <button className="delete" onClick={deleteAction}>Delete</button>
            <p className="text">{clip.text}</p>
          </article>
        ))}
      </section>
    </div>

    <label htmlFor="toggle">❔</label>
    <input type="checkbox" id="toggle" />
    <aside>
      <h2>Information</h2>

      <p><a href="https://github.com/mdn/dom-examples/tree/main/media/web-dictaphone#web-dictaphone">Web dictaphone</a> is built using <a href="https://developer.mozilla.org/en-US/docs/Web/API/Navigator.getUserMedia">getUserMedia</a> and the <a href="https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder_API">MediaRecorder API</a>, which provides an easier way to capture Media streams.</p>

      <p>Icon courtesy of <a href="http://findicons.com/search/microphone">Find Icons</a>. Thanks to <a href="http://soledadpenades.com/">Sole</a> for the Oscilloscope code!</p>

      <hr />

      <p><a href="https://github.com/fly-apps/nextjs-dictaphone?tab=readme-ov-file#web-dictaphone-adapted-for-flyio">Next.js Dictaphone</a> adds:</p>

      <ul>
        <li><p>An <a href="https://nextjs.org/">Next.js</a> application with support for GET, POST, DELETE; including ranges</p></li>
        <li><p>A <a href="https://www.postgresql.org/">PostgreSQL</a> database to persist an ordered list of clips</p></li>
        <li><p>A <a href="https://www.tigrisdata.com/">Tigris</a> bucket for storing audio files</p></li>
        <li><p>An <a href="https://upstash.com/">Upstash</a> Redis db and <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API">WebSockets</a> for broadcasting updates</p></li>
      </ul>

      <p>Multiple replicas of this application can be deployed, even in multiple regions.</p>

      <hr />

      <p>When <code>WHISPER_URL</code> is set:</p>

      <ul>
        <li><p>Clips that are stored in S3 Tigris will be sent to the <a href="https://github.com/rubys/cog-whisper/?tab=readme-ov-file#whisper-on-fly-gpus">Cog Whisper</a> application for transcription.</p></li>
        <li><p>Transcription results will be stored in the PostgreSQL database.</p></li>
        <li><p>Database updates will be broadcast to all connected clients.</p></li>
      </ul>
    </aside>
  </>
}
