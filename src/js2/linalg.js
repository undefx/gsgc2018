/* jshint esversion: 6 */

// A collection of linear algebra utilities. Note that all matrices are 4x4 and
// are represented by an array of length 16 in column-major order. That is, the
// first 4 elements belong to the first column, the next 4 elements to the next
// column, and so on.

// Returns the product of two 4x4 matrices.
const matmul = (A, B) => {
  const C = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      let sum = 0;
      for (let i = 0; i < 4; i++) {
        sum += A[i * 4 + col] * B[row * 4 + i];
      }
      C.push(sum);
    }
  }
  return C;
};

// Returns an identity matrix.
const identity = () => {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ];
};

// Returns a scaling matrix.
const scale = (x, y, z) => {
  return [
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, z, 0,
    0, 0, 0, 1,
  ];
};

// Returns a translation matrix.
const translate = (x, y, z) => {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1,
  ];
};

// Returns an object containing methods for generating rotation matrices for
// various axes.
const rotate = {

  // Returns a matrix for rotation about the x-axis.
  x: (x) => {
    const c = Math.cos(x), s = Math.sin(x);
    return [
      1, 0, 0, 0,
      0, c, -s, 0,
      0, s, c, 0,
      0, 0, 0, 1,
    ];
  },

  // Returns a matrix for rotation about the y-axis.
  y: (y) => {
    const c = Math.cos(y), s = Math.sin(y);
    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },

  // Returns a matrix for rotation about the z-axis.
  z: (z) => {
    const c = Math.cos(z), s = Math.sin(z);
    return [
      c, -s, 0, 0,
      s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
  },
};

// Returns a perspective projection matrix.
const perspective = (aspect, fov) => {
  const xMul = (aspect > 1) ? 1 : 1 / aspect;
  const yMul = (aspect > 1) ? aspect : 1;
  const invTanHalf = 1 / Math.tan(fov / 2);
  return [
    xMul * invTanHalf, 0, 0, 0,
    0, yMul * invTanHalf, 0, 0,
    0, 0, 0.1, 1,
    0, 0, 0, 1,
  ];
};
