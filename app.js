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

        title: 2,

        artist: 1,

        year: 1,

    },

    gameLengths: [10, 20, 40],

    timerOptions: [15, 30, 60],

    passesPerTenRounds: 1

};


//================================================
// GAME DATA
//================================================


let songs = [];

let deck = [];

let currentSong = null;

let roundScore = 0;

let titleAwarded = false;
let artistAwarded = false;
let yearAwarded = false;


//================================================
// GAME SETTINGS
//================================================

let numberOfTeams = 2;

let selectedDecade = "random";

let selectedDifficulty = "Mixed";

let totalRounds = 10;

let currentRound = 1;

let selectedTimer = 30;

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
        .getElementById(screenID)
        .classList
        .remove("hidden");

}

function revealNextSong() {

    if (deck.length === 0) {

        alert("No songs left!");

        return;

    }


        currentSong = deck.pop();
        roundScore = 0;

        titleAwarded = false;
        artistAwarded = false;
        yearAwarded = false;

        document
            .getElementById("roundScore")
            .textContent = roundScore;


        document
            .getElementById("songTitle")
            .textContent =
            currentSong.title;


        document
            .getElementById("artist")
            .textContent =
            currentSong.artist;


        document
            .getElementById("year")
            .textContent =
            currentSong.year;


        document
            .getElementById("difficulty")
            .textContent =
            currentSong.difficulty;

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

        document
        .getElementById("buzzerSound")
        .play();

        showScreen("scoringScreen");

}

    }, 1000);

}



//================================================
// GAME FUNCTIONS
//================================================

// Create song deck

function buildDeck() {


    deck = songs.filter(song => {


        let decadeMatch =
            selectedDecade === "random" ||
            song.decade === selectedDecade;


        let difficultyMatch =
            selectedDifficulty === "Mixed" ||
            song.difficulty === selectedDifficulty;


        return decadeMatch && difficultyMatch;


    });


    shuffle(deck);


    console.log("Deck created:", deck.length);

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

    let passes = totalRounds / 10;


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

// Show team screen

function showCurrentTeam() {

    let team = teams[currentTeamIndex];


    document
        .getElementById("teamTurn")
        .textContent =
        team.name + "'S TURN";

    document
        .getElementById("passesRemaining")
        .textContent =
        teams[currentTeamIndex].passesRemaining;


    showScreen("turnScreen");

}


//================================================
// EVENT LISTENERS
//================================================

// Start Game button

document
    .getElementById("startButton")
    .addEventListener("click", function () {


        numberOfTeams =
            Number(document.getElementById("teamSelect").value);

totalRounds =
    Number(document.getElementById("roundSelect").value);
 
    selectedDecade =
            document.getElementById("decadeSelect").value;


        selectedDifficulty =
            document.getElementById("difficultySelect").value;


        buildDeck();


        createTeams();

        currentRound = 1;

        currentTeamIndex = 0;


        showCurrentTeam();


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

            alert("No passes remaining.");

            return;

        }

        team.passesRemaining--;

        document
            .getElementById("passesRemaining")
            .textContent =
            team.passesRemaining;

        revealNextSong();

    });




    ;

// Next round

// Score button

document
    .getElementById("scoreButton")
    .addEventListener("click", function () {

        clearInterval(timerInterval);

        showScreen("scoringScreen");

    });


//================================================
// SCORING BUTTONS
//================================================

document
    .getElementById("titleCorrect")
    .addEventListener("click", function () {

        if (!titleAwarded) {
            roundScore += CONFIG.scoring.title;
            titleAwarded = true;
        }

        document.getElementById("roundScore").textContent = roundScore;

    });

document
    .getElementById("titleWrong")
    .addEventListener("click", function () {

        if (titleAwarded) {
            roundScore -= CONFIG.scoring.title;
            titleAwarded = false;
        }

        document.getElementById("roundScore").textContent = roundScore;

    });



document
    .getElementById("artistCorrect")
    .addEventListener("click", function () {

        if (!artistAwarded) {
            roundScore += CONFIG.scoring.artist;
            artistAwarded = true;
        }

        document.getElementById("roundScore").textContent = roundScore;

    });

document
    .getElementById("artistWrong")
    .addEventListener("click", function () {

        if (artistAwarded) {
            roundScore -= CONFIG.scoring.artist;
            artistAwarded = false;
        }

        document.getElementById("roundScore").textContent = roundScore;

    });


document
    .getElementById("yearCorrect")
    .addEventListener("click", function () {

        if (!yearAwarded) {
            roundScore += CONFIG.scoring.year;
            yearAwarded = true;
        }

        document.getElementById("roundScore").textContent = roundScore;

    });

document
    .getElementById("yearWrong")
    .addEventListener("click", function () {

        if (yearAwarded) {
            roundScore -= CONFIG.scoring.year;
            yearAwarded = false;
        }

        document.getElementById("roundScore").textContent = roundScore;

    });

// Next team button

document
    .getElementById("nextButton")
    .addEventListener("click", function () {

// Award points to the team that just played

        teams[currentTeamIndex].score += roundScore;

        updateScoreboard();

// Now move to the next team

        currentTeamIndex++;


        if (currentTeamIndex >= teams.length) {

            currentTeamIndex = 0;

            currentRound++;

        }


        if (currentRound > totalRounds) {

            alert("Game Over!");

            return;

        }



        showCurrentTeam();


    });