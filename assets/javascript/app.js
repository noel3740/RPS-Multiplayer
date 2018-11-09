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
        ties: 0,
        chatMessages: []
    }

    var opponentData = {
        userName: "",
        userGuess: "",
        wins: 0,
        losses: 0,
        ties: 0,
        chatMessages: []
    }

    var playersDatabaseRef = database.ref("/players");
    var currentUserDataBaseRef = null;
    var currentOpponentDatabaseRef = null;

    playersDatabaseRef.on("child_removed", function (snap) {

        if (snap.key == userData.opponentKey) {

            userData.opponentKey = "";
            updateCurrentUserData();

            setUserDataToDefault(opponentData);
            updateOpponentUserData();

            $("#opponentName").text(`${snap.val().userName} disconnected`);

            //Hide the chat button
            $("#btnChat").hide();

            //Hide the hand select buttons until an opponent is found
            $("#sectionPickHand").hide();

            //Show the search for opponent button so the user can start a new game with a new opponent
            $("#divSearchForOppenent").show();
        }
    });

    function setUserDataToDefault(data, keepUserNameFL) {

        if (!keepUserNameFL) {
            data.userName = "";
        }

        data.userGuess = "";
        data.wins = 0;
        data.losses = 0;
        data.ties = 0;
        data.chatMessages = [];

        if (data.opponentKey) {
            data.opponentKey = 0;
        }
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
                currentOpponentDatabaseRef.on("child_added", opponentValueChanged);

                opponentData.userName = childSnap.val().userName;
                updateOpponentUserData();

                userData.opponentKey = childSnap.key;
                updateCurrentUserData();

                $("#sectionPickHand").show();
                $("#lockOpponentCard").hide();
                $("#btnChat").show();

                searchForOpponentFL = false;
            }

        });
    }

    function opponentValueChanged(snap) {

        console.log("Parent Key: ", snap.ref.parent.key);
        console.log("Opponent Key: ", userData.opponentKey);

        switch (snap.key) {
            case "userGuess":
                opponentData.userGuess = snap.val();
                checkWinner();
                break;
            case "chatMessages":
                console.log("Opponenet Chat Messages", snap.val());
                opponentData.chatMessages = snap.val();

                if (snap.val().length > 0) {
                    createChatMessageDiv(opponentData.userName, snap.val()[snap.val().length - 1].message, true);
                }
                break;
/*             case "losses":
            case "wins":
            case "ties":
                if (snap.key === "losses") { opponentData.losses = snap.val(); }
                else if (snap.key === "wins") { opponentData.wins = snap.val(); }
                else if (snap.key === "ties") { opponentData.ties = snap.val(); }
                updateOpponentUserData();
                break; */
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

            var modalTitle = "";
            playerGuess = playerGuess.toLowerCase();
            opponentGuess = opponentGuess.toLowerCase();

            if ((playerGuess === "rock") || (playerGuess === "paper") || (playerGuess === "scissors")) {
                if ((playerGuess === "rock" && opponentGuess === "scissors") ||
                    (playerGuess === "scissors" && opponentGuess === "paper") ||
                    (playerGuess === "paper" && opponentGuess === "rock")) {
                    userData.wins++;
                    opponentData.losses++;
                    modalTitle = "You Won!";
                } else if (playerGuess === opponentGuess) {
                    userData.ties++;
                    opponentData.ties++;
                    modalTitle = "You Tied!";
                } else {
                    userData.losses++;
                    opponentData.wins++;
                    modalTitle = "You Lost!";
                }
            }

            updateOpponentUserData();
            updateCurrentUserData();

            //Show the results popup for 
            showModal(modalTitle);
        }
    }

    function showModal(title) {

        $("#resultsModalTitle").text(title);
        $("#resultsModal").modal('show');
        //Close the window after 5 seconds
        setTimeout(() => $("#resultsModal").modal('hide'), 5000);
    }

    //Function will run when the results modal is closed
    function onResultsModalClosed() {

        //Clear out the user guesses
        opponentData.userGuess = "";
        updateOpponentUserData();
        userData.userGuess = "";
        updateCurrentUserData();

        //Show the buttons for the user to pick a hand
        $("#sectionPickHand").show();
    }

    function updateCurrentUserData() {

        $("#yourName").text(userData.userName);
        $("#yourWins").text(userData.wins);
        $("#yourLosses").text(userData.losses);
        $("#yourTies").text(userData.ties);
        $("#yourHandDesc").text(userData.userGuess);
        setHandIcon($("#yourHand"), userData.userGuess);
        currentUserDataBaseRef.set(userData);
    }

    function updateOpponentUserData() {

        $("#opponentName").text(opponentData.userName);
        $("#opponentWins").text(opponentData.wins);
        $("#opponentLosses").text(opponentData.losses);
        $("#opponentTies").text(opponentData.ties);
        $("#opponentHandDesc").text(opponentData.userGuess);
        setHandIcon($("#opponentHand"), opponentData.userGuess);
    }

    //Function will be run when the user picks a hand to play
    function handPicked() {

        userData.userGuess = $(this).attr("data-hand-desc");
        updateCurrentUserData();

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

    //Function will run when the search for new opponenet button is pressed
    function searchForNewOpponent() {

        //Hide the search for new oppoenent div
        $("#divSearchForOppenent").hide();

        //Reset user data to default settings but keep the userName
        setUserDataToDefault(userData, true);
        //Update the user data on screen and database
        updateCurrentUserData();

        //Set search for opponent flag to true
        searchForOpponentFL = true;

        //Show spinning wheel on the opponent card
        $("#lockOpponentCard").show();

        //Clear out the chat messsages
        $("#chatMessages").empty();

        //Check the database once to see if there are any current opponents waiting
        playersDatabaseRef.once("value", searchForOpponent);
    }

    //Function to enable or disable the start button
    function enableDisableStartButton() {
        var disableButton = $("#inputUserName").val().trim() ? false : true;
        $("#btnStartGame").prop("disabled", disableButton);
    }

    function openChatWindow() {

        //$("#textboxMessage").focus();
        //setTimeout(function() { $('#textboxMessage').focus() }, 1000);
        $("#divChat").show("fast", ()=> $('#textboxMessage').focus());
        $('#textboxMessage').focus();
        stopChatButtonGlow();
    }

    function closeChatWindow() {
        $("#divChat").hide("fast");
        stopChatButtonGlow();
    }

    function sendChatMessage(event) {
        event.preventDefault();

        if ($("#textboxMessage").val().trim()) {

            var chatMessage = {
                dateTime: Date.now(),
                message: $("#textboxMessage").val()
            }
            userData.chatMessages.push(chatMessage);
            $("#textboxMessage").val("");
            updateCurrentUserData();
            createChatMessageDiv(userData.userName, chatMessage.message, false);
        }
    }

    function createChatMessageDiv(userName, chatMessage, isOpponentMessageFL) {

        var chatMessageDivElement = $("#chatMessages");
        var chatMessageClasses = isOpponentMessageFL ? "ml-5 mr-1 bg-light text-dark" : "ml-1 mr-5 bg-info text-light";

        var chatMessageContainerDiv = $("<div>")
            .addClass("border my-1 p-3 chatMessage")
            .addClass(chatMessageClasses);

        var chatMessageDiv = $(`<div><span class="font-weight-bold">${userName}: </span>${chatMessage}</div></div>`);

        chatMessageContainerDiv.append(chatMessageDiv);
        chatMessageDivElement.append(chatMessageContainerDiv);

        //Scroll to the bottom of the div so the last message is always visible
        chatMessageDivElement.animate({ "scrollTop": chatMessageDivElement[0].scrollHeight }, 0);

        if (isOpponentMessageFL) {
            startChatButtonGlow();
        }
    }

    function startChatButtonGlow() {
        $("#btnChat").css("animation", "glowingSecondaryButton 1000ms linear 0s infinite alternate");
    }

    function stopChatButtonGlow() {
        $("#btnChat").css("animation", "");
    }

    //Set default focus to the user name text box
    $("#inputUserName").focus();

    //Enable or disable the start button on load
    enableDisableStartButton();

    //Hide  the pick hand section by default
    $("#sectionPickHand").hide();

    //Hide the spinning wheel on the opponent card
    $("#lockOpponentCard").hide();

    //Hide the search for new opponent button by default
    $("#divSearchForOppenent").hide();

    //Hide the chat popup by default
    $("#divChat").hide();

    //Hide chat button until there is an opponent
    $("#btnChat").hide();

    //Attach on click events
    $(".handButton").on("click", handPicked);
    $("#btnStartGame").on("click", startGame);
    $("#btnSearchForOpponent").on("click", searchForNewOpponent);
    $("#btnChat").on("click", openChatWindow);
    $("#btnCloseChat").on("click", closeChatWindow);
    $("#formChat").on("submit", sendChatMessage);

    //Enable or disable the start button depending on if the user entered a username
    $("#inputUserName").on("keyup", enableDisableStartButton);

    //When the user hovers over the hand button change the class so it fills in the hand icon
    $(".handButton").hover(
        (event) => $(event.currentTarget).find("i").removeClass("far").addClass("fas"),
        (event) => $(event.currentTarget).find("i").removeClass("fas").addClass("far"));

    //Function will start a new hand when the results modal closes
    $("#resultsModal").on('hidden.bs.modal', onResultsModalClosed);
});