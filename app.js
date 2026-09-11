//================================================
// BACKTRACK
// 70s & 80s Music Challenge
// Version 0.3.1
//================================================

//================================================
// BACKTRACK CONFIGURATION
//================================================

const CONFIG = {

    scoring: {
    standardTitle: 2,
    standardArtist: 1,
    standardThird: 1,

    specialTitle: 3,
    specialThird: 1
    },

    gameLengths: [5, 10, 20],

    timerOptions: [15, 30, 45, 60],

    passesPerTenRounds: 2

};


//================================================
// GAME DATA
//================================================


let songs = [];

let teamDecks = [];
let usedSongs = new Set();

let currentSong = null;

let roundScore = 0;

let titleAwarded = false;
let artistAwarded = false;
let thirdAwarded = false;


//================================================
// GAME SETTINGS
//================================================

let numberOfTeams = 2;

let selectedDecade = "mixed";

let selectedDifficulty = "Mixed";

let totalRounds = 5;

let currentRound = 1;

let selectedTimer = 30;

let timerInterval = null;

let timeRemaining = 0;


//================================================
// TEAM DATA
//================================================

let teams = [];

let currentTeamIndex = 0;
let currentTurnSequence = [];
let currentTurnIndex = 0;
let activePlayerName = null;

//================================================
// MULTIPLAYER CONNECTION
//================================================

const BACKEND_URL = window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://backtrack-session-host-811982598457.us-east1.run.app";

let sessionSocket = null;
let sessionToken = null;
let sessionJoinCode = null;
let isSessionHost = false;
let pendingHostState = null;
let editingTeamName = null;

function setConnectionStatus(message) {

    document
        .getElementById("connectionStatus")
        .textContent = message;

}

function setRoomDisplay(message) {

    document
        .getElementById("roomDisplay")
        .textContent = message;

    const roomCode = message.match(/[A-Z0-9]{5,6}$/);

    if (roomCode) {
        document
            .getElementById("roomBannerCode")
            .textContent = roomCode[0];

        document
            .getElementById("roomBanner")
            .classList
            .remove("hidden");
    }

}

function getSocketUrl(path) {

    const url = new URL(path, BACKEND_URL);

    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";

    return url.toString();

}

function sendHostState(status = "playing") {

    if (!isSessionHost || !sessionSocket) {
        return;
    }

    pendingHostState = {
        status,
        teams,
        currentRound,
        currentTeamIndex,
        totalRounds,
        activePlayerName: activePlayerName || getActiveTurn().playerName || null
    };

    if (sessionSocket.readyState !== WebSocket.OPEN) {
        return;
    }

    sessionSocket.send(JSON.stringify({
        type: "state.replace",
        state: pendingHostState
    }));

    pendingHostState = null;

}

function updatePlayerView(state) {

    if (!state || !Array.isArray(state.teams)) {
        return;
    }

    const scoreHTML = state.teams.map(team => `
        <div class="score-item">
            ${team.name}<br>
            ${team.score} pts
        </div>
    `).join("");

    document
        .getElementById("playerScores")
        .innerHTML = scoreHTML;

    document
        .getElementById("playerRoundDisplay")
        .textContent = `Round ${state.currentRound} of ${state.totalRounds}`;

    const localName = getCurrentPlayerName();
    const activePlayerName = state.activePlayerName || getActiveTurn().playerName || null;
    const isActivePlayer = !!activePlayerName && localName.trim() === activePlayerName.trim();
    const currentTeamName = Array.isArray(state.teams) && state.teams[state.currentTeamIndex]
        ? state.teams[state.currentTeamIndex].name
        : "Current team";

    if (state.status === "complete") {
        document.getElementById("playerGameStatus").textContent = "Game complete.";
        return;
    }

    if (isActivePlayer) {
        document.getElementById("playerGameStatus").textContent = `It is your turn. Keep the song private.`;
        const startTurnButton = document.getElementById("startTurnButton");
        if (startTurnButton) {
            startTurnButton.classList.remove("hidden");
        }
        return;
    }

    const startTurnButton = document.getElementById("startTurnButton");
    if (startTurnButton) {
        startTurnButton.classList.add("hidden");
    }

    document
        .getElementById("playerGameStatus")
        .textContent = `${currentTeamName} is playing. ${activePlayerName ? `${activePlayerName} is active.` : "Waiting for the next turn."}`;

}

const TEAM_OPTIONS = [
    "70s",
    "80s",
    "90s",
    "2000-2015",
    "50's and 60's Classics",
    "Great American Songbook",
    "Broadway"
];

const TEAM_DIFFICULTIES = ["Easy", "Medium", "Hard"];

function getCurrentPlayerName() {
    return document.getElementById("playerName")?.value.trim() || "Player";
}

function buildTurnSequenceForTeams(teamList, roundNumber = currentRound || 1) {
    const eligibleTeams = Array.isArray(teamList)
        ? teamList.filter(team => Array.isArray(team.members) && team.members.length > 0)
        : [];

    if (!eligibleTeams.length) {
        return [];
    }

    const sequence = [];

    for (const team of eligibleTeams) {
        const members = Array.isArray(team.members)
            ? team.members.filter(member => typeof member === "string" && member.trim())
            : [];

        for (const member of members) {
            sequence.push({
                roundNumber,
                teamName: team.name,
                playerName: member.trim(),
                turnIndex: sequence.length
            });
        }
    }

    return sequence;
}

function getActiveTurn() {
    if (Array.isArray(currentTurnSequence) && currentTurnSequence.length > 0) {
        return currentTurnSequence[currentTurnIndex % currentTurnSequence.length] || currentTurnSequence[0];
    }

    return {
        teamName: teams[currentTeamIndex]?.name || "Team",
        playerName: activePlayerName || null,
        roundNumber: currentRound
    };
}

function getDefaultTeamOptions() {
    return [];
}

