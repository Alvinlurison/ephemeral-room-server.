// =====================================================================
// EPHEMERAL ROOM SERVER
// A WebSocket relay that holds rooms and messages ONLY in memory
// (a plain JS Map, living in RAM) — never a database, never a file,
// never written to disk anywhere in this file. When the last person
// leaves a room, that room's entry is deleted from the Map. Restart
// this server and everything currently in memory is gone — that's
// intentional, not a bug.
//
// This does not store message history either: a message is relayed
// to whoever is in the room AT THAT MOMENT and then this server
// forgets it immediately. Someone who joins a room after a message
// was sent will never see it — there is nothing to show them.
// =====================================================================

const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

// rooms: Map<pin, Set<ws>>  — pure RAM, no persistence of any kind.
const rooms = new Map();

function send(ws, payload){
if(ws.readyState === WebSocket.OPEN){
ws.send(JSON.stringify(payload));
}
}

function broadcastToRoom(pin, payload, exceptWs){
const members = rooms.get(pin);
if(!members) return;
members.forEach((memberWs) => {
if(memberWs !== exceptWs){
send(memberWs, payload);
}
});
}

function roomMemberCount(pin){
const members = rooms.get(pin);
return members ? members.size : 0;
}

wss.on("connection", (ws) => {

ws.pin = null;
ws.displayName = null;

ws.on("message", (raw) => {

let data;

try{
data = JSON.parse(raw);
}catch(error){
return; // ignore anything that isn't valid JSON
}

if(data.type === "join"){

const pin = String(data.pin || "").trim();
const name = String(data.name || "Anonymous").trim().slice(0, 20);

if(pin.length < 4){
send(ws, { type: "error", message: "PIN must be at least 4 characters." });
return;
}

ws.pin = pin;
ws.displayName = name;

if(!rooms.has(pin)){
rooms.set(pin, new Set());
}

rooms.get(pin).add(ws);

send(ws, { type: "joined", pin: pin, memberCount: roomMemberCount(pin) });

broadcastToRoom(pin, {
type: "presence",
event: "join",
name: name,
memberCount: roomMemberCount(pin)
}, ws);

return;

}

if(data.type === "message" && ws.pin){

// Relay only — nothing is stored or logged anywhere.
broadcastToRoom(ws.pin, {
type: "message",
sender: ws.displayName,
text: String(data.text || "").slice(0, 2000),
ttl: Number(data.ttl) || 30,
sentAt: Date.now()
}, ws);

return;

}

if(data.type === "leave"){
cleanupConnection(ws);
}

});

ws.on("close", () => {
cleanupConnection(ws);
});

});

function cleanupConnection(ws){

if(!ws.pin) return;

const members = rooms.get(ws.pin);

if(members){

members.delete(ws);

broadcastToRoom(ws.pin, {
type: "presence",
event: "leave",
name: ws.displayName,
memberCount: roomMemberCount(ws.pin)
});

// Instant purge: once the last person leaves, the room (and
// anything ever said in it) is gone from this server's memory.
if(members.size === 0){
rooms.delete(ws.pin);
}

}

ws.pin = null;
ws.displayName = null;

}

console.log("Ephemeral Room server running on port " + PORT);
