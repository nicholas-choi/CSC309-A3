require('./port');

// Load jsdom, and create a window.
var webSocketPort = port+1;

var express = require('express');
var app = express();
var open = [3, 2, 1, 0];
var inuse = [];
// Game code
var spawncord = [[1, 1], [11,11], [12,11], [10, 11]];
var gameStep=null;
var stage=null;
var stageRendered = 0;
var interval=1500;
var level;
var gameStageRendered =0;
var slime_target_count = 5;
var slime_current_count = 5;
var aggroTargetNum = 0;
var ignore_move = false;
var gameStartSec = 5;
var score = 10000;
var gameBegan = 0;
var players = [];

// static_files has all of statically returned content
// https://expressjs.com/en/starter/static-files.html

// Web Sockets
var WebSocketServer = require('ws').Server
   ,wss = new WebSocketServer({port: webSocketPort}),  LOBBY=[];

var messages=[];
var fs = require('fs');
wss.on('close', function() {
    console.log('disconnected');
    var point=JSON.parse(message);
});

wss.broadcast = function(message){
	for(let ws of this.clients){
		ws.send(message);
	}


	// Alternatively
	// this.clients.forEach(function (ws){ ws.send(message); });
}
function gameStartTimer(){
  gameStartSec--;
  if (gameStartSec > 0){
      setTimeout(gameStartTimer, 1000);
  }
  if (gameStartSec == 0 && gameBegan == 0){
    open = [];
    startGame();
  }
}
wss.on('connection', function(ws) {
  LOBBY.push(ws);
  //if (open.length <= 0){
  console.log("New User Connected");
  //console.log(LOBBY);
  if (gameStageRendered == 0){
    stage=new Stage(20,20,"stage");
    stage.initialize();
    gameStageRendered = 1;
    readStage();
    //startGame();
  }
  if (open.length != 0){
    var playerNum = open.pop();
    inuse.push(playerNum);
    var spawnjson = {'jsonType': "init", 'player_id': playerNum};
    ws.send(JSON.stringify(spawnjson));
    intializeNewPlayer(playerNum);
    if (open.length == 0){
      startGame();
    }
  }

  setTimeout(gameStartTimer, 1000);


  //}
  //for(i=0;i<messages.length;i++){
		//ws.send(messages[i]);
	//}
	ws.on('message', function(message) {

		// ws.send(message);
    var point=JSON.parse(message);
    if (point.jsonType == 'direction'){
      var direction = point["direction"];
      var clientUsr = point["id"];
      var index = stage.player.indexOf(players[clientUsr]);
      if (index > -1 && gameBegan == 1) {
        if (players[clientUsr].move(stage, direction, clientUsr) == "gameover"){
          gameOver();
        }else {
          broadcastStage();
        }

      }
    } else if (point.jsonType == 'closeConn'){
      var clientUsr = point["id"];
      var isconnected = stage.player.indexOf(stage.player[clientUsr]);
      if (isconnected >= 0){
        removePlayerFromStage(stage.player[clientUsr]);
        if (stage.player.length == 0) {
          gameOver();
        }
      }
    }
    if (point.jsonType == 'redSlime'){

      movedslime = 1;
    }
	});
});
var movedslime = 0;

function timerMethod() {

    if (movedslime == 1){
      moveRedSlime();
    } else {
      console.log("redslimes didnt move");
    }
    movedslime = 0;
}
var timerId = setInterval(timerMethod, 500);

function gameOver(){
  var gg = {'jsonType': "gg", 'gameState': "gameover", 'score': score};
  wss.broadcast(JSON.stringify(gg));
  gameBegan = 0;
}
function moveRedSlime(){
  console.log("redslime moved");
  if (stage.redSlimes.length > 0){
    for(var i=0;i<stage.redSlimes.length;i++){
      var slimeStatus = stage.redSlimes[i].move(stage);
      if (slimeStatus == "dead"){
        var index = stage.redSlimes.indexOf(stage.redSlimes[i]);
        if (index > -1) {
          stage.redSlimes.splice(index, 1);
        }
      }
      if ( slimeStatus == "gameover"){
        return "gameover";
      }
    }
  }
}