function buildDeckForTeam(team) {
    const teamOptions = Array.isArray(team?.songOptions) ? team.songOptions : [];

    if (!teamOptions.length) {
        return [...songs];
    }

    const deck = songs.filter(song => {
        for (const option of teamOptions) {
            if (typeof option !== "string") {
                continue;
            }

            const [category, difficulty] = option.split(":");
            const normalizedCategory = category && category.trim();
            const normalizedDifficulty = difficulty && difficulty.trim();

            if (!normalizedCategory) {
                continue;
            }

            if (normalizedDifficulty) {
                if (song.decade === normalizedCategory && song.difficulty === normalizedDifficulty) {
                    return true;
                }
                continue;
            }

            if (song.category === normalizedCategory) {
                return true;
            }

            if (song.decade === normalizedCategory) {
                return true;
            }
        }

        return false;
    });

    shuffle(deck);
    return deck;
}

function formatSongOption(category, difficulty) {
    return `${category}:${difficulty}`;
}

function normalizeTeamOptions(options) {
    if (!Array.isArray(options)) {
        return getDefaultTeamOptions();
    }

    return [...new Set(options
        .filter(option => typeof option === "string" && option.includes(":"))
        .map(option => option.trim()))];
}

function getSelectedSongOptionsFromUI() {
    const state = {};

    document.querySelectorAll(".difficulty-option.selected").forEach(button => {
        const category = button.dataset.category;
        const difficulty = button.dataset.difficulty;

        if (!category || !difficulty) {
            return;
        }

        if (!state[category]) {
            state[category] = [];
        }

        state[category].push(difficulty);
    });

    return state;
}

function resetTeamMatrixSelection() {
    document.querySelectorAll(".difficulty-option").forEach(button => {
        button.classList.remove("selected");
    });

    document.querySelectorAll(".category-option").forEach(button => {
        button.classList.remove("selected");
    });
}

function setSelectedSongOptionsInUI(options) {
    const selectedMap = {};

    normalizeTeamOptions(options).forEach(option => {
        const [category, difficulty] = option.split(":");
        if (category && difficulty) {
            selectedMap[category] = selectedMap[category] || [];
            selectedMap[category].push(difficulty);
        }
    });

    document.querySelectorAll(".difficulty-option").forEach(button => {
        const category = button.dataset.category;
        const difficulty = button.dataset.difficulty;
        const selected = selectedMap[category] && selectedMap[category].includes(difficulty);
        button.classList.toggle("selected", selected);
    });

    document.querySelectorAll(".category-option").forEach(button => {
        const category = button.dataset.category;
        const selected = selectedMap[category] && selectedMap[category].length > 0;
        button.classList.toggle("selected", selected);
    });
}

function getLobbyTeamsFromState(state) {
    if (!state || !Array.isArray(state.teams)) {
        return [];
    }

    return state.teams.map(team => ({
        name: typeof team.name === "string" ? team.name : "Team",
        owner: typeof team.owner === "string" ? team.owner : "Host",
        members: Array.isArray(team.members) ? team.members.filter(member => typeof member === "string") : [],
        songOptions: normalizeTeamOptions(team.songOptions)
    }));
}

function renderTeamList(message) {
    const teamList = document.getElementById("teamList");
    if (!teamList) {
        return;
    }

    const state = message && message.state ? message.state : { teams: [] };
    const teams = getLobbyTeamsFromState(state);

    if (!teams.length) {
        teamList.innerHTML = "<div class=\"team-item\">No teams yet.</div>";
        return;
    }

    const currentPlayer = getCurrentPlayerName();

    teamList.innerHTML = teams.map(team => {
        const members = Array.isArray(team.members) ? team.members : [];
        const isOwner = team.owner === currentPlayer;
        const isMember = members.includes(currentPlayer);
        const alreadyOnAnotherTeam = teams.some(candidate => candidate !== team && Array.isArray(candidate.members) && candidate.members.includes(currentPlayer));
        const canJoin = true;
        const canLeave = isMember;
        const canEdit = isOwner;
        const canDelete = isOwner;
        const joinLabel = isMember ? (alreadyOnAnotherTeam ? "Join Team" : "Joined") : "Join Team";
        const optionsText = (team.songOptions && team.songOptions.length)
            ? team.songOptions.join(", ")
            : "No song selections";

        return `
            <div class="team-item">
                <strong>${team.name}</strong>
                ${team.owner ? ` — ${team.owner}` : ""}
                <div>Members: ${members.length ? members.join(", ") : "No players yet"}</div>
                <div>Song options: ${optionsText}</div>
                <div class="team-item-actions">
                    ${canJoin ? `<button type="button" data-team-action="join" data-team-name="${team.name}">${joinLabel}</button>` : ""}
                    ${canLeave ? `<button type="button" data-team-action="leave" data-team-name="${team.name}">Leave Team</button>` : ""}
                    ${canEdit ? `<button type="button" data-team-action="edit" data-team-name="${team.name}">Edit Team</button>` : ""}
                    ${canDelete ? `<button type="button" data-team-action="delete" data-team-name="${team.name}">Delete Team</button>` : ""}
                </div>
            </div>
        `;
    }).join("");
}

function renderLobbyState(message) {
    const roomName = sessionJoinCode || "this room";
    const participants = Array.isArray(message.participants) ? message.participants : [];
    const lobbyContents = document.getElementById("lobbyContents");
    const state = message && message.state ? message.state : { status: "lobby", teams: [] };
    const teams = getLobbyTeamsFromState(state);

    if (!lobbyContents) {
        return;
    }

    const lobbyText = participants.length
        ? participants.map(participant => `- ${participant.name}${participant.isHost ? " (host)" : ""}`).join("<br>")
        : "No players yet.";

    lobbyContents.innerHTML = `<p><strong>Room:</strong> ${roomName}</p><div>${lobbyText}</div>`;
    renderTeamList(message);

    const lobbyStatus = document.getElementById("lobbyStatus");
    if (lobbyStatus) {
        if (isSessionHost) {
            lobbyStatus.textContent = state.status === "ready"
                ? "All teams and players are ready."
                : (teams.length ? "Lobby ready. The host can start once the room is set." : "Create the first team to begin.");
        } else {
            lobbyStatus.textContent = state.status === "ready"
                ? "Waiting for the host to begin the match."
                : "Waiting for the host to start the game.";
        }
    }

    const teamBuilder = document.getElementById("teamBuilder");
    if (teamBuilder) {
        teamBuilder.classList.toggle("hidden", false);
    }

    const startButton = document.getElementById("startButton");
    if (startButton) {
        startButton.classList.toggle("hidden", !isSessionHost || teams.length === 0);
    }
}

