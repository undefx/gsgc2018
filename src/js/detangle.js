/* jshint esversion: 6 */

// Stuff that needs to be detangled. This file should eventually go away.

// Creates a new quad interface object.
const newQuad = (gl, palette, texture, tex_x_offset, tex_x_num) => {
  const program = newProgram(gl, 'quad');

  const c = 1;
  // vertices
  const positions = [
    -c, -c, c, -c, c, c,
    -c, -c, c, c, -c, c,
  ];
  const coords = [
    0, 1, 1, 1, 1, 0,
    0, 1, 1, 0, 0, 0,
  ];
  const positionBuffer = uploadBuffer(gl, positions);
  const coordsBuffer = uploadBuffer(gl, coords);

  let texTransform = identity();
  texTransform = matmul(texTransform, translate(tex_x_offset / tex_x_num, 0, 0));
  texTransform = matmul(texTransform, scale(1 / tex_x_num, 1, 1));

  const renderer = createRenderer(gl, program);
  renderer.data.uniform.sampler2D.image = texture;
  renderer.data.uniform.sampler2D.palette = palette;
  renderer.data.uniform.float.filter = 1;
  renderer.data.uniform.mat4.texTransform = texTransform;
  renderer.data.attribute.vec2.position = positionBuffer;
  renderer.data.attribute.vec2.texCoord = coordsBuffer;
  const numPoints = positions.length / 2;

  return (gl, transform) => {
    renderer.data.uniform.mat4.transform = transform;
    renderer.render(numPoints);
  };
};

// Adds a new block (cube) to a static mesh.
const addBlockToMesh = (mesh, dx, dy, dz) => {
  // vertices
  const vRUF = [dx + 1, dy + 1, dz];
  const vRUB = [dx + 1, dy + 1, dz + 1];
  const vRDF = [dx + 1, dy, dz];
  const vRDB = [dx + 1, dy, dz + 1];
  const vLUF = [dx, dy + 1, dz];
  const vLUB = [dx, dy + 1, dz + 1];
  const vLDF = [dx, dy, dz];
  const vLDB = [dx, dy, dz + 1];

  flatten([
    // front
    vLDF, vRUF, vLUF,
    vLDF, vRDF, vRUF,
    // right
    vRDF, vRUB, vRUF,
    vRDF, vRDB, vRUB,
    // back
    vRDB, vLUB, vRUB,
    vRDB, vLDB, vLUB,
    // left
    vLDB, vLUF, vLUB,
    vLDB, vLDF, vLUF,
    // top
    vLUF, vRUB, vLUB,
    vLUF, vRUF, vRUB,
    // bottom
    vLDF, vRDB, vRDF,
    vLDF, vLDB, vRDB,
  ]).forEach(e => mesh.vertices.push(e));
  [
    // front
    0, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1,
    // right
    0, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1,
    // back
    0, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1,
    // left
    0, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1,
    // top
    0, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1,
    // bottom
    0, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1,
  ].forEach(e => mesh.texCoords.push(e));
};

// Adds a new ramp to a static mesh.
const addRampToMesh = (mesh, direction, dx, dy, dz) => {
  // vertices
  const c = 0.5;
  const trans = translate(c + dx, c + dy, c + dz);
  const rot = rotate.y(-Math.PI / 2 * direction);
  const shift = matmul(trans, rot);
  const applyShift = (x, y, z) => matmul(shift, [x, y, z, 1]).splice(0, 3);
  const vRUB = applyShift(+c, +c, +c);
  const vRDF = applyShift(+c, -c, -c);
  const vRDB = applyShift(+c, -c, +c);
  const vLUB = applyShift(-c, +c, +c);
  const vLDF = applyShift(-c, -c, -c);
  const vLDB = applyShift(-c, -c, +c);

  flatten([
    // ramp
    vLDF, vRUB, vLUB,
    vLDF, vRDF, vRUB,
    // right
    vRDF, vRDB, vRUB,
    // back
    vRDB, vLUB, vRUB,
    vRDB, vLDB, vLUB,
    // left
    vLDB, vLDF, vLUB,
    // bottom
    vLDF, vRDB, vRDF,
    vLDF, vLDB, vRDB,
  ]).forEach(e => mesh.vertices.push(e));
  const coords = [
    // ramp
    0, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1,
    // right
    0, 0, 1, 0, 1, 1,
    // back
    0, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1,
    // left
    0, 0, 1, 0, 0, 1,
    // bottom
    0, 0, 1, 1, 0, 1,
    0, 0, 1, 0, 1, 1,
  ].forEach(e => mesh.texCoords.push(e));
};

