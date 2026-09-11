 /*
 * BACKTRACK — Setup Module
 *
 * First step in separating game setup from gameplay.
 * This is a SKELETON only.
 *
 * For now, this file does not connect to the existing
 * Start Game button or change the current game behavior.
 */


/* =========================================================
   GAME SETUP STATE
   ========================================================= */

const SETUP = {

    // Current game settings
    numberOfTeams: 2,
    totalRounds: 10,
    selectedDecade: "mixed",
    selectedDifficulty: "Mixed",

    teamDecks: []

};

let currentSetupTeam = 0;

function createEmptyTeamDeck() {

    return {
        "70s": [],
        "80s": [],
        "90s": [],
        "2000-2015": [],
        "50's and 60's Classics": false,
        "Great American Songbook": false,
        "Broadway": false
    };

}

function initializeCurrentTeamDeck() {

    SETUP.teamDecks[currentSetupTeam] =
        createEmptyTeamDeck();

}


/* =========================================================
   STEP 1 — GAME SETTINGS
   ========================================================= */

/* =========================================================
    SETUP BUTTONS
   ========================================================= */

function selectGameMode(mode) {

    if (mode === "party") {

        SETUP.gameMode = "party";
        SETUP.numberOfTeams = 1;

    }

    else {

        SETUP.gameMode = "teams";
        SETUP.numberOfTeams = Number(mode);

    }


    // Update visual selection

    document.querySelectorAll("#gameModeOptions .setup-option")
        .forEach(button => {
            button.classList.remove("selected");
        });


    if (mode === "party") {

        document.getElementById("partyModeButton")
            .classList.add("selected");

    }

    else {

        document.getElementById(`teams${mode}Button`)
            .classList.add("selected");

    }


    console.log("Game mode:", SETUP.gameMode);
    console.log("Number of teams:", SETUP.numberOfTeams);

}


function selectRoundCount(rounds) {

    SETUP.totalRounds = Number(rounds);


    // Update the visual selection

    document.querySelectorAll("#roundOptions .setup-option")
        .forEach(button => {
            button.classList.remove("selected");
        });


    document.getElementById(`round${rounds}Button`)
        .classList.add("selected");

}   

/* =========================================================
   BUTTON EVENTS -- TEAMS AND ROUNDS
   ========================================================= */

const teams2Button = document.getElementById("teams2Button");
const teams3Button = document.getElementById("teams3Button");
const teams4Button = document.getElementById("teams4Button");
const partyModeButton = document.getElementById("partyModeButton");
const round5Button = document.getElementById("round5Button");
const round10Button = document.getElementById("round10Button");
const round20Button = document.getElementById("round20Button");

if (teams2Button) teams2Button.addEventListener("click", () => selectGameMode(2));
if (teams3Button) teams3Button.addEventListener("click", () => selectGameMode(3));
if (teams4Button) teams4Button.addEventListener("click", () => selectGameMode(4));
if (partyModeButton) partyModeButton.addEventListener("click", () => selectGameMode("party"));
if (round5Button) round5Button.addEventListener("click", () => selectRoundCount(5));
if (round10Button) round10Button.addEventListener("click", () => selectRoundCount(10));
if (round20Button) round20Button.addEventListener("click", () => selectRoundCount(20));

function collectGameSettings() {

    SETUP.numberOfTeams =
        Number(document.getElementById("teamSelect").value);

    SETUP.totalRounds =
        Number(document.getElementById("roundSelect").value);

    SETUP.selectedDecade =
        document.getElementById("decadeSelect").value;

    SETUP.selectedDifficulty =
        document.getElementById("difficultySelect").value;

}


/* =========================================================
   STEP 2 — TEAM DECK SETUP
   ========================================================= */

/* =========================================================
    BEGIN DECK BUILDER
   ========================================================= */

const nextSetupButton = document.getElementById("nextSetupButton");

if (nextSetupButton) {
    nextSetupButton.addEventListener("click", () => {

        console.log("Game setup:", SETUP);

        const gameSettings = document.getElementById("gameSettings");
        if (gameSettings) {
            gameSettings.classList.add("hidden");
        }

        const deckBuilder = document.getElementById("deckBuilder");
        if (deckBuilder) {
            deckBuilder.classList.remove("hidden");
        }

        const titleArea = document.getElementById("titleArea");
        if (titleArea) {
            titleArea.classList.add("hidden");
        }

        startTeamDeckSetup();

    });
}

