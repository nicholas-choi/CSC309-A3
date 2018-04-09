function gameover(){
	//pauseGame();
	//score = 0;
	//updateScore();
	var img = document.createElement("img");
	img.src = "http://moziru.com/images/deadth-clipart-transparent-14.png";
	if(img && img.style) {
			img.style.height = '800px';
			img.style.width = '1000px';
	}
	$('#stage').html(img);
}

function winner(){
	// To get # of scores in DB.
	//pauseGame();
	//gameStart = 0;
	//getScoreId();
	//var num = document.getElementById("temp").value;
	// Save score in text.
	//document.getElementById("temp2").value = score;

	var img = document.createElement("img");
	img.src = "http://i.imgur.com/rkxeQPC.gif";
	if(img && img.style) {
			img.style.height = '800px';
			img.style.width = '1000px';
	}
	$('#stage').html(img);
	// To create a Score Tuple in Highscore DB.
	//createScore();
	//var num = parseInt(document.getElementById("profilewin").value) + 1;
 //document.getElementById("profilewin").value = num;
	//incrementWin();
}
