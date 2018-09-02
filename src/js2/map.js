/* jshint esversion: 6 */

// Defines the geometry of the playable area.

const map = {

  // The coordinates of the spawn point.
  start_position: {
    x: 1.5,
    y: 1.5,
    z: 1.5,
  },
  
  height:9,
  width:9,
  layers:0,
  rampsPerLayer:2,

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

const randomFloor = () => {
	return 1.5 + Math.round(Math.random() * ((map.blocks.length-1)/2-1))*2;
};

const findFirstChoice = (k, meta) =>{
	var actions = [[0,0]];
	while(meta[k][0] != null){
		actions.push(meta[k][1]);
		k = meta[k][0];
	}
	return actions[actions.length-1];
};

const bfs = (l, r, c, goalr, goalc, blockTypes, ignoreCollision) => {
	var open = [], closed = [], meta = {};
	var root = r+'|'+c;
	meta[root] = [null, null];
	if(r != goalr || c != goalc)
		open.push(root);
	var neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]]; //up, down, left, right (just like collisions)
	while (open.length > 0){
		var rt = open.shift();
		var i = rt.indexOf('|');
		r = parseInt(rt.substring(0, i));
		c = parseInt(rt.substring(i+1));
		//found desired block
		//stay within boundaries
		if(l <= 0 || l >= map.blocks.length || r <= 0 || r >= map.blocks[l].length || c <= 0 || c >= map.blocks[l][r].length){
			closed.push(rt);
			continue;
		}
		if(blockTypes.includes(map.blocks[l][r][c])){
			return [l, r, c];
		}
		//reached goal
		if(r == goalr && c == goalc){
			return findFirstChoice(rt, meta);
		}
		if(!ignoreCollision && map.blocks[l][r][c] != 0){
			closed.push(rt);
			continue;
		}
		var collisions = getCollisions(map.blocks, l, r, c);
		neighbors.forEach((n, i) => {
			var k = (r+n[0]) + '|' + (c+n[1]);
			if(!closed.includes(k) && !open.includes(k) && (ignoreCollision || !collisions[i] || blockTypes.includes(map.blocks[l][r+n[0]][c+n[1]]))){
				meta[k] = [rt, n];
				open.push(k);
			}
		});
		closed.push(rt);
	}
	return [0,0];
};

const findRampFoot = (l, r, c, dl) => {
	var r = map.blocks[l][r][c];
	var dr=0, dc=0;
	if(r == 6){
		dr = (dl == 0) ? -1: 1;
		dc = 0;
	}
	else if(r == 7){
		dr = 0;
		dc = (dl == 0) ? 1: -1;
	}
	else if(r == 8){
		dr = (dl == 0) ? 1: -1;
		dc = 0;
	}
	else if(r == 9){
		dr = 0;
		dc = (dl == 0) ? -1: 1;
	}
	else
		console.log(l + ', ' + r + ', ' + c + ' isnt a ramp!');
	return [dr, dc];
};

// Powerup definitions.
const powerupTypes = {
  none: 0,
  ammo: 1,
  health: 2,
  exit: 3,
};

const randomEmptyZX = (layer, checkPowerup) =>{
	var x=0,z=0;
	while(map.blocks[Math.floor(layer)][Math.floor(z)][Math.floor(x)] != 0 || 
			(checkPowerup && map.blockInfo[Math.floor(layer)][Math.floor(z)][Math.floor(x)].powerup != powerupTypes.none)){
		z = Math.floor(Math.random() * (map.blocks[0].length-2))+1.5;
		x = Math.floor(Math.random() * (map.blocks[0][0].length-2))+1.5;
	}
	return [z, x];
};

