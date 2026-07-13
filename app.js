let songs = [];

let deck = [];

let currentSong = null;

let currentTeam = 1;

let numberOfTeams = 2;

let selectedDecade = "random";

let selectedDifficulty = "Mixed";


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



// Start Game button

document
    .getElementById("startButton")
    .addEventListener("click", function () {


        numberOfTeams =
            Number(document.getElementById("teamSelect").value);


        selectedDecade =
            document.getElementById("decadeSelect").value;


        selectedDifficulty =
            document.getElementById("difficultySelect").value;


        buildDeck();


        currentTeam = 1;


        showTurnScreen();

    });



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



// Show team screen

function showTurnScreen() {

    document
        .getElementById("teamTurn")
        .textContent =
        "TEAM " + currentTeam + "'S TURN";


    showScreen("turnScreen");

}



// Reveal song

document
    .getElementById("revealButton")
    .addEventListener("click", function () {


        if (deck.length === 0) {

            alert("No songs left!");

            return;

        }


        currentSong =
            deck.pop();


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


        currentTeam++;


        if (currentTeam > numberOfTeams) {

            currentTeam = 1;

        }


        showTurnScreen();


    });