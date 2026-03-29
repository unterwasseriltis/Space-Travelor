import {
  celestialBodies,
  type BodyName,
  type Coordinates,
} from '@/features/solar-voyage/domain/solar-system';
import { CRAFTING_RECIPES } from '@/features/solar-voyage/model/crafting';
import { ELEMENTS } from '@/features/solar-voyage/model/types';
import { createEmptyResourceState, type ElementKey } from '@/features/solar-voyage/model/types';
import type {
  GameState,
  LocationId,
  ResourceState,
  ScannerDiscoveryId,
  ScannerDiscoveryKind,
  ScannerDiscoveryState,
} from '@/features/solar-voyage/model/types';

export type LocationOption = {
  id: LocationId;
  label: string;
};

export type MapLocation = Coordinates & {
  color: string;
  id: LocationId;
  isScannerDiscovery: boolean;
  label: string;
};

const SCANNER_DISCOVERY_TYPES: Array<{
  color: string;
  kind: ScannerDiscoveryKind;
  label: string;
}> = [
  { color: '#f59e0b', kind: 'oreDeposit', label: 'Erzvorkommen' },
  { color: '#fb7185', kind: 'asteroidCluster', label: 'Asteroidenfeld' },
  { color: '#22d3ee', kind: 'debrisField', label: 'Mineralienwolke' },
];

const STATIC_LOCATION_IDS = Object.keys(celestialBodies) as BodyName[];
const ALL_ELEMENTS = Object.keys(ELEMENTS) as ElementKey[];

export function getAvailableDestinationOptions(state: GameState): LocationOption[] {
  return [...STATIC_LOCATION_IDS, ...state.discoveredLocations.map((location) => location.id)]
    .filter((locationId) => locationId !== state.currentLocation)
    .map((locationId) => ({
      id: locationId,
      label: getLocationLabel(state, locationId),
    }));
}

export function getCurrentAnchorBody(state: GameState) {
  return getLocationAnchor(state, state.currentLocation);
}

export function getLocationAnchor(
  state: Pick<GameState, 'discoveredLocations'>,
  locationId: LocationId,
): BodyName {
  if (isBodyName(locationId)) {
    return locationId;
  }

  return state.discoveredLocations.find((location) => location.id === locationId)?.anchor ?? 'Erde';
}

export function getLocationArrivalMessage(
  state: Pick<GameState, 'discoveredLocations'>,
  locationId: LocationId,
) {
  if (isBodyName(locationId)) {
    return `Willkommen ${celestialBodies[locationId].arrivalPhrase}.`;
  }

  const discovery = state.discoveredLocations.find((location) => location.id === locationId);
  return discovery ? `Willkommen am ${discovery.name}.` : 'Willkommen am Zielort.';
}

export function getLocationCoordinates(
  state: Pick<GameState, 'discoveredLocations'>,
  locationId: LocationId,
) {
  if (isBodyName(locationId)) {
    return celestialBodies[locationId];
  }

  const discovery = state.discoveredLocations.find((location) => location.id === locationId);

  if (!discovery) {
    throw new Error(`Unknown location "${locationId}".`);
  }

  return discovery;
}

export function getLocationLabel(
  state: Pick<GameState, 'discoveredLocations'>,
  locationId: LocationId,
) {
  if (isBodyName(locationId)) {
    return celestialBodies[locationId].label;
  }

  return (
    state.discoveredLocations.find((location) => location.id === locationId)?.name ?? locationId
  );
}

export function getMapLocations(state: Pick<GameState, 'discoveredLocations'>): MapLocation[] {
  const staticLocations = STATIC_LOCATION_IDS.map((locationId) => ({
    ...celestialBodies[locationId],
    id: locationId,
    isScannerDiscovery: false,
    label: celestialBodies[locationId].label,
  }));
  const discoveredLocations = state.discoveredLocations.map((location) => ({
    color: location.color,
    id: location.id,
    isScannerDiscovery: true,
    label: location.name,
    x: location.x,
    y: location.y,
  }));

  return [...staticLocations, ...discoveredLocations];
}

export function isBodyName(value: string): value is BodyName {
  return value in celestialBodies;
}

export function isScannerDiscoveryId(value: string): value is ScannerDiscoveryId {
  return /^scanner-site-\d+$/.test(value);
}

export function createScannerDiscoveries(state: GameState, random = Math.random) {
  const discoveryCount = 1 + Math.floor(random() * 3);
  const anchor = getCurrentAnchorBody(state);
  const origin = getLocationCoordinates(state, state.currentLocation);
  const discoveries: ScannerDiscoveryState[] = [];

  for (let offset = 0; offset < discoveryCount; offset += 1) {
    const numericId = state.nextScannerDiscoveryId + offset;
    const discoveryType =
      SCANNER_DISCOVERY_TYPES[Math.floor(random() * SCANNER_DISCOVERY_TYPES.length)];
    const angle = random() * Math.PI * 2;
    const radius = 0.18 + random() * 1.15;

    discoveries.push({
      anchor,
      color: discoveryType.color,
      id: `scanner-site-${numericId}`,
      kind: discoveryType.kind,
      name: `${discoveryType.label} ${numericId}`,
      resourceYield: createDiscoveryResourceYield(random),
      x: roundToThreeDigits(origin.x + Math.cos(angle) * radius),
      y: roundToThreeDigits(origin.y + Math.sin(angle) * radius),
    });
  }

  return discoveries;
}

function createDiscoveryResourceYield(random: () => number): ResourceState {
  const rewards = createEmptyResourceState();
  const recipe =
    CRAFTING_RECIPES[Math.floor(random() * CRAFTING_RECIPES.length)] ?? CRAFTING_RECIPES[0];

  recipe.ingredients.forEach((ingredient) => {
    const element = ingredient.element;
    rewards[element] = 35 + Math.floor(random() * 31);
  });

  const bonusElements = pickDistinctElements(
    2,
    recipe.ingredients.map((ingredient) => ingredient.element),
    random,
  );

  bonusElements.forEach((element) => {
    rewards[element] += 10 + Math.floor(random() * 21);
  });

  return rewards;
}

function pickDistinctElements(count: number, excludedElements: ElementKey[], random: () => number) {
  const availableElements = ALL_ELEMENTS.filter((element) => !excludedElements.includes(element));
  const selectedElements: ElementKey[] = [];

  while (selectedElements.length < count && availableElements.length > 0) {
    const index = Math.floor(random() * availableElements.length);
    const [element] = availableElements.splice(index, 1);
    selectedElements.push(element);
  }

  return selectedElements;
}

function roundToThreeDigits(value: number) {
  return Number(value.toFixed(3));
}
