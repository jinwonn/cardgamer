//CREATE RANDOM USER ID ONCE PER SESSION (REGENERATED ON REFRESH BUT NOT ON SOCKET DROP/RECONNECT)
var randomlyGeneratedUID = Math.random().toString(36).substring(3,16) + +new Date;
var gameId, players, opponentUID;
const cardRef = {
  1:'01H',
  2:'02H',
  3:'03H',
  4:'04H',
  5:'05H',
  6:'06H',
  7:'07H',
  8:'08H',
  9:'09H',
  10:'10H',
  11:'11H',
  12:'12H',
  13:'13H',
  14:'01S',
  15:'02S',
  16:'03S',
  17:'04S',
  18:'05S',
  19:'06S',
  20:'07S',
  21:'08S',
  22:'09S',
  23:'10S',
  24:'11S',
  25:'12S',
  26:'13S',
  27:'01C',
  28:'02C',
  29:'03C',
  30:'04C',
  31:'05C',
  32:'06C',
  33:'07C',
  34:'08C',
  35:'09C',
  36:'10C',
  37:'11C',
  38:'12C',
  39:'13C',
  40:'01D',
  41:'02D',
  42:'03D',
  43:'04D',
  44:'05D',
  45:'06D',
  46:'07D',
  47:'08D',
  48:'09D',
  49:'10D',
  50:'11D',
  51:'12D',
  52:'13D',
  53:'j01',
  54:'j02',
};



/*TYPICAL MESSAGE STRUCTURE
const message = {
  turn: 1,
  cards: { id1: 15 },
  roundWinner: '',
  gameWinner: '',
  players: {
    id1: { score: 1, playable: false },
    id2: { score: 0, playable: true }
  }
};*/


//INITIATE SOCKET CONNECTION
var HOST = location.origin
var socket = io.connect(HOST);

//CONFIRM CONNECT TO SERVER
socket.on('connect', () => {
  console.log('Successfully connected!');

});

//message both people connected and server ready for game
socket.on('ready', (message) => {
  gameId = message.gameId;
  players = message.players;

  //Set opponent UID for later use/lookup
  opponentUID = (players.indexOf(randomlyGeneratedUID) == 1)? players[0]: players[1];

  //Setup scorecard information upon connect to second player
  $('#op').text(message.usernames[players.indexOf(opponentUID)]);

  //Setup replay logic
  if ($('#playagain').length > 0 || message.usernames[0] == message.usernames[1]){
    window.location = "/wargame";
  } else {
    gameconnect()
  }
  console.log('p2 connected and game loaded');

});

socket.on('update', (message) => {
  let mycard = cardRef[message.cards[randomlyGeneratedUID]];
  let opponentcard = cardRef[message.cards[opponentUID]];
  p1draw(mycard);
  p2draw(opponentcard);
  cardmove(message);
  displayRoundWinner(message);
  setTimeout(function () {
    setScore(message);
    gameEndCheck(message);
    }, 3520);

  console.log(message);
});


// FUNCTIONS -------------------------------------------------------------------------

//initial game load and waiting for other player
function gameload(){
  //show game container and end button
  if ($('.wargamecontainer').is(":hidden")) {
  $('.wargamecontainer').slideToggle();}
  $('.endwargame').show();
  $('#scorebox').hide();
  let $waitingmessage = $("<h2>").text("WAITING FOR A FRIEND (｡•́︿•̀｡)").attr('id', 'waitmessage');
  let $gametitle = $("<h2>").addClass('title').text("Game of War");
  $('.wargamecontainer').append($waitingmessage);
  $('.gametitlesection').prepend($gametitle)

  //emit game load
  var registration = {
    uid: randomlyGeneratedUID,
    gameType: "war"
  };
  socket.emit('register', registration);
}

//player 2 disconnected
// function gamedisconnect(){
//     $('.wargamecontainer').empty();

// let $disconnectmessage = $("<h2>").text("FRIEND LOST");
// $('.wargamecontainer').append($disconnectmessage);

// }


//loads game of war code
function gameconnect(){
  $('.wargamecontainer').empty();
  $('.p1draw').show();
  if ($('#scorebox').is(":hidden")) {
    $('#scorebox').slideToggle();}
    let $p1cardcontainer = $("<div>").attr('id', 'cardcontainer');
    let $p2cardcontainer = $("<div>").attr('id', 'cardcontainer');
    let $p1hand = $("<div>").attr('id', 'p1hand');
    let $p2hand = $("<div>").attr('id', 'p2hand');
    let $p2card = $("<img>").attr('src', "/images/cards/purple_back.png").attr('id', 'p2card');;
    let $p1card = $("<img>").attr('src', "/images/cards/red_back.png").attr('id', 'p1card');;
    let $playfield = $("<section>").attr('id', 'middlefield');
    let $p2cardbox = $("<div>").attr('id', 'p2carddrawnbox');
    let $p1cardbox = $("<div>").attr('id', 'p1carddrawnbox');
    let $draw = $('<button>').addClass('p1draw');
    $p1hand.append($p1card, $p1cardbox);
    $p2hand.append($p2card, $p2cardbox);
    $p1cardcontainer.append($p1hand);
    $p2cardcontainer.append($p2hand);
    $('.wargamecontainer').append($p2cardcontainer, $playfield, $p1cardcontainer);
    $('#middlefield').append("Please Draw a Card");

}

