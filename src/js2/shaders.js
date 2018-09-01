/* jshint esversion: 6 */

// A central repository for GLSL shader code. Each object within `shaders`
// defines as a pair of shader code strings named `vertex` and `fragment`.

const _u = `uniform`;
const _a = `attribute`;
const _vv = `varying vec`;
const _vf = `varying float `;
const _vm = `void main() {`;
const _sc = (q,n) => `vec2 ${q}=vec2(sin(${n}),cos(${n}));`;
const _f=`
float n=3.0;vec3 xyz=floor(rgb*(n-0.001));float idx=(xyz.x*n*n+xyz.y*n+xyz.z+0.5)/(n*n*n);vec3 rgb2=texture2D(u_palette,vec2(idx,0.5)).rgb;gl_FragColor=vec4(rgb2*u_filter+(1.0-u_filter)*rgb,1);`;
const _g=`
precision mediump float;${_u} sampler2D u_palette;${_u} sampler2D u_image;${_u} float u_filter;`;
const shaders={

// The shaders used by blocks (cubes) and ramps.
block: {
vertex: `
${_u} mat4 u_transform;${_a} vec3 a_position;${_a} vec2 a_texCoord;${_vv}3 qa;${_vv}2 qb;
${_vm}
qa=(u_transform*vec4(a_position,1)).xyz;qb=a_texCoord;gl_Position=u_transform*vec4(a_position,1);}`,fragment: `
${_g}
${_vv}3 qa;${_vv}2 qb;
${_vm}
vec3 rgb=texture2D(u_image,qb).rgb;rgb *= 1.0-0.75*min(max(0.0,qa.z),1.0);${_f}
}`,},
// The shaders used by interface quads.
quad: {
vertex: `
${_u} mat4 u_transform;${_a} vec2 a_position;${_a} vec2 a_texCoord;${_vv}2 qb;
${_vm}
qb=a_texCoord;gl_Position=u_transform*vec4(a_position,0,1);}`,fragment: `
${_g}
${_u} mat4 u_texTransform;${_vv}2 qb;
${_vm}
vec4 tc=u_texTransform*vec4(qb,0,1);vec3 rgb=texture2D(u_image,tc.xy).rgb;${_f}
}`,},
// The shaders used by particle effects.
particle: {
vertex: `
${_u} mat4 u_transform;${_u} vec3 u_delta;${_u} float u_age;${_u} float u_size;${_u} float u_nonce;${_a} vec3 a_position;${_a} float a_entropy;${_vf}qc;
${_vm}
float qo=fract(a_entropy+u_nonce);qc=qo;float qp=(0.5*qo+0.5)*6.0*pow(u_age,0.5);float qf=u_age*6.28*4.0*(qo-0.5);float qn=-atan(u_delta.z,u_delta.x);float qg=-atan(-length(u_delta.xz),u_delta.y);float qh=6.28*fract(qo*256.0);float qi=3.14*fract(qo*65535.0);${_sc('sc','qf')}${_sc('ab','qn')}${_sc('fg','qg')}${_sc('st','qh')}${_sc('uv','qi')}mat4 qm=mat4(
1,0,0,0,0,fg.x,fg.y,0,0,-fg.y,fg.x,0,0,0,0,1
);mat4 qk=mat4(
ab.x,0,ab.y,0,0,1,0,0,-ab.y,0,ab.x,0,0,0,0,1
);mat4 ql=mat4(
sc.x,sc.y,0,0,-sc.y,sc.x,0,0,0,0,1,0,0,0,0,1
);float invAge=u_size/(1.0+u_age*u_age*9.0);mat4 scale=mat4(
invAge,0,0,0,0,invAge,0,0,0,0,invAge,0,0,0,0,1
);vec4 abc=vec4(st.x*uv.x,st.y*uv.x,uv.y,0);vec4 pos=scale*qk*qm*ql*vec4(a_position,1)+qp*abc;pos.y-=pow(u_age*1.25,2.0);gl_Position=u_transform*pos;}`,fragment: `
${_g}
${_vf}qc;
${_vm}
vec3 rgb=vec3(fract(qc*16.0),fract(qc*256.0),fract(qc*4096.0));rgb.g *= rgb.r;rgb.b *= rgb.g;${_f}
}`,},
// The shaders used by powerups.
powerup: {
vertex: `
${_u} mat4 u_transform;${_u} vec3 u_player;${_u} float u_time;${_a} vec3 a_vtx_pos;${_a} vec3 a_mdl_pos;${_a} vec2 a_texCoord;${_a} float a_type;${_vv}3 qa;${_vv}2 qb;${_vf}qd;${_vf}qe;
${_vm}
vec3 mdl=a_mdl_pos;mdl.xz+=0.5;mdl.y+=0.2;mdl.y+=0.05*sin(u_time*3.14);vec3 delta=u_player-mdl;float a1=-atan(delta.z,delta.x);float a2=-atan(-length(delta.xz),delta.y);float a3=0.0;if (a_type==3.0) {
a3=u_time*10.0;}
${_sc('ab','a1')}${_sc('fg','a2')}${_sc('sc','a3')}mat4 rx=mat4(
1,0,0,0,0,fg.x,fg.y,0,0,-fg.y,fg.x,0,0,0,0,1
);mat4 ry=mat4(
ab.x,0,ab.y,0,0,1,0,0,-ab.y,0,ab.x,0,0,0,0,1
);mat4 rz=mat4(
sc.x,sc.y,0,0,-sc.y,sc.x,0,0,0,0,1,0,0,0,0,1
);float s=0.2;mat4 scale=mat4(s,0,0,0,0,s,0,0,0,0,s,0,0,0,0,1);vec4 pos=scale*ry*rx*rz*vec4(a_vtx_pos,1)+vec4(mdl,0);vec4 tpos=u_transform*pos;tpos.xyz *= min(a_type,1.0);vec2 tex=a_texCoord;tex.x=(tex.x+a_type-1.0)/3.0;qa=tpos.xyz;qb=tex;qd=u_time;qe=a_type;gl_Position=tpos;}`,fragment: `
${_g}
${_vv}3 qa;${_vv}2 qb;${_vf}qd;${_vf}qe;
${_vm}
vec3 rgb=texture2D(u_image,qb).rgb;if (qe==3.0) {
rgb.r=0.75+0.25*sin(qd*5.0);rgb.g=0.75+0.25*sin(qd*7.0);rgb.b=0.75+0.25*sin(qd*11.0);}
rgb *= 1.0-0.75*min(max(0.0,qa.z),1.0);${_f}
}`,},};
