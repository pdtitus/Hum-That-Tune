# Game-Agnostic Session Host

The backend is a generic real-time session host. It does not know what a game is, how a game scores, or what any payload means. A frontend starts a session by providing a manifest and an initial opaque state object.

## Start the server

```sh
npm install
npm start
```

The default port is `3000`; set `PORT` to use another port.

## Create a session

`POST /api/sessions`

```json
{
  "manifest": {
    "name": "backtrack",
    "version": "1",
    "channels": [
      { "name": "public-events", "audience": "public" },
      { "name": "host-events", "audience": "host" },
      { "name": "clue-giver", "audience": "role", "role": "clue-giver" },
      { "name": "private-player", "audience": "player" }
    ]
  },
  "state": {
    "round": 1,
    "status": "lobby"
  }
}
```

The response contains a `sessionId`, a human-friendly `joinCode`, a private `hostToken`, and the WebSocket path. The server stores `manifest` and `state` as JSON without interpreting them.

## Join a session

`POST /api/sessions/:sessionId-or-joinCode/participants`

```json
{
  "name": "Alex",
  "role": "clue-giver"
}
```

The response contains a participant ID, a private reconnect token, and the WebSocket path. The frontend must keep the token private and use it when opening the participant's WebSocket connection.

Supported channel audiences are:

- `public`: every connected participant may publish and receive the event.
- `host`: only the host may publish or receive the event.
- `role`: participants with the declared role may publish or receive the event.
- `player`: targeted routing; events must include the destination participant ID in `to`.

## Join over WebSocket

Connect to `/ws/:sessionId-or-joinCode?token=TOKEN`.

The host uses `hostToken` from session creation. A player token is created by the frontend and supplied when it joins; the current server accepts that token as the player's stable reconnect credential.

On connection, the server sends:

```json
{
  "type": "connected",
  "participant": {
    "id": "...",
    "name": "Host",
    "role": "host",
    "isHost": true
  },
  "game": {},
  "state": {},
  "participants": []
}
```

The frontend can identify a connection with:

```json
{
  "type": "identify",
  "name": "Alex",
  "role": "clue-giver"
}
```

## State and events

Only the host can replace shared state:

```json
{
  "type": "state.replace",
  "state": {
    "round": 2,
    "status": "playing"
  }
}
```

The server broadcasts a `state` message containing the opaque state and the public participant list.

Any participant can publish to a channel they are authorized to access:

```json
{
  "type": "event",
  "channel": "public-events",
  "payload": {
    "type": "round.started",
    "round": 2
  }
}
```

For a private player channel, include the participant ID returned by the join endpoint:

```json
{
  "type": "event",
  "channel": "private-player",
  "to": "participant-id",
  "payload": {
    "type": "song.answer",
    "answer": "..."
  }
}
```

The server broadcasts the event to the channel's audience and does not inspect or transform `payload`.

## Important boundary

The frontend owns game semantics. For BackTrack, the frontend would decide that a song, score, or pass belongs in the state and would decide what event names and payloads mean. The generic server only owns:

- session identity and join codes
- participant connections
- channel audience enforcement
- host-only state replacement
- routing opaque event payloads

The current implementation stores active sessions in memory. A production deployment should replace the session map with a persistence adapter and use a shared pub/sub layer when multiple server processes are deployed.
