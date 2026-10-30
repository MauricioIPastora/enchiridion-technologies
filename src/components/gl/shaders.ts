/* GLSL sources for the background (blob gradient, starfield, pointer trail,
 * composite) and the logo particle geometry. Ported from the reference site. */

const SIMPLEX_2D = /* glsl */ `
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

const FBM_3 = /* glsl */ `
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.55;
  mat2 rot = mat2(0.87, -0.5, 0.5, 0.87);
  for (int i = 0; i < 3; i++) {
    value += amplitude * snoise(p);
    p = rot * p * 2.05 + 19.7;
    amplitude *= 0.48;
  }
  return value;
}
`;

/* ------------------------------------------------------------------ */
/* Blob gradient                                                       */
/* ------------------------------------------------------------------ */

export const gradientVertex = /* glsl */ `
precision highp float;
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}
`;

export const gradientFragment = /* glsl */ `
precision highp float;

uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform float u_weight1;
uniform float u_weight2;
uniform float u_blobRandomness;
uniform float u_blobDisplacement;
uniform float u_blobMorphSpeed;
uniform float u_colorBlend;

varying vec2 vUv;

const float BLOB_SCALE = 0.35;

${SIMPLEX_2D}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.72;
  mat2 rot = mat2(0.87, -0.5, 0.5, 0.87);

  for (int i = 0; i < 2; i++) {
    value += amplitude * snoise(p);
    p = rot * p * 1.55 + 19.7;
    amplitude *= 0.55;
  }

  return value;
}

