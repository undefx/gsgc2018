/* jshint esversion: 6 */

// Stuff that needs to be detangled. This file should eventually go away.

const setup = () => {

  // Player input constants.
  const mouseSensitivity = 0.0015;
  const keyMap = {
    'w': 'forward',
    'a': 'left',
    's': 'backward',
    'd': 'right',
    ' ': 'jumping',
  };

  // Get and initialize GL context.
  const initGL = (canvas) => {
    const options = {alpha: false, antialias : false};
    const gl = canvas.getContext('webgl', options);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);
    return gl;
  };

  const canvas = document.getElementsByTagName('canvas')[0];
  const gl = initGL(canvas);

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
    const size = lines.length;
    return renderToTexture(gl, 192, 256, () => {
      let transform = identity();
      transform = matmul(transform, translate(-0.5, -0.5, 0));
      transform = matmul(transform, scale(1 / 2, 1 / 2, 1));
      transform = matmul(transform, scale(1 / size, -1 / size, 1));
      transform = matmul(transform, translate(1, -1, 0));
      for (let i = 0; i < lines.length; i++) {
        renderString(gl, lines[i], transform);
        transform = matmul(transform, translate(0, -2, 0));
      }
    });
  };

  const game = newGame();
  game.state.renderFuncGenArgs = [canvas, gl, game, paletteTexId, renderString, renderTextGrid];
  game.state.renderFuncGen = getGameRenderer;
  game.goToLevel(1, false, null);

  // Wire up user input.
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
    game.state.levelStatus = isLocked ? null : 'click to play';
    if (!game.state.input.pointerLocked && isLocked) {
      game.state.input.pointerLocked = document.pointerLockElement === canvas;
      if (game.state.input.pointerLocked) {
        //requestAnimationFrame(game.state.renderFunc);
        audio.playNote(440);
      }
    } else if (!isLocked) {
      game.state.input.pointerLocked = false;
      audio.playNote(415);
    }
  });
  setInterval(audio.playTheme, 60000);
  game.state.levelStatus = 'click to play';
  requestAnimationFrame(game.state.renderFunc);
};

