/** Shared tunables for the work carousel and the home-page image planes. */
export const CAROUSEL_CONFIG = {
  BREAKPOINT_TABLET: 1024,
  BREAKPOINT_MOBILE: 480,
  SLIDE_ASPECT_RATIO: 1.6,
  SLIDE_MAX_VW: 0.5,
  SLIDE_MAX_VH: 0.5,
  SLIDE_TABLET_VW: 0.85,
  SLIDE_MOBILE_VW: 0.9,
  SLIDE_GAP_RATIO: 0.04,
  PLANE_SEGMENTS_X: 32,
  PLANE_SEGMENTS_Y: 10,
  BARREL_SCALE: 0.32,
  BARREL_EDGE_LIFT: 0.25,
  BARREL_ATTACK_LERP: 0.06,
  BARREL_RELEASE_LERP: 0.035,
  BARREL_VELOCITY_THRESHOLD: 0.012,
  BARREL_SPEED_FACTOR: 0.18,
  BARREL_IMPULSE_FACTOR: 1.8,
  BARREL_MAX_STRENGTH: 1,
  SCROLL_SPEED: 0.00112,
  SCROLL_DAMPING: 0.93,
  SCROLL_VELOCITY_LERP: 0.08,
  SNAP_SMOOTH_TIME: 0.9,
  SNAP_SETTLE_OFFSET: 5e-4,
  SNAP_SETTLE_VELOCITY: 0.001,
  TRANSITION_DURATION: 1.2,
  TRANSITION_DISPLACEMENT_EFFECT: 1.2,
  TRANSITION_EASE: "power2.inOut",
  DISPLACEMENT_TEXTURE_URL: "/images/displacement.png",
  ENTRY_REVEAL_DURATION: 1.4,
  ENTRY_REVEAL_STAGGER: 0.14,
  ENTRY_REVEAL_DELAY: 0.1,
  ENTRY_REVEAL_EASE: "power2.out",
  ENTRY_REVEAL_MAX_WAIT_MS: 1500,
  TOUCH_DRAG_DIRECTION: 1,
  TOUCH_DRAG_SPEED: 5e-4,
  TOUCH_MOMENTUM_SPEED: 0.006,
  TOUCH_DAMPING: 0.9,
  TOUCH_VELOCITY_DECAY: 0.85,
  VISIBLE_SLIDES: 5,
  PRELOAD_TEXTURE_COUNT: 3,
  CLICK_DRAG_THRESHOLD: 6,
  DESELECT_SCROLL_THRESHOLD: 20,
  GRID_SIZE: 12,
  GRID_MOUSE_RADIUS: 0.1,
  GRID_STRENGTH: 0.15,
  GRID_RELAXATION: 0.9,
  GRID_UV_DISTORT: 0.02,
} as const;

/** Barrel strength follows scroll speed with attack/release smoothing. */
export function stepCarouselBarrel(current: number, velocity: number, impulse: number, moved: boolean, dt: number) {
  const c = CAROUSEL_CONFIG;
  const speed = Math.max(60 * Math.abs(velocity), moved ? Math.abs(impulse) * c.BARREL_IMPULSE_FACTOR : 0);
  let target = 0;
  if (speed > c.BARREL_VELOCITY_THRESHOLD) {
    target = Math.min((speed - c.BARREL_VELOCITY_THRESHOLD) * c.BARREL_SPEED_FACTOR, c.BARREL_MAX_STRENGTH);
  }
  const lerp = target > current ? c.BARREL_ATTACK_LERP : c.BARREL_RELEASE_LERP;
  return current + (target - current) * (1 - Math.pow(1 - lerp, 60 * dt));
}
