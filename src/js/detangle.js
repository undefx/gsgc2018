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

  const render = (gl, transform) => {
    gl.useProgram(program.program);
    let id;

    id = program.getUniform('transform');
    gl.uniformMatrix4fv(id, false, new Float32Array(transform));

    id = program.getUniform('palette');
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, palette);
    gl.uniform1i(id, 0);

    id = program.getUniform('image');
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(id, 1);

    id = program.getUniform('filter');
    gl.uniform1f(id, 1);

    id = program.getUniform('texTransform');
    gl.uniformMatrix4fv(id, false, new Float32Array(texTransform));

    id = program.getAttribute('position');
    gl.enableVertexAttribArray(id);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(id, 2, gl.FLOAT, false, 0, 0);

    id = program.getAttribute('texCoord');
    gl.enableVertexAttribArray(id);
    gl.bindBuffer(gl.ARRAY_BUFFER, coordsBuffer);
    gl.vertexAttribPointer(id, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
  };

  return render;
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

// Creates a new static mesh renderer.
const newMeshRenderer = (gl, mesh, name) => {
  const program = newProgram(gl, name);
  const vertexBuffer = uploadBuffer(gl, mesh.vertices);
  const texCoordBuffer = uploadBuffer(gl, mesh.texCoords);

  return (transform) => {
    let id;
    gl.useProgram(program.program);

    id = program.getUniform('transform');
    gl.uniformMatrix4fv(id, false, new Float32Array(transform));

    id = program.getUniform('palette');
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, mesh.palette);
    gl.uniform1i(id, 0);

    id = program.getUniform('image');
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, mesh.texture);
    gl.uniform1i(id, 1);

    id = program.getUniform('filter');
    gl.uniform1f(id, mesh.filter);

    id = program.getAttribute('position');
    gl.enableVertexAttribArray(id);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(id, 3, gl.FLOAT, false, 0, 0);

    id = program.getAttribute('texCoord');
    gl.enableVertexAttribArray(id);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.vertexAttribPointer(id, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, mesh.vertices.length / 3);
  };
};

// Creates a new block (cube) game object.
const newBlock = (gl, palette, texture) => {
  const program = newProgram(gl, 'block');

  // vertices
  const c = 0.5;
  const vRUF = [+c, +c, -c];
  const vRUB = [+c, +c, +c];
  const vRDF = [+c, -c, -c];
  const vRDB = [+c, -c, +c];
  const vLUF = [-c, +c, -c];
  const vLUB = [-c, +c, +c];
  const vLDF = [-c, -c, -c];
  const vLDB = [-c, -c, +c];

  const positions = flatten([
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
  ]);
  const coords = [
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
  ];
  const positionBuffer = uploadBuffer(gl, positions);
  const coordsBuffer = uploadBuffer(gl, coords);
  const shift = translate(c, c, c);

  const render = (gl, transform, timestamp) => {
    gl.useProgram(program.program);
    let id;

    id = program.getUniform('transform');
    gl.uniformMatrix4fv(id, false, new Float32Array(matmul(transform, shift)));

    id = program.getUniform('palette');
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, palette);
    gl.uniform1i(id, 0);

    id = program.getUniform('image');
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(id, 1);

    id = program.getUniform('filter');
    gl.uniform1f(id, 1);

    id = program.getAttribute('position');
    gl.enableVertexAttribArray(id);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(id, 3, gl.FLOAT, false, 0, 0);

    id = program.getAttribute('texCoord');
    gl.enableVertexAttribArray(id);
    gl.bindBuffer(gl.ARRAY_BUFFER, coordsBuffer);
    gl.vertexAttribPointer(id, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);
  };

  return render;
};

