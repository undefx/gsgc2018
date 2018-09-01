rm -f js_min.js
uglifyjs -c -m -- js2/shaders.js >> js_min.js
uglifyjs -c -m -- js2/linalg.js >> js_min.js
uglifyjs -c -m -- js2/map.js >> js_min.js
uglifyjs -c -m -- js2/gl_utils.js >> js_min.js
uglifyjs -c -m -- js2/render.js >> js_min.js
uglifyjs -c -m -- js2/particle.js >> js_min.js
uglifyjs -c -m -- js2/audio.js >> js_min.js
uglifyjs -c -m -- js2/textures.js >> js_min.js
uglifyjs -c -m -- js2/game.js >> js_min.js
uglifyjs -c -m -- js2/detangle.js >> js_min.js
cat index.html img/alpha.png js_min.js | wc -c