map.init = (lvl) => {
  map.blocks = [];
  map.blockInfo = [];
  var seed = lvl;
	function random() {
		var x = Math.sin(seed++) * 10000;
		return x - Math.floor(x);
	}

  const rand = (min, max) => {
  	return Math.floor(random() * (max - min) ) + min;
  };

  const newMazeLayer = (shape1, shape0, complexity, density, blockType) => {
      // Adjust complexity and density relative to maze size
      complexity = complexity * (5 * (shape0 + shape1)); // number of components
      density = density * (Math.floor(shape0 / 2) * Math.floor(shape1 / 2)); // size of components
      // Build actual maze
      let Z = [];
  	for(let m = 0; m < shape0; m++){ //start layer with 4 walls but empty inside
  		Z.push([]);
  		for(let n = 0; n < shape1; n++){
  			if(m == 0 || n == 0 || m == shape0-1 || n == shape1-1)
  				Z[m].push(blockType);
  			else
  				Z[m].push(0);
  		}
  	}
      for(let i = 0; i < density; i++){
          let x = rand(0, Math.floor(shape1 / 2)) * 2;
  		let y = rand(0, Math.floor(shape0 / 2)) * 2; // pick a random position
          Z[y][x] = blockType;
          for(let j = 0; j < complexity; j++){
              let neighbours = [];
              if(x > 1) neighbours.push([y, x - 2]);
              if(x < shape1 - 2) neighbours.push([y, x + 2]);
              if(y > 1) neighbours.push([y - 2, x]);
              if(y < shape0 - 2) neighbours.push([y + 2, x]);
              if(neighbours.length > 0){
  				let r = rand(0, neighbours.length - 1);
                  let y_ = neighbours[r][0];
  				let x_ = neighbours[r][1];
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
  };

  const newSolidLayer = (shape1, shape0, blockType) => {
  	let Z = [];
  	for(let m = 0; m < shape0; m++){
  		Z.push([]);
  		for(let n = 0; n < shape1; n++){
  			Z[m].push(blockType);
  		}
  	}
  	return Z;
  };

  const solid = [2,3,4]; //so we don't mess up existing ramps
  const makeRamp = (k, h0, w0, hw0, hwlim0, gt0, h1, w1, hw1, hwlim1, gt1, h2, w2, h3, w3, rn, rnlim, ramp) => {
  	if(solid.includes(map.blocks[k][h0][w0]) && ((gt0 && hw0 > hwlim0) || (!gt0 && hw0 < hwlim0)) && //current block is non-empty and within bounds
  			map.blocks[k][h1][w1] == 0 && ((gt1 && hw1 > hwlim1) || (!gt1 && hw1 < hwlim1)) && //adjacent block is empty and within bounds
			solid.includes(map.blocks[k+1][h3][w3]) && 
  			map.blocks[k+2][h2][w2] == 0 && map.blocks[k+2][h3][w3] == 0 && rn < rnlim){ //block in other direction, but 2 layers up, is empty, as well as the one past it
  		map.blocks[k][h0][w0] = ramp;
  		map.blocks[k+1][h0][w0] = 0;
  		map.blocks[k+1][h2][w2] = ramp;
  		return true;
  	}
  	return false;
  };
  
  const placeRamps = (k) => { //k is layer
	let rampCount = 0;
	for(let h = 0; h < map.height; h++){
		for(let w = 0; w < map.width; w++){
			//try to add ramps.  The idea is to try to find walls on this layer that could be changed to a ramp
			//which leads to an empty space in the layer above, and with a floor at the top of the ramp.
			//the random is a hacky way to make sure the first ifs don't make the most ramps.
			let rn = random();
			if(rampCount < map.rampsPerLayer &&
				makeRamp(k, h, w, h-1, 1,            true,  h-1, w,   h+2, map.height-1, false, h+1, w,   h+2, w,   rn, .1, 6) ||
				makeRamp(k, h, w, h+1, map.height-1, false, h+1, w,   h-2, 1,            true,  h-1, w,   h-2, w,   rn, .2, 8) ||
				makeRamp(k, h, w, w-1, 1,            true,  h,   w-1, w+2, map.width-1,  false, h,   w+1, h,   w+2, rn, .3, 9) ||
				makeRamp(k, h, w, w+1, map.width-1,  false, h,   w+1, w-2, 1,            true,  h,   w-1, h,   w-2, rn, .4, 7))
				rampCount++;
		}
	}
  };

  for(let l = 0; l < map.layers+1; l++){
  	map.blocks.push(newSolidLayer(map.width, map.height, l == 0 ? 2 : 3));
  	map.blocks.push(newMazeLayer(map.width, map.height, 0.1, 0.15, 4));
  }
  map.blocks.push(newSolidLayer(map.width, map.height, 1)); //ceiling

  for(let k = 1; k < map.layers*2+1; k+=2){
  	placeRamps(k);
  }

  // Level indicator block.
  map.blocks[1][0][1] = 5;
  map.blocks[map.blocks.length - 2][map.height - 2][map.width - 2] = 0;
  map.blocks[map.blocks.length - 2][map.height - 1][map.width - 2] = 10;
  map.blocks[map.blocks.length - 2][map.height - 2][map.width - 2] = -1;
  
  //make sure level is solveable
  let sx = 1, sz = 1, lx, lz;
  for(let k = 1; k < map.layers*2+2; k+=2){
	  var lrc = bfs(k, sz, sx, null, null, [6,7,8,9,-1], false, 1);
	  var zx = [0,0];
	  if(lrc.length == 3){
		  var r = map.blocks[lrc[0]][lrc[1]][lrc[2]];
		  if(r == -1) break; //found exit, should be done
		  var drdc = findRampFoot(lrc[0], lrc[1], lrc[2], 0);
		  zx = bfs(k, sz, sx, lrc[1]+drdc[0], lrc[2]+drdc[1], [], false, 1);
	  }
	  while(zx[0] == 0 && zx[1] == 0){
		//TODO: found nothing, regenerating level 7
		console.log("regenerating layer " + k);
		//regenerate layer
		map.blocks[k] = newMazeLayer(map.width, map.height, 0.1, 0.15, 4);
		placeRamps(k);
		lrc = bfs(k, sz, sx, null, null, [6,7,8,9,-1], false, 1);
		if(lrc.length == 3){
			r = map.blocks[lrc[0]][lrc[1]][lrc[2]];
			if(r == -1) break; //found exit, should be done
			drdc = findRampFoot(lrc[0], lrc[1], lrc[2], 0);
			zx = bfs(k, sz, sx, lrc[1]+drdc[0], lrc[2]+drdc[1], [], false, 1);
		}
	  }
	  if(r == -1) break; //found exit, should be done
	  sz = lrc[1]+drdc[0]*-2; //next start is at top of next ramp
	  sx = lrc[2]+drdc[1]*-2;
  }
  //need to do again in case layer was rebuilt
  map.blocks[1][0][1] = 5;
  map.blocks[map.blocks.length - 2][map.height - 2][map.width - 2] = 0;
  map.blocks[map.blocks.length - 2][map.height - 1][map.width - 2] = 10;
  map.blocks[map.blocks.length - 2][map.height - 2][map.width - 2] = 0;
  
	//make lofts
    const ramps = [6,7,8,9];
	for(let k = 1; k < map.layers*2+1; k+=2){
		let rampCount = 0;
		for(let h = 0; h < map.height; h++){
			for(let w = 0; w < map.width; w++){
				if(map.blocks[k][h][w] == 0 && map.blocks[k+2][h][w] == 0 && solid.includes(map.blocks[k+1][h][w])){
					if((h > 1 && map.blocks[k+2][h-1][w] == 0 && !ramps.includes(map.blocks[k+1][h-1][w])) &&
						(h < map.height-1 && map.blocks[k+2][h+1][w] == 0 && !ramps.includes(map.blocks[k+1][h+1][w])) &&
						(w > 1 && map.blocks[k+2][h][w-1] == 0 && !ramps.includes(map.blocks[k+1][h][w-1])) &&
						(w < map.width-1 && map.blocks[k+2][h][w+1] == 0 && !ramps.includes(map.blocks[k+1][h][w+1])))
							map.blocks[k+1][h][w] = 0;
				}
			}
		}
	}
  

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
          powerup: powerupTypes.none,
        });
      }
      layer.push(row);
    }
    map.blockInfo.push(layer);
  }

  // Exit indicator
  map.blockInfo[map.blocks.length - 2][map.height - 2][map.width - 2].powerup = powerupTypes.exit;

  //add powerups
  for(let l = 1; l < map.layers*2+2; l+=2){
	  var zx = randomEmptyZX(l, 1);
	  map.blockInfo[l][Math.floor(zx[0])][Math.floor(zx[1])].powerup = powerupTypes.ammo;
	  zx = randomEmptyZX(l, 1);
	  map.blockInfo[l][Math.floor(zx[0])][Math.floor(zx[1])].powerup = powerupTypes.health;
  }
};