function removePlayerFromStage(player){
  var yLocation = player.yCord*20;
  var xLocation = player.xCord;
  var convertedLocation = yLocation + xLocation;
  stage.setActor(stage.blanks[convertedLocation]);

  var index = stage.player.indexOf(player);
  if (index > -1) {
    stage.player.splice(index, 1);
  }
  console.log("player length" + stage.player.length );
  if (stage.player.length == 0){
    return "gameover";
  }
}
//game loop
function intializeNewPlayer(playerNum){

    var xCord = spawncord[playerNum][0];
    var yCord = spawncord[playerNum][1];
    new_player = new player("player", "player", xCord, yCord, playerNum)
    stage.player.push(new_player);
    players.push(new_player);
    //console.log(stage.player);
    stage.setActor(new_player);
}

function setupGame(){

  stage.loadLevel(level);
//  $.get("static-content/stage/s1.txt", function(data) {
   //level = data.split('\n');
   //stage.loadLevel(level);
 //});

}

function readStage(){
  var txtFile = "static-content/stage/s2.txt"
  fs.readFile(txtFile, 'utf8', function(err, contents) {
      //console.log(contents);
      level = contents.split('\n');

      level.pop();
      setupGame();
  });

//  $.get("static-content/stage/s1.txt", function(data) {
   //level = data.split('\n');
   //stage.loadLevel(level);
 //});
}
function startGame(){
  gameBegan = 1;
  broadcastStage();
  var isIntervalInProgress = false;
  setTimeout(mobsMove, 1000);

}

function mobsMove(){
    if (gameBegan == 0){return;}
    var d = new Date();
    var gameState = stage.step();
    if (gameState == "win"){
      gameBegan = 0;
      var gg = {'jsonType': "gg", 'gameState': gameState, 'score': score};
      wss.broadcast(JSON.stringify(gg));
      return;
    }
    else if (gameState == "gameover"){
      gameBegan = 0;
      var gg = {'jsonType': "gg", 'gameState': gameState, 'score': 0};
      wss.broadcast(JSON.stringify(gg));
      return;
    }
    score = score - 50;
    broadcastStage();
    setTimeout(mobsMove, 1000);



}
function winner(){
}

function broadcastStage(){
  var encodedStage = encodeStage();
  wss.broadcast(JSON.stringify(encodedStage));
};
function intialize_player(j, i){
  //if (inputline[j] == 'p'){
    //this.player = new player("player", "player", j, i, 1);
    //this.setActor(this.player);
  //}
}
// Stage
// Note: Yet another way to declare a class, using .prototype.

function Stage(width, height, stageElementID){
	this.actors=[]; // all actors on this stage (monsters, player, boxes, ...)
	this.player=[]; // a special actor, the player
	this.blanks=[];
	this.monsters=[];
  this.redSlimes=[];
	// the logical width and height of the stage
	this.width=width;
	this.height=height;

	// the element containing the visual representation of the stage
	this.stageElementID=stageElementID;

}

// initialize an instance of the game
Stage.prototype.initialize=function(){
	// Create a table of blank images, give each image an ID so we can reference it later


	for (var i = 0; i < 400; ++i) {
		this.blanks[i] = new blank("blank", "blank", i%20, (i - (i%20))/20);
		this.actors.push(this.blanks[i]);
	}



	// Add the player to the center of the stage

	// Add walls around the outside of the stage, so actors can't leave the stage
	//top of stage
	// Add some Boxes to the stage

}
Stage.prototype.loadLevel=function(level){
	for (var i = 0; i < 20; i++){
		var inputline = level[i].split('');
		for (var j = 0; j < 20; j++){
			if (inputline[j] == 'x'){
				newWall = new wall("wall", "wall", j, i);
				this.setActor(newWall);
			}
			if (inputline[j] == 'b'){
				newBox = new box("box", "box", j, i);
				this.setActor(newBox);
			}
      if (inputline[j] == 'r'){
        newRedslime = new redSlime("redSlime", "monster", j, i);
        this.monsters.push(newRedslime);
        this.redSlimes.push(newRedslime);
        this.setActor(newRedslime);
      }
			if (inputline[j] == 'd'){
				newDevil = new devil("devil", "monster", j, i);
				this.monsters.push(newDevil);
				this.setActor(newDevil);
			}
			if (inputline[j] == 's'){
				newSlime = new slime("slime", "monster", j, i);
				this.monsters.push(newSlime);
				this.setActor(newSlime);
			}
		}
	}

}