function applyIncomingGameState(state) {
    if (!state || typeof state !== "object") {
        return;
    }

    if (Array.isArray(state.teams)) {
        teams = state.teams.map(team => ({
            ...team,
            name: typeof team.name === "string" ? team.name : "Team",
            owner: typeof team.owner === "string" ? team.owner : "Host",
            members: Array.isArray(team.members)
                ? team.members.filter(member => typeof member === "string" && member.trim())
                : [],
            score: Number.isFinite(team.score) ? Number(team.score) : 0,
            passesRemaining: Number.isFinite(team.passesRemaining) ? Number(team.passesRemaining) : 2,
            songOptions: normalizeTeamOptions(team.songOptions)
        }));

        teamDecks = teams.map(team => buildDeckForTeam(team));
        currentTurnSequence = buildTurnSequenceForTeams(teams, currentRound);
    }

    if (Number.isInteger(state.currentRound)) {
        currentRound = state.currentRound;
    }

    if (Number.isInteger(state.totalRounds)) {
        totalRounds = state.totalRounds;
    }

    if (Number.isInteger(state.currentTeamIndex)) {
        currentTeamIndex = state.currentTeamIndex;
    }

    if (typeof state.activePlayerName === "string") {
        activePlayerName = state.activePlayerName;
    }

    if (Array.isArray(teams) && teams.length) {
        currentTurnSequence = buildTurnSequenceForTeams(teams, currentRound);
    }
}

function handleSessionMessage(message) {

    if (sessionSocket && message && message.state) {
        sessionSocket.lastState = message.state;
    }

    const state = message && message.state ? message.state : null;
    if (state) {
        applyIncomingGameState(state);
    }

    const phase = state ? (state.status === "playing" || state.status === "complete" ? "game" : "lobby") : "lobby";

    if (message.type === "connected") {
        setConnectionStatus(`Connected. Room ${sessionJoinCode || ""}`);
        setRoomDisplay(`Room code: ${sessionJoinCode || "connected"}`);

        if (phase === "game") {
            const localName = getCurrentPlayerName();
            const isActive = state && typeof state.activePlayerName === "string" && localName.trim() === state.activePlayerName.trim();

            if (isActive) {
                if (state.currentSong) {
                    showScreen("songScreen");
                } else {
                    showActivePlayerStartScreen();
                }
            } else {
                showScreen("playerScreen");
            }

            updatePlayerView(state);
            return;
        }

        renderLobbyState(message);
        showScreen("lobbyScreen");

        if (!isSessionHost) {
            updatePlayerView(state);
        }
        return;
    }

    if (message.type === "state") {
        if (phase === "game") {
            const localName = getCurrentPlayerName();
            const isActive = state && typeof state.activePlayerName === "string" && localName.trim() === state.activePlayerName.trim();

            if (isActive) {
                if (state.currentSong) {
                    showScreen("songScreen");
                } else {
                    showActivePlayerStartScreen();
                }
            } else {
                showScreen("playerScreen");
            }

            updatePlayerView(state);
            return;
        }

        renderLobbyState(message);
        if (!isSessionHost) {
            updatePlayerView(state);
        }
        return;
    }

    if (message.type === "error") {
        setConnectionStatus(`Connection error: ${message.error}`);
    }
}

function connectToSession(token, wsPath, hostSession) {

    sessionToken = token;
    isSessionHost = hostSession;
    sessionSocket = new WebSocket(`${getSocketUrl(wsPath)}?token=${encodeURIComponent(token)}`);

    sessionSocket.addEventListener("open", function () {

        const name = document.getElementById("playerName").value.trim() || "Player";

        sessionSocket.send(JSON.stringify({
            type: "identify",
            name,
            role: hostSession ? "host" : "player"
        }));

        if (hostSession && pendingHostState) {
            sendHostState(pendingHostState.status);
        }

        setConnectionStatus(`Connected. Room ${sessionJoinCode || ""}`);
        setRoomDisplay(`Room code: ${sessionJoinCode || "connected"}`);

    });

    sessionSocket.addEventListener("message", function (event) {

        handleSessionMessage(JSON.parse(event.data));

    });

    sessionSocket.addEventListener("close", function () {

        setConnectionStatus("Disconnected from game server.");

    });

    sessionSocket.addEventListener("error", function () {

        setConnectionStatus("Unable to connect to game server.");

    });

}

async function createHostedSession() {

    const response = await fetch(`${BACKEND_URL}/api/sessions`, {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify({
            manifest: {
                name: "backtrack",
                version: "1",
                channels: [
                    { name: "public-events", audience: "public" },
                    { name: "private-player", audience: "player" }
                ]
            },
            state: {
                status: "lobby",
                teams: []
            }
        })
    });

    if (!response.ok) {
        throw new Error("The game server rejected the session.");
    }

    const session = await response.json();

    sessionJoinCode = session.joinCode;

    connectToSession(session.hostToken, session.wsUrl, true);

    setConnectionStatus(`Host room created: ${session.joinCode}`);
    setRoomDisplay(`Room code: ${session.joinCode}`);

}

async function getSessionByCode(joinCode) {
    const response = await fetch(`${BACKEND_URL}/api/sessions/${encodeURIComponent(joinCode)}`);

    if (!response.ok) {
        throw new Error("That join code was not found.");
    }

    return response.json();
}