mat2 rot2(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

vec2 domainWarp(vec2 p, float time, float displacement) {
  float t1 = time * 0.13;
  float t2 = time * 0.087;

  vec2 q = vec2(
    fbm(p + vec2(t1, t2)),
    fbm(p + vec2(4.7, 2.3) + vec2(-t2, t1))
  );

  return p + q * mix(0.0, 0.28, displacement);
}

float fbmAnimated(vec2 p, float phase, float randomness) {
  float value = 0.0;
  float amplitude = 0.72;
  mat2 rot = mat2(0.87, -0.5, 0.5, 0.87);
  float evolutionAmp = mix(0.04, 0.14, randomness);

  for (int i = 0; i < 2; i++) {
    float fi = float(i);
    vec2 evolution = vec2(
      sin(phase * (0.28 + fi * 0.12) + fi * 2.1),
      cos(phase * (0.24 + fi * 0.1) - fi * 1.7)
    ) * (evolutionAmp + fi * evolutionAmp * 0.35);

    value += amplitude * snoise(p + evolution);
    p = rot * p * 1.55 + 19.7;
    amplitude *= 0.55;
  }

  return value;
}

float smoother(float t) {
  return t * t * (3.0 - 2.0 * t);
}

float colorTransition(float lt) {
  return mix(step(0.5, lt), smoother(lt), u_colorBlend);
}

vec3 palette2(float t) {
  t = clamp(t, 0.0, 1.0);

  float total = u_weight1 + u_weight2;
  float w2 = total > 0.001 ? u_weight2 / total : 0.55;

  float biased = pow(t, mix(1.0, max(w2, 0.2), u_colorBlend * 0.65 + 0.35));
  float blendT = smoother(smoother(biased));

  return mix(u_color2, u_color1, colorTransition(blendT));
}

void main() {
  vec2 uv = vUv;
  float time = u_time * u_blobMorphSpeed;

  vec2 centered = (uv - 1.0) * BLOB_SCALE;

  float swirl = time * 0.17;
  vec2 swirled = rot2(swirl * mix(0.0, 0.35, u_blobDisplacement)) * centered;

  vec2 nBase = domainWarp(swirled, time, u_blobDisplacement);

  float tA = time * 0.21;
  float tB = time * 0.14;
  float n1 = fbmAnimated(nBase, tA, u_blobRandomness);
  float n2 = fbmAnimated(nBase + vec2(8.3, 5.1), tB + 1.3, u_blobRandomness);
  float n3 = fbmAnimated(
    nBase + vec2(-6.2, 9.4),
    tA * 0.85 + tB * 0.6 + 2.7,
    u_blobRandomness
  );

  float fieldCoherent = n1 * 0.58 + n2 * 0.24 + n3 * 0.18;
  float fieldChaotic = (n1 + n2 + n3) / 3.0;
  float field = mix(fieldCoherent, fieldChaotic, u_blobRandomness) + 0.02;

  float edge = mix(0.14, 0.58, u_colorBlend);
  float mask = smoothstep(-edge, edge, field);
  float maskSmooth = smoother(smoother(mask));
  mask = mix(mask, maskSmooth, u_colorBlend);

  float spatial = smoother(clamp(uv.y * 0.46 + (1.0 - uv.x) * 0.2, 0.0, 1.0));
  float detail = fbmAnimated(
    nBase * 1.3 + vec2(3.1, -2.8),
    time * 0.32,
    u_blobRandomness
  ) * mix(0.002, 0.012, u_blobRandomness);

  float rampRaw = clamp(mask * 0.4 + spatial * 0.48 + detail + 0.02, 0.0, 1.0);
  float expo = mix(3.8, 0.82, u_colorBlend);
  rampRaw = pow(rampRaw, expo);

  float rampLo = mix(0.0, 0.04, u_colorBlend);
  float rampHi = mix(1.0, 0.78, u_colorBlend);
  float rampT = (rampRaw - rampLo) / max(rampHi - rampLo, 0.001);

  gl_FragColor = vec4(palette2(rampT), 1.0);
}
`;

/* ------------------------------------------------------------------ */
/* Starfield                                                           */
/* ------------------------------------------------------------------ */

export const starVertex = /* glsl */ `
uniform float uSizeRef;
uniform float uSpawnFar;

attribute float size;
attribute float brightness;
attribute vec3 color;

varying vec3 vColor;
varying float vBrightness;

void main() {
  vColor = color;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float depth = max(-mvPosition.z, 1.0);

  gl_PointSize = size * (uSizeRef / depth);
  gl_PointSize = clamp(gl_PointSize, 0.0, 56.0);

  float approach = clamp(1.0 + mvPosition.z / uSpawnFar, 0.2, 1.0);
  vBrightness = brightness * approach;

  gl_Position = projectionMatrix * mvPosition;
}
`;

export const starFragment = /* glsl */ `
precision highp float;

varying vec3 vColor;
varying float vBrightness;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float dist = dot(uv, uv);
  if (dist > 0.25) discard;

  float core = smoothstep(0.25, 0.06, dist);
  float alpha = core * 0.26 * clamp(vBrightness, 0.0, 2.5);
  vec3 rgb = vColor * (0.4 + vBrightness * 0.7);

  gl_FragColor = vec4(rgb, alpha);
}
`;

/* ------------------------------------------------------------------ */
/* Fullscreen passes                                                   */
/* ------------------------------------------------------------------ */

export const screenVertex = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const trailFragment = /* glsl */ `
precision highp float;

uniform sampler2D u_trailPrev;
uniform vec2 u_pointer;
uniform vec2 u_pointerPrev;
uniform float u_pointerEngage;
uniform float u_pointerRadius;
uniform vec2 u_resolution;
uniform float u_fade;
uniform float u_disengage;
uniform float u_ageRate;
uniform float u_time;

varying vec2 vUv;

const float TRAIL_LEN_NORM = 0.38;

${SIMPLEX_2D}
${FBM_3}

vec2 toAspect(vec2 uv) {
  return vec2(uv.x * u_resolution.x / u_resolution.y, uv.y);
}

float distToSegment(vec2 p, vec2 a, vec2 b) {
  vec2 ba = b - a;
  float len2 = dot(ba, ba);
  if (len2 < 0.00001) return length(p - a);
  float t = clamp(dot(p - a, ba) / len2, 0.0, 1.0);
  return length(p - a - ba * t);
}

float headDistForPoint(vec2 p, vec2 prev, vec2 cur) {
  vec2 ba = cur - prev;
  float len2 = dot(ba, ba);
  if (len2 < 0.00001) return length(p - cur) / TRAIL_LEN_NORM;
  float t = clamp(dot(p - prev, ba) / len2, 0.0, 1.0);
  return (1.0 - t) * sqrt(len2) / TRAIL_LEN_NORM;
}

