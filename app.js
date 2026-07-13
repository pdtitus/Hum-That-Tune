let songs = [];
let currentSong = null;


// Load the song database
fetch("songs.json")
    .then(response => response.json())
    .then(data => {
        songs = data;
        console.log("Songs loaded:", songs.length);
    })
    .catch(error => {
        console.error("Error loading songs:", error);
    });


// Select a random song
function getRandomSong() {

    const randomIndex = Math.floor(Math.random() * songs.length);

    currentSong = songs[randomIndex];

    return currentSong;
}


// Reveal button
document
    .getElementById("revealButton")
    .addEventListener("click", function () {

        if (songs.length === 0) {
            alert("Songs are still loading...");
            return;
        }

        const song = getRandomSong();

        document.getElementById("songTitle").textContent = song.title;
        document.getElementById("artist").textContent = song.artist;
        document.getElementById("year").textContent = song.year;
        document.getElementById("difficulty").textContent = song.difficulty;


        document
            .getElementById("songCard")
            .classList
            .remove("hidden");


        document
            .getElementById("nextButton")
            .classList
            .remove("hidden");

    });


// Next button
document
    .getElementById("nextButton")
    .addEventListener("click", function () {

        document
            .getElementById("songCard")
            .classList
            .add("hidden");

        document
            .getElementById("nextButton")
            .classList
            .add("hidden");

    });