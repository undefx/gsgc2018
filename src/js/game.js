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
    }
  };

  const walkDirection = [
    [5, 4, 3],
    [6, 0, 2],
    [7, 0, 1],
  ];
  const quarterPi = Math.PI / 4;
  const fallRate = 0.12;
  const walkRate = 2;

  let lastUpdate = 0;
  const update = (timestamp) => {
    const dt = Math.min(timestamp - lastUpdate, 1000) / 1000;
    lastUpdate = timestamp;

    let dx = 0, dy = -state.player.fallSpeed, dz = 0;
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
  };

  return {
    state: state,
    update: update,
  };
};