float exitScale(float headDist) {
  return clamp(1.0 - (u_disengage * 1.2 - (1.0 - headDist)), 0.0, 1.0);
}

float stampBlob(vec2 p, vec2 center, float radius, float engage) {
  float dist = length(p - center);
  vec2 nCoord = p * 4.2 + vec2(u_time * 0.22, -u_time * 0.19);
  float edgeNoise = fbm(nCoord) * radius * 0.42;
  edgeNoise += fbm(nCoord * 1.85 + 3.7 - u_time * 0.31) * radius * 0.22;
  float edge = radius + edgeNoise;
  float soft = radius * 0.22 + 0.012;
  float blob = 1.0 - smoothstep(edge, edge + soft, dist);
  float pulse = 0.88 + 0.12 * sin(u_time * 1.6 + fbm(p * 2.0) * 3.0);
  return blob * engage * pulse;
}

float stampSegment(vec2 p, vec2 a, vec2 b, float radius, float engage) {
  float dist = min(distToSegment(p, a, b), length(p - b));
  vec2 nCoord = p * 4.2 + vec2(u_time * 0.22, -u_time * 0.19);
  float edgeNoise = fbm(nCoord) * radius * 0.42;
  edgeNoise += fbm(nCoord * 1.85 + 3.7 - u_time * 0.31) * radius * 0.22;
  float edge = radius + edgeNoise;
  float soft = radius * 0.22 + 0.012;
  float blob = 1.0 - smoothstep(edge, edge + soft, dist);
  float pulse = 0.88 + 0.12 * sin(u_time * 1.6 + fbm(p * 2.0) * 3.0);
  return blob * engage * pulse;
}

void main() {
  vec2 uv = vUv;
  vec4 prev = texture2D(u_trailPrev, uv);
  float trail = prev.r * u_fade;
  float headDist = prev.g;
  float scale = prev.b;

  if (u_pointerEngage > 0.008) {
    vec2 p = toAspect(uv);
    vec2 cur = toAspect(u_pointer);
    vec2 prevPt = toAspect(u_pointerPrev);
    float radius = u_pointerRadius * (0.5 + u_pointerEngage * 0.35);

    float stamp = stampSegment(p, prevPt, cur, radius, u_pointerEngage);
    float stampHeadDist = headDistForPoint(p, prevPt, cur);

    vec2 seg = cur - prevPt;
    float segLen = length(seg);
    if (segLen > 0.0001) {
      float step = radius * 0.22;
      int nSteps = int(clamp(segLen / step, 1.0, 12.0));
      for (int i = 0; i <= 12; i++) {
        if (i > nSteps) break;
        float t = float(i) / float(nSteps);
        vec2 pt = mix(prevPt, cur, t);
        float blob = stampBlob(p, pt, radius, u_pointerEngage);
        if (blob > stamp) {
          stamp = blob;
          stampHeadDist = (1.0 - t) * segLen / TRAIL_LEN_NORM;
        }
      }
    } else {
      float blob = stampBlob(p, cur, radius, u_pointerEngage);
      if (blob > stamp) {
        stamp = blob;
        stampHeadDist = 0.0;
      }
    }

    if (stamp > trail) {
      trail = stamp;
      headDist = clamp(stampHeadDist, 0.0, 1.0);
      scale = 1.0;
    } else if (trail > 0.001) {
      headDist = min(headDist + u_ageRate, 1.0);
      scale = 1.0;
    }
  } else if (trail > 0.001) {
    scale = exitScale(headDist);
    trail *= scale;
  } else {
    headDist = 0.0;
    scale = 0.0;
  }

  gl_FragColor = vec4(trail, headDist, scale, 1.0);
}
`;

export const compositeFragment = /* glsl */ `
precision highp float;

uniform sampler2D u_scene;
uniform sampler2D u_trail;
uniform float u_time;
uniform float u_pointerEngage;
uniform vec2 u_resolution;

varying vec2 vUv;