function encodeStage (){
  stageArray=[];
  for (var i = 0; i < 20; i++)
  {
    for (var j = 0; j < 20; j++){
      var yLocation = i*20;
    	var xLocation = j;

    	var convertedLocation = yLocation + xLocation;
      switch (stage.actors[convertedLocation].getName()) {
        case "player":
          var player_id = stage.actors[convertedLocation].player_id;
          if (player_id == 0){
            stageArray.push("p");
          } else if (player_id == 1){
            stageArray.push("2");
          } else if (player_id == 2){
            stageArray.push("3");
          } else if (player_id == 3){
            stageArray.push("4");
          }
          break;
        case "devil":
          stageArray.push("d");
          break;
        case "redSlime":
          stageArray.push("r");
          break;
        case "wall":
          stageArray.push("w");
          break;
        case "box":
          stageArray.push("b");
          break;
        case "slime":
          stageArray.push("s");
          break;
        default:
          stageArray.push("a");
          break;
      }

    }
  }
  var stageJSON = {'jsonType': "stage", "stage":stageArray};
  return stageJSON;
}

Stage.prototype.addActor=function(actor){
	this.actors.push(actor);
}


Stage.prototype.removeActor=function(actor){
	// Lookup javascript array manipulation (indexOf and splice).
}

Stage.prototype.setActor=function(actor){
	x = actor.getXCord();
	y = actor.getYCord();


	var yLocation = y*20;
	var xLocation = x;
	var convertedLocation = yLocation + xLocation;
	stage.actors[convertedLocation] = actor;

}

// Set the src of the image at stage location (x,y) to src
Stage.prototype.setImage=function(x, y, src){

}

// Take one step in the animation of the game.
Stage.prototype.step=function(){
	if (this.monsters.length > 0){
		for(var i=0;i<this.monsters.length;i++){
			if (this.monsters[i].move(this) == "gameover"){
				return "gameover";
			}
		}
	} else{
		return "win";
	}
}

// return the first actor at coordinates (x,y) return null if there is no such actor
// there should be only one actor at (x,y)!
Stage.prototype.getActor=function(x, y){
	var yLocation = y*20;
	var xLocation = x;
	var convertedLocation = yLocation + xLocation;
	return this.actors[convertedLocation];
}

Stage.prototype.getNewDirectionCord=function(movingActor, direction){
	switch (direction) {
		case "north_west":
			newXcord = movingActor.xCord - 1;
			newYcord = movingActor.yCord - 1;
			break;
		case "north_east":
			newXcord = movingActor.xCord + 1;
			newYcord = movingActor.yCord - 1;
			break;
		case "north":
			newXcord = movingActor.xCord;
			newYcord = movingActor.yCord - 1;
			break;
		case "west":
			newXcord = movingActor.xCord - 1;
			newYcord = movingActor.yCord;
			break;
		case "east":
			newXcord = movingActor.xCord + 1;
			newYcord = movingActor.yCord;
			break;
		case "south_west":
			newXcord = movingActor.xCord - 1;
			newYcord = movingActor.yCord + 1;
			break;
		case "south_east":
			newXcord = movingActor.xCord + 1;
			newYcord = movingActor.yCord + 1;
			break;
		case "south":
			newXcord = movingActor.xCord;
			newYcord = movingActor.yCord + 1;
			break;
	}
	return [newXcord, newYcord];
}
// End Class Stage


// Start of actor Class
function actor(name, type, xCord, yCord) {
		this.name = name;
		this.type = type;
    this.xCord = xCord;
		this.yCord = yCord;
}

actor.prototype.getXCord=function() {
    return this.xCord;
}

actor.prototype.getYCord=function() {
    return this.yCord;
}
actor.prototype.getName=function() {
    return this.name;
}
actor.prototype.getType=function() {
    return this.type;
}
// End of actor CLASS

// Start of mob Class
function mob(name, type, xCord, yCord, status) {
	actor.call(this, name, type, xCord, yCord);
	// 0 is dead 1 is alive
	this.status = status;
}

mob.prototype = Object.create(actor.prototype);

