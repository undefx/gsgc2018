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

// A helper object that automates the rendering process. Only supports a subset
// of GLSL types.
const createRenderer = (gl, program) => {

  // The supported GLSL types and their values.
  const data = {
    uniform: {
      sampler2D: {},
      float: {},
      vec3: {},
      mat4: {},
    },
    attribute: {
      float: {},
      vec2: {},
      vec3: {},
    },
  };

  // A rendering function that activates the program, uploads the data, and
  // renders the geometry.
  const render = (numPoints) => {
    gl.useProgram(program.program);

    let textureIndex = 0;
    Object.getOwnPropertyNames(data.uniform.sampler2D).forEach((name) => {
      const textureId = data.uniform.sampler2D[name];
      const id = program.getUniform(name);
      gl.activeTexture(gl.TEXTURE0 + textureIndex);
      gl.bindTexture(gl.TEXTURE_2D, textureId);
      gl.uniform1i(id, textureIndex);
      textureIndex++;
    });

    Object.getOwnPropertyNames(data.uniform.float).forEach((name) => {
      const value = data.uniform.float[name];
      const id = program.getUniform(name);
      gl.uniform1f(id, value);
    });

    Object.getOwnPropertyNames(data.uniform.vec3).forEach((name) => {
      const values = data.uniform.vec3[name];
      const id = program.getUniform(name);
      gl.uniform3fv(id, new Float32Array(values));
    });

    Object.getOwnPropertyNames(data.uniform.mat4).forEach((name) => {
      const values = data.uniform.mat4[name];
      const id = program.getUniform(name);
      gl.uniformMatrix4fv(id, false, new Float32Array(values));
    });

    Object.getOwnPropertyNames(data.attribute.float).forEach((name) => {
      const buffer = data.attribute.float[name];
      const id = program.getAttribute(name);
      gl.enableVertexAttribArray(id);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(id, 1, gl.FLOAT, false, 0, 0);
    });

    Object.getOwnPropertyNames(data.attribute.vec2).forEach((name) => {
      const buffer = data.attribute.vec2[name];
      const id = program.getAttribute(name);
      gl.enableVertexAttribArray(id);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(id, 2, gl.FLOAT, false, 0, 0);
    });

    Object.getOwnPropertyNames(data.attribute.vec3).forEach((name) => {
      const buffer = data.attribute.vec3[name];
      const id = program.getAttribute(name);
      gl.enableVertexAttribArray(id);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(id, 3, gl.FLOAT, false, 0, 0);
    });

    gl.drawArrays(gl.TRIANGLES, 0, numPoints);
  };

  // The helper object consists of a data store and the rendering function.
  return {
    data: data,
    render: render,
  };
};

// Creates a texture, renders to it, and returns it.
const renderToTexture = (gl, width, height, render) => {
  const textureId = gl.createTexture();
  const frameBufferId = gl.createFramebuffer();

  gl.bindTexture(gl.TEXTURE_2D, textureId);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBufferId);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureId, 0);

  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBufferId);
  gl.viewport(0, 0, width, height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.disable(gl.CULL_FACE);
  render();
  gl.enable(gl.CULL_FACE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(frameBufferId);

  return textureId;
};