${SIMPLEX_2D}
${FBM_3}

vec2 toAspect(vec2 uv) {
  return vec2(uv.x * u_resolution.x / u_resolution.y, uv.y);
}

vec2 fromAspect(vec2 p) {
  return vec2(p.x / (u_resolution.x / u_resolution.y), p.y);
}

vec2 trailBlobCenter(vec2 uv) {
  vec2 texel = vec2(1.0 / u_resolution.x, 1.0 / u_resolution.y);
  vec2 p = uv;

  for (int i = 0; i < 4; i++) {
    float c = texture2D(u_trail, p).r;
    if (c < 0.0001) break;

    float r = texture2D(u_trail, clamp(p + vec2(texel.x, 0.0), 0.0, 1.0)).r;
    float l = texture2D(u_trail, clamp(p - vec2(texel.x, 0.0), 0.0, 1.0)).r;
    float u = texture2D(u_trail, clamp(p + vec2(0.0, texel.y), 0.0, 1.0)).r;
    float d = texture2D(u_trail, clamp(p - vec2(0.0, texel.y), 0.0, 1.0)).r;
    vec2 grad = vec2(r - l, u - d);
    float len = length(grad);
    if (len < 0.00001) break;
    p += (grad / len) * texel.x * 1.6;
  }

  return clamp(p, 0.0, 1.0);
}

float trailBlobScaled(vec2 uv) {
  vec4 data = texture2D(u_trail, uv);
  float intensity = data.r;
  float scale = data.b;

  if (intensity < 0.001) return 0.0;
  if (scale > 0.985) return intensity;

  vec2 center = trailBlobCenter(uv);
  vec2 scaledUv = center + (uv - center) / max(scale, 0.025);
  float scaledIntensity = texture2D(u_trail, clamp(scaledUv, 0.0, 1.0)).r;

  return scaledIntensity * smoothstep(0.0, 0.12, scale);
}

vec4 sampleScene(vec2 uv) {
  return texture2D(u_scene, clamp(uv, 0.0, 1.0));
}

vec2 patternWarp(vec2 uv, float blob) {
  vec2 p = toAspect(uv);
  vec2 nBase = p * 3.2 + vec2(u_time * 0.16, -u_time * 0.13);

  float n1 = fbm(nBase);
  float n2 = fbm(nBase * 1.65 + vec2(5.1, 2.4) - u_time * 0.11);
  float n3 = fbm(nBase * 2.1 - u_time * 0.2 + 8.0);

  vec2 flow = vec2(n1 - n2, n2 - n3);
  flow *= 2.4;

  vec2 texel = vec2(1.0 / u_resolution.x, 1.0 / u_resolution.y);
  float tC = trailBlobScaled(uv);
  float tR = trailBlobScaled(clamp(uv + vec2(texel.x, 0.0), 0.0, 1.0));
  float tU = trailBlobScaled(clamp(uv + vec2(0.0, texel.y), 0.0, 1.0));
  vec2 grad = vec2(tR - tC, tU - tC);
  float gradLen = length(grad);
  vec2 vel = gradLen > 0.00008 ? grad / gradLen : vec2(0.0);
  vec2 right = vec2(-vel.y, vel.x);

  flow += vel * blob * 1.4;
  flow += right * blob * 0.65;

  float amp = blob * (0.028 + u_pointerEngage * 0.022);
  return fromAspect(flow * amp);
}

void main() {
  vec2 uv = vUv;
  vec4 base = sampleScene(uv);

  float blob = trailBlobScaled(uv);
  if (blob < 0.001) {
    gl_FragColor = base;
    return;
  }

  vec2 warp = patternWarp(uv, blob);
  vec4 warped = sampleScene(uv + warp);
  vec4 warpedDeep = sampleScene(uv + warp * 1.35 + vec2(warp.y, -warp.x) * 0.15);
  vec4 displaced = mix(warped, warpedDeep, blob * 0.4);

  gl_FragColor = mix(base, displaced, clamp(blob * 0.98, 0.0, 1.0));
}
`;

/* ------------------------------------------------------------------ */
/* Logo particle geometry                                              */
/* ------------------------------------------------------------------ */

export const geometryParticleVertex = /* glsl */ `
uniform float uSizeRef;
uniform float uLocalZExtent;
uniform float uZAlphaMin;
uniform float uZAlphaMax;

