/* jshint esversion: 6 */

// Centralized location for game logic.

// Computes movement collisions at the given player location.
// TODO: the idea is good enough, but the implementation is extra hacky
const getCollisions = (map, layer, row, col) => {
  let left = 0, right = 0, up = 0, down = 0, floor = 0;
  if (row > 0 && map[layer][row - 1][col] != 0) {
    if (map[layer][row - 1][col] != 8) {
      up = 1;
    }
  }
  if (row < map[0].length - 1 && map[layer][row + 1][col] != 0) {
    if (map[layer][row + 1][col] != 6) {
      down = 1;
    }
  }
  if (col > 0 && map[layer][row][col - 1] != 0) {
    if (map[layer][row][col - 1] != 7) {
      left = 1;
    }
  }
  if (col < map[0][0].length - 1 && map[layer][row][col + 1] != 0) {
    if (map[layer][row][col + 1] != 9) {
      right = 1;
    }
  }
  const airHere = map[layer][row][col] == 0;
  const airBelow = map[layer - 1][row][col] == 0;
  if (layer > 0 && !(airHere && airBelow)) {
    if ([6, 7, 8, 9].includes(map[layer][row][col])) {
      floor = map[layer][row][col];
    } else if ([6, 7, 8, 9].includes(map[layer - 1][row][col])) {
      floor = -map[layer - 1][row][col];
    } else {
      floor = 1;
    }
  }
  return [up, down, left, right, floor];
};

const getPosition = (x, a, b) => {
  if (x < 0.25) {
    return a * 0.25 + (1 - a) * x;
  }
  if (x >= 0.75) {
    return b * 0.75 + (1 - b) * x;
  }
  return x;
};

const getPositionY = (x, z, y, type) => {
  let height;
  if (type == 6) {
    height = z + 0.5;
  } else if (type == -6) {
    height = z - 0.5;
  } else if (type == 8) {
    height = (1 - z) + 0.5;
  } else if (type == -8) {
    height = (1 - z) - 0.5;
  } else if (type == 7) {
    height = (1 - x) + 0.5;
  } else if (type == -7) {
    height = (1 - x) - 0.5;
  } else if (type == 9) {
    height = x + 0.5;
  } else if (type == -9) {
    height = x - 0.5;
  } else if (type == 0) {
    // Falling.
    height = -1;
  } else {
    // Any other block.
    height = 0.5;
  }
  const isFalling = y > height;
  return [Math.max(y, height), isFalling];
};

const getCoords = (obj) => [
  obj.x, obj.y, obj.z
];

const getIntCoords = (obj) => [
  Math.floor(obj.x), Math.floor(obj.y), Math.floor(obj.z)
];