mob.prototype.checkStatus=function(stage){
	var alive = 1
	var wallsAround = 0;
	var ya=this.yCord - 1;
	var yb=this.yCord + 2;
	var xa=this.xCord - 1;
	var xb=this.xCord + 2;
	for(var y=ya;y<yb;y++){
		for(var x=xa;x<xb;x++){
			if(stage.getActor(x,y).getType() != "player" && stage.getActor(x,y).getType() != "blank"){
				wallsAround++;
			}
		}
	}
	if (wallsAround == 9){
		this.status = 0;
		var index = stage.monsters.indexOf(this);
		if (index > -1) {
	    stage.monsters.splice(index, 1);
		}
		var yLocation = this.yCord*20;
		var xLocation = this.xCord;
		var convertedLocation = yLocation + xLocation;
		stage.setActor(stage.blanks[convertedLocation]);
	}
	return this.status;
}

mob.prototype.getValidMove=function(stage){
	var validMoves = [];
	var ya=this.yCord - 1;
	var yb=this.yCord + 2;
	var xa=this.xCord - 1;
	var xb=this.xCord + 2;
  //console.log(validMoves);
	for(var y=ya;y<yb;y++){
		for(var x=xa;x<xb;x++){
			if(stage.getActor(x,y).getType() == "blank" || stage.getActor(x,y).getType() == "player"){
				validMoves.push([x, y]);
			}
		}
	}
  //console.log(this.xCord + ", " + this.yCord)
  //console.log(validMoves);
	return validMoves;
}
// End of mob Class

// Start of devil Class
function devil(name, type, xCord, yCord, status) {
	mob.call(this, name, type, xCord, yCord, status);
}

devil.prototype = Object.create(mob.prototype);

devil.prototype.move=function(stage) {
	if (this.checkStatus(stage) == 0){
		return "dead";
	}
	var validMoves = this.getValidMove(stage);
	if (!Array.isArray(validMoves) || !validMoves.length) {
  	return;
	}
	var moveNumber = Math.floor((Math.random() * (validMoves.length)));
  //console.log("move number is" + moveNumber)
	var yLocation = this.yCord*20;
	var xLocation = this.xCord;

	var convertedLocation = yLocation + xLocation;
	stage.setActor(stage.blanks[convertedLocation]);
	if (stage.getActor(validMoves[moveNumber][0], validMoves[moveNumber][1]).getType() == "player"){
      var index = stage.player.indexOf(stage.getActor(validMoves[moveNumber][0], validMoves[moveNumber][1]));
      if (index > -1) {
        stage.player.splice(index, 1);
      }
      console.log("player length" + stage.player.length );
  		if (stage.player.length == 0){
        return "gameover";
      }
	}
	this.xCord = validMoves[moveNumber][0];
	this.yCord = validMoves[moveNumber][1];
  //console.log("moved to" + validMoves[moveNumber][0] + ", " + validMoves[moveNumber][1])
	stage.setActor(this);
}
// End of devil Class
// Start of Red slime Class
function redSlime(name, type, xCord, yCord, status) {
	devil.call(this, name, type, xCord, yCord, status);
}
redSlime.prototype = Object.create(devil.prototype);

// Start of slime Class
function slime(name, type, xCord, yCord, status) {
	mob.call(this, name, type, xCord, yCord, status);
}

slime.prototype = Object.create(mob.prototype);