const getGameRenderer = (canvas, gl, game, paletteTexId, renderString, renderTextGrid) => {
  const levelString = '' + game.state.level;
  const enterBlockTextureId = renderTextGrid(gl, [
    '+              +','',
    'level:          '.slice(0, 16 - levelString.length) + levelString,'',
    'move:    w/a/s/d','',
    'jump:      space','',
    'shoot:     click','','',
    '   objective:',
    ' get out alive','',
    '   good luck!',
    '+              +',
  ]);
  const exitBlockTextureId = renderTextGrid(gl, [
    '+   +',
    ' got ',
    ' out ',
    'alive',
    '+   +',
  ]);

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

  // Do the same for each powerup
  const powerupProgram = newProgram(gl, 'powerup');
  const newPowerupType = (textureId) => ({
    program: powerupProgram,
    palette: paletteTexId,
    texture: textureId,
    vertices: [],
    texCoords: [],
    positions: [],
    types: [],
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
  for(var b = 0; b < 3; b++) {
	  baddies.push(newBaddie(gl, baddieMesh));
  }

  // Health bar
  const healthFrontTextureId = uploadTexture(gl, solidTexture(0.5, 0.5, 0.7));
  const healthBackTextureId = uploadTexture(gl, solidTexture(0.7, 0.0, 0.0));
  const renderHealthFront = newQuad(gl, paletteTexId, healthFrontTextureId, 0, 1);
  const renderHealthBack = newQuad(gl, paletteTexId, healthBackTextureId, 0, 1);

  // Ammo bar
  const ammoFrontTextureId = orbTexture;
  const ammoBackTextureId = uploadTexture(gl, solidTexture(0.5, 0.5, 0.5));
  const renderAmmoFront = newQuad(gl, paletteTexId, ammoFrontTextureId, 0, 1);
  const renderAmmoBack = newQuad(gl, paletteTexId, ammoBackTextureId, 0, 1);

  // Crosshairs
  const crosshairTextureId = uploadTexture(gl, solidTexture(0.8, 0.8, 0.8));
  const crosshairQuad = newQuad(gl, paletteTexId, crosshairTextureId, 0, 1);

  const staticMeshes = {
    // Ceiling
    1: newBlockType(uploadTexture(gl, randomTexture(16, 0.7, 0, 0))),
    // Ground
    2: newBlockType(uploadTexture(gl, randomTexture(16, 0, 0.7, 0))),
    // Floors
    3: newBlockType(uploadTexture(gl, randomTexture(8, 0.5, 0.5, 0.3))),
    // Walls
    4: newBlockType(uploadTexture(gl, randomTexture(8, 0.7, 0.7, 0.7))),
    // Level indicator block
    5: newBlockType(enterBlockTextureId),
    // 6, 7, 8, 9 are reserved
    // Exit block
    10: newBlockType(exitBlockTextureId),
    // Ramps (N, E, S, W)
    'ramps': rampBlockType,
  };
  const powerupColors = solidTextureStack([0.8, 0.4, 0.1], [0.5, 0.5, 0.7], [1, 1, 1]);
  const powerupTextureId = uploadTexture(gl, powerupColors);
  const powerupMesh = newPowerupType(powerupTextureId);
  for (let layer = 0; layer < map.blocks.length; layer++) {
    for (let row = 0; row < map.blocks[0].length; row++) {
      for (let col = 0; col < map.blocks[0][0].length; col++) {
        let idx = map.blocks[layer][row][col];
        const isRamp = idx >= 6 && idx <= 9;
        if (staticMeshes.hasOwnProperty(idx) || isRamp) {
          if (isRamp) {
            const direction = idx - 6;
            addRampToMesh(staticMeshes.ramps, direction, col, layer, row);
          } else {
            addBlockToMesh(staticMeshes[idx], col, layer, row);
          }
        }
        const powerup = map.blockInfo[layer][row][col].powerup;
        addPowerupToMesh(powerupMesh, col, layer, row, powerup);
      }
    }
  }
  Object.getOwnPropertyNames(staticMeshes).forEach((name) => {
    staticMeshes[name].render = newMeshRenderer(gl, staticMeshes[name]);
  });
  powerupMesh.renderer = newPowerupRenderer(gl, powerupMesh);
  game.setPowerupRenderer(powerupMesh.renderer);

  let lastTimestamp = 0;
  const render = (timestamp) => {
    //if (game.state.input.pointerLocked) {
    requestAnimationFrame(game.state.renderFunc);
    //}
    //telemetry.blend('frame_lag', timestamp - lastTimestamp);
    lastTimestamp = timestamp;

    //let time0;
    //time0 = performance.now();
    if (game.state.levelStatus == null) {
      game.update(timestamp);
    }
    //telemetry.blend('update_game', performance.now() - time0);

    //time0 = performance.now();
    if (game.state.levelStatus == null) {
    	baddies.forEach((b)=>{
    		b.update(timestamp, game.state.player.location);
    	});
    }
    //telemetry.blend('update_baddies', performance.now() - time0);

    //time0 = performance.now();
  	baddies.forEach((bad) => {
      const size = bad.hitBox;
      game.state.orbs.forEach((orb) => {
        const dx = bad.location.x - orb.position.x;
        const dy = bad.location.y - orb.position.y;
        const dz = bad.location.z - orb.position.z;
        if (Math.abs(dx) < size && Math.abs(dy) < size && Math.abs(dz) < size) {
          // Nice shot.
          orb.explode(game.state.emitterSpawns);
          bad.health -= 1;
          if (bad.health <= 0) {
            bad.explode(game.state.emitterSpawns);
          } else {
            audio.playNote(392);
          }
        }
      });
  	});
    baddies.forEach((bad) => {
      if (bad.health <= 0) {
        return;
      }
      const size = bad.hitBox + game.state.player.hitBox;
      const dx = bad.location.x - game.state.player.location.x;
      const dy = bad.location.y - game.state.player.location.y;
      const dz = bad.location.z - game.state.player.location.z;
      if (Math.abs(dx) < size && Math.abs(dy) < size && Math.abs(dz) < size) {
        // Ouch.
        game.doDamage(1);
        bad.explode(game.state.emitterSpawns);
      }
  	});
    for (let i = 0; i < baddies.length; i++) {
      if (baddies[i].health <= 0) {
        baddies.splice(i--, 1);
      }
    }
    //telemetry.blend('update_attacks', performance.now() - time0);

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 3d: game world
    gl.enable(gl.DEPTH_TEST);

    //time0 = performance.now();
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
    //telemetry.blend('render_static', performance.now() - time0);

    //time0 = performance.now();
    if (powerupMesh.renderer.stale != false) {
      const offset = powerupMesh.renderer.stale;
      powerupMesh.renderer.stale = false;
      gl.bindBuffer(gl.ARRAY_BUFFER, powerupMesh.renderer.typeBufferId);
      const data = powerupMesh.renderer.typeData.slice(offset, offset + 6);
      gl.bufferSubData(gl.ARRAY_BUFFER, offset * 4, new Float32Array(data));
    }
    const ploc = game.state.player.location;
    powerupMesh.renderer.render(transform, timestamp * 0.001, ploc.x, ploc.y, ploc.z);
    //telemetry.blend('render_powerup', performance.now() - time0);

    //time0 = performance.now();
    baddies.forEach((b)=>{
  		let bt;
  		bt = matmul(transform, translate(
  			b.location.x,
  			b.location.y,
  			b.location.z));
  		bt = matmul(bt, scale(0.5, 0.5, 0.5));
  		b.render(bt);
  	});
    //telemetry.blend('render_baddies', performance.now() - time0);

    //time0 = performance.now();
    game.state.orbs.forEach((orb) => {
      let orbTransform = matmul(transform, translate(
        orb.position.x,
        orb.position.y,
        orb.position.z));
      orbTransform = matmul(orbTransform, scale(0.05, 0.05, 0.05));
      orbBlockType.render(orbTransform);
    });
    //telemetry.blend('render_orb', performance.now() - time0);

    //time0 = performance.now();
    if (game.state.emitterSpawns.length > 0) {
      game.state.emitterSpawns.forEach((xyzs) => {
        game.state.emitters.push(spawnEmitter(baseEmitter, ...xyzs));
      });
      game.state.emitterSpawns = [];
    }
    game.state.emitters.forEach((emitter) => {
      emitter.render(transform, timestamp, game);
    });
    //telemetry.blend('render_emitter', performance.now() - time0);


    // 2d: user interface
    gl.disable(gl.DEPTH_TEST);

    //// FPS
    //if (DEBUG) {
    //  //time0 = performance.now();
    //  transform = identity();
    //  transform = matmul(transform, translate(-1, 1, 0));
    //  transform = matmul(transform, scale(6 / 360, 24 / 400, 1));
    //  transform = matmul(transform, translate(1, -1, 0));
    //  const fps = 1 / (telemetry.get('frame_lag', 1000) * 0.001);
    //  renderString(gl, 'fps: ' + Math.round(fps), transform);
    //  //telemetry.blend('render_fps', performance.now() - time0);
    //}

    // Health bar
    //time0 = performance.now();
    transform = identity();
    transform = matmul(transform, scale(1 / 2, 1 / 20, 1));
    transform = matmul(transform, translate(0, -19, 0));
    renderHealthBack(gl, transform);
    let fraction = game.state.player.health / game.state.limits.health;
    transform = identity();
    transform = matmul(transform, translate(-1 / 2, 0, 0));
    transform = matmul(transform, scale(fraction / 2, 1 / 20, 1));
    transform = matmul(transform, translate(1, -19, 0));
    renderHealthFront(gl, transform);
    //telemetry.blend('render_health', performance.now() - time0);

    // Ammo bar
    //time0 = performance.now();
    transform = identity();
    transform = matmul(transform, scale(1 / 2, 1 / 20, 1));
    transform = matmul(transform, translate(0, -17, 0));
    renderAmmoBack(gl, transform);
    fraction = game.state.player.ammo / game.state.limits.ammo;
    transform = identity();
    transform = matmul(transform, translate(-1 / 2, 0, 0));
    transform = matmul(transform, scale(fraction / 2, 1 / 20, 1));
    transform = matmul(transform, translate(1, -17, 0));
    renderAmmoFront(gl, transform);
    //telemetry.blend('render_ammo', performance.now() - time0);

    // Crosshairs
    //time0 = performance.now();
    for (let i = 0; i < 5; i++) {
      transform = identity();
      transform = matmul(transform, translate(-1 / 360, 0, 0));
      transform = matmul(transform, rotate.z(i * Math.PI * 2 / 3));
      transform = matmul(transform, scale(1 / 360, 1 / 100, 1));
      transform = matmul(transform, translate(0, 2.2, 0));
      crosshairQuad(gl, transform);
    }
    //telemetry.blend('render_cross', performance.now() - time0);

    // Level status
    //time0 = performance.now();
    if (game.state.levelStatus != null) {
      const n = game.state.levelStatus.length;
      transform = identity();
      transform = matmul(transform, translate(-n / 30, 0, 0));
      transform = matmul(transform, scale(12 / 360, 48 / 400, 1));
      transform = matmul(transform, translate(1, 0, 0));
      renderString(gl, game.state.levelStatus, transform);
    }
    //telemetry.blend('render_ls', performance.now() - time0);

    //// Telemetry debugging
    //if (DEBUG) {
    //  //telemetry.blend('log', 0);
    //  if (telemetry.get('log') < 1) {
    //    //telemetry.log();
    //    //telemetry.add('log', 200);
    //  }
    //}
  };

  return render;
};
