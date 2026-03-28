export type Coordinates = {
  x: number;
  y: number;
};

export type CelestialBody = Coordinates & {
  color: string;
};

export const KM_PER_AU = 149_597_870.7;

export const celestialBodies = {
  Erde: { x: 1.0, y: 0.0, color: '#3b82f6' },
  Mond: { x: 1.0027, y: 0.0025, color: '#60a5fa' },
  Venus: { x: 0.723, y: -0.35, color: '#fb923c' },
  Mars: { x: 1.524, y: 0.85, color: '#f87171' },
  Merkur: { x: 0.387, y: 0.22, color: '#94a3b8' },
  Jupiter: { x: 5.203, y: 2.1, color: '#fbbf24' },
  Saturn: { x: 9.582, y: -3.2, color: '#fde68a' },
  Uranus: { x: 19.191, y: 4.5, color: '#5eead4' },
} satisfies Record<string, CelestialBody>;

export type BodyName = keyof typeof celestialBodies;

export function calculateDistanceAu(from: BodyName, to: BodyName) {
  if (from === to) {
    return 0;
  }

  const start = celestialBodies[from];
  const destination = celestialBodies[to];
  const dx = destination.x - start.x;
  const dy = destination.y - start.y;

  return Math.hypot(dx, dy);
}

export function formatCoordinates(position: Coordinates) {
  return `X: ${position.x.toFixed(3)} AU | Y: ${position.y.toFixed(3)} AU`;
}

export function interpolateCoordinates(from: Coordinates, to: Coordinates, progress: number): Coordinates {
  return {
    x: from.x * (1 - progress) + to.x * progress,
    y: from.y * (1 - progress) + to.y * progress,
  };
}