async function joinHostedSession() {

    const joinCode = document.getElementById("joinCode").value.trim().toUpperCase();
    const name = document.getElementById("playerName").value.trim() || "Player";

    if (!joinCode) {
        setConnectionStatus("Enter a join code first.");
        return;
    }

    if (!name || name.trim().length < 1) {
        setConnectionStatus("Enter a name before joining a room.");
        return;
    }

    const session = await getSessionByCode(joinCode);
    const existingNames = new Set((session.participants || []).map(participant => participant.name.toLowerCase()));

    if (existingNames.has(name.trim().toLowerCase())) {
        setConnectionStatus("That name is already in use in this room.");
        return;
    }

    const response = await fetch(`${BACKEND_URL}/api/sessions/${encodeURIComponent(joinCode)}/participants`, {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify({
            name,
            role: "player"
        })
    });

    if (!response.ok) {
        throw new Error("That join code was not found.");
    }

    const participant = await response.json();

    sessionJoinCode = joinCode;

    connectToSession(participant.token, participant.wsUrl, false);
    setRoomDisplay(`Joined room: ${joinCode}`);

}

//================================================
// INITIALIZATION
//================================================

// Load songs
fetch("songs.json")
    .then(response => response.json())
    .then(data => {

        songs = data;

        console.log("Songs loaded:", songs.length);

    });

showScreen("entryScreen");

// Screen controls

function showScreen(screenID) {

    const titleArea = document.getElementById("titleArea");

    if (screenID === "entryScreen") {
        titleArea.classList.remove("hidden");
    } else {
        titleArea.classList.add("hidden");
    }

    [
        "entryScreen",
        "lobbyScreen",
        "teamSetupScreen",
        "setupScreen",
        "turnScreen",
        "songScreen",
        "scoringScreen",
        "gameOverScreen",
        "playerScreen"
    ].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.toggle("hidden", id !== screenID);
        }
    });

    const scoreboard = document.getElementById("scoreboard");
    if (scoreboard) {
        const shouldShowScoreboard = ["turnScreen", "songScreen", "scoringScreen"].includes(screenID);
        scoreboard.classList.toggle("hidden", !shouldShowScoreboard);
    }

}

function toggleJoinMode() {
    const joinCodeRow = document.getElementById("joinCodeRow");
    if (joinCodeRow) {
        joinCodeRow.classList.toggle("hidden");
    }
}

function createHostTeam() {
    if (!sessionSocket) {
        setConnectionStatus("Connect to the room before creating a team.");
        return;
    }

    const currentState = sessionSocket.lastState || { status: "lobby", teams: [] };

    if (currentState.status !== "lobby") {
        setConnectionStatus("The lobby is closed. The game has already started.");
        return;
    }

    const teamNameInput = document.getElementById("teamNameInput");
    const teamName = teamNameInput ? teamNameInput.value.trim() : "";
    const selectionState = getSelectedSongOptionsFromUI();
    const songOptions = Object.entries(selectionState).flatMap(([category, difficulties]) =>
        difficulties.map(difficulty => formatSongOption(category, difficulty))
    );

    if (!teamName) {
        setConnectionStatus("Enter a team name before creating a team.");
        return;
    }

    const teams = Array.isArray(currentState.teams) ? currentState.teams : [];
    const normalizedName = teamName.slice(0, 40);

    const existingIndex = teams.findIndex(team => team.name.toLowerCase() === normalizedName.toLowerCase());
    if (existingIndex >= 0 && editingTeamName !== normalizedName) {
        setConnectionStatus("That team name is already in use.");
        return;
    }

    const updatedTeams = [...teams];
    const ownerName = getCurrentPlayerName();

    if (editingTeamName && existingIndex >= 0) {
        updatedTeams[existingIndex] = {
            ...updatedTeams[existingIndex],
            name: normalizedName,
            owner: ownerName,
            songOptions
        };
    } else {
        updatedTeams.push({
            name: normalizedName,
            owner: ownerName,
            members: [ownerName],
            songOptions
        });
    }

    const nextState = {
        ...currentState,
        status: "lobby",
        teams: updatedTeams
    };

    sessionSocket.lastState = nextState;
    sessionSocket.send(JSON.stringify({
        type: "state.replace",
        scope: "team",
        state: nextState
    }));

    if (teamNameInput) {
        teamNameInput.value = "";
    }
    document.querySelectorAll(".difficulty-option, .category-option").forEach(button => {
        button.classList.remove("selected");
    });
    const button = document.getElementById("createTeamButton");
    if (button) {
        button.textContent = "CREATE TEAM";
    }
    const wasEditing = editingTeamName;
    editingTeamName = null;

    setConnectionStatus(wasEditing ? "Team updated." : "Team created.");
}

function modifyCurrentTeamMembership(teamName, action) {
    if (!sessionSocket || !sessionSocket.lastState) {
        return;
    }

    const currentState = sessionSocket.lastState;
    if (currentState.status !== "lobby") {
        setConnectionStatus("The lobby is closed.");
        return;
    }

    const currentPlayer = getCurrentPlayerName();
    const teams = getLobbyTeamsFromState(currentState);
    const targetIndex = teams.findIndex(team => team.name === teamName);

    if (targetIndex < 0) {
        return;
    }

    const nextTeams = teams.map(team => ({
        ...team,
        members: Array.isArray(team.members) ? team.members.slice() : []
    }));
    const target = nextTeams[targetIndex];

    if (action === "join") {
        const alreadyOnAnyTeam = nextTeams.some(team => team.name !== teamName && team.members.includes(currentPlayer));
        if (alreadyOnAnyTeam) {
            setConnectionStatus("Warning: you are already on another team. Joining this team is allowed, but you may want to leave the other team first.");
        }

        if (!target.members.includes(currentPlayer)) {
            target.members.push(currentPlayer);
        }
    }

    if (action === "leave") {
        target.members = target.members.filter(member => member !== currentPlayer);
    }

    if (action === "delete") {
        nextTeams.splice(targetIndex, 1);
    }

    const nextState = {
        ...currentState,
        teams: nextTeams
    };

    sessionSocket.lastState = nextState;
    sessionSocket.send(JSON.stringify({
        type: "state.replace",
        scope: "team",
        state: nextState
    }));
}

