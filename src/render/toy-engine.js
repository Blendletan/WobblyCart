/** Small orthographic renderer for the shop's procedural toy models. */
export const identity = () => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);

export function multiply(a, b) {
  const out = new Float32Array(16);
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      out[column * 4 + row] = a[row] * b[column * 4] + a[4 + row] * b[column * 4 + 1] +
        a[8 + row] * b[column * 4 + 2] + a[12 + row] * b[column * 4 + 3];
    }
  }
  return out;
}

export function transform(x = 0, y = 0, z = 0, heading = 0, lean = 0, scale = 1) {
  const cosine = Math.cos(heading), sine = Math.sin(heading);
  const rollCosine = Math.cos(lean), rollSine = Math.sin(lean);
  return new Float32Array([
    cosine * rollCosine * scale, -sine * rollCosine * scale, -rollSine * scale, 0,
    sine * scale, cosine * scale, 0, 0,
    cosine * rollSine * scale, -sine * rollSine * scale, rollCosine * scale, 0,
    x, y, z, 1,
  ]);
}

export function pitch(angle) {
  const cosine = Math.cos(angle), sine = Math.sin(angle);
  return new Float32Array([1,0,0,0, 0,cosine,sine,0, 0,-sine,cosine,0, 0,0,0,1]);
}

const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const subtract = (a, b) => a.map((value, i) => value - b[i]);
const unit = vector => { const size = Math.hypot(...vector); return vector.map(value => value / (size || 1)); };
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);

function lookAt(eye, target) {
  const back = unit(subtract(eye, target)), right = unit(cross([0,0,1], back)), up = cross(back, right);
  return new Float32Array([right[0],up[0],back[0],0, right[1],up[1],back[1],0,
    right[2],up[2],back[2],0, -dot(right,eye),-dot(up,eye),-dot(back,eye),1]);
}

function orthographic(halfWidth, halfHeight, near, far) {
  return new Float32Array([1/halfWidth,0,0,0, 0,1/halfHeight,0,0, 0,0,-2/(far-near),0, 0,0,-(far+near)/(far-near),1]);
}

const colorCache = new Map();
function rgb(hex) {
  if (!colorCache.has(hex)) {
    const value = parseInt(hex.slice(1),16);
    colorCache.set(hex, [(value>>16&255)/255,(value>>8&255)/255,(value&255)/255]);
  }
  return colorCache.get(hex);
}

/** Interleaved position, normal and colour. Model geometry is built once at startup. */
export class ToyMesh {
  vertices = [];

  triangle(a, b, c, color, normals) {
    const normal = unit(cross(subtract(b,a),subtract(c,a))), tint = rgb(color);
    for (const [index, point] of [a,b,c].entries()) this.vertices.push(...point,...(normals?.[index] ?? normal),...tint);
  }

  face(points, color) {
    for (let i = 1; i < points.length-1; i++) this.triangle(points[0],points[i],points[i+1],color);
  }

  block(x, y, z, width, depth, height, color, bevel = .035) {
    const b = Math.min(bevel,width*.22,depth*.22,height*.32);
    const ring = [[-width/2+b,-depth/2],[width/2-b,-depth/2],[width/2,-depth/2+b],[width/2,depth/2-b],
      [width/2-b,depth/2],[-width/2+b,depth/2],[-width/2,depth/2-b],[-width/2,-depth/2+b]];
    const levels = [[z,b],[z+b,0],[z+height-b,0],[z+height,b]];
    const rings = levels.map(([altitude,inset]) => ring.map(([px,py]) => [x+px*(1-inset*2/width),y+py*(1-inset*2/depth),altitude]));
    this.face([...rings[0]].reverse(),color);
    this.face(rings[3],color);
    for (let level = 0; level < 3; level++) for (let i = 0; i < 8; i++) {
      const next = (i+1)%8;
      this.face([rings[level][i],rings[level][next],rings[level+1][next],rings[level+1][i]],color);
    }
  }

  cylinder(x, y, z, radius, height, color, segments = 16, topRadius = radius) {
    for (let i = 0; i < segments; i++) {
      const a = i*Math.PI*2/segments, b = (i+1)*Math.PI*2/segments;
      const bottomA = [x+Math.cos(a)*radius,y+Math.sin(a)*radius,z];
      const bottomB = [x+Math.cos(b)*radius,y+Math.sin(b)*radius,z];
      const topA = [x+Math.cos(a)*topRadius,y+Math.sin(a)*topRadius,z+height];
      const topB = [x+Math.cos(b)*topRadius,y+Math.sin(b)*topRadius,z+height];
      const normalA = unit([Math.cos(a),Math.sin(a),(radius-topRadius)/height]);
      const normalB = unit([Math.cos(b),Math.sin(b),(radius-topRadius)/height]);
      this.triangle(bottomA,bottomB,topB,color,[normalA,normalB,normalB]);
      this.triangle(bottomA,topB,topA,color,[normalA,normalB,normalA]);
      this.triangle([x,y,z+height],topA,topB,color);
      this.triangle([x,y,z],bottomB,bottomA,color);
    }
  }

