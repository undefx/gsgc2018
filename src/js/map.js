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
  start_direction: Math.PI * 1,

  // A 3-dimensional array that explicitly lists the type of each block in the
  // playable area. The map is indexed by "layer" (y-axis), "row" (z-axis), and
  // "col" (x-axis).
  // TODO: numbers shouldn't be hard-coded
  blocks: [],

  // A 3-dimensional array that contains information about live game objects
  // that occupy each block.
  blockInfo: [],
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

function makeRamp(k, h0, w0, hw0, hwlim0, gt0, h1, w1, hw1, hwlim1, gt1, h2, w2, h3, w3, rn, rnlim, ramp){
	if(map.blocks[k][h0][w0] != 0 && ((gt0 && hw0 > hwlim0) || (!gt0 && hw0 < hwlim0)) &&
			map.blocks[k][h1][w1] == 0 && ((gt1 && hw1 > hwlim1) || (!gt1 && hw1 < hwlim1)) &&
			map.blocks[k+2][h2][w2] == 0 && map.blocks[k+2][h3][w3] == 0 && rn < rnlim){
		map.blocks[k][h0][w0] = ramp;
		map.blocks[k+1][h0][w0] = 0;
		map.blocks[k+1][h2][w2] = ramp;
		return true;
	}
	return false;
}

var height = 16;
var width = 16;
var layers = 7;
for(var l = 0; l < layers+1; l++){
	map.blocks.push(newSolidLayer(width, height, l == 0 ? 2 : 3));
	map.blocks.push(newMazeLayer(width, height, 0.1, 0.15, 4));
}
map.blocks.push(newSolidLayer(width, height, 1)); //ceiling

for(var k = 1; k < layers*2+1; k+=2){
	var rampCount = 0;
	for(var h = 0; h < height; h++){
		for(var w = 0; w < width; w++){
			//make lofts
			if(map.blocks[k][h][w] == 0 && map.blocks[k+2][h][w] == 0){
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
			if(makeRamp(k, h, w, h-1, 1, true, h-1, w, h+2, height-1, false, h+1, w, h+2, w, rn, .1, 6) ||
				makeRamp(k, h, w, h+1, height-1, false, h+1, w, h-2, 1, true, h-1, w, h-2, w, rn, .2, 8) ||
				makeRamp(k, h, w, w-1, 1, true, h, w-1, w+2, width-1, false, h, w+1, h, w+2, rn, .3, 9) ||
				makeRamp(k, h, w, w+1, width-1, false, h, w+1, w-2, 1, true, h, w-1, h, w-2, rn, .4, 7))
				rampCount++;
			if(rampCount >= 4) break;
		}
	}
}

// Level indicator block.
map.blocks[1][0][1] = 5;

// Initialze block info.
let i = 0;
for (let l = 0; l < map.blocks.length; l++) {
  const layer = [];
  for (let r = 0; r < map.blocks[0].length; r++) {
    const row = [];
    for (let c = 0; c < map.blocks[0][0].length; c++) {
      // Things that can potentially occupy this block.
      row.push({
        attributeBufferIndex: i++,
        powerup: 0,
      });
    }
    layer.push(row);
  }
  map.blockInfo.push(layer);
}

// TODO: Add powerups; these are just samples (ammo=1)
map.blockInfo[1][2][2].powerup = 1;
map.blockInfo[1][4][3].powerup = 1;
map.blockInfo[1][3][4].powerup = 1;
