/* jshint esversion: 6 */

// Defines the geometry of the playable area.

const map = {

  // The coordinates of the spawn point.
  start_position: {
    x: 1.5,
    y: 1.5,
    z: 1.5,
  },

  // The direction the player should face when spawned.
  start_direction: Math.PI * 0.25,

  // A 3-dimensional array that explicitly lists the type of each block in the
  // playable area. The map is indexed by "layer" (y-axis), "row" (z-axis), and
  // "col" (x-axis).
  // TODO: numbers shouldn't be hard-coded
  // TODO: shouldn't be necessary to exhaustively list each block
  blocks: [],
  // [[
    // [3, 3, 3, 3, 3, 3, 3, 3, 3],
    // [3, 3, 3, 3, 3, 3, 3, 3, 3],
    // [3, 3, 3, 3, 3, 3, 3, 3, 3],
    // [3, 3, 3, 3, 3, 3, 3, 3, 3],
    // [3, 3, 3, 3, 3, 3, 3, 3, 3],
    // [3, 3, 3, 3, 3, 3, 3, 3, 3],
    // [3, 3, 3, 3, 3, 3, 3, 3, 3],
    // [3, 3, 3, 3, 3, 3, 3, 3, 3],
    // [3, 3, 3, 3, 3, 3, 3, 3, 3],
  // ], [
    // [4, 4, 4, 4, 4, 4, 4, 4, 4],
    // [4, 0, 0, 0, 0, 0, 0, 0, 4],
    // [4, 0, 0, 0, 0, 0, 0, 0, 4],
    // [4, 0, 0, 0, 0, 0, 0, 0, 4],
    // [4, 0, 0, 0, 0, 0, 0, 0, 4],
    // [4, 0, 0, 0, 0, 0, 0, 0, 4],
    // [4, 0, 0, 4, 6, 4, 0, 0, 4],
    // [4, 0, 0, 4, 4, 4, 0, 0, 4],
    // [4, 4, 4, 4, 4, 4, 4, 4, 4],
  // ], [
    // [2, 2, 2, 2, 2, 2, 2, 2, 2],
    // [2, 2, 2, 2, 2, 2, 2, 2, 2],
    // [2, 2, 2, 2, 2, 2, 2, 2, 2],
    // [2, 2, 2, 0, 0, 0, 2, 2, 2],
    // [2, 2, 2, 0, 0, 0, 2, 2, 2],
    // [2, 2, 2, 0, 0, 0, 2, 2, 2],
    // [2, 2, 2, 2, 0, 2, 2, 2, 2],
    // [2, 2, 2, 7, 0, 9, 2, 2, 2],
    // [2, 2, 2, 2, 2, 2, 2, 2, 2],
  // ], [
    // [5, 5, 5, 5, 5, 5, 5, 5, 5],
    // [5, 0, 0, 0, 0, 0, 0, 0, 5],
    // [5, 0, 5, 5, 0, 5, 5, 0, 5],
    // [5, 0, 5, 0, 0, 0, 5, 0, 5],
    // [5, 0, 0, 0, 0, 0, 0, 0, 5],
    // [5, 0, 5, 0, 0, 0, 5, 0, 5],
    // [5, 0, 5, 5, 0, 5, 5, 0, 5],
    // [5, 0, 0, 0, 0, 0, 0, 0, 5],
    // [5, 5, 5, 5, 5, 5, 5, 5, 5],
  // ], [
    // [1, 1, 1, 1, 1, 1, 1, 1, 1],
    // [1, 1, 1, 1, 1, 1, 1, 1, 1],
    // [1, 1, 1, 1, 1, 1, 1, 1, 1],
    // [1, 1, 1, 1, 1, 1, 1, 1, 1],
    // [1, 1, 1, 1, 1, 1, 1, 1, 1],
    // [1, 1, 1, 1, 1, 1, 1, 1, 1],
    // [1, 1, 1, 1, 1, 1, 1, 1, 1],
    // [1, 1, 1, 1, 1, 1, 1, 1, 1],
    // [1, 1, 1, 1, 1, 1, 1, 1, 1],
  // ]],
};

function rand(min, max){
	return Math.floor(Math.random() * (max - min) ) + min;
}

