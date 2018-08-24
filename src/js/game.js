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
  if (type == 6) {
    return z + 0.5;
  }
  if (type == -6) {
    return z - 0.5;
  }
  if (type == 8) {
    return (1 - z) + 0.5;
  }
  if (type == -8) {
    return (1 - z) - 0.5;
  }
  if (type == 7) {
    return (1 - x) + 0.5;
  }
  if (type == -7) {
    return (1 - x) - 0.5;
  }
  if (type == 9) {
    return x + 0.5;
  }
  if (type == -9) {
    return x - 0.5;
  }
  if (type == 0) {
    return y;
  }
  return Math.max(y, 0.5);
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
    }
  };

  let lastUpdate = 0;
  const update = (timestamp) => {
    const dt = Math.min(timestamp - lastUpdate, 1000) / 1000;
    lastUpdate = timestamp;

    const moveSpeed = dt * 2;
    const strafe = 0.8;
    state.player.fallSpeed += dt * 0.12;
    let dx = 0, dy = -state.player.fallSpeed, dz = 0;
    if (state.input.forward) {
      const theta = state.player.direction;
      dz += moveSpeed * Math.cos(theta);
      dx += moveSpeed * Math.sin(theta);
    }
    if (state.input.backward) {
      const theta = state.player.direction + Math.PI;
      dz += moveSpeed * Math.cos(theta);
      dx += moveSpeed * Math.sin(theta);
    }
    if (state.input.left) {
      const theta = state.player.direction + Math.PI * 1.5;
      dz += strafe * moveSpeed * Math.cos(theta);
      dx += strafe * moveSpeed * Math.sin(theta);
    }
    if (state.input.right) {
      const theta = state.player.direction + Math.PI * 0.5;
      dz += strafe * moveSpeed * Math.cos(theta);
      dx += strafe * moveSpeed * Math.sin(theta);
    }
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
      const yMove = getPositionY(xMove, zMove, yFrac + dy, collisions[4]);
      state.player.location.y = layer + yMove;
      if (collisions[4] != 0 && yMove == 0.5) {
        state.player.fallSpeed = 0;
      }
    } else {
      state.player.fallSpeed = 0;
    }
  };

  return {
    state: state,
    update: update,
  };
};