  ellipsoid(x, y, z, rx, ry, rz, color, segments = 16, rings = 10) {
    const point = (angle, latitude) => [x+rx*Math.cos(angle)*Math.sin(latitude),y+ry*Math.sin(angle)*Math.sin(latitude),z+rz*Math.cos(latitude)];
    const normal = p => unit([(p[0]-x)/(rx*rx),(p[1]-y)/(ry*ry),(p[2]-z)/(rz*rz)]);
    for (let i = 0; i < segments; i++) for (let j = 0; j < rings; j++) {
      const a = point(i*Math.PI*2/segments,j*Math.PI/rings);
      const b = point((i+1)*Math.PI*2/segments,j*Math.PI/rings);
      const c = point((i+1)*Math.PI*2/segments,(j+1)*Math.PI/rings);
      const d = point(i*Math.PI*2/segments,(j+1)*Math.PI/rings);
      this.triangle(a,c,b,color,[normal(a),normal(c),normal(b)]);
      this.triangle(a,d,c,color,[normal(a),normal(d),normal(c)]);
    }
  }

  rod(start, end, radius, color, segments = 8) {
    const axis = unit(subtract(end,start));
    const across = unit(cross(axis,Math.abs(axis[2]) > .9 ? [0,1,0] : [0,0,1]));
    const up = cross(axis,across);
    const point = (center,angle) => center.map((value,i) => value+radius*(Math.cos(angle)*across[i]+Math.sin(angle)*up[i]));
    for (let i = 0; i < segments; i++) {
      const a = i*Math.PI*2/segments, b = (i+1)*Math.PI*2/segments;
      this.face([point(start,a),point(start,b),point(end,b),point(end,a)],color);
      this.triangle(end,point(end,a),point(end,b),color);
      this.triangle(start,point(start,b),point(start,a),color);
    }
  }

  ring(x, y, z, radius, thickness, color, segments = 48, fraction = 1) {
    for (let i = 0; i < segments*fraction; i++) {
      const a = i*Math.PI*2/segments, b = Math.min((i+1)/segments,fraction)*Math.PI*2;
      this.face([[x+Math.cos(a)*radius,y+Math.sin(a)*radius,z],[x+Math.cos(a)*(radius-thickness),y+Math.sin(a)*(radius-thickness),z],
        [x+Math.cos(b)*(radius-thickness),y+Math.sin(b)*(radius-thickness),z],[x+Math.cos(b)*radius,y+Math.sin(b)*radius,z]],color);
    }
  }

  append(mesh, matrix = identity()) {
    for (let i = 0; i < mesh.vertices.length; i += 9) {
      for (const offset of [0,3]) {
        const [x,y,z] = mesh.vertices.slice(i+offset,i+offset+3), w = offset === 0 ? 1 : 0;
        this.vertices.push(matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12]*w,
          matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13]*w,matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14]*w);
      }
      this.vertices.push(...mesh.vertices.slice(i+6,i+9));
    }
  }
}

const vertexShader = `
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec3 a_color;
uniform mat4 u_model;
uniform mat4 u_camera;
uniform mat4 u_light;
varying vec3 v_normal;
varying vec3 v_color;
varying vec3 v_world;
varying vec4 v_shadow;
void main() {
  vec4 world = u_model * vec4(a_position, 1.0);
  v_world = world.xyz;
  v_normal = mat3(u_model) * a_normal;
  v_color = a_color;
  v_shadow = u_light * world;
  gl_Position = u_camera * world;
}`;

const fragmentShader = `
precision highp float;
uniform sampler2D u_shadowMap;
uniform vec3 u_eye;
uniform float u_shadowPass;
uniform float u_shininess;
varying vec3 v_normal;
varying vec3 v_color;
varying vec3 v_world;
varying vec4 v_shadow;
void main() {
  if (u_shadowPass > 0.5) {
    vec2 encoded = fract(vec2(1.0, 255.0) * gl_FragCoord.z);
    encoded.x -= encoded.y / 255.0;
    gl_FragColor = vec4(encoded, 0.0, 1.0);
    return;
  }
  vec3 n = normalize(v_normal);
  vec3 light = normalize(vec3(-0.65, -0.40, 1.0));
  vec3 shadow = v_shadow.xyz / v_shadow.w * 0.5 + 0.5;
  float shade = 0.0;
  float bias = max(0.00038, 0.00115 * (1.0 - dot(n, light)));
  for (int i = 0; i < 5; i++) {
    float x = i == 0 ? 0.0 : (i == 1 || i == 3 ? -1.0 : 1.0);
    float y = i == 0 ? 0.0 : (i < 3 ? -1.0 : 1.0);
    vec2 value = texture2D(u_shadowMap, shadow.xy + vec2(x,y) / 1024.0).rg;
    shade += shadow.z - bias > value.x + value.y / 255.0 ? 1.0 : 0.0;
  }
  shade *= step(0.0,shadow.x)*step(shadow.x,1.0)*step(0.0,shadow.y)*step(shadow.y,1.0) / 5.0;
  float diffuse = max(0.0, dot(n, light));
  vec3 halfVector = normalize(light + normalize(u_eye - v_world));
  float specular = pow(max(dot(n, halfVector), 0.0), 36.0) * u_shininess * (1.0-shade);
  vec3 tint = pow(v_color,vec3(2.2));
  vec3 ambient = mix(vec3(0.49,0.56,0.61),vec3(0.79,0.83,0.83),n.z*0.5+0.5);
  vec3 color = tint * (ambient + diffuse * vec3(0.52,0.49,0.40) * (1.0-shade*0.72));
  color += specular * vec3(0.65,0.65,0.58);
  gl_FragColor = vec4(pow(color,vec3(1.0/2.2)),1.0);
}`;