slime.prototype.move=function(stage) {
	if (this.checkStatus(stage) == 0){
		return;
	}
  if (slime_current_count == 0){
    slime_current_count = slime_target_count;
  }

  if (slime_current_count == slime_target_count){


    aggroTargetNum = Math.floor((Math.random() * (stage.player.length)));
  }

	var validMoves = this.getValidMove(stage);
	if (!Array.isArray(validMoves) || !validMoves.length) {
		return;
	}
	var whichValidMove = [0,0];
	var smallestDif = 9999;
  if(typeof stage.player[aggroTargetNum] == "undefined")
  {
    aggroTargetNum = Math.floor((Math.random() * (stage.player.length)));
    validMoves = this.getValidMove(stage);
  }

    for (var i = 0; i<validMoves.length; i++){
      if(typeof stage.player[aggroTargetNum] == "undefined")
      {
        return;
      }
      console.log("stage player " + stage.player[aggroTargetNum] + aggroTargetNum);
      var differenceX = Math.abs(validMoves[i][0] - stage.player[aggroTargetNum].getXCord());
      var differenceY = Math.abs(validMoves[i][1] - stage.player[aggroTargetNum].getYCord());
      var  difference = Math.abs(differenceX + differenceY);

      if (difference < smallestDif){
        smallestDif = difference;
        whichValidMove[0] =  validMoves[i][0];
        whichValidMove[1] =  validMoves[i][1];
      }
    }


  slime_current_count--;
	var yLocation = this.yCord*20;
	var xLocation = this.xCord;
	var convertedLocation = yLocation + xLocation;
	stage.setActor(stage.blanks[convertedLocation]);
	if (stage.getActor(whichValidMove[0], whichValidMove[1]).getType() == "player"){
    var index = stage.player.indexOf(stage.getActor(whichValidMove[0], whichValidMove[1]));
    if (index > -1) {
      stage.player.splice(index, 1);
    }
    console.log("player length" + stage.player.length );
		if (stage.player.length == 0){
      return "gameover";
    }
	}

	this.xCord = whichValidMove[0];
	this.yCord = whichValidMove[1];
	stage.setActor(this);
}

// End of slime Class
// Start of wall Class
function wall(name, type, xCord, yCord) {
	actor.call(this, name, type, xCord, yCord);
}

wall.prototype = Object.create(actor.prototype);
// End of wall Class
// Start of box Class
function box(name, type, xCord, yCord) {
	actor.call(this, name, type, xCord, yCord);
}

box.prototype = Object.create(actor.prototype);

box.prototype.attemptToMoveBox=function(stage, direction){
	var move = 0;
	var newCordTuple = [];
	var newXcord = 0;
	var newYcord = 0;
	newCordTuple = stage.getNewDirectionCord(this, direction);
	newXcord = newCordTuple[0];
	newYcord = newCordTuple[1];
	switch (stage.getActor(newXcord, newYcord).getType()){
		case "box":
			if (stage.getActor(newXcord, newYcord).attemptToMoveBox(stage, direction) == 1){
				move = 1;
				var yLocation = this.yCord*20;
				var xLocation = this.xCord;
				var convertedLocation = yLocation + xLocation;
				stage.setActor(stage.blanks[convertedLocation]);
			}
			break;
		case "blank":
			move = 1;
			break;
		default:
			move = 0;
		}
	if (move == 1){
		this.xCord = newXcord;
		this.yCord = newYcord;
	}
	stage.setActor(this);
	return move;

}
// End of box Class
// Start of player Class
function player(name, type, xCord, yCord, player_id) {
	actor.call(this, name, type, xCord, yCord);
	this.player_id = player_id;
}

player.prototype = Object.create(actor.prototype);

player.prototype.move=function(stage, direction, playerNum){
	if(this.status == 0){
		return "gameover";
	}
	var yLocation = this.yCord*20;
	var xLocation = this.xCord;
	var convertedLocation = yLocation + xLocation;
	stage.setActor(stage.blanks[convertedLocation]);
	var newCordTuple = [];
	newCordTuple = stage.getNewDirectionCord(this, direction);
	var newXcord = newCordTuple[0];
	var newYcord = newCordTuple[1];
	var move = 0;
	ranInto = stage.getActor(newXcord, newYcord).getType();
	switch (ranInto){
		case "wall":
			move = 0;
			break;
		case "box":
			if (stage.getActor(newXcord, newYcord).attemptToMoveBox(stage, direction) == 1){
				move = 1;
			} else {
				move = 0;
			}
			break;
		case "monster":
    aggroTargetNum = 0;
      var index = stage.player.indexOf(this);
      if (index > -1) {
        stage.player.splice(index, 1);
      }
  		if (stage.player.length == 0){
        console.log("gameover");
        return "gameover";
        gameBegan = 0;
      }
			return "gameContinued";
		case "blank":
			move = 1;
			break;
	}
	if (move == 1){
		this.xCord = newXcord;
		this.yCord = newYcord;
	}
	stage.setActor(this);
	return "gameContinued";
}

// End of Player Class
// Start of blank Class
function blank(name, type, xCord, yCord) {
	actor.call(this, name, type, xCord, yCord);
}

blank.prototype = Object.create(actor.prototype);
// End of Player Class
