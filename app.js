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

        yearTolerance: 1

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


//================================================
// GAME SETTINGS
//================================================

let numberOfTeams = 2;

let selectedDecade = "random";

let selectedDifficulty = "Mixed";

let totalRounds = 10;

let currentRound = 1;


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
        .getElementById(screenID)
        .classList
        .remove("hidden");

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

}

// Show team screen

function showCurrentTeam() {

    let team = teams[currentTeamIndex];


    document
        .getElementById("teamTurn")
        .textContent =
        team.name + "'S TURN";


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


        if (deck.length === 0) {

            alert("No songs left!");

            return;

        }


// Remove the next song from the shuffled deck.

        currentSong = deck.pop();


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


        showScreen("songScreen");


    });



// Next round

document
    .getElementById("nextButton")
    .addEventListener("click", function () {


        currentRound++;


        currentTeamIndex++;


        if (currentTeamIndex >= teams.length) {

            currentTeamIndex = 0;

        }


        if (currentRound > totalRounds) {

            alert("Game Over!");

            return;

        }


        showCurrentTeam();


    });