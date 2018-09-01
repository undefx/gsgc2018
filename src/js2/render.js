/* jshint esversion: 6 */

// A collection of rendering helpers.

// Concatenates several arrays.
const flatten = (arrays) => {
  const result = [];
  arrays.forEach((a) => {
    a.forEach((b) => {
      result.push(b);
    });
  });
  return result;
};

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

// Adds a new powerup to a static mesh.
const addPowerupToMesh = (mesh, dx, dy, dz, type) => {
  // Vertices
  const c = 0.5;
  const vRUF = [+c, +c, 0];
  const vRDF = [+c, -c, 0];
  const vLUF = [-c, +c, 0];
  const vLDF = [-c, -c, 0];
  flatten([
    vLDF, vRUF, vLUF,
    vLDF, vRDF, vRUF,
  ]).forEach(e => mesh.vertices.push(e));

  // Texture coordinates
  [
    0, 1, 1, 0, 0, 0,
    0, 1, 1, 1, 1, 0,
  ].forEach(e => mesh.texCoords.push(e));

  // Offsets
  const position = [dx, dy, dz];
  flatten([
    position, position, position,
    position, position, position,
  ]).forEach(e => mesh.positions.push(e));

  // Types
  [type, type, type, type, type, type].forEach(e => mesh.types.push(e));
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

// Creates a new powerup mesh renderer.
const newPowerupRenderer = (gl, mesh) => {
  const program = mesh.program;
  const vertexBuffer = uploadBuffer(gl, mesh.vertices);
  const positionBuffer = uploadBuffer(gl, mesh.positions);
  const texCoordBuffer = uploadBuffer(gl, mesh.texCoords);
  const typeBuffer = uploadBuffer(gl, mesh.types);

  const renderer = createRenderer(gl, program);
  renderer.data.uniform.sampler2D.image = mesh.texture;
  renderer.data.uniform.sampler2D.palette = mesh.palette;
  renderer.data.uniform.float.filter = 1;
  renderer.data.attribute.vec3.vtx_pos = vertexBuffer;
  renderer.data.attribute.vec3.mdl_pos = positionBuffer;
  renderer.data.attribute.vec2.texCoord = texCoordBuffer;
  renderer.data.attribute.float.type = typeBuffer;
  const numPoints = mesh.vertices.length / 3;

  const render = (transform, timestamp, x, y, z) => {
    renderer.data.uniform.mat4.transform = transform;
    renderer.data.uniform.vec3.player = [x, y, z];
    renderer.data.uniform.float.time = timestamp;
    renderer.render(numPoints);
  };

  return {
    render: render,
    typeBufferId: typeBuffer,
    typeData: mesh.types,
    stale: false,
  };
};
