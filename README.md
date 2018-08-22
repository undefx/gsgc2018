# gsgc2018

An entry for the [GSGC2018](https://gynvael.coldwind.pl/?id=686) game competition.

The game idea is inspired by Pacman, with the maps being made up of 3d mazes.  Randomly throughout the map there will be ammo, which the player can pick up.  Also randomly throughout the map are baddies, with ai pathing towards the player.  If a baddie reaches the player, the game is over (perhaps just restart current map?).  If the player shoots the baddie with ammo he found, the baddie changes state to path away from the player for X seconds.  The player needs to find the exit to beat the map and progress to the next one.

Change map.js to use a maze generating algorithm found here: https://en.wikipedia.org/wiki/Maze_generation_algorithm#Python_code_example.  The bottom most layer will be a solid floor, and the next layer will be generated by the maze algorithm.  The layers will be every other floor/maze until the top layer, which is a solid ceiling.  After generating all the layers, another algorithm will search through every adjacent maze layer to choose a good location(s) for a ramp between them (ie switch a solid block for a ramp in the floor between them).  This algorithm should also check for adjacent empty spaces in the mazes, and remove the floor block between them entirely.  Start and exit positions will also be randomly chosen.