export function createToyEngine(canvas) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: true, powerPreference: 'high-performance' });
  if (!gl) return null;
  const shaders = [], buffers = [];
  function compile(type, source) {
    const shader = gl.createShader(type);
    shaders.push(shader);
    gl.shaderSource(shader,source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  const program = gl.createProgram();
  gl.attachShader(program,compile(gl.VERTEX_SHADER,vertexShader));
  gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragmentShader));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const attributes = ['position','normal','color'].map(name => gl.getAttribLocation(program,`a_${name}`));
  const uniforms = Object.fromEntries(['model','camera','light','shadowPass','shininess','eye','shadowMap'].map(name => [name,gl.getUniformLocation(program,`u_${name}`)]));
  const shadowTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,shadowTexture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1024,1024,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const shadowBuffer = gl.createFramebuffer(), depthBuffer = gl.createRenderbuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER,shadowBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,shadowTexture,0);
  gl.bindRenderbuffer(gl.RENDERBUFFER,depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,1024,1024);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depthBuffer);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('Shadow buffer unavailable');
  gl.enable(gl.DEPTH_TEST);
  let width = 1, height = 1, camera, light, eye;
  return {
    dispose(releaseContext = false) {
      for (const buffer of buffers) gl.deleteBuffer(buffer);
      buffers.length = 0;
      for (const shader of shaders) gl.deleteShader(shader);
      shaders.length = 0;
      gl.deleteProgram(program); gl.deleteFramebuffer(shadowBuffer);
      gl.deleteRenderbuffer(depthBuffer); gl.deleteTexture(shadowTexture);
      if (releaseContext) gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
    upload(mesh) {
      const buffer = gl.createBuffer();
      buffers.push(buffer);
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh.vertices),gl.STATIC_DRAW);
      return { buffer, count: mesh.vertices.length/9 };
    },
    resize(w,h,ratio) {
      width = w; height = h;
      canvas.width = Math.round(w*ratio); canvas.height = Math.round(h*ratio);
    },
    camera(x,y,span) {
      const target = [x,y+.9,.3];
      eye = [x+5.5,y-8.5,10.8];
      camera = multiply(orthographic(span*width/height/2,span/2,.1,65),lookAt(eye,target));
      light = multiply(orthographic(10,12,1,44),lookAt([x-11,y-7,19],[x,y+2,0]));
    },
    project(x,y,z = 0) {
      return [(camera[0]*x+camera[4]*y+camera[8]*z+camera[12]+1)*width/2,
        (1-camera[1]*x-camera[5]*y-camera[9]*z-camera[13])*height/2];
    },
    render(objects) {
      gl.useProgram(program);
      gl.uniformMatrix4fv(uniforms.light,false,light);
      gl.uniform3fv(uniforms.eye,eye);
      for (const shadowPass of [true,false]) {
        gl.bindFramebuffer(gl.FRAMEBUFFER,shadowPass ? shadowBuffer : null);
        gl.viewport(0,0,shadowPass ? 1024 : canvas.width,shadowPass ? 1024 : canvas.height);
        gl.clearColor(...(shadowPass ? [1,1,1,1] : [.75,.87,.86,1]));
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        gl.uniform1f(uniforms.shadowPass,Number(shadowPass));
        gl.uniformMatrix4fv(uniforms.camera,false,shadowPass ? light : camera);
        // Sampling the texture while it is attached for drawing is invalid.
        gl.bindTexture(gl.TEXTURE_2D,shadowPass ? null : shadowTexture);
        gl.uniform1i(uniforms.shadowMap,0);
        for (const object of objects) {
          if (shadowPass && object.shadow === false) continue;
          gl.bindBuffer(gl.ARRAY_BUFFER,object.mesh.buffer);
          for (const [index,attribute] of attributes.entries()) {
            gl.enableVertexAttribArray(attribute);
            gl.vertexAttribPointer(attribute,3,gl.FLOAT,false,36,index*12);
          }
          gl.uniformMatrix4fv(uniforms.model,false,object.matrix ?? identity());
          gl.uniform1f(uniforms.shininess,object.shine ?? .12);
          gl.drawArrays(gl.TRIANGLES,0,object.mesh.count);
        }
      }
    },
  };
}