attribute float size;
attribute float brightness;
attribute float opacity;
attribute vec3 color;

varying vec3 vColor;
varying float vBrightness;
varying float vOpacity;

void main() {
  vColor = color;

  float localExtent = max(uLocalZExtent, 1.0);
  float zNorm = clamp(position.z / localExtent, -1.0, 1.0);
  float depthAlpha = mix(uZAlphaMin, uZAlphaMax, zNorm * 0.5 + 0.5);
  vOpacity = opacity * depthAlpha;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vec4 mvCenter = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);

  // Use the group's centre depth so the tilt does not inflate one edge.
  float centerDepth = max(-mvCenter.z, 1.0);
  float depthScale = uSizeRef / centerDepth;

  // Subtle parallax from local Z only.
  float localZFactor = 1.0 + (position.z / localExtent) * 0.1;
  localZFactor = clamp(localZFactor, 0.9, 1.1);

  float sizeScale = depthScale * localZFactor;
  gl_PointSize = clamp(size * sizeScale, 0.0, 64.0);
  vBrightness = brightness * clamp(sizeScale, 0.72, 1.22);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const geometryParticleFragment = /* glsl */ `
precision highp float;

uniform float uGlowBoost;
uniform float uHaloStrength;
uniform float uColorGainBase;
uniform float uColorGainBrightness;

varying vec3 vColor;
varying float vBrightness;
varying float vOpacity;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float dist = dot(uv, uv);
  if (dist > 0.25) discard;

  float core = smoothstep(0.14, 0.0, dist);
  float halo = smoothstep(0.25, 0.035, dist);
  float shape = core + halo * uHaloStrength;

  float alpha = shape * vOpacity * clamp(vBrightness, 0.0, 3.0);
  vec3 rgb = vColor * (uColorGainBase + vBrightness * uColorGainBrightness);
  rgb *= 1.0 + core * uGlowBoost;

  gl_FragColor = vec4(rgb, alpha * 0.82);
}
`;

/* ------------------------------------------------------------------ */
/* Featured-work image planes (rig canvas)                             */
/* ------------------------------------------------------------------ */

export const imagePlaneVertex = /* glsl */ `
uniform float uBarrelStrength;
uniform float uBarrelScale;
uniform float uBarrelEdgeLift;
uniform float uScrollDirection;
uniform float uMeshY;
uniform float uMeshHeight;
uniform float uViewportHeight;

varying vec2 vUv;

const float M_PI = 3.14159265;

// One shared viewport curve on X driven by world Y.
vec3 globalViewportBarrelX(vec3 pos) {
  float vertexWorldY = uMeshY + pos.y * uMeshHeight;
  float normalizedY = clamp(vertexWorldY / (uViewportHeight * 0.5), -1.0, 1.0);
  float distFromCenter = abs(normalizedY);

  float pinchAtY = cos(distFromCenter * M_PI * 0.5);
  float edgeAtY = 1.0 - pinchAtY;
  float s = uBarrelStrength * uBarrelScale * uScrollDirection;

  pos.x *= 1.0 - pinchAtY * s;
  pos.x *= 1.0 + edgeAtY * s * uBarrelEdgeLift;

  return pos;
}

void main() {
  vUv = uv;
  vec3 pos = globalViewportBarrelX(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const imagePlaneFragment = /* glsl */ `
uniform sampler2D uTexture;
uniform sampler2D uDataTexture;
uniform vec2 uTextureRepeat;
uniform vec2 uTextureOffset;
uniform float uAlpha;
uniform float uGridUvDistort;

varying vec2 vUv;

void main() {
  vec4 gridOffset = texture2D(uDataTexture, vUv);
  vec2 uv = vUv * uTextureRepeat + uTextureOffset - uGridUvDistort * gridOffset.rg;
  gl_FragColor = vec4(texture2D(uTexture, uv).rgb, uAlpha);
}
`;
