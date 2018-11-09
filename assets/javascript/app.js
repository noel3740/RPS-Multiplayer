$(document).ready(function () {

    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyD_hruTmr-hBCaj4Pak5d6uv1U14eoFrhQ",
        authDomain: "rock-paper-scissors-d436a.firebaseapp.com",
        databaseURL: "https://rock-paper-scissors-d436a.firebaseio.com",
        projectId: "rock-paper-scissors-d436a",
        storageBucket: "rock-paper-scissors-d436a.appspot.com",
        messagingSenderId: "9049498232"
    };
    firebase.initializeApp(config);

    //Declare global variables
    var database = firebase.database();
    var searchForOpponentFL = false;

    var userData = {
        userName: "",
        userGuess: "",
        opponentKey: "",
        wins: 0,
        losses: 0,
        ties: 0
    }

    var opponentData = {
        userName: "",
        userGuess: "",
        wins: 0,
        losses: 0,
        ties: 0
    }

    var playersDatabaseRef = database.ref("/players");
    var currentUserDataBaseRef;
    var currentOpponentDatabaseRef;

    playersDatabaseRef.on("child_removed", function (snap) {

        if (snap.key == userData.opponentKey) {

            userData.opponentKey = "";
            updateCurrentUserData(userData);

            setOppenentDataToDefault();
            updateOpponentUserData(opponentData);

            $("#opponentName").text(`${snap.val().userName} disconnected`);
        }
    });

    function setOppenentDataToDefault() {
        opponentData.userName = "";
        opponentData.userGuess = "";
        opponentData.wins = 0;
        opponentData.losses = 0;
        opponentData.ties = 0;
    }


    playersDatabaseRef.on("value", function (snap) {

        if (currentUserDataBaseRef &&
            !userData.opponentKey) {

            searchForOpponent(snap);
        }
    });

    function searchForOpponent(snap) {

        snap.forEach((childSnap) => {
            if (searchForOpponentFL &&
                childSnap.key !== currentUserDataBaseRef.key &&
                (!childSnap.val().opponentKey || childSnap.val().opponentKey == currentUserDataBaseRef.key)) {

                currentOpponentDatabaseRef = childSnap.ref;
                currentOpponentDatabaseRef.on("child_changed", opponentValueChanged);

                opponentData.userName = childSnap.val().userName;
                updateOpponentUserData(opponentData);

                userData.opponentKey = childSnap.key;
                updateCurrentUserData(userData);

                $("#sectionPickHand").show();
                $("#lockOpponentCard").hide();

                searchForOpponentFL = false;
            }

        });
    }

    function opponentValueChanged(snap) {

        if (snap.key === "userGuess") {

            opponentData.userGuess = snap.val();
            checkWinner();
        }
    }

    function setHandIcon(handIconElement, handDesc) {

        handIconElement.removeClass();

        if (handDesc) {

            handIconElement.addClass("fas");

            switch (handDesc.toLowerCase()) {
                case "rock":
                    handIconElement.addClass("fa-hand-rock");
                    break;
                case "paper":
                    handIconElement.addClass("fa-hand-paper");
                    break;
                case "scissors":
                    handIconElement.addClass("fa-hand-scissors");
                    break;
            }
        }

    }

    function checkWinner() {

        var playerGuess = userData.userGuess;
        var opponentGuess = opponentData.userGuess;

        if (playerGuess && opponentGuess) {

            playerGuess = playerGuess.toLowerCase();
            opponentGuess = opponentGuess.toLowerCase();

            if ((playerGuess === "rock") || (playerGuess === "paper") || (playerGuess === "scissors")) {
                if ((playerGuess === "rock" && opponentGuess === "scissors") ||
                    (playerGuess === "scissors" && opponentGuess === "paper") ||
                    (playerGuess === "paper" && opponentGuess === "rock")) {
                    userData.wins++;
                    opponentData.losses++;
                } else if (playerGuess === opponentGuess) {
                    userData.ties++;
                    opponentData.ties++;
                } else {
                    userData.losses++;
                    opponentData.wins++;
                }
            }

            updateOpponentUserData(opponentData);
            updateCurrentUserData(userData);
        }
    }

    function updateCurrentUserData(data) {

        $("#yourName").text(data.userName);
        $("#yourWins").text(data.wins);
        $("#yourLosses").text(data.losses);
        $("#yourTies").text(data.ties);
        $("#yourHandDesc").text(data.userGuess);
        setHandIcon($("#yourHand"), data.userGuess);
        currentUserDataBaseRef.set(data);
    }

    function updateOpponentUserData(data) {

        $("#opponentName").text(data.userName);
        $("#opponentWins").text(data.wins);
        $("#opponentLosses").text(data.losses);
        $("#opponentTies").text(data.ties);
        $("#opponentHandDesc").text(data.userGuess);
        setHandIcon($("#opponentHand"), data.userGuess);
    }

    //Function will be run when the user picks a hand to play
    function handPicked() {

        userData.userGuess = $(this).attr("data-hand-desc");
        updateCurrentUserData(userData);

        $("#sectionPickHand").hide();
        checkWinner();
    }

    //Function that is run when the user start the game
    function startGame(event) {

        event.preventDefault();

        $("#formUserName").hide();

        var userNameValue = $("#inputUserName").val().trim();
        $("#yourName").text(userNameValue);

        userData.userName = userNameValue;

        //Save the user info to the database
        currentUserDataBaseRef = playersDatabaseRef.push(userData);
        currentUserDataBaseRef.onDisconnect().remove();

        //Set search for opponent flag to true
        searchForOpponentFL = true;

        //Show spinning wheel on the opponent card
        $("#lockOpponentCard").show();
    }

    //Function to enable or disable the start button
    function enableDisableStartButton() {
        var disableButton = $("#inputUserName").val().trim() ? false : true;
        $("#btnStartGame").prop("disabled", disableButton);
    }

    //Enable or disable the start button on load
    enableDisableStartButton();

    //Hide  the pick hand section by default
    $("#sectionPickHand").hide();

    //Hide the spinning wheel on the opponent card
    $("#lockOpponentCard").hide();

    //Attach on click events to the new game buttons and hand button
    $(".handButton").on("click", handPicked);
    $("#btnStartGame").on("click", startGame);

    //Enable or disable the start button depending on if the user entered a username
    $("#inputUserName").on("keyup", enableDisableStartButton);

    //When the user hovers over the hand button change the class so it fills in the hand icon
    $(".handButton").hover(
        (event) => $(event.currentTarget).find("i").removeClass("far").addClass("fas"),
        (event) => $(event.currentTarget).find("i").removeClass("fas").addClass("far"));
});