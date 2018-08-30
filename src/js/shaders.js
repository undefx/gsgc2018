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
      uniform float u_size;
      uniform float u_nonce;
      attribute vec3 a_position;
      attribute float a_entropy;
      varying float v_entropy;

      void main() {
        float entropy = fract(a_entropy + u_nonce);
        v_entropy = entropy;
        float velocity = (0.5 * entropy + 0.5) * 6.0 * pow(u_age, 0.5);
        float angle0 = u_age * 6.28 * 4.0 * (entropy - 0.5);
        float angle1 = -atan(u_delta.z, u_delta.x);
        float angle2 = -atan(-length(u_delta.xz), u_delta.y);
        float angle3 = 6.28 * fract(entropy * 256.0);
        float angle4 = 3.14 * fract(entropy * 65535.0);
        vec2 sc = vec2(sin(angle0), cos(angle0));
        vec2 ab = vec2(sin(angle1), cos(angle1));
        vec2 fg = vec2(sin(angle2), cos(angle2));
        vec2 st = vec2(sin(angle3), cos(angle3));
        vec2 uv = vec2(sin(angle4), cos(angle4));
        mat4 rotateX = mat4(
          1, 0, 0, 0,
          0, fg.x, fg.y, 0,
          0, -fg.y, fg.x, 0,
          0, 0, 0, 1
        );
        mat4 rotateY = mat4(
          ab.x, 0, ab.y, 0,
          0, 1, 0, 0,
          -ab.y, 0, ab.x, 0,
          0, 0, 0, 1
        );
        mat4 rotateZ = mat4(
          sc.x, sc.y, 0, 0,
          -sc.y, sc.x, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        );
        float invAge = u_size / (1.0 + u_age * u_age * 9.0);
        mat4 scale = mat4(
          invAge, 0, 0, 0,
          0, invAge, 0, 0,
          0, 0, invAge, 0,
          0, 0, 0, 1
        );
        vec4 abc = vec4(st.x * uv.x, st.y * uv.x, uv.y, 0);
        vec4 pos = scale * rotateY * rotateX * rotateZ * vec4(a_position, 1) + velocity * abc;
        pos.y -= pow(u_age * 1.25, 2.0);
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
        rgb.g *= rgb.r;
        rgb.b *= rgb.g;
        vec3 xyz = floor(rgb * (n - 0.001));
        float idx = (xyz.x * n * n + xyz.y * n + xyz.z + 0.5) / (n * n * n);
        vec3 rgb2 = texture2D(u_palette, vec2(idx, 0.5)).rgb;
        gl_FragColor = vec4(rgb2 * u_filter + (1.0 - u_filter) * rgb, 1);
      }
    `,
  },
};