function startTeamDeckSetup() {


    initializeCurrentTeamDeck();

    const deckBuilder =
        document.getElementById("deckBuilder");


    deckBuilder.innerHTML = `

        <h3>
         ${
        SETUP.gameMode === "party"
            ? "PARTY MODE — BUILD YOUR DECK"
            : `TEAM ${currentSetupTeam + 1} — BUILD YOUR DECK`
         }
        </h3>

        <div class="deck-matrix">

            <div class="matrix-header">
                <div></div>
                <div>EASY</div>
                <div>MEDIUM</div>
                <div>HARD</div>
            </div>


            <div class="matrix-row" data-category="70s">

                <div class="category-name">70s</div>

                <button class="difficulty-option"
                        data-category="70s"
                        data-difficulty="Easy"
                        disabled>
                    EASY
                </button>

                <button class="difficulty-option"
                        data-category="70s"
                        data-difficulty="Medium"
                        disabled>
                    MEDIUM
                </button>

                <button class="difficulty-option"
                        data-category="70s"
                        data-difficulty="Hard"
                        disabled>
                    HARD
                </button>

            </div>


            <div class="matrix-row" data-category="80s">

                <div class="category-name">80s</div>

                <button class="difficulty-option"
                        data-category="80s"
                        data-difficulty="Easy"
                        disabled>
                    EASY
                </button>

                <button class="difficulty-option"
                        data-category="80s"
                        data-difficulty="Medium"
                        disabled>
                    MEDIUM
                </button>

                <button class="difficulty-option"
                        data-category="80s"
                        data-difficulty="Hard"
                        disabled>
                    HARD
                </button>

            </div>


            <div class="matrix-row" data-category="90s">

                <div class="category-name">90s</div>

                <button class="difficulty-option"
                        data-category="90s"
                        data-difficulty="Easy"
                        disabled>
                    EASY
                </button>

                <button class="difficulty-option"
                        data-category="90s"
                        data-difficulty="Medium"
                        disabled>
                    MEDIUM
                </button>

                <button class="difficulty-option"
                        data-category="90s"
                        data-difficulty="Hard"
                        disabled>
                    HARD
                </button>

            </div>


            <div class="matrix-row" data-category="2000-2015">

                <div class="category-name">2000–2015</div>

                <button class="difficulty-option"
                        data-category="2000-2015"
                        data-difficulty="Easy"
                        disabled>
                    EASY
                </button>

                <button class="difficulty-option"
                        data-category="2000-2015"
                        data-difficulty="Medium"
                        disabled>
                    MEDIUM
                </button>

                <button class="difficulty-option"
                        data-category="2000-2015"
                        data-difficulty="Hard"
                        disabled>
                    HARD
                </button>

            </div>


            <div class="matrix-row classic-row">

                <button class="category-option"
                        data-category="50's and 60's Classics">
                        CLASSIC 50'S AND 60'S SONGS
                </button>

            </div>


            <div class="matrix-row songbook-row">

                <button class="category-option"
                        data-category="Great American Songbook">
                        GREAT AMERICAN SONGBOOK
                </button>

            </div>


            <div class="matrix-row broadway-row">

                <button class="category-option"
                        data-category="Broadway">
                        BROADWAY SHOW TUNES
                </button>

            </div>

            <div class="setup-navigation">

                <button type="button" id="nextTeamButton">
                ${
                    SETUP.gameMode === "party" ||
                   currentSetupTeam === SETUP.numberOfTeams - 1
                        ? "START GAME"
                        : "NEXT TEAM"
                }
                </button>

            </div>

        </div>

    `;


    setupMatrixEvents();

    document
    .getElementById("nextTeamButton")
    .addEventListener("click", goToNextSetupTeam);

}

function goToNextSetupTeam() {

    // If this is NOT the final team,
    // move to the next team.

    if (currentSetupTeam < SETUP.numberOfTeams - 1) {

        currentSetupTeam++;

        console.log(
            "Moving to setup team:",
            currentSetupTeam + 1
        );

        initializeCurrentTeamDeck();

        startTeamDeckSetup();

        return;
    }


    // Otherwise, this was the final team.

    console.log("All teams configured.");

    console.log("Final setup:", SETUP);

    finishSetup();

}

