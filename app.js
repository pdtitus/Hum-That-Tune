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

let selectedTimer = 45;

let timerInterval = null;

let timeRemaining = 0;


//================================================
// TEAM DATA
//================================================

let teams = [];

let currentTeamIndex = 0;

//================================================
// MULTIPLAYER CONNECTION
//================================================

const BACKEND_URL = window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://backtrack-session-host-5uxukeuzmq-ue.a.run.app";

let sessionSocket = null;
let sessionToken = null;
let sessionJoinCode = null;
let isSessionHost = false;
let pendingHostState = null;

function setConnectionStatus(message) {

    document
        .getElementById("connectionStatus")
        .textContent = message;

}

function setRoomDisplay(message) {

    document
        .getElementById("roomDisplay")
        .textContent = message;

    const roomCode = message.match(/[A-Z0-9]{6}$/);

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
        totalRounds
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

    document
        .getElementById("playerGameStatus")
        .textContent = state.status === "complete"
            ? "Game complete."
            : `Team ${state.currentTeamIndex + 1} is playing.`;

}

function handleSessionMessage(message) {

    if (message.type === "connected") {

        setConnectionStatus(`Connected. Room ${sessionJoinCode || ""}`);
        setRoomDisplay(`Room code: ${sessionJoinCode || "connected"}`);

        if (!isSessionHost) {
            updatePlayerView(message.state);
            showScreen("playerScreen");
        }

        return;

    }

    if (message.type === "state" && !isSessionHost) {

        updatePlayerView(message.state);

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
                status: "lobby"
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

async function joinHostedSession() {

    const joinCode = document.getElementById("joinCode").value.trim().toUpperCase();
    const name = document.getElementById("playerName").value.trim() || "Player";

    if (!joinCode) {
        setConnectionStatus("Enter a join code first.");
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



// Screen controls

function showScreen(screenID) {

    const titleArea = document.getElementById("titleArea");

    if (screenID === "setupScreen") {

    titleArea.classList.remove("hidden");

    }
    else {
        
    titleArea.classList.add("hidden");
    } 
   
   
    document
        .getElementById("setupScreen")
        .classList
        .add("hidden");

    document
        .getElementById("turnScreen")
        .classList
        .add("hidden");

    document
        .getElementById("songScreen")
        .classList
        .add("hidden");

    document
        .getElementById("scoringScreen")
        .classList
        .add("hidden");

    document
        .getElementById("gameOverScreen")
        .classList
        .add("hidden");

    document
        .getElementById("playerScreen")
        .classList
        .add("hidden");

            const scoreboard = document.getElementById("scoreboard");

            if (screenID === "setupScreen" || screenID === "gameOverScreen" || screenID === "playerScreen") {

            scoreboard.classList.add("hidden");

        }   else {

            scoreboard.classList.remove("hidden");

}

    document
        .getElementById(screenID)
        .classList
        .remove("hidden");

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

    // Stay on the song screen.
    // Wait for the clue giver to press SCORE THIS SONG.
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

    let team = teams[currentTeamIndex];


        if (SETUP.gameMode === "party") {

        document
            .getElementById("teamTurn")
            .textContent =
            "PARTY MODE";

        }
        else {

        document
            .getElementById("teamTurn")
            .textContent =
            team.name + "'S TURN";

        }

    document
        .getElementById("passesRemaining")
        .textContent =
        teams[currentTeamIndex].passesRemaining;

        const passButton = document.getElementById("passButton");

    if (team.passesRemaining === 0) {

        passButton.classList.add("pass-disabled");

    } else {

        passButton.classList.remove("pass-disabled");

    }

    showScreen("turnScreen");

}


//================================================
// EVENT LISTENERS
//================================================

document
    .getElementById("startButton")
    .addEventListener("click", async function () {

        try {

            if (!isSessionHost) {
                await createHostedSession();
            }

            numberOfTeams = Number(document.getElementById("teamSelect").value);
            totalRounds = Number(document.getElementById("roundSelect").value);
            selectedDecade = document.getElementById("decadeSelect").value;
            selectedDifficulty = document.getElementById("difficultySelect").value;

            buildDeck();
            createTeams();
            currentRound = 1;
            currentTeamIndex = 0;

            sendHostState("playing");
            showCurrentTeam();

        } catch (error) {
            setConnectionStatus(error.message);
        }
    });

document
    .getElementById("joinButton")
    .addEventListener("click", async function () {

        try {
            await joinHostedSession();
        }
        catch (error) {
            setConnectionStatus(error.message);
        }

    });

// Reveal song

        document
        .getElementById("revealButton")
        .addEventListener("click", function () {

        revealNextSong();

    });

        // reduce passes...

       document
    .getElementById("passButton")
    .addEventListener("click", function () {

        let team = teams[currentTeamIndex];

        if (team.passesRemaining <= 0) {

            return;

        }

        team.passesRemaining--;

        document
            .getElementById("passesRemaining")
            .textContent =
            team.passesRemaining;

            const passButton = document.getElementById("passButton");

        if (team.passesRemaining === 0) {

            passButton.classList.add("pass-disabled");

        } else {

            passButton.classList.remove("pass-disabled");

        }

        sendHostState("playing");

        revealNextSong();

    });




    ;

// Next round

// Score button

document
    .getElementById("scoreButton")
    .addEventListener("click", function () {

        clearInterval(timerInterval);

        setupScoringScreen();
        updateNextButtonLabel();

        showScreen("scoringScreen");

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

        // Award points to the team that just played
        teams[currentTeamIndex].score += roundScore;

        // Move to the next team
        currentTeamIndex++;

        // If all teams have played, move to the next round
        if (currentTeamIndex >= teams.length) {

            currentTeamIndex = 0;
            currentRound++;

        }

        // Update the scoreboard
        updateScoreboard();

        // If all rounds are complete, end the game
        if (currentRound > totalRounds) {
            sendHostState("complete");
            showGameOver();
            return;
        }

        sendHostState("playing");
        showCurrentTeam();

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