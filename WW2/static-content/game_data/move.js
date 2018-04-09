function getNewDirectionCord(direction, xyCord){
		var xCord = xyCord[0];
		var yCord = xyCord[1];
		
	switch (direction) {
		case "north_west":
			newXcord = xCord - 1;
			newYcord = yCord - 1;
			break;
		case "north_east":
			newXcord = xCord + 1;
			newYcord = yCord - 1;
			break;
		case "north":
			newXcord = xCord;
			newYcord = yCord - 1;
			break;
		case "west":
			newXcord = xCord - 1;
			newYcord = yCord;
			break;
		case "east":
			newXcord = xCord + 1;
			newYcord = yCord;
			break;
		case "south_west":
			newXcord = xCord - 1;
			newYcord = yCord + 1;
			break;
		case "south_east":
			newXcord = xCord + 1;
			newYcord = yCord + 1;
			break;
		case "south":
			newXcord = xCord;
			newYcord = yCord + 1;
			break;
	}
	return [newXcord, newYcord];
}