//p1 draw card function to move card and await p2
function p1draw(param){
  if (param && $('#p1carddrawn').length > 0){
    setTimeout(function () {
      $("#p1carddrawn").animate({left: '+=0px'});
    }, 500);
  } else if (param) {
    p1drawnCard = `/images/cards/${param}.png`;
    $('#p1carddrawnbox').empty();
    $('#p1carddrawnbox').append(`<img src = '${p1drawnCard}' id = 'p1carddrawn'>`)
    $('#middlefield').empty();
    if (param && $('#p2carddrawn').length > 0){
    } else {
      $('#middlefield').append("Waiting for opponent to draw a card.");
    }
    setTimeout(function () {
      $("#p1carddrawn").animate({left: '+=75px'});
    }, 500);
  }
}

//p2 draw card function to move card
function p2draw(param){
  if (param && $('#p2carddrawn').length > 0){
    setTimeout(function () {
      $("#p2carddrawn").animate({left: '+=0px'});
    }, 500);
  } else if (param) {
    p2drawnCard = `/images/cards/${param}.png`;
    $('#p2carddrawnbox').empty();
    $('#p2carddrawnbox').append(`<img src = '${p2drawnCard}' id = 'p2carddrawn'>`)
    setTimeout(function () {
      $("#p2carddrawn").animate({left: '-=75px'});
    }, 500);
    if (param && $('#p1carddrawn').length > 0){
      $('#middlefield').empty();
    }
  }
}

//card movement upon both players selecting their cards
function cardmove(param) {
  setTimeout(function () {
    if (param.roundWinner) {
      $("#p2carddrawn").animate({right: '+=70px', top: '+=220px'});
      $("#p1carddrawn").animate({bottom: '+=220px'});
      setTimeout(function () {
          $('#p1carddrawnbox').empty();
          $('#p2carddrawnbox').empty();
          // console.log("cards cleared")
          $('.p1draw').show();
          $('#middlefield').empty();
          $('#middlefield').append("Please Draw a Card");
        }, 3000);
    }
  }, 500);
}

//display player scores
function setScore(param) {
  // setTimeout(function () {
    $('#my-score').text(param.players[randomlyGeneratedUID].score);
    $('#op-score').text(param.players[opponentUID].score);
    $('#turn').text(param.turn + 1);
    // }, 3500);
}

// display winner message and button to play again
function displaygameWinner(param) {
  if (param.gameWinner === randomlyGeneratedUID) {
    $('#middlefield').empty();
    $('#middlefield').append("YOU WIN!!!")
    $('#middlefield').append(`<div class="again-container"><form action="/wargame" id=playagain>
    <input type="submit" class='play-again' value="PLAY AGAIN" />
    </form></div>`)
  } else {
    $('#middlefield').empty();
    $('#middlefield').append("YOU'RE A LOSER (┛◉Д◉)┛彡┻━┻")
    $('#middlefield').append(`<div class="again-container"><form action="/wargame" id=playagain>
    <input type="submit" class='play-again' value="PLAY AGAIN" />
    </form></div>`)
  }
}

// Displays round winner
function displayRoundWinner(param) {
  if (param.roundWinner) {
    if (param.roundWinner === randomlyGeneratedUID){
      setTimeout(function () {
        $('#middlefield').empty();
        $('#middlefield').append(`YOU WIN THIS ROUND`)
        }, 1250);
    } else if (param.roundWinner == "draw") {
      setTimeout(function () {
        $('#middlefield').empty();
        $('#middlefield').append(`ITS A DRAW`)
        }, 1250);
    } else {
      setTimeout(function () {
        $('#middlefield').empty();
        $('#middlefield').append(`YOU LOSE THIS ROUND`)
        }, 1250);
    };
  };
}

//game end check and actions
function gameEndCheck(param){
  if (param.gameWinner) {
    console.log("endgame check");
      $('.p1draw').hide();
      displaygameWinner(param);
      socket.emit('end-game', {uid: randomlyGeneratedUID});
      console.log("send end game")
  }
}


// EVENTS------------------------------------------------------------------

//on page load
$(document).ready(function() {

  //SET UP GAME
  if ($('.wargamecontainer').is(":visible")) {
    $('.endwargame').hide();
    $('.p1draw').hide();
    gameload();
  }

  //DRAW CARD BUTTON
  $(".p1draw").on("click", function(event) {
    $('.p1draw').hide();
    var data = {
      gameId: gameId,
      uid: randomlyGeneratedUID
    }
      socket.emit('draw', data);
  });
});



