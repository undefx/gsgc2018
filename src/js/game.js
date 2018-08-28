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

// Initialize a new game.
const newGame = () => {
  const state = {
    player: {
      location: {
        x: map.start_position.x,
        y: map.start_position.y,
        z: map.start_position.z,
      },
      direction: map.start_direction,
      altitude: 0,
      fallSpeed: 0,
    },
    input: {
      forward: false,
      backward: false,
      left: false,
      right: false,
      pointerLocked: false,
      jumping: false,
    },
    orb: {
      active: false,
      position: {
        x: 0,
        y: 0,
        z: 0,
      },
      velocity: {
        x: 0,
        y: 0,
        z: 0,
      },
    },
    emitter: null,
  };

  state.sendOrb = () => {
    if (state.orb.active) {
      return;
    }
    state.orb.active = true;
    state.orb.position.x = state.player.location.x;
    state.orb.position.y = state.player.location.y;
    state.orb.position.z = state.player.location.z;
    const orbSpeed = 0.25;
    const sd = Math.sin(state.player.direction);
    const cd = Math.cos(state.player.direction);
    const sa = Math.sin(state.player.altitude);
    const ca = Math.cos(state.player.altitude);
    state.orb.velocity.x = orbSpeed * sd * ca;
    state.orb.velocity.z = orbSpeed * cd * ca;
    state.orb.velocity.y = orbSpeed * sa;
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
    let dy = -state.player.fallSpeed;
    if (dx != 0 || dy != 0 || dz != 0) {
      const layer = Math.floor(state.player.location.y);
      const row = Math.floor(state.player.location.z);
      const col = Math.floor(state.player.location.x);
      const collisions = getCollisions(map.blocks, layer, row, col);
      const xFrac = state.player.location.x - col;
      const xMove = getPosition(xFrac + dx, collisions[2], collisions[3]);
      state.player.location.x = col + xMove;
      const zFrac = state.player.location.z - row;
      const zMove = getPosition(zFrac + dz, collisions[0], collisions[1]);
      state.player.location.z = row + zMove;
      const yFrac = state.player.location.y - layer;
      const [yMove, isFalling] = getPositionY(xMove, zMove, yFrac + dy, collisions[4]);
      state.player.location.y = layer + yMove;
      if (isFalling) {
        state.player.fallSpeed += dt * fallRate;
      } else {
        state.player.fallSpeed = 0;
      }
    }
    if (state.orb.active) {
      state.orb.position.x += state.orb.velocity.x;
      state.orb.position.y += state.orb.velocity.y;
      state.orb.position.z += state.orb.velocity.z;
      state.orb.velocity.y -= dt * fallRate;
      const col2 = Math.floor(state.orb.position.x);
      const layer2 = Math.floor(state.orb.position.y);
      const row2 = Math.floor(state.orb.position.z);
      if (map.blocks[layer2][row2][col2] != 0) {
        playNote(220);
        state.orb.active = false;
        state.emitter = [state.orb.position.x, state.orb.position.y, state.orb.position.z];
      }
    }
  };

  return {
    state: state,
    update: update,
  };
};

const newBaddie = (gl, mesh) => {
	const baddie = {
		location: {
			x: .66,
			y: .5,
			z: .66,
		  },
		hitTime : 0,
	};	
	
	addBlockToMesh(mesh, baddie.location.x, baddie.location.y, baddie.location.z, .5)
	baddie.render = newMeshRenderer(gl, mesh);
	
	baddie.rfindPath = (l, r, c, goalr, goalc) => {
		var p = [[0,0]];
		return [0,0];
	};
	
	baddie.findPath = (playerLocation) => {
		var dx = playerLocation.x-baddie.location.x, 
			dy = playerLocation.y-baddie.location.y, 
			dz = playerLocation.z-baddie.location.z,
			adx = Math.abs(dx),
			ady = Math.abs(dy),
			adz = Math.abs(dz);
		if(Math.floor(dy) == 0){ //same layer
			
		}
	};
	
	let lastUpdate = 0;
	baddie.update = (timestamp, playerLocation) => {
		const dt = Math.min(timestamp - lastUpdate, 1000) / 1000;
		lastUpdate = timestamp;
		if(baddie.hitTime == 0) baddie.hitTime = timestamp;
		const layer = Math.floor(baddie.location.y);
		const row = Math.floor(baddie.location.z);
		const col = Math.floor(baddie.location.x);
		var dz, dx = baddie.rfindPath(layer, row, col, Math.floor(playerLocation.z), Math.floor(playerLocation.x));				
		//baddie.location.x += dx * dt;
		//baddie.location.z += dz * dt;
	};
	
	return baddie;
};

