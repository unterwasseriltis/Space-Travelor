import type { BodyName } from '@/features/solar-voyage/domain/solar-system';

export type ArrivalVisualConfig = {
  greeting: string;
  portraitLabel: string;
  sceneLabel: string;
  sceneSubtitle: string;
  statusCode: string;
  statusLabel: string;
  title: string;
};

const DEFAULT_PORTRAIT_LABEL = 'Colony Liaison';
const DEFAULT_SCENE_LABEL = 'Arrival Vista';
const DEFAULT_STATUS_CODE = 'COLONY ONLINE';
const DEFAULT_STATUS_LABEL = 'Colonized destination';

function createColonyArrivalVisualConfig(locationLabel: string): ArrivalVisualConfig {
  return {
    greeting: `Port control is live. Welcome to ${locationLabel}; the colony has opened its docks, habitats, and trade concourse for your crew.`,
    portraitLabel: DEFAULT_PORTRAIT_LABEL,
    sceneLabel: DEFAULT_SCENE_LABEL,
    sceneSubtitle: 'COLONIZED WORLD',
    statusCode: DEFAULT_STATUS_CODE,
    statusLabel: DEFAULT_STATUS_LABEL,
    title: `${locationLabel} Colony`,
  };
}

export const ERDE_ARRIVAL_VISUAL_CONFIG: ArrivalVisualConfig = {
  greeting:
    'Port control is live. Welcome to Erde; the spacedock has opened its docks, habitats, and trade concourse for your crew.',
  portraitLabel: DEFAULT_PORTRAIT_LABEL,
  sceneLabel: DEFAULT_SCENE_LABEL,
  sceneSubtitle: 'COLONIZED WORLD',
  statusCode: DEFAULT_STATUS_CODE,
  statusLabel: DEFAULT_STATUS_LABEL,
  title: 'Erde Colony',
};

export const MOON_ARRIVAL_VISUAL_CONFIG: ArrivalVisualConfig = {
  greeting:
    'Port control is live. Welcome to Mond; the colony has opened its docks, habitats, and Mooncheese factories for your crew.',
  portraitLabel: DEFAULT_PORTRAIT_LABEL,
  sceneLabel: DEFAULT_SCENE_LABEL,
  sceneSubtitle: 'COLONIZED WORLD',
  statusCode: DEFAULT_STATUS_CODE,
  statusLabel: DEFAULT_STATUS_LABEL,
  title: 'Mond Base',
};

export const PHOBOS_ARRIVAL_VISUAL_CONFIG: ArrivalVisualConfig = {
  greeting:
    'Port control is live. Welcome to Phobos; the colony has opened its docks, habitats, and mining operations for your crew. ',
  portraitLabel: DEFAULT_PORTRAIT_LABEL,
  sceneLabel: DEFAULT_SCENE_LABEL,
  sceneSubtitle: 'COLONIZED WORLD',
  statusCode: DEFAULT_STATUS_CODE,
  statusLabel: DEFAULT_STATUS_LABEL,
  title: 'Phobos Colony',
};

export const bodyArrivalVisualConfig = {
  Erde: ERDE_ARRIVAL_VISUAL_CONFIG,
  Mond: MOON_ARRIVAL_VISUAL_CONFIG,
  Venus: createColonyArrivalVisualConfig('Venus'),
  Mars: createColonyArrivalVisualConfig('Mars'),
  Phobos: createColonyArrivalVisualConfig('Phobos'),
  Deimos: createColonyArrivalVisualConfig('Deimos'),
  Merkur: createColonyArrivalVisualConfig('Merkur'),
  Jupiter: createColonyArrivalVisualConfig('Jupiter'),
  Amalthea: createColonyArrivalVisualConfig('Amalthea'),
  Io: createColonyArrivalVisualConfig('Io'),
  Europa: createColonyArrivalVisualConfig('Europa'),
  Ganymed: createColonyArrivalVisualConfig('Ganymed'),
  Kallisto: createColonyArrivalVisualConfig('Kallisto'),
  Saturn: createColonyArrivalVisualConfig('Saturn'),
  Tethys: createColonyArrivalVisualConfig('Tethys'),
  Dione: createColonyArrivalVisualConfig('Dione'),
  Rhea: createColonyArrivalVisualConfig('Rhea'),
  Titan: createColonyArrivalVisualConfig('Titan'),
  Iapetus: createColonyArrivalVisualConfig('Iapetus'),
  Uranus: createColonyArrivalVisualConfig('Uranus'),
  Miranda: createColonyArrivalVisualConfig('Miranda'),
  Ariel: createColonyArrivalVisualConfig('Ariel'),
  Umbriel: createColonyArrivalVisualConfig('Umbriel'),
  Titania: createColonyArrivalVisualConfig('Titania'),
  Oberon: createColonyArrivalVisualConfig('Oberon'),
} satisfies Record<BodyName, ArrivalVisualConfig>;

export const scannerDiscoveryArrivalVisualConfig: ArrivalVisualConfig = {
  greeting:
    'Automated beacons are online around this waypoint. Temporary docking clearance is granted while the survey systems sync.',
  portraitLabel: 'Survey Controller',
  sceneLabel: 'Approach Feed',
  sceneSubtitle: 'SCANNER SITE',
  statusCode: 'SURVEY ONLINE',
  statusLabel: 'Unmanned waypoint',
  title: 'Prospecting Relay',
};

export function getArrivalVisualConfig(
  locationId: BodyName | null,
  fallbackLabel: string,
): ArrivalVisualConfig {
  if (!locationId) {
    return {
      ...scannerDiscoveryArrivalVisualConfig,
      greeting: `Automated beacons are online around ${fallbackLabel}. Temporary docking clearance is granted while the survey systems sync.`,
      title: `${fallbackLabel} Prospecting Relay`,
    };
  }

  return bodyArrivalVisualConfig[locationId];
}