function prepareTeamEdit(teamName) {
    const currentState = sessionSocket?.lastState || { teams: [] };
    const teams = getLobbyTeamsFromState(currentState);
    const team = teams.find(item => item.name === teamName);

    if (!team) {
        return;
    }

    editingTeamName = teamName;
    const teamNameInput = document.getElementById("teamNameInput");
    if (teamNameInput) {
        teamNameInput.value = teamName;
    }
    resetTeamMatrixSelection();
    setSelectedSongOptionsInUI(team.songOptions || []);

    const button = document.getElementById("createTeamButton");
    if (button) {
        button.textContent = "SAVE TEAM";
    }
}

function deleteTeam(teamName) {
    if (!sessionSocket || !sessionSocket.lastState) {
        return;
    }

    const currentState = sessionSocket.lastState;
    if (currentState.status !== "lobby") {
        setConnectionStatus("The lobby is closed.");
        return;
    }

    const nextState = {
        ...currentState,
        teams: (Array.isArray(currentState.teams) ? currentState.teams : []).filter(team => team.name !== teamName)
    };

    sessionSocket.lastState = nextState;
    sessionSocket.send(JSON.stringify({
        type: "state.replace",
        scope: "team",
        state: nextState
    }));
}

function startGameFromLobby() {
    if (!isSessionHost || !sessionSocket) {
        setConnectionStatus("Only the host can start the game.");
        return;
    }

    const currentState = sessionSocket.lastState || { status: "lobby", teams: [] };
    const teams = Array.isArray(currentState.teams) ? currentState.teams : [];

    if (currentState.status !== "lobby") {
        setConnectionStatus("The room is already in progress.");
        return;
    }

    if (!teams.length) {
        setConnectionStatus("Create at least one team before the lobby is ready.");
        return;
    }

    const cleanedTeams = teams.filter(team => Array.isArray(team.members) && team.members.length > 0).map(team => ({
        ...team,
        score: Number.isFinite(team.score) ? team.score : 0,
        passesRemaining: Number.isFinite(team.passesRemaining) ? team.passesRemaining : 2
    }));

    teamDecks = cleanedTeams.map(team => buildDeckForTeam(team));

    currentRound = 1;
    currentTeamIndex = 0;
    currentTurnSequence = buildTurnSequenceForTeams(cleanedTeams, currentRound);
    currentTurnIndex = 0;
    activePlayerName = currentTurnSequence[0]?.playerName || null;

    const activeTurn = getActiveTurn();
    if (activeTurn && activeTurn.teamName) {
        const nextTeamIndex = cleanedTeams.findIndex(team => team.name === activeTurn.teamName);
        if (nextTeamIndex >= 0) {
            currentTeamIndex = nextTeamIndex;
        }
    }

    const nextState = {
        ...currentState,
        status: "playing",
        currentRound: 1,
        currentTeamIndex,
        totalRounds: currentState.totalRounds || 10,
        teams: cleanedTeams,
        activePlayerName: activePlayerName || null
    };

    sessionSocket.lastState = nextState;
    sessionSocket.send(JSON.stringify({
        type: "state.replace",
        state: nextState
    }));

    showActivePlayerStartScreen();
    setConnectionStatus("Game started. Round 1.");
}

function revealNextSong() {

    const currentDeck =
        teamDecks[currentTeamIndex];


    if (!currentDeck || currentDeck.length === 0) {

        alert(
            "No songs left for " +
            teams[currentTeamIndex].name +
            "!"
        );

        return;

    }


    // Find the next song that has not been used this game

    while (
        currentDeck.length > 0 &&
        usedSongs.has(currentDeck[currentDeck.length - 1])
    ) {

        currentDeck.pop();

    }

    if (currentDeck.length === 0) {

    alert(
        "No unused songs left for " +
        teams[currentTeamIndex].name +
        "!"
    );

    return;

    }

    currentSong =
        currentDeck.pop();

    usedSongs.add(currentSong);

        roundScore = 0;

        titleAwarded = false;
        artistAwarded = false;
        thirdAwarded = false;

        document
            .getElementById("roundScore")
            .textContent = roundScore;


        document
            .getElementById("songTitle")
            .textContent =
            currentSong.title;


        //================================================
// DYNAMIC SONG DETAILS
//================================================

const artistDetail =
    document.getElementById("artistDetail");

const yearDetail =
    document.getElementById("yearDetail");

const difficultyDetail =
    document.getElementById("difficultyDetail");


// Reset the detail labels/values

artistDetail.innerHTML = `
    Artist:
    <span id="artist"></span>
`;

yearDetail.innerHTML = `
    Year:
    <span id="year"></span>
`;

difficultyDetail.innerHTML = `
    Difficulty:
    <span id="difficulty"></span>
`;


// Regular songs and 50s/60s Classics

if (
    !currentSong.category ||
    currentSong.category === "50's and 60's Classics"
) {

    document.getElementById("artist").textContent =
        currentSong.artist;

    document.getElementById("year").textContent =
        currentSong.year;

}


// Great American Songbook

else if (
    currentSong.category === "Great American Songbook"
) {

    artistDetail.innerHTML = `
        Composer / Lyricist:
        <span>
            ${currentSong.composer || ""}
        </span>
    `;

    yearDetail.innerHTML = `
        Decade:
        <span>
            ${currentSong.date || ""}
        </span>
    `;

}


// Broadway

else if (
    currentSong.category === "Broadway"
) {

    artistDetail.innerHTML = `
        Show:
        <span>
            ${currentSong.show || ""}
        </span>
    `;

    yearDetail.innerHTML = "";

}


// Difficulty

if (currentSong.decade === "Old Classics") {

    difficultyDetail.innerHTML = "";

}
else {

    document.getElementById("difficulty").textContent =
        currentSong.difficulty;

}

        startTimer();
        showScreen("songScreen");


    };

    function goToScoringScreen() {
        clearInterval(timerInterval);
        setupScoringScreen();
        updateNextButtonLabel();
        showScreen("scoringScreen");
    }

    function startTimer() {

    // Stop any previous timer
    clearInterval(timerInterval);

    timeRemaining = selectedTimer;

    document
        .getElementById("timerDisplay")
        .textContent = timeRemaining;


    timerInterval = setInterval(function () {

        timeRemaining--;

        document
            .getElementById("timerDisplay")
            .textContent = timeRemaining;


if (timeRemaining <= 0) {

    clearInterval(timerInterval);

    timeRemaining = 0;

    document
        .getElementById("timerDisplay")
        .textContent = "0";

    document
        .getElementById("buzzerSound")
        .play();

    goToScoringScreen();
    return;

}

    }, 1000);

}



