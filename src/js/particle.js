/* jshint esversion: 6 */

// A bare-bones particle effect system.

const newEmitter = (gl, paletteTexId, x, y, z) => {
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
  renderer.data.uniform.vec3.color = [1, 1, 1];
  renderer.data.attribute.vec3.position = vertexBuffer;
  renderer.data.attribute.float.entropy = entropyBuffer;

  let model = identity();
  // emitter position
  model = matmul(model, translate(x, y, z));
  model = matmul(model, scale(1 / 8, 1 / 8, 1 / 8));

  const numPoints = vertices.length / 3;
  let t0 = null;
  return (transform, timestamp, game) => {
    const delta = [
      game.state.player.location.x - x,
      game.state.player.location.y - y,
      game.state.player.location.z - z,
    ];
    if (t0 == null) {
      t0 = timestamp;
    }
    let age = (timestamp - t0) / 500;
    if (age > 1) {
      return false;
    }
    renderer.data.uniform.mat4.transform = matmul(transform, model);
    renderer.data.uniform.vec3.delta = delta;
    renderer.data.uniform.float.time_v = timestamp * 0.001;
    renderer.data.uniform.float.time_f = timestamp * 0.001;
    renderer.data.uniform.float.age = age;
    renderer.render(numPoints);
    return true;
  };
};
