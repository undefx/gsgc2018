/* jshint esversion: 6 */

// A collection of WebGL-related helper functions.

// Creates and compiles a shader object.
const createShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
  }
  return shader;
};

// Creates and links a shader program.
const createProgram = (gl, vertexShader, fragmentShader) => {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
  }
  return program;
};

// Returns a helper object that looks up and caches the location of shader
// program uniforms and attributes.
const analyzeProgram = (gl, program) => {
  const info = {program: program, _attributes: {}, _uniforms: {}};
  info.getAttribute = (name) => {
    if (!info._attributes.hasOwnProperty(name)) {
      info._attributes[name] = gl.getAttribLocation(program, `a_${name}`);
    }
    return info._attributes[name];
  };
  info.getUniform = (name) => {
    if (!info._uniforms.hasOwnProperty(name)) {
      info._uniforms[name] = gl.getUniformLocation(program, `u_${name}`);
    }
    return info._uniforms[name];
  };
  return info;
};

// Compiles shaders with the given name, creates a shader program, and returns
// a helper object for retrieving program uniforms and attributes.
const newProgram = (gl, name) => {
  const vSrc = shaders[name].vertex;
  const fSrc = shaders[name].fragment;
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vSrc);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fSrc);
  const program = createProgram(gl, vertexShader, fragmentShader);
  return analyzeProgram(gl, program);
};

// Creates a buffer, uploads data (an array of floats) to the buffer, and
// returns the buffer.
const uploadBuffer = (gl, data) => {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  return buffer;
};

// Creates a texture, uploads data (e.g. a canvas or image element) to the
// texture, and returns the texture.
const uploadTexture = (gl, data) => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, data);
  return texture;
};