//================================================
// GAME FUNCTIONS
//================================================

// Create song deck

//================================================
// GAME FUNCTIONS
//================================================

// Create a song deck for one team

function buildDeck(teamIndex) {

    const teamSelection =
        SETUP.teamDecks[teamIndex];


    if (!teamSelection) {

        console.error(
            "No deck configuration found for Team",
            teamIndex + 1
        );

        return [];

    }


    const newDeck =
        songs.filter(song => {

            // ----------------------------------------
            // Regular decade categories
            // ----------------------------------------

            if (
                teamSelection[song.decade] &&
                teamSelection[song.decade].length > 0
            ) {

                return teamSelection[song.decade]
                    .includes(song.difficulty);

            }


            // ----------------------------------------
            // Old Classics categories
            // ----------------------------------------

            if (
                song.category &&
                teamSelection[song.category] === true
            ) {

                return true;

            }


            return false;

        });


    shuffle(newDeck);


    console.log(
        `Deck created for Team ${teamIndex + 1}:`,
        newDeck.length
    );


    return newDeck;

}

function buildAllTeamDecks() {

    teamDecks = [];

    for (let i = 0; i < SETUP.numberOfTeams; i++) {

        const newDeck = buildDeck(i);

        teamDecks.push(newDeck);

    }

    console.log(
        "All team decks built:",
        teamDecks
    );

}



// Shuffle function

function shuffle(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        let j = Math.floor(
            Math.random() * (i + 1)
        );


        [
            array[i],
            array[j]
        ] =
        [
            array[j],
            array[i]
        ];

    }

}

function createTeams() {

    teams = [];

    let passes = totalRounds / 5;


    for (let i = 1; i <= numberOfTeams; i++) {

        teams.push({

            name: "Team " + i,

            score: 0,

            passesRemaining: passes

        });

    }

    updateScoreboard();

}

//================================================
// SCOREBOARD
//================================================

function updateScoreboard() {

    let scoreHTML = "";


    teams.forEach(team => {

        scoreHTML += `

            <div class="score-item">

                ${team.name}<br>
                ${team.score} pts

            </div>

        `;

    });


    document
        .getElementById("scores")
        .innerHTML = scoreHTML;

    document
        .getElementById("roundDisplay")
        .textContent =
        "Round " + currentRound + " of " + totalRounds;

}


// Show the game over screen

function showGameOver() {

    let highestScore = Math.max(...teams.map(team => team.score));

    let winners = teams.filter(team => team.score === highestScore);

    if (SETUP.gameMode === "party") {

    document
        .getElementById("winnerDisplay")
        .textContent =
        "FINAL SCORE";

}
else if (winners.length === 1) {

    document
        .getElementById("winnerDisplay")
        .textContent =
        winners[0].name + " WINS!";

}
else {

    document
        .getElementById("winnerDisplay")
        .textContent =
        "IT'S A TIE!";

}

    let html = "";

    teams.forEach(team => {

        html += `
            <p>
                <strong>${team.name}</strong>
                — ${team.score} points
            </p>
        `;

    });

    document
        .getElementById("finalScores")
        .innerHTML = html;

    showScreen("gameOverScreen");

}



// Show team screen

function showCurrentTeam() {
    const activeTurn = getActiveTurn();
    const teamIndex = teams.findIndex(team => team.name === activeTurn.teamName);
    if (teamIndex >= 0) {
        currentTeamIndex = teamIndex;
    }

    const team = teams[currentTeamIndex];
    if (!team) {
        return;
    }

    if (SETUP && SETUP.gameMode === "party") {
        document.getElementById("teamTurn").textContent = "PARTY MODE";
    } else {
        const displayName = activeTurn.playerName ? `${team.name} — ${activeTurn.playerName}'s turn` : `${team.name}'S TURN`;
        document.getElementById("teamTurn").textContent = displayName;
    }

    document.getElementById("passesRemaining").textContent = team.passesRemaining ?? 0;

    const passButton = document.getElementById("passButton");
    if ((team.passesRemaining ?? 0) === 0) {
        passButton.classList.add("pass-disabled");
    } else {
        passButton.classList.remove("pass-disabled");
    }

    activePlayerName = activeTurn.playerName || activePlayerName;
    showScreen("turnScreen");
}

function showActivePlayerStartScreen() {
    const activeTurn = getActiveTurn();
    if (activeTurn && activeTurn.playerName) {
        activePlayerName = activeTurn.playerName;
    }

    const activeTurnTeam = teams.find(team => team.name === (activeTurn && activeTurn.teamName)) || teams[currentTeamIndex];
    if (activeTurnTeam) {
        currentTeamIndex = teams.indexOf(activeTurnTeam);
    }

    const startTurnButton = document.getElementById("startTurnButton");
    if (startTurnButton) {
        startTurnButton.classList.remove("hidden");
    }

    updatePlayerView({
        status: "playing",
        teams,
        currentRound,
        totalRounds,
        currentTeamIndex,
        activePlayerName
    });

    showScreen("playerScreen");
}