// Creates a new static mesh renderer.
const newMeshRenderer = (gl, mesh) => {
  const program = mesh.program;
  const vertexBuffer = uploadBuffer(gl, mesh.vertices);
  const texCoordBuffer = uploadBuffer(gl, mesh.texCoords);

  const renderer = createRenderer(gl, program);
  renderer.data.uniform.sampler2D.image = mesh.texture;
  renderer.data.uniform.sampler2D.palette = mesh.palette;
  renderer.data.uniform.float.filter = 1;
  renderer.data.attribute.vec3.position = vertexBuffer;
  renderer.data.attribute.vec2.texCoord = texCoordBuffer;
  const numPoints = mesh.vertices.length / 3;

  return (transform) => {
    renderer.data.uniform.mat4.transform = transform;
    renderer.render(numPoints);
  };
};

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

const game = {
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

const setup = () => {
  const canvas = document.getElementsByTagName('canvas')[0];
  const options = {alpha: false, antialias : false};
  const gl = canvas.getContext('webgl', options);
  gl.enable(gl.CULL_FACE);
  gl.frontFace(gl.CCW);
  gl.cullFace(gl.BACK);

  const paletteTexId = uploadTexture(gl, paletteTexture());

  // Text rendering.
  const glyphs = {};
  const glyphTexId = uploadTexture(gl, img_text);
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789.,!?-+:/@ ';
  for (let i = 0; i < alphabet.length; i++) {
    const quad = newQuad(gl, paletteTexId, glyphTexId, i, alphabet.length);
    glyphs[alphabet[i]] = quad;
  }
  const renderString = (gl, str, transform) => {
    for (let i = 0; i < str.length; i++) {
      glyphs[str[i]](gl, transform);
      transform = matmul(transform, translate(2, 0, 0));
    }
  };

  canvas.addEventListener('keydown', (e) => {
    if (e.key == 'w') {
      game.input.forward = true;
    }
    if (e.key == 'a') {
      game.input.left = true;
    }
    if (e.key == 's') {
      game.input.backward = true;
    }
    if (e.key == 'd') {
      game.input.right = true;
    }
  });
  canvas.addEventListener('keyup', (e) => {
    if (e.key == 'w') {
      game.input.forward = false;
    }
    if (e.key == 'a') {
      game.input.left = false;
    }
    if (e.key == 's') {
      game.input.backward = false;
    }
    if (e.key == 'd') {
      game.input.right = false;
    }
  });
  canvas.onclick = function() {
    canvas.requestPointerLock();
  };
  document.addEventListener('pointerlockchange', () => {
    const isLocked = document.pointerLockElement === canvas;
    if (!game.input.pointerLocked && isLocked) {
      game.input.pointerLocked = document.pointerLockElement === canvas;
      if (game.input.pointerLocked) {
        requestAnimationFrame(render);
        playNote(440);
      }
    } else if (!isLocked) {
      game.input.pointerLocked = false;
      playNote(420);
    }
  });
  const mouseSensitivity = 0.0015;
  canvas.addEventListener('mousemove', (e) => {
    if (game.input.pointerLocked) {
      game.player.direction += e.movementX * mouseSensitivity;
      game.player.altitude -= e.movementY * mouseSensitivity;
      game.player.altitude = Math.min(game.player.altitude, +Math.PI / 2);
      game.player.altitude = Math.max(game.player.altitude, -Math.PI / 2);
    }
  });

  // Build a static mesh for each block type.
  const blockProgram = newProgram(gl, 'block');
  const newBlockType = (textureId) => ({
    program: blockProgram,
    palette: paletteTexId,
    texture: textureId,
    filter: 1,
    vertices: [],
    texCoords: [],
    render: null,
  });

  const rampTexture = uploadTexture(gl, randomTexture(8, 0, 0.2, 0.7));
  const rampBlockType = newBlockType(rampTexture);

  const staticMeshes = {
    // Ceiling
    1: newBlockType(uploadTexture(gl, randomTexture(8, 0.7, 0, 0))),
    // Floors
    3: newBlockType(uploadTexture(gl, randomTexture(8, 0.7, 0.7, 0.4))),
    // Walls
    4: newBlockType(uploadTexture(gl, randomTexture(8, 0.7, 0.7, 0.7))),
    // Ramps (N, E, S, W)
    'ramps': rampBlockType,
  };
  for (let layer = 0; layer < map.blocks.length; layer++) {
    for (let row = 0; row < map.blocks[0].length; row++) {
      for (let col = 0; col < map.blocks[0][0].length; col++) {
        const idx = map.blocks[layer][row][col];
        const isRamp = idx >= 6 && idx <= 9;
        if (staticMeshes.hasOwnProperty(idx) || isRamp) {
          if (isRamp) {
            const direction = idx - 6;
            addRampToMesh(staticMeshes.ramps, direction, col, layer, row);
          } else {
            addBlockToMesh(staticMeshes[idx], col, layer, row);
          }
        }
      }
    }
  }
  Object.getOwnPropertyNames(staticMeshes).forEach((name) => {
    staticMeshes[name].render = newMeshRenderer(gl, staticMeshes[name]);
  });

  let lastTimestamp = 0, avgLag = 0;
  const render = (timestamp) => {
    const frameLag = timestamp - lastTimestamp;
    avgLag = 0.98 * avgLag + 0.02 * frameLag;
    lastTimestamp = timestamp;
    if (game.input.pointerLocked) {
      requestAnimationFrame(render);
    }
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const sec_rad = timestamp * 0.001 * Math.PI * 2;
    const sin_t = (x) => {return Math.sin(x * sec_rad);};
    const cos_t = (x) => {return Math.cos(x * sec_rad);};

    const moveSpeed = 0.04;
    const strafe = 0.8;
    game.player.fallSpeed += 0.002;
    let dx = 0, dy = -game.player.fallSpeed, dz = 0;
    if (game.input.forward) {
      const theta = game.player.direction;
      dz += moveSpeed * Math.cos(theta);
      dx += moveSpeed * Math.sin(theta);
    }
    if (game.input.backward) {
      const theta = game.player.direction + Math.PI;
      dz += moveSpeed * Math.cos(theta);
      dx += moveSpeed * Math.sin(theta);
    }
    if (game.input.left) {
      const theta = game.player.direction + Math.PI * 1.5;
      dz += strafe * moveSpeed * Math.cos(theta);
      dx += strafe * moveSpeed * Math.sin(theta);
    }
    if (game.input.right) {
      const theta = game.player.direction + Math.PI * 0.5;
      dz += strafe * moveSpeed * Math.cos(theta);
      dx += strafe * moveSpeed * Math.sin(theta);
    }
    if (dx != 0 || dy != 0 || dz != 0) {
      const layer = Math.floor(game.player.location.y);
      const row = Math.floor(game.player.location.z);
      const col = Math.floor(game.player.location.x);
      const collisions = getCollisions(map.blocks, layer, row, col);
      const xFrac = game.player.location.x - col;
      const xMove = getPosition(xFrac + dx, collisions[2], collisions[3]);
      game.player.location.x = col + xMove;
      const zFrac = game.player.location.z - row;
      const zMove = getPosition(zFrac + dz, collisions[0], collisions[1]);
      game.player.location.z = row + zMove;
      const yFrac = game.player.location.y - layer;
      const yMove = getPositionY(xMove, zMove, yFrac + dy, collisions[4]);
      game.player.location.y = layer + yMove;
      if (collisions[4] != 0 && yMove == 0.5) {
        game.player.fallSpeed = 0;
      }
    } else {
      game.player.fallSpeed = 0;
    }

    // 3d: game world
    gl.enable(gl.DEPTH_TEST);
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const fov = 1.2 * Math.PI / 2;
    let transform = identity();
    transform = matmul(transform, perspective(aspect, fov));
    transform = matmul(transform, translate(0, -0.01, -1));
    transform = matmul(transform, rotate.x(-game.player.altitude));
    transform = matmul(transform, rotate.y(-game.player.direction));
    transform = matmul(transform, translate(-game.player.location.x, -game.player.location.y, -game.player.location.z));

    Object.getOwnPropertyNames(staticMeshes).forEach((name) => {
      staticMeshes[name].render(transform);
    });

    // 2d: user interface
    gl.disable(gl.DEPTH_TEST);
    transform = identity();
    transform = matmul(transform, translate(-1, -1, 0));
    transform = matmul(transform, scale(6 / 360, 24 / 400, 1));
    transform = matmul(transform, translate(1, 1, 0));
    const fps = 1 / (avgLag * 0.001);
    renderString(gl, 'fps: ' + Math.round(fps), transform);
  };

  requestAnimationFrame(render);
};
