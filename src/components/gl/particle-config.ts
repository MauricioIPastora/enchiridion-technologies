/**
 * Tunables for the logo particle geometry (hero shape, footer formation,
 * scroll-driven morph / dissolve) and the shared particle color treatment.
 */
export const PARTICLE = {
  /** Image used to sample the logo shape (opaque pixels become particles). */
  SHAPE_IMAGE_URL: "/scroll-hd.png",
  SHAPE_ALPHA_THRESHOLD: 48,
  /** Half-extent (in shape units) the sampled image is normalised to. */
  SHAPE_HALF_EXTENT: 0.48,
  /** Z thickness (shape units) of the slab the image particles live in. */
  SHAPE_DEPTH: 0.14,
  /** Extra relief: brighter pixels sit slightly forward. */
  SHAPE_LUMA_DEPTH: 0.05,

  CAMERA_Z: 800,
  DEPTH_SIZE_REF: 5600,
  SIZE_FILL: 0.68,
  SPAWN_SPREAD: 0.92,
  SPAWN_DISTANCE_MULTIPLIER: 2,

  PARTICLE_SIZE_MIN: 0.1,
  PARTICLE_SIZE_MAX: 3.2,
  PARTICLE_Z_RANGE: 0.12,
  PARTICLE_Z_ALPHA_MIN: 0.6,
  PARTICLE_Z_ALPHA_MAX: 1,
  PARTICLE_NOISE_AMOUNT: 0.042,
  PARTICLE_NOISE_SPEED: 0.2,
  PARTICLE_OFFSET_MAX: 0,
  PARTICLE_WANDER_SPEED: 0.06,
  PARTICLE_DRIFT_MIN: 0.006,
  PARTICLE_DRIFT_MAX: 0.018,

  GLOW_BOOST: 0.75,
  HALO_STRENGTH: 0.6,
  /** Lower than the original (1.05) because particles carry real image colors. */
  COLOR_GAIN_BASE: 0.42,
  COLOR_GAIN_BRIGHTNESS: 0.45,

  GROUP_LOOK_TILT: 0.58,
  GROUP_ROTATION_SPEED: 9,

  FORM_STAGGER: 0.72,
  DISSOLVE_STAGGER: 0.65,
  DISSOLVE_ROTATION_DEGREES: 360,
  DISSOLVE_ROTATION_AXIS: "y" as "x" | "y" | "z",
  PAGE_DISSOLVE_DURATION: 1.35,

  SHAPE_SCALE: 0.48 / 2.55,
  SHAPE_MORPH_EXPAND: 0.62,
  SHAPE_MORPH_ROTATION_DEGREES: 360,
  SHAPE_MORPH_COMMIT_START: 0.68,
  SHAPE_MORPH_RANDOM_AMOUNT: 0.34,
  SHAPE_MORPH_RANDOM_SPEED: 1.35,

  GEOMETRY_SCROLL_ROTATION_START_DEGREES: 0,
  GEOMETRY_SCROLL_ROTATION_END_DEGREES: -2160,
  GEOMETRY_SCROLL_ROTATION_SCROLL_START: "top top",
  GEOMETRY_SCROLL_ROTATION_SCRUB: 0.7,

  TWINKLE_PERCENT: 35,
  TWINKLE_INTENSITY: 2.5,

  /** Cursor repulsion radius in canvas pixels. */
  CURSOR_RADIUS: 78,
  CURSOR_FORCE: 34,
} as const;

export const BACKGROUND = {
  color1: "#120703",
  color2: "#C2410C",
  colorWeights: [0, 100] as [number, number],
  blobRandomness: 0.35,
  blobDisplacement: 0.55,
  blobMorphSpeed: 1.3,
  colorBlend: 1,
  scrollGradientDownSpeed: 1.8,
  scrollGradientUpSpeed: 0.3,
  bloomIntensity: 2,
  bloomThreshold: 0.02,
  bloomSmoothing: 0.3,
  cssFallbackGradient:
    "radial-gradient(ellipse at 45% 35%, #c2410c 0%, #6b2a0f 45%, #050201 100%)",
} as const;
