export type Coordinates = {
  x: number;
  y: number;
};

export type CelestialBody = Coordinates & {
  arrivalPhrase: string;
  color: string;
  label: string;
};

export const KM_PER_AU = 149_597_870.7;

export const celestialBodies = {
  Erde: { x: 1.0, y: 0.0, color: '#3b82f6', label: 'Erde', arrivalPhrase: 'auf der Erde' },
  Mond: { x: 1.0027, y: 0.0025, color: '#60a5fa', label: 'Mond', arrivalPhrase: 'auf dem Mond' },
  Venus: { x: 0.723, y: -0.35, color: '#fb923c', label: 'Venus', arrivalPhrase: 'auf der Venus' },
  Mars: { x: 1.524, y: 0.85, color: '#f87171', label: 'Mars', arrivalPhrase: 'auf dem Mars' },
  Phobos: { x: 1.536, y: 0.824, color: '#fb7185', label: 'Phobos', arrivalPhrase: 'auf Phobos' },
  Deimos: { x: 1.553, y: 0.888, color: '#fca5a5', label: 'Deimos', arrivalPhrase: 'auf Deimos' },
  Merkur: { x: 0.387, y: 0.22, color: '#94a3b8', label: 'Merkur', arrivalPhrase: 'auf Merkur' },
  Jupiter: { x: 5.203, y: 2.1, color: '#fbbf24', label: 'Jupiter', arrivalPhrase: 'auf Jupiter' },
  Amalthea: {
    x: 5.145,
    y: 2.014,
    color: '#f59e0b',
    label: 'Amalthea',
    arrivalPhrase: 'auf Amalthea',
  },
  Io: { x: 5.172, y: 2.041, color: '#f97316', label: 'Io', arrivalPhrase: 'auf Io' },
  Europa: { x: 5.236, y: 2.162, color: '#fde68a', label: 'Europa', arrivalPhrase: 'auf Europa' },
  Ganymed: { x: 5.279, y: 2.228, color: '#fcd34d', label: 'Ganymed', arrivalPhrase: 'auf Ganymed' },
  Kallisto: {
    x: 5.317,
    y: 2.345,
    color: '#facc15',
    label: 'Kallisto',
    arrivalPhrase: 'auf Kallisto',
  },
  Saturn: { x: 9.582, y: -3.2, color: '#fde68a', label: 'Saturn', arrivalPhrase: 'auf Saturn' },
  Tethys: { x: 9.548, y: -3.024, color: '#fef3c7', label: 'Tethys', arrivalPhrase: 'auf Tethys' },
  Dione: { x: 9.586, y: -3.081, color: '#fde68a', label: 'Dione', arrivalPhrase: 'auf Dione' },
  Rhea: { x: 9.631, y: -3.279, color: '#f5deb3', label: 'Rhea', arrivalPhrase: 'auf Rhea' },
  Titan: { x: 9.674, y: -3.066, color: '#fbbf24', label: 'Titan', arrivalPhrase: 'auf Titan' },
  Iapetus: {
    x: 9.792,
    y: -3.421,
    color: '#fef08a',
    label: 'Iapetus',
    arrivalPhrase: 'auf Iapetus',
  },
  Uranus: { x: 19.191, y: 4.5, color: '#5eead4', label: 'Uranus', arrivalPhrase: 'auf Uranus' },
  Miranda: {
    x: 19.087,
    y: 4.288,
    color: '#67e8f9',
    label: 'Miranda',
    arrivalPhrase: 'auf Miranda',
  },
  Ariel: { x: 19.143, y: 4.357, color: '#a5f3fc', label: 'Ariel', arrivalPhrase: 'auf Ariel' },
  Umbriel: {
    x: 19.224,
    y: 4.428,
    color: '#99f6e4',
    label: 'Umbriel',
    arrivalPhrase: 'auf Umbriel',
  },
  Titania: {
    x: 19.287,
    y: 4.581,
    color: '#2dd4bf',
    label: 'Titania',
    arrivalPhrase: 'auf Titania',
  },
  Oberon: { x: 19.361, y: 4.668, color: '#14b8a6', label: 'Oberon', arrivalPhrase: 'auf Oberon' },
} satisfies Record<string, CelestialBody>;

export type BodyName = keyof typeof celestialBodies;

function resolveCoordinates(target: BodyName | Coordinates) {
  if (typeof target === 'string') {
    return celestialBodies[target];
  }

  return target;
}

export function calculateDistanceAu(from: BodyName | Coordinates, to: BodyName | Coordinates) {
  const start = resolveCoordinates(from);
  const destination = resolveCoordinates(to);

  if (start.x === destination.x && start.y === destination.y) {
    return 0;
  }
  const dx = destination.x - start.x;
  const dy = destination.y - start.y;

  return Math.hypot(dx, dy);
}

export function formatCoordinates(position: Coordinates) {
  return `X: ${position.x.toFixed(3)} AU | Y: ${position.y.toFixed(3)} AU`;
}

export function interpolateCoordinates(
  from: Coordinates,
  to: Coordinates,
  progress: number,
): Coordinates {
  return {
    x: from.x * (1 - progress) + to.x * progress,
    y: from.y * (1 - progress) + to.y * progress,
  };
}
