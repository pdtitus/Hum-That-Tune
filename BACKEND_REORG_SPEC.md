# Backend Reorganization and Frontend Flow Specification

## Problems observed

The current multiplayer backend and frontend are misaligned with the desired game flow.

### Current issues

- The host start flow no longer works because the frontend still contains legacy setup logic that was not reworked for the backend model.
- The backend is currently generic but the client still assumes old team setup semantics and custom game configuration screens.
- The backend is not designed for team customization or per-team song catalogs yet.
- The frontend exposes options too early, before the player has joined a session and been assigned a valid role/team context.
- The old start-game flow does not match the required host-then-team-join workflow.
- The identity model is too loose: there is no enforced name uniqueness within an active session or player gate before the game begins.

## Desired behavior

### 1) Initial page load

On initial load, the user should see only:

- name input
- host or join selection

No other game configuration or team controls should be visible before a valid join or host setup is completed.

### 2) Host flow

When a user chooses to host:

- they enter a display name
- they create a session
- they are assigned host privileges
- they are placed into the lobby state
- no additional options are shown until they have a valid session

The host must be forced to create the first team immediately after entering the lobby. That first team becomes the initial team in the lobby and is required before the room is ready for other players to join or start.

The host should then be able to:

- see the lobby
- see connected players and teams
- create additional teams
- define or assign songs/options for their own team
- start the game only when ready

### 3) Join flow

When a user chooses to join:

- they enter a name
- they submit a join code
- they are validated against the room
- the system checks that the chosen display name is unique within that active game
- if the name already exists, the user is rejected or prompted to choose another name

Once accepted,

- the player is placed in the waiting lobby
- they see available teams to join or the option to create and name a new team
- they cannot start the game
- they cannot access game setup beyond lobby actions

### 4) Team selection and creation

Once a player has successfully joined:

- the lobby shows a list of existing teams
- each team listing briefly displays:
  - team name
  - team owner / creator name
  - configured song selections or song options
- the player can choose an existing team to join
- the player can create a new team with a custom team name

When a player creates a team, they should then immediately define or assign the song options for that team. This must be part of team creation and should be visible in the team list that other players use to decide whether to join.

This should be stored as part of the lobby state, not only in the local browser.

### 5) Waiting state and host-only start

After a player has joined or created a team:

- they enter a waiting state
- the host is the only user that should have a visible start button
- players may be waiting in lobby view, not in active game screens
- host can start the game only when the room is ready

### 6) Active game flow

Once the host starts the game:

- the game rotates team by team each turn
- during a team’s turn, exactly one player is designated as the current player for that team
- the active player sees the current song detail
- all other players see a scoreboard or waiting status rather than the active song
- songs should be selected according to the team’s configured options
- each team has its own available song choices or filters
- the game continues until the round limit is reached

### 7) Round and turn model

The game should operate as a turn-based multiplayer structure:

- round limit is configured by the host
- a round consists of each player getting a chance to be the current player at least once
- the team order rotates from one turn to the next
- the player order within a team rotates as turns progress
- a team turn should involve only one player before the next team takes a turn
- for uneven team sizes, the round should continue until all players have had at least one turn, even if the team count is different
- only the current player should see the active song
- everyone else sees the scoreboard and round state
- the game continues until the configured round limit is reached

## Backend restructure requirements

The current backend is generic and session-based, but it needs higher-level state support for:

- active room/lobby state
- player identity validation
- team membership
- team creation and team naming
- team-specific song selection configuration
- turn ownership
- round and score state
- per-player/private visibility rules

### Specific backend responsibilities

The backend should own or coordinate:

- session creation and join validation
- room-level player registry
- unique-name enforcement per room
- team creation and join operations
- distribution of lobby state
- host-only lifecycle actions such as starting the match
- turn rotation data
- shared game state updates
- public scoreboard state to all players
- private song visibility to only the current player

### Frontend responsibilities

The frontend should own:

- screen transitions
- lobby rendering
- team and player UIs
- local interaction flow
- song selection logic based on team settings
- user-facing scoreboard and turn state

The frontend should not rely on the old setup screens or legacy game-setup assumptions.

## Scope of the next implementation

The next implementation should replace the existing startup flow with a lobby-first multiplayer model:

1. load page
2. name + host/join selection
3. room validation and unique-name enforcement
4. team list or create-team flow
5. waiting state
6. host starts game
7. current-player/song-private view and team rotation
8. round completion and game end

This is the product model the backend and frontend should be structured around going forward.
