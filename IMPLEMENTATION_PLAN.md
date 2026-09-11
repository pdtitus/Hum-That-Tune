# Implementation Plan for the Lobby-First Backend and Frontend Rework

## Objective

Rebuild the game around a lobby-first multiplayer flow that matches the specification documented in [BACKEND_REORG_SPEC.md](BACKEND_REORG_SPEC.md). The goal is to keep the backend generic while aligning the frontend to a host/join flow, unique player names, team creation, host-only start control, and turn-based game play.

---

## Step 1: Rebuild the initial entry flow

### Goal

On first load, the user sees only:

- name input
- host or join selection

No other setup screens or game configuration should be visible before a valid join or host start occurs.

### Scope

- Remove legacy game setup UI from the default render state
- Keep the landing screen minimal and clear
- Add a host-created session flow
- Add a join-flow with validation
- Enforce unique names within the room

### Testing to confirm completion

1. Load the page and confirm only the name field and host/join controls are visible.
2. Host creates a room successfully with a valid name.
3. Join flow rejects an invalid or missing room code.
4. Duplicate player names in the same room are rejected.
5. A user cannot access game controls before joining successfully.

### Files involved

- [index.html](index.html)
- [app.js](app.js)
- [style.css](style.css)

---

## Step 2: Add the lobby as the room state model

### Goal

The room should move immediately into a lobby state after valid host or join.

### Scope

- Host is placed in lobby immediately after session creation
- Player is placed in lobby immediately after valid join
- Players can create and join teams
- Teams include basic metadata plus song option configuration
- Team details should be visible in team selection UI

### Testing to confirm completion

1. Host enters lobby directly after creating a room.
2. Player enters lobby after a valid join.
3. Host is forced to create the first team before the room is considered ready.
4. Team cards display team name, creator, and assigned song options.
5. A player can join an existing team or create a new one.

### Files involved

- [server.js](server.js)
- [app.js](app.js)
- [index.html](index.html)
- [style.css](style.css)

---

## Step 3: Enforce lobby waiting-state logic and host-only start

### Goal

No one except the host can trigger the game start.

### Scope

- Add clear lobby and ready states
- Add a host-only Start button
- Disable start actions for non-host players
- Prevent players from entering gameplay screens before the host starts the match

### Testing to confirm completion

1. Non-host players cannot start the game.
2. The host sees the start control and other players do not.
3. The lobby view persists until the host begins the match.
4. Start action transitions the room into gameplay state.

### Files involved

- [server.js](server.js)
- [app.js](app.js)

---

## Step 4: Build the turn-rotation engine

### Goal

Implement rotation rules that are fair and consistent with the specification.

### Scope

- Current team and current player are tracked in server state
- A player turn is one team turn only
- Team order rotates throughout the turn cycle
- Player sequence within each team rotates as turns progress
- A round is considered complete when each player has taken a turn at least once
- Uneven team sizes are handled without breaking this rule

### Testing to confirm completion

1. Trace a 2-team / 3-player scenario and confirm all players get at least one turn before the round ends.
2. Confirm only one player is active per team turn.
3. Confirm teams rotate in order.
4. Confirm turn progression remains deterministic and visible in shared state.

### Files involved

- [server.js](server.js)
- [app.js](app.js)

---

## Step 5: Split public and private visibility correctly

### Goal

The active player sees the song, while others see public state only.

### Scope

- Public state includes scoreboard, round, team order, and status
- Private state includes current song, artist, and any active-player-only metadata
- Backend event routing must support these views correctly
- The host should not leak song data to non-active players

### Testing to confirm completion

1. Current player sees the active song details.
2. Everyone else sees the scoreboard and waiting/turn status only.
3. Non-active players do not see hidden song information.
4. Host control state still updates the shared room state correctly.

### Files involved

- [server.js](server.js)
- [app.js](app.js)

---

## Step 6: Replace old setup screens with the new lobby/game flow

### Goal

Remove the legacy setup screens and build the new UI sequence around lobby-first state.

### Scope

- Replace game-setup screens with landing + lobby + waiting + active game screens
- Add a proper waiting state for joined players
- Add the active-player screen and scoreboard screen
- Clean up stale elements from the old setup system

### Testing to confirm completion

1. The landing page shows only the entry fields.
2. Joining a room moves the user to a lobby screen.
3. Waiting state is shown to non-hosts before start.
4. The active-player view replaces the waiting screen only at the correct time.

### Files involved

- [index.html](index.html)
- [style.css](style.css)
- [app.js](app.js)

---

## Step 7: End-to-end flow verification

### Goal

Verify the full user journey works from initial load to game completion.

### Validation sequence

1. Page loads with only name + host/join controls
2. Host creates a room
3. Host is forced to create first team
4. Host defines team song selections
5. A second user joins with a unique name
6. Player chooses or creates a team
7. Host starts the game
8. The active player sees the song
9. Other players see scoreboard status
10. Turn rotates by team and player as designed
11. Round finishes after all players have each had a chance
12. Game progresses to end screen

### Files involved

- [server.js](server.js)
- [app.js](app.js)
- [index.html](index.html)
- [style.css](style.css)

---

## Recommended execution order

1. Step 1
2. Step 2
3. Step 3
4. Step 4
5. Step 5
6. Step 6
7. Step 7

This order ensures each step delivers a verifiable user-facing state before additional game logic is layered on top.