// Initialize a new game.
const newGame = () => {
  const state = {
    levelStatus: null,
    renderFuncGenArgs: null,
    renderFuncGen: null,
    renderFunc: null,
    level: 1,
    limits: {
      health: 3,
      ammo: 25,
    },
    player: {
      location: {
        x: map.start_position.x,
        y: map.start_position.y,
        z: map.start_position.z,
      },
      direction: map.start_direction,
      altitude: 0,
      fallSpeed: 0,
      health: 3,
      ammo: 15,
      hitBox: 0.5,
    },
    input: {
      forward: false,
      backward: false,
      left: false,
      right: false,
      pointerLocked: false,
      jumping: false,
    },
    orbs: [],
    emitterSpawns: [],
    emitters: [],
  };

  let powerupRenderer = null;

  state.sendOrb = () => {
    if (state.player.ammo == 0) {
      return;
    }
    state.player.ammo--;
    const orbSpeed = 0.25;
    const sd = Math.sin(state.player.direction);
    const cd = Math.cos(state.player.direction);
    const sa = Math.sin(state.player.altitude);
    const ca = Math.cos(state.player.altitude);
    const orb = {
      active: true,
      position: {
        x: state.player.location.x,
        y: state.player.location.y,
        z: state.player.location.z,
      },
      velocity: {
        x: orbSpeed * sd * ca,
        y: orbSpeed * sa,
        z: orbSpeed * cd * ca,
      },
    };
    orb.explode = (emitterSpawns) => {
      audio.playDrum(250);
      orb.active = false;
      const [x, y, z] = getCoords(orb.position);
      emitterSpawns.push([x, y, z, 1]);
    };
    audio.playDrum(500);
    state.orbs.push(orb);
  };

  const goToLevel = (lvl, delay, status) => {
    state.renderFunc = () => {};
    state.levelStatus = status;
    const changeLevel = () => {
      state.levelStatus = null;
      state.level = lvl;
      state.player.location.x = map.start_position.x;
      state.player.location.y = map.start_position.y;
      state.player.location.z = map.start_position.z;
      state.player.direction = map.start_direction;
      state.player.altitude = 0;
      state.player.fallSpeed = 0;
      state.player.health = 3;
      state.player.ammo = 15;
      state.renderFunc = state.renderFuncGen(...state.renderFuncGenArgs);
      requestAnimationFrame(state.renderFunc);
    };
    if (delay) {
      setTimeout(changeLevel, 1000);
    } else {
      changeLevel();
    }
  };

  const walkDirection = [
    [5, 4, 3],
    [6, 0, 2],
    [7, 0, 1],
  ];
  const quarterPi = Math.PI / 4;
  const fallRate = 0.16;
  const walkRate = 2;
  const jumpSpeed = 0.04;

  let lastUpdate = 0;
  const update = (timestamp) => {
    const dt = Math.min(timestamp - lastUpdate, 1000) / 1000;
    lastUpdate = timestamp;

    let dx = 0, dz = 0;
    const walkSpeed = dt * walkRate;

    // Read player inputs
    const walkIdx = [
      1 + state.input.forward - state.input.backward,
      1 + state.input.right - state.input.left,
    ];
    if (walkIdx[0] != 1 || walkIdx[1] != 1) {
      const angle = walkDirection[walkIdx[0]][walkIdx[1]] * quarterPi;
      const theta = state.player.direction + angle;
      dz += walkSpeed * Math.cos(theta);
      dx += walkSpeed * Math.sin(theta);
    }
    if (state.input.jumping && state.player.fallSpeed == 0) {
      state.player.fallSpeed -= jumpSpeed;
    }

    // Update player position
    let dy = -state.player.fallSpeed;
    if (dx != 0 || dy != 0 || dz != 0) {
      const [playerX, playerY, playerZ] = getCoords(state.player.location);
      const [col, layer, row] = getIntCoords(state.player.location);
      const collisions = getCollisions(map.blocks, layer, row, col);
      const xFrac = playerX - col;
      const xMove = getPosition(xFrac + dx, collisions[2], collisions[3]);
      state.player.location.x = col + xMove;
      const zFrac = playerZ - row;
      const zMove = getPosition(zFrac + dz, collisions[0], collisions[1]);
      state.player.location.z = row + zMove;
      const yFrac = playerY - layer;
      const [yMove, isFalling] = getPositionY(xMove, zMove, yFrac + dy, collisions[4]);
      state.player.location.y = layer + yMove;
      if (isFalling) {
        state.player.fallSpeed += dt * fallRate;
      } else {
        state.player.fallSpeed = 0;
      }
    }

    // Collect powerups
    const [col, layer, row] = getIntCoords(state.player.location);
    const powerup = map.blockInfo[layer][row][col].powerup;
    if (powerup != powerupTypes.none) {
      if (powerup == powerupTypes.ammo) {
        state.player.ammo = Math.min(state.player.ammo + 5, state.limits.ammo);
      } else if (powerup == powerupTypes.health) {
        state.player.health = Math.min(state.player.health + 1, state.limits.health);
      } else if (powerup == powerupTypes.exit) {
        audio.playNote(440);
        setTimeout(() => audio.playNote(554), 200);
        setTimeout(() => audio.playNote(659), 400);
        goToLevel(state.level + 1, true, 'next level');
        // No need to finish update.
        return;
      }
      map.blockInfo[layer][row][col].powerup = powerupTypes.none;
      let idx = map.blockInfo[layer][row][col].attributeBufferIndex;
      idx *= 6;
      for (let i = 0; i < 6; i++) {
        powerupRenderer.typeData[idx + i] = powerupTypes.none;
      }
      powerupRenderer.stale = idx;
      audio.playNote(659);
    }

    // Update orbs and emitters
    state.orbs.forEach((orb) => {
      orb.position.x += orb.velocity.x;
      orb.position.y += orb.velocity.y;
      orb.position.z += orb.velocity.z;
      orb.velocity.y -= dt * fallRate;
      const col = Math.floor(orb.position.x);
      const layer = Math.floor(orb.position.y);
      const row = Math.floor(orb.position.z);
      if (map.blocks[layer][row][col] != 0) {
        orb.explode(state.emitterSpawns);
      }
    });
    state.emitters.forEach((emitter) => {
      emitter.state.age += dt * 3;
    });
    for (let i = 0; i < state.orbs.length; i++) {
      if (!state.orbs[i].active) {
        state.orbs.splice(i--, 1);
      }
    }
    for (let i = 0; i < state.emitters.length; i++) {
      if (state.emitters[i].state.age > 1) {
        state.emitters.splice(i--, 1);
      }
    }
  };

  return {
    state: state,
    update: update,
    setPowerupRenderer: (r) => {powerupRenderer = r;},
    doDamage: (dmg) => {
      state.player.health -= dmg;
      if (state.player.health <= 0) {
        audio.playNote(440);
        setTimeout(() => audio.playNote(370), 200);
        setTimeout(() => audio.playNote(349), 400);
        goToLevel(1, true, 'game over');
      } else {
        audio.playNote(466);
      }
    },
    goToLevel: goToLevel,
  };
};
const newBaddie = (gl, mesh) => {
	var x=0,z=0;
	while(map.blocks[1][Math.floor(z)][Math.floor(x)] != 0){
		x = Math.floor(Math.random() * (map.blocks[0].length-2))+1.5;
		z = Math.floor(Math.random() * (map.blocks[0].length-2))+1.5;
	}
	const baddie = {
		location: {
			x: x,
			y: 1.5,
			z: z,
		  },
		hitTime : 0,
    hitBox: 0.25,
    health: 3,
	};

	addBlockToMesh(mesh, -0.5, -0.5, -0.5);
	baddie.render = newMeshRenderer(gl, mesh);

	baddie.findFirstChoice = (k, meta) =>{
		var actions = [[0,0]];
		while(meta[k][0] != null){
			actions.push(meta[k][1]);
			k = meta[k][0];
		}
		return actions[actions.length-1];
	};

	baddie.bfs = (l, r, c, goalr, goalc, blockTypes, ignoreCollision) => {
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
			if(r == null || c == null)
				console.log('r and c shouldnt be null');
			//stay within boundaries
			if(l <= 0 || l >= map.blocks.length || r <= 0 || r >= map.blocks[l].length || c <= 0 || c >= map.blocks[l][r].length){
				closed.push(rt);
				continue;
			}
			//reached goal
			if(r == goalr && c == goalc){
				return baddie.findFirstChoice(rt, meta);
			}
			//found desired block
			if(blockTypes.includes(map.blocks[l][r][c])){
				//console.log('found ramp ' + map.blocks[l][r][c]);
				return [l, r, c];
			}
			if(!ignoreCollision && map.blocks[l][r][c] != 0){
				closed.push(rt);
				continue;
			}
			var collisions = getCollisions(map.blocks, l, r, c);
			neighbors.forEach((n, i) => {
				var k = (r+n[0]) + '|' + (c+n[1]);
				if(!closed.includes(k) && !open.includes(k) && (ignoreCollision || !collisions[i])){
					meta[k] = [rt, n];
					open.push(k);
				}
			});
			closed.push(rt);
		}
		return [0,0];
	};

	baddie.findRamp = (layer, row, col, dl) => {
		//Find ramp location
		var lrc = baddie.bfs(layer+dl, row, col, null, null, [6,7,8,9], dl<0);
		if(lrc.length == 2) return lrc;//no ramp found
		//now find the block at the foot of the ramp
		var r = map.blocks[lrc[0]][lrc[1]][lrc[2]];
		var dr, dc;
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
			console.log('this shouldnt happen. ' + r + ' ' + lrc);
		//if baddie is at foot of ramp, climb
		if(row == lrc[1]+dr && col == lrc[2]+dc){
			//special logic for ramps.  This should be the only time the function returns null.
			//if(dl == 0){
				baddie.shortGoal[0] = dr*-1;
				baddie.shortGoal[1] = dc*-1;
			//}
			baddie.shortGoal[2] = row + 3 * baddie.shortGoal[0];
			baddie.shortGoal[3] = col + 3 * baddie.shortGoal[1];
			baddie.shortGoal[4] = baddie.location.y;
			baddie.shortGoal[5] = baddie.location.y+2;
			if(dl < 0)
				baddie.shortGoal[5] = baddie.location.y-2;
			return null;
		}
		//else path to foot of ramp
		return baddie.bfs(layer, row, col, lrc[1]+dr, lrc[2]+dc, [], false);
	};

	baddie.getGoal = (timestamp, playerLocation, layer, row, col) => {
		var zx=[0,0];
		if(layer == Math.floor(playerLocation.y))
			zx = baddie.bfs(layer, row, col, Math.floor(playerLocation.z), Math.floor(playerLocation.x), [], false);
		//otherwise, find nearest ramp.  TODO: maybe this needs to be changed to find ramp nearest to player, instead of ramp nearest to baddie?
		if(zx[0] == 0 && zx[1] == 0 && layer < Math.floor(playerLocation.y))
			zx = baddie.findRamp(layer, row, col, 0);
		if(zx != null && zx[0] == 0 && zx[1] == 0)
			zx = baddie.findRamp(layer, row, col, -1);
		return zx;
	};

	baddie.shortGoal = [null, null, null, null, null, null];
	let lastUpdate = 0;
	baddie.update = (timestamp, playerLocation) => {
		const dt = Math.min(timestamp - lastUpdate, 1000) / 1000;
		lastUpdate = timestamp;
		if(baddie.hitTime == 0) baddie.hitTime = timestamp;
		const layer = Math.floor(baddie.location.y);
		const row = Math.floor(baddie.location.z);
		const col = Math.floor(baddie.location.x);
		//todo: keep whole path and reuse if player location hasn't changed.
		if(baddie.shortGoal[0] == null){// && baddie.shortGoal[4] == null){
			var zx = baddie.getGoal(timestamp, playerLocation, layer, row, col);
			if(zx != null){
				//direction to go
				baddie.shortGoal[0] = zx[0];
				baddie.shortGoal[1] = zx[1];
				//location to get to
				baddie.shortGoal[3] = col + baddie.shortGoal[1]*.5;//.5 is to keep him in center of row/col
				baddie.shortGoal[2] = row + baddie.shortGoal[0]*.5;//doesn't always work though...
				//baddie.shortGoal[4] = null;
			}
		}
		baddie.location.x += baddie.shortGoal[1] * dt;
		baddie.location.z += baddie.shortGoal[0] * dt;
		//decide if any vertical movement is needed
		if(baddie.shortGoal[4] != null){
			//dividing by 3 wasn't getting them quite high enough, causign a bug.
			var zratio = (3-Math.abs(baddie.shortGoal[2] - baddie.location.z))/2.9;
			var xratio = (3-Math.abs(baddie.shortGoal[3] - baddie.location.x))/2.9;
			var up = baddie.shortGoal[5] > baddie.shortGoal[4];
			//reached vertical goal
			if((up && baddie.location.y >= baddie.shortGoal[5]) ||
					(!up && baddie.location.y <= baddie.shortGoal[5]) ||
					zratio < 0 || xratio < 0){
				baddie.shortGoal[4] = baddie.shortGoal[5] = null;//baddie.shortGoal[1] = baddie.shortGoal[2] =
				baddie.location.y = Math.floor(baddie.location.y) + .5;
			}
			else if(up)
				baddie.location.y = baddie.shortGoal[4] +
					2*Math.abs(baddie.shortGoal[0]) * zratio +
					2*Math.abs(baddie.shortGoal[1]) * xratio;
			else
				baddie.location.y = baddie.shortGoal[4] -
					2*Math.abs(baddie.shortGoal[0]) * zratio -
					2*Math.abs(baddie.shortGoal[1]) * xratio;
		}
		//reached horizontal goal
		if(//baddie.shortGoal[4] == null &&
			   (baddie.shortGoal[1] > 0 && baddie.location.x > baddie.shortGoal[3]) ||
			   (baddie.shortGoal[1] < 0 && baddie.location.x < baddie.shortGoal[3]) ||
			   (baddie.shortGoal[0] > 0 && baddie.location.z > baddie.shortGoal[2]) ||
			   (baddie.shortGoal[0] < 0 && baddie.location.z < baddie.shortGoal[2]) ||
			   (baddie.shortGoal[1] == 0 && baddie.shortGoal[0] == 0))
			baddie.shortGoal[0] = baddie.shortGoal[1] = null;
	};

  // Things that happen when the baddie dies.
  baddie.explode = (emitterSpawns) => {
    baddie.health = 0;
    audio.playNote(440);
    const [x, y, z] = getIntCoords(baddie.location);
    emitterSpawns.push([x, y, z, 5]);
  };

	return baddie;
};
