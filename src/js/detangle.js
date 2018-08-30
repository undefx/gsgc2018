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
const addBlockToMesh = (mesh, dx, dy, dz, size) => {
  // vertices
  var s = size || 1;
  const vRUF = [dx + s, dy + s, dz];
  const vRUB = [dx + s, dy + s, dz + s];
  const vRDF = [dx + s, dy, dz];
  const vRDB = [dx + s, dy, dz + s];
  const vLUF = [dx, dy + s, dz];
  const vLUB = [dx, dy + s, dz + s];
  const vLDF = [dx, dy, dz];
  const vLDB = [dx, dy, dz + s];
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
const keyMap = {
  'w': 'forward',
  'a': 'left',
  's': 'backward',
  'd': 'right',
  ' ': 'jumping',
};

const telemetry = newTelemetry();


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

  const renderTextGrid = (gl, lines) => {
    return renderToTexture(gl, 192, 256, () => {
      let transform = identity();
      transform = matmul(transform, translate(-0.5, -0.5, 0));
      transform = matmul(transform, scale(1 / 32, -1 / 32, 1));
      transform = matmul(transform, translate(1, -1, 0));
      for (let i = 0; i < lines.length; i++) {
        renderString(gl, lines[i], transform);
        transform = matmul(transform, translate(0, -2, 0));
      }
    });
  };

  const game = newGame();

  const levelString = '' + game.state.level;
  const renderedTextureId = renderTextGrid(gl, [
    '+              +','',
    'level:          '.slice(0, 16 - levelString.length) + levelString,'',
    'move:    w/a/s/d','',
    'jump:      space','',
    'shoot:     click','','',
    '   objective:',
    ' get out alive','',
    '   good luck!','',
    '+              +',
  ]);

  canvas.addEventListener('keydown', (e) => {
    if (keyMap.hasOwnProperty(e.key)) {
      game.state.input[keyMap[e.key]] = true;
    }
  });
  canvas.addEventListener('keyup', (e) => {
    if (keyMap.hasOwnProperty(e.key)) {
      game.state.input[keyMap[e.key]] = false;
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
  canvas.addEventListener('mousemove', (e) => {
    if (game.state.input.pointerLocked) {
      game.state.player.direction += e.movementX * mouseSensitivity;
      game.state.player.altitude -= e.movementY * mouseSensitivity;
      game.state.player.altitude = Math.min(game.state.player.altitude, +Math.PI / 2);
      game.state.player.altitude = Math.max(game.state.player.altitude, -Math.PI / 2);
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

  // Build a static mesh for each block type.
  const blockProgram = newProgram(gl, 'block');
  const newBlockType = (textureId) => ({
    program: blockProgram,
    palette: paletteTexId,
    texture: textureId,
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

  const baseEmitter = createEmitter(gl, paletteTexId);

  const baddieTexture = uploadTexture(gl, solidTexture(0.9, 0.2, 0.2));//lance
  var baddieMesh = newBlockType(baddieTexture);
  var baddies = [];
  for(var b = 0; b < 10; b++)
	baddies.push(newBaddie(gl, baddieMesh));

  const staticMeshes = {
    // Ceiling
    1: newBlockType(uploadTexture(gl, randomTexture(8, 0.7, 0, 0))),
    // Ground
    2: newBlockType(uploadTexture(gl, randomTexture(8, 0, 0.7, 0))),
    // Floors
    3: newBlockType(uploadTexture(gl, randomTexture(8, 0.5, 0.5, 0.3))),
    // Walls
    4: newBlockType(uploadTexture(gl, randomTexture(8, 0.7, 0.7, 0.7))),
    // Level indicator block
    5: newBlockType(renderedTextureId),
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

  let lastTimestamp = 0;
  const render = (timestamp) => {
    if (game.state.input.pointerLocked) {
      requestAnimationFrame(render);
    }
    telemetry.blend('frame_lag', timestamp - lastTimestamp);
    lastTimestamp = timestamp;

    let time0 = performance.now();
    game.update(timestamp);
    telemetry.blend('update_game', performance.now() - time0);

    time0 = performance.now();
  	baddies.forEach((b)=>{
  		b.update(timestamp, game.state.player.location);
  	});
    telemetry.blend('update_baddies', performance.now() - time0);

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 3d: game world
    gl.enable(gl.DEPTH_TEST);

    time0 = performance.now();
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
    telemetry.blend('render_static', performance.now() - time0);

    time0 = performance.now();
    baddies.forEach((b)=>{
  		let bt;
  		bt = matmul(transform, translate(
  			b.location.x,
  			b.location.y,
  			b.location.z));
  		bt = matmul(bt, scale(0.5, 0.5, 0.5));
  		b.render(bt);
  	});
    telemetry.blend('render_baddies', performance.now() - time0);

    time0 = performance.now();
    game.state.orbs.forEach((orb) => {
      let orbTransform = matmul(transform, translate(
        orb.position.x,
        orb.position.y,
        orb.position.z));
      orbTransform = matmul(orbTransform, scale(0.05, 0.05, 0.05));
      orbBlockType.render(orbTransform);
    });
    telemetry.blend('render_orb', performance.now() - time0);

    time0 = performance.now();
    if (game.state.emitterSpawns.length > 0) {
      game.state.emitterSpawns.forEach((xyz) => {
        game.state.emitters.push(spawnEmitter(baseEmitter, ...xyz));
      });
      game.state.emitterSpawns = [];
    }
    game.state.emitters.forEach((emitter) => {
      emitter.render(transform, timestamp, game);
    });
    telemetry.blend('render_emitter', performance.now() - time0);


    // 2d: user interface
    gl.disable(gl.DEPTH_TEST);

    time0 = performance.now();
    transform = identity();
    transform = matmul(transform, translate(-1, 1, 0));
    transform = matmul(transform, scale(6 / 360, 24 / 400, 1));
    transform = matmul(transform, translate(1, -1, 0));
    const fps = 1 / (telemetry.get('frame_lag', 1000) * 0.001);
    renderString(gl, 'fps: ' + Math.round(fps), transform);
    telemetry.blend('render_fps', performance.now() - time0);

    time0 = performance.now();
    transform = identity();
    const solidBlueTextureId = uploadTexture(gl, solidTexture(0.5, 0.5, 0.7));
    const solidRedTextureId = uploadTexture(gl, solidTexture(1, 0, 0));
    const healthBar = newQuad(gl, paletteTexId, solidBlueTextureId, 0, 1);
    const healthMissing = newQuad(gl, paletteTexId, solidRedTextureId, 0, 1);
    transform = identity();
    transform = matmul(transform, scale(1 / 2, 1 / 20, 1));
    transform = matmul(transform, translate(0, -19, 0));
    healthMissing(gl, transform);
    const healthBarWidth = game.state.player.health / 5;
    const missing = 5 - game.state.player.health;
    transform = identity();
    transform = matmul(transform, translate(missing * -0.1, 0, 0));
    transform = matmul(transform, scale(healthBarWidth / 2, 1 / 20, 1));
    transform = matmul(transform, translate(0, -19, 0));
    healthBar(gl, transform);
    telemetry.blend('render_health', performance.now() - time0);

    telemetry.blend('log', 0);
    if (telemetry.get('log') < 1) {
      // TODO: comment out in final version
      telemetry.log();
      telemetry.add('log', 100);
    }
  };

  requestAnimationFrame(render);
};