function startActiveTurn() {
    const activeTurn = getActiveTurn();
    if (activeTurn && activeTurn.teamName) {
        const nextTeamIndex = teams.findIndex(team => team.name === activeTurn.teamName);
        if (nextTeamIndex >= 0) {
            currentTeamIndex = nextTeamIndex;
        }
    }

    if (!Array.isArray(teamDecks[currentTeamIndex]) || teamDecks[currentTeamIndex].length === 0) {
        teamDecks[currentTeamIndex] = buildDeckForTeam(teams[currentTeamIndex]);
    }

    clearInterval(timerInterval);
    timeRemaining = selectedTimer;
    document.getElementById("timerDisplay").textContent = String(timeRemaining);
    showScreen("songScreen");
    revealNextSong();
}


//================================================
// EVENT LISTENERS
//================================================

document
    .getElementById("hostButton")
    .addEventListener("click", async function () {

        const name = document.getElementById("playerName").value.trim();

        if (!name) {
            setConnectionStatus("Enter a name before hosting a game.");
            return;
        }

        try {
            await createHostedSession();
            showScreen("lobbyScreen");
        }
        catch (error) {
            setConnectionStatus(error.message);
        }
    });

document
    .getElementById("joinModeButton")
    .addEventListener("click", function () {
        toggleJoinMode();
    });

document
    .getElementById("joinButton")
    .addEventListener("click", async function () {

        const name = document.getElementById("playerName").value.trim();

        if (!name) {
            setConnectionStatus("Enter a name before joining a game.");
            return;
        }

        try {
            await joinHostedSession();
        }
        catch (error) {
            setConnectionStatus(error.message);
        }
    });

document
    .getElementById("createTeamButton")
    .addEventListener("click", createHostTeam);

document.getElementById("teamList").addEventListener("click", function (event) {
    const actionButton = event.target.closest("[data-team-action]");
    if (!actionButton) {
        return;
    }

    const action = actionButton.dataset.teamAction;
    const teamName = actionButton.dataset.teamName;

    if (action === "join") {
        modifyCurrentTeamMembership(teamName, "join");
    }

    if (action === "leave") {
        modifyCurrentTeamMembership(teamName, "leave");
    }

    if (action === "edit") {
        prepareTeamEdit(teamName);
    }

    if (action === "delete") {
        deleteTeam(teamName);
    }
});

document
    .getElementById("startButton")
    .addEventListener("click", function () {
        startGameFromLobby();
    });

function bindTeamMatrixControls() {
    document.querySelectorAll(".difficulty-option").forEach(button => {
        button.addEventListener("click", function () {
            const category = button.dataset.category;
            button.classList.toggle("selected");

            const categoryButton = document.querySelector(`.category-option[data-category="${category}"]`);
            if (categoryButton) {
                const rowButtons = document.querySelectorAll(`.difficulty-option[data-category="${category}"]`);
                const isSelected = Array.from(rowButtons).some(item => item.classList.contains("selected"));
                categoryButton.classList.toggle("selected", isSelected);
            }
        });
    });

    document.querySelectorAll(".category-option").forEach(button => {
        button.addEventListener("click", function () {
            const category = button.dataset.category;
            const rowButtons = document.querySelectorAll(`.difficulty-option[data-category="${category}"]`);
            const shouldSelect = !button.classList.contains("selected");

            rowButtons.forEach(item => {
                item.classList.toggle("selected", shouldSelect);
            });
            button.classList.toggle("selected", shouldSelect);
        });
    });

    resetTeamMatrixSelection();
}

bindTeamMatrixControls();

document
    .getElementById("startTurnButton")
    .addEventListener("click", function () {
        startActiveTurn();
    });


document
    .getElementById("passButton")
    .addEventListener("click", function () {
        const team = teams[currentTeamIndex];

        if (!team || (team.passesRemaining ?? 0) <= 0) {
            return;
        }

        team.passesRemaining -= 1;

        document.getElementById("passesRemaining").textContent = team.passesRemaining;

        const passButton = document.getElementById("passButton");
        if ((team.passesRemaining ?? 0) === 0) {
            passButton.classList.add("pass-disabled");
        } else {
            passButton.classList.remove("pass-disabled");
        }

        sendHostState("playing");
        revealNextSong();
    });


document
    .getElementById("scoreButton")
    .addEventListener("click", function () {
        goToScoringScreen();
    });

function setupScoringScreen() {

    const artistRow =
        document.getElementById("artistScoreRow");

    const thirdRow =
        document.getElementById("thirdScoreRow");


    // ================================================
    // GREAT AMERICAN SONGBOOK
    // ================================================

    if (
        currentSong.category === "Great American Songbook"
    ) {

        artistRow.classList.add("hidden");

        thirdRow.firstChild.textContent =
            "Decade: ";

        return;

    }


    // ================================================
    // BROADWAY
    // ================================================

    if (
        currentSong.category === "Broadway"
    ) {

        artistRow.classList.add("hidden");

        thirdRow.firstChild.textContent =
            "Show: ";

        return;

    }


    // ================================================
    // REGULAR + 50s/60s CLASSICS
    // ================================================

    artistRow.classList.remove("hidden");

    thirdRow.firstChild.textContent =
        "Year: ";

}



//================================================
// SCORING BUTTONS
//================================================

function isSpecialCategory() {

    return (
        currentSong.category === "Great American Songbook" ||
        currentSong.category === "Broadway"
    );

}


//================================================
// TITLE
//================================================

document
    .getElementById("titleCorrect")
    .addEventListener("click", function () {

        const points =
            isSpecialCategory()
                ? CONFIG.scoring.specialTitle
                : CONFIG.scoring.standardTitle;

        if (!titleAwarded) {

            roundScore += points;

            titleAwarded = true;

        }

        document
            .getElementById("roundScore")
            .textContent = roundScore;

    });


