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

            const scoreboard = document.getElementById("scoreboard");

            if (screenID === "setupScreen" || screenID === "gameOverScreen") {

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


    currentSong =
        currentDeck.pop();

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


    // Final round always ends the game

    if (currentRound >= totalRounds) {

        nextButton.textContent =
            "END GAME";

        return;

    }


    // Party Mode advances to another song

    if (SETUP.gameMode === "party") {

        nextButton.textContent =
            "NEXT SONG";

        return;

    }


    // Normal team games

    nextButton.textContent =
        "NEXT TEAM";

}


    // Next team button

document
    .getElementById("nextButton")
    .addEventListener("click", function () {

// Award points to the team that just played
teams[currentTeamIndex].score += roundScore;

// Now move to the next team
currentTeamIndex++;

if (currentTeamIndex >= teams.length) {

    currentTeamIndex = 0;
    currentRound++;

}

// NOW update the scoreboard
updateScoreboard();

if (currentRound > totalRounds) {

    // call showGameOver())
    showGameOver();
    return;

}


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

showCurrentTeam();


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


        // Create the teams

        createTeams();


        // Show Team 1's turn

        showCurrentTeam();

    }
);