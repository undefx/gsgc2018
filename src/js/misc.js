/* jshint esversion: 6 */

// Miscellaneous functions. All code here is either temporary or experimental
// and should be moved to a better home at earliest convenience.

const byte = (x) => {
  return Math.floor(x * 255);
};

const getRgb2 = (r, g, b) => {
  return [byte(r), byte(g), byte(b)];
};

const randomTexture = (size, red, green, blue) => {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.canvas.width = size;
  ctx.canvas.height = size;
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const shade = Math.random();
      const rgb = getRgb2(shade * red, shade * green, shade * blue);
      ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return ctx.canvas;
};

const solidTexture = (red, green, blue) => {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.canvas.width = 1;
  ctx.canvas.height = 1;
  const rgb = getRgb2(red, green, blue);
  ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  ctx.fillRect(0, 0, 1, 1);
  return ctx.canvas;
};

const solidTextureStack = (...colors) => {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.canvas.width = colors.length;
  ctx.canvas.height = 1;
  for (let i = 0; i < colors.length; i++) {
    const rgb = getRgb2(...colors[i]);
    ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    ctx.fillRect(i, 0, 1, 1);
  }
  return ctx.canvas;
};

const paletteTexture = () => {
  const ctx = document.createElement("canvas").getContext("2d");
  const n = 3;
  const m = n - 1;
  ctx.canvas.width = n * n * n;
  ctx.canvas.height = 1;
  for (let red = 0; red < n; red++) {
    for (let green = 0; green < n; green++) {
      for (let blue = 0; blue < n; blue++) {
        const rgb = getRgb2(red / m, green / m, blue / m);
        ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        let x = red * n * n + green * n + blue;
        ctx.fillRect(x, 0, 1, 1);
      }
    }
  }
  return ctx.canvas;
};

const flatten = (arrays) => {
  const result = [];
  arrays.forEach((a) => {
    a.forEach((b) => {
      result.push(b);
    });
  });
  return result;
};

// Tracks runtime stats for debugging.
const newTelemetry = () => {
  const counters = {};
  const get = (name, default_) => {
    if (counters.hasOwnProperty(name)) {
      return counters[name];
    } else {
      return default_;
    }
  };
  const add = (name, value) => {
    counters[name] = get(name, 0) + value;
  };
  const blend = (name, value, weight) => {
    weight = weight || 0.05;
    counters[name] = (1 - weight) * get(name, value) + weight * value;
  };
  const log = () => {
    Object.getOwnPropertyNames(counters).forEach((name) => {
      console.log(name, get(name));
    });
  };
  return {
    get: get,
    add: add,
    blend: blend,
    log: log,
  };
};