function setupMatrixEvents() {

    const teamDeck =
    SETUP.teamDecks[currentSetupTeam];


    // ================================================
    // REGULAR DECADE ROWS
    // ================================================

    const decadeRows =
        document.querySelectorAll(".matrix-row[data-category]");


    decadeRows.forEach(row => {

        const category =
            row.dataset.category;


        // Skip Old Classics

        if (
            category === "50's and 60's Classics" ||
            category === "Great American Songbook" ||
            category === "Broadway"
            ) {
            return;
            }


        const difficultyButtons =
            row.querySelectorAll(".difficulty-option");


        const categoryName =
            row.querySelector(".category-name");


        // --------------------------------------------
        // CLICK DECADE
        // --------------------------------------------

        categoryName.addEventListener("click", function () {

            const decadeIsSelected =
                row.classList.contains("selected");


            if (!decadeIsSelected) {

                // Select all three difficulties

                row.classList.add("selected");

                difficultyButtons.forEach(button => {

                    button.disabled = false;

                    button.classList.add("selected");

                });


                teamDeck[category] =
                    ["Easy", "Medium", "Hard"];

            }

            else {

                // Turn the decade completely off

                row.classList.remove("selected");

                difficultyButtons.forEach(button => {

                    button.disabled = true;

                    button.classList.remove("selected");

                });


                teamDeck[category] = [];

            }


            console.log(
             `Team ${currentSetupTeam + 1} deck:`,
              teamDeck
            );
        });


        // --------------------------------------------
        // CLICK INDIVIDUAL DIFFICULTY
        // --------------------------------------------

        difficultyButtons.forEach(button => {

            button.addEventListener("click", function () {

                const difficulty =
                    this.dataset.difficulty;


                this.classList.toggle("selected");


                const selectedDifficulties =
                    Array.from(difficultyButtons)
                        .filter(button =>
                            button.classList.contains("selected")
                        )
                        .map(button =>
                            button.dataset.difficulty
                        );


                teamDeck[category] =
                    selectedDifficulties;


                // If at least one remains,
                // keep the decade active.

                if (selectedDifficulties.length > 0) {

                    row.classList.add("selected");

                }

                else {

                    // Nothing selected:
                    // turn the decade off.

                    row.classList.remove("selected");

                    difficultyButtons.forEach(button => {

                        button.disabled = true;

                    });

                }


                console.log(
                 `Team ${currentSetupTeam + 1} deck:`,
                teamDeck
                );

            });

        });

    });


    // ================================================
    // OLD CLASSICS
    // ================================================

    const categoryButtons =
        document.querySelectorAll(".category-option");


    categoryButtons.forEach(button => {

        button.addEventListener("click", function () {

            const category =
                this.dataset.category;


            this.classList.toggle("selected");


            teamDeck[category] =
                this.classList.contains("selected");



            console.log(
               `Team ${currentSetupTeam + 1} deck:`,
               teamDeck
            );


        });

    });

}


function saveTeamDeck(teamIndex, deckSelection) {

    // TODO:
    // Save this team's selection in SETUP.teamDecks[teamIndex].

}


/* =========================================================
   DECK CONFIGURATION
   ========================================================= */

/*
 * A future team deck might look like:
 *
 * {
 *     "70s": ["Easy", "Medium", "Hard"],
 *     "80s": ["Easy", "Medium"],
 *     "90s": [],
 *     "2000-2015": [],
 *     "Classic": true,
 *     "Songbook": true,
 *     "Broadway": false
 * }
 *
 * This is only a conceptual structure for now.
 */


/* =========================================================
   VALIDATION
   ========================================================= */

function validateTeamDeck(deckSelection) {

    // TODO:
    // Make sure the selection is valid.
    // Later this can check the actual songs.json library.

    return true;

}


/* =========================================================
   SETUP COMPLETE
   ========================================================= */

function finishSetup() {

    console.log("SETUP COMPLETE:", SETUP);

    document.dispatchEvent(
        new CustomEvent("backtrackSetupComplete")
    );

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

/*
 * IMPORTANT:
 * Do not connect this module to the existing Start Game
 * button yet. We will do that deliberately after the
 * skeleton is installed and confirmed to load.
 */

console.log("BackTrack setup.js loaded.");