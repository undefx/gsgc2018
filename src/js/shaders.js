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
      varying vec3 v_position;
      varying vec2 v_texCoord;

      void main() {
        v_position = (u_transform * vec4(a_position, 1)).xyz;
        v_texCoord = a_texCoord;
        gl_Position = u_transform * vec4(a_position, 1);
      }
    `,
    fragment: `
      precision mediump float;

      uniform sampler2D u_palette;
      uniform sampler2D u_image;
      uniform float u_filter;
      varying vec3 v_position;
      varying vec2 v_texCoord;

      void main() {
        float n = 3.0;
        vec3 rgb = texture2D(u_image, v_texCoord).rgb;
        rgb *= 1.0 - 0.75 * min(max(0.0, v_position.z), 1.0);
        vec3 xyz = floor(rgb * (n - 0.001));
        float idx = (xyz.x * n * n + xyz.y * n + xyz.z + 0.5) / (n * n * n);
        vec3 rgb2 = texture2D(u_palette, vec2(idx, 0.5)).rgb;
        gl_FragColor = vec4(rgb2 * u_filter + (1.0 - u_filter) * rgb, 1);
      }
    `,
  },

  // The shaders used by interface quads.
  quad: {
    vertex: `
      uniform mat4 u_transform;
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;

      void main() {
        v_texCoord = a_texCoord;
        gl_Position = u_transform * vec4(a_position, 0, 1);
      }
    `,
    fragment: `
      precision mediump float;

      uniform sampler2D u_palette;
      uniform sampler2D u_image;
      uniform float u_filter;
      uniform mat4 u_texTransform;
      varying vec2 v_texCoord;

      void main() {
        float n = 3.0;
        vec4 tc = u_texTransform * vec4(v_texCoord, 0, 1);
        vec3 rgb = texture2D(u_image, tc.xy).rgb;
        vec3 xyz = floor(rgb * (n - 0.001));
        float idx = (xyz.x * n * n + xyz.y * n + xyz.z + 0.5) / (n * n * n);
        vec3 rgb2 = texture2D(u_palette, vec2(idx, 0.5)).rgb;
        gl_FragColor = vec4(rgb2 * u_filter + (1.0 - u_filter) * rgb, 1);
      }
    `,
  },

  // The shaders used by particle effects.
  particle: {
    vertex: `
      uniform mat4 u_transform;
      uniform vec3 u_delta;
      uniform float u_age;
      attribute vec3 a_position;
      attribute float a_entropy;
      varying float v_entropy;

      void main() {
        v_entropy = a_entropy;
        float ff = u_age * 6.28 * a_entropy * 4.0 - 2.0;
        float s = sin(ff);
        float c = cos(ff);
        float d = -c;
        float angle1 = atan(u_delta.z, u_delta.x);
        float angle2 = atan(-length(u_delta.xz), u_delta.y);
        float a = sin(-angle1);
        float b = cos(-angle1);
        float e = -b;
        float f = sin(-angle2);
        float g = cos(-angle2);
        float h = -g;
        mat4 rotateX = mat4(
          1, 0, 0, 0,
          0, f, g, 0,
          0, h, f, 0,
          0, 0, 0, 1
        );
        mat4 rotateY = mat4(
          a, 0, b, 0,
          0, 1, 0, 0,
          e, 0, a, 0,
          0, 0, 0, 1
        );
        mat4 rotateZ = mat4(
          s, c, 0, 0,
          d, s, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        );
        float invAge = 1.0 / (1.0 + u_age * u_age * 9.0);
        mat4 scale = mat4(
          invAge, 0, 0, 0,
          0, invAge, 0, 0,
          0, 0, invAge, 0,
          0, 0, 0, 1
        );
        float angle3 = 6.28 * fract(a_entropy * 7.0);
        float angle4 = 3.14 * fract(a_entropy * 19.0);
        a = sin(angle3) * sin(angle4);
        b = cos(angle3) * sin(angle4);
        c = cos(angle4);
        vec4 pos = scale * rotateY * rotateX * rotateZ * vec4(a_position, 1);
        float velocity = (0.5 * a_entropy + 0.5) * 6.0 * pow(u_age, 0.5);
        pos.x += velocity * a;
        pos.z += velocity * b;
        pos.y += velocity * c - pow(u_age * 1.25, 2.0);
        gl_Position = u_transform * pos;
      }
    `,
    fragment: `
      precision mediump float;

      uniform sampler2D u_palette;
      uniform float u_filter;
      varying float v_entropy;

      void main() {
        float n = 3.0;
        vec3 rgb = vec3(fract(v_entropy * 16.0), fract(v_entropy * 256.0), fract(v_entropy * 4096.0));
        vec3 xyz = floor(rgb * (n - 0.001));
        float idx = (xyz.x * n * n + xyz.y * n + xyz.z + 0.5) / (n * n * n);
        vec3 rgb2 = texture2D(u_palette, vec2(idx, 0.5)).rgb;
        gl_FragColor = vec4(rgb2 * u_filter + (1.0 - u_filter) * rgb, 1);
      }
    `,
  },
};
