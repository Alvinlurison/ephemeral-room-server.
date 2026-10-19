# Ephemeral Room Server

A tiny WebSocket relay — RAM only, no database, no files written. Rooms
and messages disappear from the server's memory the instant the last
person leaves.

## Test it on your own computer first

You need [Node.js](https://nodejs.org) installed (version 18+).

```
npm install
npm start
```

You should see: `Ephemeral Room server running on port 8080`

Now open `ephemeral-room.html` in two browser tabs, leave the Server
Address as `ws://localhost:8080`, join both with the same PIN, and
chat between them. This also works across two different computers on
the same WiFi network if you use your computer's local IP address
instead of `localhost` (e.g. `ws://192.168.1.42:8080`).

## Deploy it for real (so it works from anywhere, any device)

GitHub Pages can't run this — it only hosts static files. You need a
host that runs actual Node.js servers. Free options that work well for
something this small:

**Render.com** (recommended, simplest):
1. Push this `ephemeral-server` folder to its own GitHub repo
2. On Render: New → Web Service → connect that repo
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Once deployed, Render gives you a URL like
   `https://your-app-name.onrender.com` — your WebSocket address is
   the same thing with `wss://` instead of `https://`:
   `wss://your-app-name.onrender.com`
6. Paste that into "Server Address" on the join screen instead of
   `ws://localhost:8080`

**Railway.app** and **Fly.io** work the same way — push the repo,
point it at `npm start`, use the `wss://` version of whatever URL they
give you.

Free tiers on these platforms often "sleep" the server after a period
of inactivity and take a few seconds to wake back up on the next
connection — normal, not a bug, and fine for a project like this.