document
    .getElementById("titleWrong")
    .addEventListener("click", function () {

        const points =
            isSpecialCategory()
                ? CONFIG.scoring.specialTitle
                : CONFIG.scoring.standardTitle;

        if (titleAwarded) {

            roundScore -= points;

            titleAwarded = false;

        }

        document
            .getElementById("roundScore")
            .textContent = roundScore;

    });


//================================================
// ARTIST
//================================================
// Only regular songs and 50s/60s Classics use Artist.

document
    .getElementById("artistCorrect")
    .addEventListener("click", function () {

        if (
            !currentSong ||
            isSpecialCategory()
        ) {

            return;

        }

        if (!artistAwarded) {

            roundScore +=
                CONFIG.scoring.standardArtist;

            artistAwarded = true;

        }

        document
            .getElementById("roundScore")
            .textContent = roundScore;

    });


document
    .getElementById("artistWrong")
    .addEventListener("click", function () {

        if (
            !currentSong ||
            isSpecialCategory()
        ) {

            return;

        }

        if (artistAwarded) {

            roundScore -=
                CONFIG.scoring.standardArtist;

            artistAwarded = false;

        }

        document
            .getElementById("roundScore")
            .textContent = roundScore;

    });


//================================================
// THIRD ITEM
//================================================
// Year, Decade, or Show.
// All are worth 1 point.

document
    .getElementById("thirdCorrect")
    .addEventListener("click", function () {

        if (!currentSong) {
            return;
        }

        if (!thirdAwarded) {

            roundScore +=
                CONFIG.scoring.standardThird;

            thirdAwarded = true;

        }

        document
            .getElementById("roundScore")
            .textContent = roundScore;

    });


document
    .getElementById("thirdWrong")
    .addEventListener("click", function () {

        if (!currentSong) {
            return;
        }

        if (thirdAwarded) {

            roundScore -=
                CONFIG.scoring.standardThird;

            thirdAwarded = false;

        }

        document
            .getElementById("roundScore")
            .textContent = roundScore;

    });

//================================================
// UPDATE NEXT BUTTON LABEL
//================================================

function updateNextButtonLabel() {

    const nextButton =
        document.getElementById("nextButton");


    // Party Mode: every song is a turn.
    // The final song ends the game.

    if (SETUP.gameMode === "party") {

        if (currentRound >= totalRounds) {

            nextButton.textContent =
                "END GAME";

        }
        else {

            nextButton.textContent =
                "NEXT SONG";

        }

        return;

    }


    // Normal team games:
    // Only the final team's turn in the final round
    // should show END GAME.

    if (
        currentRound >= totalRounds &&
        currentTeamIndex >= teams.length - 1
    ) {

        nextButton.textContent =
            "END GAME";

        return;

    }


    // Otherwise, move to the next team.

    nextButton.textContent =
        "NEXT TEAM";

}


//================================================
// NEXT TEAM / NEXT SONG BUTTON
//================================================

document
    .getElementById("nextButton")
    .addEventListener("click", function () {
        const currentTeam = teams[currentTeamIndex];
        if (currentTeam) {
            currentTeam.score = (Number(currentTeam.score) || 0) + (Number(roundScore) || 0);
        }

        currentTurnIndex += 1;
        if (currentTurnIndex >= currentTurnSequence.length) {
            currentTurnIndex = 0;
            currentRound += 1;
            currentTurnSequence = buildTurnSequenceForTeams(teams, currentRound);
        }

        if (!currentTurnSequence.length) {
            currentTurnSequence = buildTurnSequenceForTeams(teams, currentRound);
        }

        const activeTurn = getActiveTurn();
        if (activeTurn && activeTurn.teamName) {
            const nextTeamIndex = teams.findIndex(team => team.name === activeTurn.teamName);
            if (nextTeamIndex >= 0) {
                currentTeamIndex = nextTeamIndex;
            }
        }

        updateScoreboard();

        if (currentRound > totalRounds) {
            activePlayerName = null;
            sendHostState("complete");
            showGameOver();
            return;
        }

        activePlayerName = getActiveTurn().playerName || activePlayerName;
        sendHostState("playing");
        showActivePlayerStartScreen();

    });

//================================================
// PLAY AGAIN BUTTON
//================================================

document
    .getElementById("playAgainButton")
    .addEventListener("click", function () {

        // Reset setup state

        currentSetupTeam = 0;

        SETUP.teamDecks = [];

        SETUP.gameMode = "teams";
        SETUP.numberOfTeams = 2;
        SETUP.totalRounds = 10;


        // Reset setup screens

        document
            .getElementById("gameSettings")
            .classList.remove("hidden");

        document
            .getElementById("deckBuilder")
            .classList.add("hidden");


        // Reset visual game-mode selection

        document
            .querySelectorAll(
                "#gameModeOptions .setup-option"
            )
            .forEach(button => {

                button.classList.remove("selected");

            });

        document
            .getElementById("teams2Button")
            .classList.add("selected");


        // Reset round selection

        document
            .querySelectorAll(
                "#roundOptions .setup-option"
            )
            .forEach(button => {

                button.classList.remove("selected");

            });

        document
            .getElementById("round10Button")
            .classList.add("selected");


        // Return to the beginning of setup

        document
            .getElementById("titleArea")
            .classList.remove("hidden");

        showScreen("setupScreen");

    });
//================================================
// SETUP COMPLETION
//================================================

document.addEventListener(
    "backtrackSetupComplete",
    function () {

        console.log("BackTrack setup complete.");

        buildAllTeamDecks();


        // Apply the setup values to the game

        numberOfTeams =
            SETUP.numberOfTeams;

        totalRounds =
            SETUP.totalRounds;


        // Reset game state

        currentRound = 1;

        currentTeamIndex = 0;

        usedSongs = new Set();  


        // Create the teams

        createTeams();


        // Show Team 1's turn

        showCurrentTeam();

    }
);