// Creates a new ramp game object.
const newRamp = (gl, palette, texture, direction) => {
  const program = newProgram(gl, 'block');

  // vertices
  const c = 0.5;
  const vRUB = [+c, +c, +c];
  const vRDF = [+c, -c, -c];
  const vRDB = [+c, -c, +c];
  const vLUB = [-c, +c, +c];
  const vLDF = [-c, -c, -c];
  const vLDB = [-c, -c, +c];

  const positions = flatten([
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
  ]);
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
  ];
  const positionBuffer = uploadBuffer(gl, positions);
  const coordsBuffer = uploadBuffer(gl, coords);
  const shift = matmul(translate(c, c, c), rotate.y(-Math.PI / 2 * direction));

  const render = (gl, transform, timestamp) => {
    gl.useProgram(program.program);
    let id;

    id = program.getUniform('transform');
    gl.uniformMatrix4fv(id, false, new Float32Array(matmul(transform, shift)));

    id = program.getUniform('palette');
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, palette);
    gl.uniform1i(id, 0);

    id = program.getUniform('image');
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(id, 1);

    id = program.getUniform('filter');
    gl.uniform1f(id, 1);

    id = program.getAttribute('position');
    gl.enableVertexAttribArray(id);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(id, 3, gl.FLOAT, false, 0, 0);

    id = program.getAttribute('texCoord');
    gl.enableVertexAttribArray(id);
    gl.bindBuffer(gl.ARRAY_BUFFER, coordsBuffer);
    gl.vertexAttribPointer(id, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);
  };

  return render;
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
  const blocks = [
    null, //newBlock(gl, paletteTexId, uploadTexture(gl, randomTexture(8, 0.7, 0, 0))),
    null,
    null, //newBlock(gl, paletteTexId, uploadTexture(gl, randomTexture(8, 0.7, 0.7, 0.4))),
    null, // newBlock(gl, paletteTexId, uploadTexture(gl, randomTexture(8, 0.7, 0.7, 0.7))),
    null,
    newRamp(gl, paletteTexId, uploadTexture(gl, randomTexture(8, 0, 0.8, 0.3)), 0),
    newRamp(gl, paletteTexId, uploadTexture(gl, randomTexture(8, 0, 0.8, 0.3)), 1),
    newRamp(gl, paletteTexId, uploadTexture(gl, randomTexture(8, 0, 0.8, 0.3)), 2),
    newRamp(gl, paletteTexId, uploadTexture(gl, randomTexture(8, 0, 0.8, 0.3)), 3),
  ];
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
  const newBlockType = (textureId) => ({
    palette: paletteTexId,
    texture: textureId,
    filter: 1,
    vertices: [],
    texCoords: [],
    render: null,
  });
  const staticMeshes = {
    // Ceiling
    1: newBlockType(uploadTexture(gl, randomTexture(8, 0.7, 0, 0))),
    // Floors
    3: newBlockType(uploadTexture(gl, randomTexture(8, 0.7, 0.7, 0.4))),
    // Walls
    4: newBlockType(uploadTexture(gl, randomTexture(8, 0.7, 0.7, 0.7))),
  };
  const stragglers = [];
  for (let layer = 0; layer < map.blocks.length; layer++) {
    for (let row = 0; row < map.blocks[0].length; row++) {
      for (let col = 0; col < map.blocks[0][0].length; col++) {
        const idx = map.blocks[layer][row][col];
        if (staticMeshes.hasOwnProperty(idx)) {
          addBlockToMesh(staticMeshes[idx], col, layer, row);
        } else if (idx != 0) {
          stragglers.push([blocks[idx - 1], [col, layer, row]]);
        }
      }
    }
  }
  staticMeshes[1].render = newMeshRenderer(gl, staticMeshes[1], 'block');
  staticMeshes[3].render = newMeshRenderer(gl, staticMeshes[3], 'block');
  staticMeshes[4].render = newMeshRenderer(gl, staticMeshes[4], 'block');
  console.log('map dimens:', map.blocks.length, map.blocks[0].length, map.blocks[0][0].length);
  //console.log(staticMeshes);
  //console.log(stragglers);

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
    //for (let layer = 0; layer < map.blocks.length; layer++) {
    //  for (let row = 0; row < map.blocks[0].length; row++) {
    //    for (let col = 0; col < map.blocks[0][0].length; col++) {
    //      if (map.blocks[layer][row][col] == 0) {
    //        continue;
    //      }
    //      const idx = map.blocks[layer][row][col] - 1;
    //      const l = layer;
    //      const r = row;
    //      if (idx != 3) {
    //        blocks[idx](gl, matmul(transform, translate(col, l, r)), timestamp);
    //      }
    //    }
    //  }
    //}
    staticMeshes[1].render(transform);
    staticMeshes[3].render(transform);
    staticMeshes[4].render(transform);
    stragglers.forEach((s) => {
      const render = s[0];
      const [x, y, z] = s[1];
      render(gl, matmul(transform, translate(x, y, z)), timestamp);
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
