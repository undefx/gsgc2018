/* jshint esversion: 6 */

// A central repository for GLSL shader code. Each object within `shaders`
// defines as a pair of shader code strings named `vertex` and `fragment`.

const shaders = {

  // The shaders used by blocks (cubes) and ramps.
  block: {
    vertex: `
      uniform mat4 u_transform;
      attribute vec3 a_position;
      attribute vec2 a_texCoord;
      attribute vec3 a_normal;
      varying vec3 v_position;
      varying vec2 v_texCoord;
      varying vec3 v_normal;

      void main() {
        v_position = (u_transform * vec4(a_position, 1)).xyz;
        v_normal = (u_transform * vec4(a_normal, 1)).xyz;
        v_texCoord = a_texCoord;
        gl_Position = u_transform * vec4(a_position, 1);
      }
    `,
    fragment: `
      precision mediump float;

      uniform sampler2D u_palette;
      uniform sampler2D u_image;
      uniform float u_filter;
      uniform vec2 u_texCoordOffset;
      varying vec3 v_position;
      varying vec2 v_texCoord;
      varying vec3 v_normal;

      void main() {
        float n = 3.0;
        vec2 texCoord = fract(v_texCoord + u_texCoordOffset);
        vec3 rgb = texture2D(u_image, texCoord).rgb;
        rgb *= 1.0 - 0.75 * min(max(0.0, v_position.z), 1.0);
        //rgb.r = clamp(v_normal.z / length(v_normal), 0.0, 1.0);
        vec3 xyz = floor(rgb * (n - 0.001));
        float idx = (xyz.x * n * n + xyz.y * n + xyz.z + 0.5) / (n * n * n);
        vec3 rgb2 = texture2D(u_palette, vec2(idx, 0.5)).rgb;
        gl_FragColor = vec4(rgb2 * u_filter + (1.0 - u_filter) * rgb, 1);
      }
    `,
  }
};
