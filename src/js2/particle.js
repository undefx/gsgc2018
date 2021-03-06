/* jshint esversion: 6 */

// A bare-bones particle effect system.

const createEmitter = (gl, paletteTexId) => {
  const turn = -Math.PI * 2 / 3;
  const getPoint = (i) =>
    [0.5 * Math.sin(turn * i), 0.5 *  Math.cos(turn * i), 0];
  const vertices = [];
  const entropy = [];

  const extend = (arr, values) => values.forEach(v => arr.push(v));

  for (let i = 0; i < 50; i++) {
    extend(vertices, flatten([getPoint(0), getPoint(1), getPoint(2)]));
    const e = Math.random();
    extend(entropy, [e, e, e]);
  }

  const program = newProgram(gl, 'particle');
  const vertexBuffer = uploadBuffer(gl, vertices);
  const entropyBuffer = uploadBuffer(gl, entropy);
  const renderer = createRenderer(gl, program);
  renderer.data.uniform.sampler2D.palette = paletteTexId;
  renderer.data.uniform.float.filter = 1;
  renderer.data.attribute.vec3.position = vertexBuffer;
  renderer.data.attribute.float.entropy = entropyBuffer;

  const numPoints = vertices.length / 3;
  const render = () => {
    renderer.render(numPoints);
  };

  return {
    renderer: renderer,
    render: render,
  };
};

const spawnEmitter = (emitter, x, y, z, size) => {
  let model = identity();
  model = matmul(model, translate(x, y, z));
  model = matmul(model, scale(1 / 8, 1 / 8, 1 / 8));

  const state = {
    age: 0,
  };

  const nonce = Math.random();

  const render = (transform, timestamp, game) => {
    const delta = [
      game.state.player.location.x - x,
      game.state.player.location.y - y,
      game.state.player.location.z - z,
    ];
    emitter.renderer.data.uniform.mat4.transform = matmul(transform, model);
    emitter.renderer.data.uniform.vec3.delta = delta;
    emitter.renderer.data.uniform.float.age = state.age;
    emitter.renderer.data.uniform.float.size = size;
    emitter.renderer.data.uniform.float.nonce = nonce;
    emitter.render();
  };

  return {
    render: render,
    state: state,
  };
};
