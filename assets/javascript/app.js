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
    var giphyAPIKey = "BhEB2InhZbmP96xsZoWBz15voVYxA47a";

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

    var currentUserDataBaseRef = null;
    var currentOpponentDatabaseRef = null;

    var playersDatabaseRef = database.ref("/players");

    //Check when a player disconnects
    playersDatabaseRef.on("child_removed", function (snap) {

        //If the player that disconnected is your opponent
        if (snap.key == userData.opponentKey) {

            //Notify user that the player disconnected on the main screen and in the chat window
            $("#opponentName").text(`${snap.val().userName} disconnected`);
            addDisconnectMessageToChat();

            //Hide the chat button
            $("#btnChat").hide();

            //Hide the hand select buttons until an opponent is found
            $("#sectionPickHand").hide();

            //Show the search for opponent button so the user can start a new game with a new opponent
            $("#divSearchForOppenent").show();
        }
    });

    //Set the user data object to it's default values
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
            data.opponentKey = "";
        }
    }

    //Function to search for an opponent
    function searchForOpponent(snap) {

        //If the current opponent db reference is not null 
        // remove it from the db and set it null
        if (currentOpponentDatabaseRef) {

            currentOpponentDatabaseRef.remove();
            currentOpponentDatabaseRef = null;
        }

        //Oppenent does not have the same key as the current user and 
        //doesn't currently have an opponent and the current user does 
        //not have an opponent
        if (currentUserDataBaseRef.key != snap.key &&
            !userData.opponentKey &&
            !snap.val().opponentKey) {

            //Stop searching for players added
            playersDatabaseRef.off("child_added", searchForOpponent);

            //Set the current opponent database ref to the ref we found
            currentOpponentDatabaseRef = snap.ref;
            //Remove the opponent from the database if they disconnect
            currentOpponentDatabaseRef.onDisconnect().remove();

            //Check when chat messages have been received
            currentOpponentDatabaseRef.child("chatMessages").on("child_added", chatMessageReceived);
            //Check when the opponent guess has changed
            currentOpponentDatabaseRef.child("userGuess").on("value", opponentGuessReceived);

            //Set the the user name for the opponent
            opponentData.userName = snap.val().userName;
            updateOpponentUserData();

            //Set the opponent key for the current user
            userData.opponentKey = snap.key;
            updateCurrentUserData();

            //Show the buttons to select a hand, 
            //Hide the "searching for opponents" lock div
            //Show the chat button
            $("#sectionPickHand").show();
            $("#lockScreen").hide();
            $("#btnChat").show();

            //Remove prevention of the html body from scrolling
            $("body").removeClass("noScroll");
        }
    }

    //Function that is run when the opponents guess has changed
    function opponentGuessReceived(snap) {

        //If the user guess value is not null or blank then set the userGuess in the
        //opponentData global variable to the value and check who the winner is
        if (snap.val()) {

            opponentData.userGuess = snap.val();
            checkWinner();
        }
    }

    //Function that is run when a new chat message is received
    function chatMessageReceived(snap) {

        //If the chat message object received is not null then 
        //push the new message to the chat message array on the
        //opponentData global variable
        if (snap.val() && opponentData.userName) {

            opponentData.chatMessages.push(snap.val());
            createChatMessageDiv(opponentData.userName, snap.val().message, true);
        }
    }

    //Function to set the hand icon displayed on the screen on user guess
    function setHandIcon(handIconElement, handDesc) {

        //Remove any classes from the hand icon element passed in as a parameter
        handIconElement.removeClass();

        //If the hand description passed in as a parameter is not blank or null
        //then add the font awesome classes for the hand description
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

    //Function to check who the winner is
    function checkWinner() {

        var playerGuess = userData.userGuess;
        var opponentGuess = opponentData.userGuess;

        //If the current player and opponent both have guesses then
        if (playerGuess && opponentGuess) {

            var modalTitle = "";
            playerGuess = playerGuess.toLowerCase();
            opponentGuess = opponentGuess.toLowerCase();

            //Compare the current player guess to the opponent guess to get winner/losser/tie and 
            //increment the wins/losses/ties in the current player and opponent objects and set 
            //the title that would be displayed in the results modal popup
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

            //Update opponent data on screen and current 
            //player data on screen and in the database
            updateOpponentUserData();
            updateCurrentUserData();

            //Show the results popup for 
            showModal(modalTitle);
        }
    }

    //Function to show the results modal popup
    function showModal(title) {

        //Set the title in the results modal popup
        $("#resultsModalTitle").text(title);
        //Show the results modal popup
        $("#resultsModal").modal('show');

        //Setup for a new game after 3 seconds. 
        setTimeout(() => {
            setupNewHand();
        }, 3000);

        //Close the results popup window after 5 seconds
        setTimeout(() => {
            $("#resultsModal").modal('hide');
            //Get a new gif in the results popup
            setResultsGif();
        }, 5000);
    }

    //Function to setup a new hand to play
    function setupNewHand() {

        //Clear out the user guesses
        opponentData.userGuess = "";
        updateOpponentUserData();
        userData.userGuess = "";
        updateCurrentUserData();

        //Show the buttons for the user to pick a hand
        $("#sectionPickHand").show();
    }

    //Function to update the current user data on screen and in the database
    function updateCurrentUserData() {

        $("#yourName").text(userData.userName);
        $("#yourWins").text(userData.wins);
        $("#yourLosses").text(userData.losses);
        $("#yourTies").text(userData.ties);
        $("#yourHandDesc").text(userData.userGuess);
        setHandIcon($("#yourHand"), userData.userGuess);
        currentUserDataBaseRef.set(userData);
    }

    //Function to update the opponent user data on screen
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

        //Set the value in the userData global object to the data-hand-desc 
        //attribute value in the hand button that was selected. Update the current
        //user data on the screen and in the database
        userData.userGuess = $(this).attr("data-hand-desc");
        updateCurrentUserData();

        //Hide the buttons for selecting a hand
        $("#sectionPickHand").hide();
        //Check the winner
        checkWinner();
    }

    //Function that is run when the user start the game
    function startGame(event) {

        event.preventDefault();

        //Hide the username form section
        $("#formUserName").hide();

        //If there is already a current user database ref then remove it from the database
        if (currentUserDataBaseRef) {
            currentUserDataBaseRef.remove();
            currentUserDataBaseRef = null;
        }

        //Grab the value the user entered in the username text box and display it on the screen
        var userNameValue = $("#inputUserName").val().trim();
        $("#yourName").text(userNameValue);

        //Sett the username on the user data object and push it out to the database to create the user there
        userData.userName = userNameValue;
        currentUserDataBaseRef = playersDatabaseRef.push(userData);

        //If the user disocnnects then remove that user from the database
        currentUserDataBaseRef.onDisconnect().remove();

        //Show spinning wheel on the opponent card
        $("#lockScreen").show();

        //Prevent the html body from scrolling
        $("body").addClass("noScroll");

        //Search for opponents
        playersDatabaseRef.on("child_added", searchForOpponent);
    }

    //Function will run when the search for new opponent button is pressed
    function searchOpponentClick() {

        //Clear opponent key from user data object and update it in the database
        userData.opponentKey = "";
        updateCurrentUserData();

        //Reset opponent data object to defaults and update screen
        setUserDataToDefault(opponentData);
        updateOpponentUserData();

        //Hide the search for new oppoenent div
        $("#divSearchForOppenent").hide();

        //Reset user data to default settings but keep the userName
        setUserDataToDefault(userData, true);
        //Update the user data on screen and database
        updateCurrentUserData();

        //Show spinning wheel on the opponent card
        $("#lockScreen").show();

        //Prevent the html body from scrolling
        $("body").addClass("noScroll");

        //Clear out the chat messsages
        $("#chatMessages").empty();

        //Search for opponents
        playersDatabaseRef.on("child_added", searchForOpponent);
    }

    //Function to enable or disable the start button
    function enableDisableStartButton() {
        var disableButton = $("#inputUserName").val().trim() ? false : true;
        $("#btnStartGame").prop("disabled", disableButton);
    }

    //Function to open the chat window
    function openChatWindow() {

        //Animate the showing of the chat window and when done set the focus to the
        //send chat text box
        $("#divChat").show("fast", () => $('#textboxMessage').focus());
        //Prevent the html body from scrolling when the chat window is open
        $("body").addClass("noScroll");
        //Stop the chat button from glowing
        stopChatButtonGlow();

        //Scroll to the bottom of the div so the last message is always visible
        var chatMessageDivElement = $("#chatMessages");
        chatMessageDivElement.animate({ "scrollTop": chatMessageDivElement[0].scrollHeight }, 0);
    }

    //Function to close the chat window
    function closeChatWindow() {

        //Animate the hiding of the chat window
        $("#divChat").hide("fast");
        //Allow the html body to scroll again
        $("body").removeClass("noScroll");
        //Stop the chat button from glowing
        stopChatButtonGlow();
    }

    //Function to send a chat message to the opponent
    function sendChatMessage(event) {

        event.preventDefault();
        var textboxMessage = $("#textboxMessage");

        //If the message being sent has a value
        if (textboxMessage.val().trim()) {

            //Create a chat message object
            var chatMessage = {
                dateTime: firebase.database.ServerValue.TIMESTAMP,
                message: textboxMessage.val()
            }

            //Add the chat message object to the userData object global variable
            userData.chatMessages.push(chatMessage);
            //Clear out the message text box
            textboxMessage.val("");
            //Update the current user data on screen and in the database
            updateCurrentUserData();
            //Add the message to the chat window
            createChatMessageDiv(userData.userName, chatMessage.message, false);
        }
    }

    //Function to add the chat message to the chat window
    function createChatMessageDiv(userName, chatMessage, isOpponentMessageFL) {

        var chatMessageDivElement = $("#chatMessages");
        //Get the class to add to the div depending on if it's for the current user or the opponent
        var chatMessageClasses = isOpponentMessageFL ? "ml-5 mr-1 bg-light text-dark" : "ml-1 mr-5 bg-info text-light";

        //Create chat message container div
        var chatMessageContainerDiv = $("<div>")
            .addClass("border my-1 p-3 chatMessage")
            .addClass(chatMessageClasses);

        //Create the div containing the chat message text
        var chatMessageDiv = $(`<div><span class="font-weight-bold">${userName}: </span>${chatMessage}</div></div>`);

        //Append the chat message text div to the chat message container
        chatMessageContainerDiv.append(chatMessageDiv);
        //Append the chat message container div to the main chat window div
        chatMessageDivElement.append(chatMessageContainerDiv);

        //Scroll to the bottom of the div so the last message is always visible
        chatMessageDivElement.animate({ "scrollTop": chatMessageDivElement[0].scrollHeight }, 0);

        //If this is a message from an opponent then make the chat button glow 
        //so the user knows there is a new message if they don't have the chat 
        //window open
        if (isOpponentMessageFL) {
            startChatButtonGlow();
        }
    }

    //Function to add a disconnect message to the chat window
    function addDisconnectMessageToChat() {

        var chatMessageDivElement = $("#chatMessages");
        //Create element that contains the player disconnected message
        var newElement = $(`<p class="text-center pt-3">Player diconnected!</p>`);

        //Add the new element to the main chat window div
        chatMessageDivElement.append(newElement);

        //Scroll to the bottom of the div so the last message is always visible
        chatMessageDivElement.animate({ "scrollTop": chatMessageDivElement[0].scrollHeight }, 0);
    }

    //Function to make the chat button glow
    function startChatButtonGlow() {
        $("#btnChat").css("animation", "glowingSecondaryButton 1000ms linear 0s infinite alternate");
    }

    //Function to stop the chat button from glowing
    function stopChatButtonGlow() {
        $("#btnChat").css("animation", "");
    }

    //Function to add a gif to the results div
    function setResultsGif() {
        //Build the giphy query url
        var queryURL = `https://api.giphy.com/v1/gifs/random?api_key=${giphyAPIKey}&rating=g&tag=dog`;

        //send a get request to the giphy url then build the gif card elements on the page. 
        //after gif is retrieved then display the results popup
        $.ajax({
            url: queryURL,
            method: "GET"
        }).then((giphyResponse) => {

            $("#resultsModalBody").empty();
            var gifImg = $("<img>")
                .attr("width", "100%")
                .attr("src", giphyResponse.data.image_url);

            $("#resultsModalBody").append(gifImg);
        });
    }

    //Set default focus to the user name text box
    $("#inputUserName").focus();

    //Enable or disable the start button on load
    enableDisableStartButton();

    //Hide  the pick hand section by default
    $("#sectionPickHand").hide();

    //Hide the spinning wheel on the opponent card
    $("#lockScreen").hide();

    //Remove prevention of the html body from scrolling
    $("body").removeClass("noScroll");

    //Hide the search for new opponent button by default
    $("#divSearchForOppenent").hide();

    //Hide the chat popup by default
    $("#divChat").hide();

    //Hide chat button until there is an opponent
    $("#btnChat").hide();

    //Set the gif in the results popup
    setResultsGif();

    //Attach on click events
    $(".handButton").on("click", handPicked);
    $("#btnStartGame").on("click", startGame);
    $("#btnSearchForOpponent").on("click", searchOpponentClick);
    $("#btnChat").on("click", openChatWindow);
    $("#btnCloseChat").on("click", closeChatWindow);
    $("#formChat").on("submit", sendChatMessage);
    $("#spanEnterMessage").on("click", sendChatMessage);

    //Enable or disable the start button depending on if the user entered a username
    $("#inputUserName").on("keyup", enableDisableStartButton);

    //When the user hovers over the hand button change the class so it fills in the hand icon
    $(".handButton").hover(
        (event) => $(event.currentTarget).find("i").removeClass("far").addClass("fas"),
        (event) => $(event.currentTarget).find("i").removeClass("fas").addClass("far"));
});