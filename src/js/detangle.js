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
    vLDB, vRDF, vLDF,
    vLDB, vRDB, vRDF,
  ]).forEach(e => mesh.vertices.push(e));

  // Texture coordinates for a single face. All faces are identical.
  const faceCoords = [
    0, 1, 1, 0, 0, 0,
    0, 1, 1, 1, 1, 0,
  ];
  flatten([
    faceCoords, faceCoords, faceCoords, faceCoords, faceCoords, faceCoords
  ]).forEach(e => mesh.texCoords.push(e));
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

  // Texture coordinates for square faces.
  const squareCoords = [
    0, 1, 1, 0, 0, 0,
    0, 1, 1, 1, 1, 0,
  ];
  flatten([
    // ramp
    squareCoords,
    // right
    [0, 1, 1, 1, 1, 0,],
    // back
    squareCoords,
    // left
    [0, 1, 1, 1, 0, 0],
    // bottom
    squareCoords,
  ]).forEach(e => mesh.texCoords.push(e));
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

const mouseSensitivity = 0.0015;

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

  const game = newGame();

  canvas.addEventListener('keydown', (e) => {
    if (e.key == 'w') {
      game.state.input.forward = true;
    }
    if (e.key == 'a') {
      game.state.input.left = true;
    }
    if (e.key == 's') {
      game.state.input.backward = true;
    }
    if (e.key == 'd') {
      game.state.input.right = true;
    }
  });
  canvas.addEventListener('keyup', (e) => {
    if (e.key == 'w') {
      game.state.input.forward = false;
    }
    if (e.key == 'a') {
      game.state.input.left = false;
    }
    if (e.key == 's') {
      game.state.input.backward = false;
    }
    if (e.key == 'd') {
      game.state.input.right = false;
    }
  });
  canvas.addEventListener('click', (e) => {
    if (!game.state.input.pointerLocked) {
      canvas.requestPointerLock();
    }
  });
  canvas.addEventListener('mousedown', (e) => {
    if (game.state.input.pointerLocked) {
      game.state.sendOrb();
    }
  });
  document.addEventListener('pointerlockchange', (e) => {
    const isLocked = document.pointerLockElement === canvas;
    if (!game.state.input.pointerLocked && isLocked) {
      game.state.input.pointerLocked = document.pointerLockElement === canvas;
      if (game.state.input.pointerLocked) {
        requestAnimationFrame(render);
        playNote(440);
      }
    } else if (!isLocked) {
      game.state.input.pointerLocked = false;
      playNote(420);
    }
  });
  canvas.addEventListener('mousemove', (e) => {
    if (game.state.input.pointerLocked) {
      game.state.player.direction += e.movementX * mouseSensitivity;
      game.state.player.altitude -= e.movementY * mouseSensitivity;
      game.state.player.altitude = Math.min(game.state.player.altitude, +Math.PI / 2);
      game.state.player.altitude = Math.max(game.state.player.altitude, -Math.PI / 2);
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

  const orbTexture = uploadTexture(gl, solidTexture(0.8, 0.4, 0.1));
  const orbBlockType = newBlockType(orbTexture);
  addBlockToMesh(orbBlockType, -0.5, -0.5, -0.5);
  orbBlockType.render = newMeshRenderer(gl, orbBlockType);

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
    if (game.state.input.pointerLocked) {
      requestAnimationFrame(render);
    }
    game.update(timestamp);

    const frameLag = timestamp - lastTimestamp;
    avgLag = 0.98 * avgLag + 0.02 * frameLag;
    lastTimestamp = timestamp;

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 3d: game world
    gl.enable(gl.DEPTH_TEST);
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const fov = 1.2 * Math.PI / 2;
    let transform = identity();
    transform = matmul(transform, perspective(aspect, fov));
    transform = matmul(transform, translate(0, -0.01, -1));
    transform = matmul(transform, rotate.x(-game.state.player.altitude));
    transform = matmul(transform, rotate.y(-game.state.player.direction));
    const trans = translate(
      -game.state.player.location.x,
      -game.state.player.location.y,
      -game.state.player.location.z);
    transform = matmul(transform, trans);
    Object.getOwnPropertyNames(staticMeshes).forEach((name) => {
      if (staticMeshes[name].vertices.length > 0) {
        staticMeshes[name].render(transform);
      }
    });
    if (game.state.orb.active) {
      transform = matmul(transform, translate(
        game.state.orb.position.x,
        game.state.orb.position.y,
        game.state.orb.position.z));
      transform = matmul(transform, scale(0.05, 0.05, 0.05));
      orbBlockType.render(transform);
    }

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