function newMazeLayer(shape1, shape0, complexity, density, blockType){
    // Adjust complexity and density relative to maze size
    complexity = complexity * (5 * (shape0 + shape1)); // number of components
    density = density * (Math.floor(shape0 / 2) * Math.floor(shape1 / 2)); // size of components
    // Build actual maze
    var Z = [];
	for(var m = 0; m < shape0; m++){ //start layer with 4 walls but empty inside
		Z.push([]);
		for(var n = 0; n < shape1; n++){
			if(m == 0 || n == 0 || m == shape0-1 || n == shape1-1)
				Z[m].push(blockType);
			else
				Z[m].push(0);
		}
	}
    for(var i = 0; i < density; i++){
        var x = rand(0, Math.floor(shape1 / 2)) * 2;
		var y = rand(0, Math.floor(shape0 / 2)) * 2; // pick a random position
        Z[y][x] = blockType;
        for(var j = 0; j < complexity; j++){
            var neighbours = [];
            if(x > 1) neighbours.push([y, x - 2]);
            if(x < shape1 - 2) neighbours.push([y, x + 2]);
            if(y > 1) neighbours.push([y - 2, x]);
            if(y < shape0 - 2) neighbours.push([y + 2, x]);
            if(neighbours.length > 0){
				var r = rand(0, neighbours.length - 1);
                var y_ = neighbours[r][0];
				var x_ = neighbours[r][1];
                if(Z[y_][x_] == 0){
                    Z[y_][x_] = blockType;
                    Z[y_ + Math.floor((y - y_) / 2)][x_ + Math.floor((x - x_) / 2)] = blockType;
                    x = x_;
					y = y_;
				}
			}
		}
	}
    return Z;
}

function newSolidLayer(shape1, shape0, blockType){
	var Z = [];
	for(var m = 0; m < shape0; m++){
		Z.push([]);
		for(var n = 0; n < shape1; n++){
			Z[m].push(blockType);
		}
	}
	return Z;
}

// Only odd shapes (not sure why)
var height = Math.floor(16 / 2) * 2 + 1;
var width = Math.floor(16 / 2) * 2 + 1;
var layers = 7;
for(var l = 0; l < layers+1; l++){
	map.blocks.push(newSolidLayer(width, height, 3));
	map.blocks.push(newMazeLayer(width, height, 0.1, 0.15, 4));
}
map.blocks.push(newSolidLayer(width, height, 1)); //ceiling

for(var k = 1; k < layers*2-1; k+=2){
	var rampCount = 0;
	for(var h = 0; h < height; h++){
		for(var w = 0; w < width; w++){
			//make lofts
			if(map.blocks[k][h][w] == 0 && map.blocks[k+2][h][w] == 0){
				//both layers are empty here, see if theres enough space to remove the
				//floor without making the upper layer unpassable here
				if((h > 1 && map.blocks[k+2][h-1][w] == 0) &&
					(h < height-1 && map.blocks[k+2][h+1][w] == 0) &&
					(w > 1 && map.blocks[k+2][h][w-1] == 0) &&
					(w < width-1 && map.blocks[k+2][h][w+1] == 0))
						map.blocks[k+1][h][w] = 0;
			}
			//try to add ramps.  The idea is to try to find walls on this layer that could be changed to a ramp
			//which leads to an empty space in the layer above, and with a floor at the top of the ramp.
			//the random is a hacky way to make sure the first ifs don't make the most ramps.
			var rn = Math.random();
			//south
			if(rampCount < 4 && map.blocks[k][h][w] != 0 && h-1 > 1 && map.blocks[k][h-1][w] == 0 &&
					h+2 < height-1 && map.blocks[k+2][h+1][w] == 0 && map.blocks[k+2][h+2][w] == 0 && rn < .1){
				map.blocks[k][h][w] = 6;
				map.blocks[k+1][h][w] = 0;
				map.blocks[k+1][h+1][w] = 6;
				rampCount++;
			}//north
			else if(rampCount < 4 && map.blocks[k][h][w] != 0 && h+1 < height-1 && map.blocks[k][h+1][w]== 0 &&
					h-2 > 1 && map.blocks[k+2][h-1][w] == 0 && map.blocks[k+2][h-2][w] == 0 && rn < .2){
				map.blocks[k][h][w] = 8;
				map.blocks[k+1][h][w] = 0;
				map.blocks[k+1][h-1][w] = 8;
				rampCount++;
			}//east
			else if(rampCount < 4 && map.blocks[k][h][w] != 0 && w-1 > 1 && map.blocks[k][h][w-1] == 0 &&
					w+2 < width-1 && map.blocks[k+2][h][w+1] == 0 && map.blocks[k+2][h][w+2] == 0 && rn < .3){
				map.blocks[k][h][w] = 9;
				map.blocks[k+1][h][w] = 0;
				map.blocks[k+1][h][w+1] = 9;
				rampCount++;
			}//west
			else if(rampCount < 4 && map.blocks[k][h][w] != 0 && w+1 < width-1 && map.blocks[k][h][w+1] == 0 &&
					w-2 > 1 && map.blocks[k+2][h][w-1] == 0 && map.blocks[k+2][h][w-2] == 0 && rn < .4){
				map.blocks[k][h][w] = 7;
				map.blocks[k+1][h][w] = 0;
				map.blocks[k+1][h][w-1] = 7;
				rampCount++;
			}
		}
	}
	console.log(k + ' has ' + rampCount + ' ramps');
}
