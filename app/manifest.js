export default function manifest() {
  return {
    "version": "0.1",
    "name": "Web dictaphone",
    "description": "A sample MDN app that uses getUserMedia and MediaRecorder API for recording audio snippets, and The Web Audio API for visualizations.",
    "launch_path": "/index.html",
    "icons": {
      "60": "app-icons/icon-60.png",
      "128": "app-icons/icon-128.png"
    },
    "developer": {
      "name": "Chris Mills",
      "url": "https://developer.mozila.org"
    },
    "locales": {
      "es": {
        "description": "A sample MDN app that uses getUserMedia and MediaRecorder API for recording audio snippets, and The Web Audio API for visualizations.",
        "developer": {
          "url": "https://developer.mozila.org"
        }
      },
      "it": {
        "description": "A sample MDN app that uses getUserMedia and MediaRecorder API for recording audio snippets, and The Web Audio API for visualizations.",
        "developer": {
          "url": "https://developer.mozila.org"
        }
      }
    },
    "default_locale": "en",
    "permissions": {
      "audio-capture": {
        "description": "Required to capture audio via getUserMedia"
      }
    },
    "orientation": "portrait"
  }

}