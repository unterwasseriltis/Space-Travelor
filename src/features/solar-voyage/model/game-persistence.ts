import { celestialBodies } from '@/features/solar-voyage/domain/solar-system';
import type { BodyName, Coordinates } from '@/features/solar-voyage/domain/solar-system';
import {
  CRAFTING_RECIPES,
  createInitialInventorySlots,
  INVENTORY_SLOT_COUNT,
} from '@/features/solar-voyage/model/crafting';
import {
  createInitialEquipmentSlots,
  INITIAL_FUEL,
  MAX_FUEL,
  syncEquipmentSlotsWithResources,
} from '@/features/solar-voyage/model/equipment';
import { isScannerDiscoveryId } from '@/features/solar-voyage/model/locations';
import { getLocationCoordinates } from '@/features/solar-voyage/model/locations';
import { ELEMENTS } from '@/features/solar-voyage/model/types';
import type {
  ArrivalDialogState,
  ElementKey,
  EquipmentSlotState,
  GamePhase,
  GameState,
  InventoryItemKey,
  InventorySlotState,
  LocationId,
  ResourceState,
  ScannerDiscoveryId,
  ScannerDiscoveryState,
  ShipState,
  SpecialResourceState,
  TravelState,
} from '@/features/solar-voyage/model/types';

const LEGACY_GAME_STATE_STORAGE_KEY = 'space-travelor.game-state.v1';
export const GAME_STATE_STORAGE_KEY = 'space-travelor.game-state.v2';
const GAME_STATE_SNAPSHOT_VERSION = 4;

type GameStateSnapshot = {
  version: typeof GAME_STATE_SNAPSHOT_VERSION;
  savedAt: string;
  state: GameState;
};

export function serializeGameStateSnapshot(state: GameState) {
  return JSON.stringify(createGameStateSnapshot(state), null, 2);
}

export function deserializeGameStateSnapshot(rawSnapshot: string) {
  let parsedSnapshot: unknown;

  try {
    parsedSnapshot = JSON.parse(rawSnapshot);
  } catch {
    throw new Error('Save data is not valid JSON.');
  }

  return validateGameStateSnapshot(parsedSnapshot);
}

export function saveGameStateSnapshot(state: GameState) {
  const storage = getBrowserStorage();

  if (!storage) {
    return;
  }

  storage.setItem(GAME_STATE_STORAGE_KEY, serializeGameStateSnapshot(state));
  storage.removeItem(LEGACY_GAME_STATE_STORAGE_KEY);
}

export function loadStoredGameState() {
  const storage = getBrowserStorage();

  if (!storage) {
    return null;
  }

  const rawSnapshot = storage.getItem(GAME_STATE_STORAGE_KEY);
  const legacySnapshot = storage.getItem(LEGACY_GAME_STATE_STORAGE_KEY);

  if (!rawSnapshot && !legacySnapshot) {
    return null;
  }

  try {
    const restoredState = deserializeGameStateSnapshot(rawSnapshot ?? legacySnapshot ?? '');

    if (!rawSnapshot && legacySnapshot) {
      saveGameStateSnapshot(restoredState);
      storage.removeItem(LEGACY_GAME_STATE_STORAGE_KEY);
    }

    return restoredState;
  } catch {
    storage.removeItem(GAME_STATE_STORAGE_KEY);
    storage.removeItem(LEGACY_GAME_STATE_STORAGE_KEY);
    return null;
  }
}

function createGameStateSnapshot(state: GameState): GameStateSnapshot {
  return {
    version: GAME_STATE_SNAPSHOT_VERSION,
    savedAt: new Date().toISOString(),
    state,
  };
}

function getBrowserStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function validateGameStateSnapshot(snapshot: unknown): GameState {
  const snapshotRecord = getRecord(snapshot, 'Save data is not an object.');

  if ('version' in snapshotRecord) {
    if (
      snapshotRecord.version !== GAME_STATE_SNAPSHOT_VERSION &&
      snapshotRecord.version !== 3 &&
      snapshotRecord.version !== 2 &&
      snapshotRecord.version !== 1
    ) {
      throw new Error('Save data version is not supported.');
    }
  }

  const gameStateSource = 'state' in snapshotRecord ? snapshotRecord.state : snapshotRecord;
  return validateGameState(gameStateSource);
}

function validateGameState(gameState: unknown): GameState {
  const stateRecord = getRecord(gameState, 'Save data is missing the game state.');
  const phase = validatePhase(stateRecord.phase);
  const missionElapsedSeconds = validateWholeNumber(
    stateRecord.missionElapsedSeconds,
    'Mission timer is invalid.',
  );
  const ship = validateShipState(stateRecord.ship);
  const resources = validateResourceState(stateRecord.resources, 'Resource totals are invalid.');
  const equipmentSlots = validateEquipmentSlots(stateRecord.equipmentSlots, resources);
  const inventorySlots = validateInventorySlots(stateRecord.inventorySlots);
  const discoveredLocations = validateDiscoveredLocations(stateRecord.discoveredLocations);
  const knownLocationIds = createKnownLocationIdSet(discoveredLocations);
  const currentLocation = validateLocationId(
    stateRecord.currentLocation,
    knownLocationIds,
    'Current location is invalid.',
  );
  const currentCoordinatesOverride = validateOptionalCoordinates(
    stateRecord.currentCoordinatesOverride,
    'Current coordinates override is invalid.',
  );
  const currentLocationLabelOverride = validateNullableString(
    stateRecord.currentLocationLabelOverride,
    'Current location label override is invalid.',
  );
  const selectedDestination = validateSelectedDestination(
    stateRecord.selectedDestination,
    knownLocationIds,
  );
  const travel = validateTravelState(stateRecord.travel, knownLocationIds, discoveredLocations);
  const notification = validateNotification(stateRecord.notification);
  const arrivalDialog = validateArrivalDialog(stateRecord.arrivalDialog);
  const specialResources = validateSpecialResourceState(stateRecord.specialResources);
  const nextScannerDiscoveryId = validateNextScannerDiscoveryId(
    stateRecord.nextScannerDiscoveryId,
    discoveredLocations,
  );

  if (phase === 'menu' && travel) {
    throw new Error('Menu saves cannot contain active travel.');
  }

  return {
    arrivalDialog,
    currentLocation,
    currentCoordinatesOverride,
    currentLocationLabelOverride,
    discoveredLocations,
    equipmentSlots,
    inventorySlots,
    missionElapsedSeconds,
    nextScannerDiscoveryId,
    notification,
    phase,
    resources,
    selectedDestination,
    ship,
    specialResources,
    travel,
  };
}

function validatePhase(value: unknown): GamePhase {
  if (value === 'menu' || value === 'mission') {
    return value;
  }

  throw new Error('Game phase is invalid.');
}

function validateShipState(value: unknown): ShipState {
  const shipRecord = getRecord(value, 'Ship state is invalid.');

  return {
    hull: validateWholeNumber(shipRecord.hull, 'Ship hull value is invalid.'),
    shields: validateWholeNumber(shipRecord.shields, 'Ship shield value is invalid.'),
    fuel: validateNonNegativeNumber(shipRecord.fuel, INITIAL_FUEL),
    maxFuel: validatePositiveNumber(shipRecord.maxFuel, MAX_FUEL),
  };
}

function validateResourceState(value: unknown, errorMessage: string): ResourceState {
  const resourceRecord = getRecord(value, errorMessage);
  const resources = {} as ResourceState;

  (Object.keys(ELEMENTS) as ElementKey[]).forEach((elementKey) => {
    resources[elementKey] = validateWholeNumber(
      resourceRecord[elementKey],
      `Resource "${elementKey}" is invalid.`,
    );
  });

  return resources;
}

function validateSpecialResourceState(value: unknown): SpecialResourceState {
  if (value === undefined) {
    return {
      diamonds: 0,
      plasma: 0,
      rawOre: 0,
    };
  }

  const resourceRecord = getRecord(value, 'Special resources are invalid.');

  return {
    diamonds: validateWholeNumber(resourceRecord.diamonds, 'Diamonds are invalid.'),
    plasma: validateWholeNumber(resourceRecord.plasma, 'Plasma is invalid.'),
    rawOre: validateWholeNumber(resourceRecord.rawOre, 'Raw ore is invalid.'),
  };
}

function validateTravelState(
  value: unknown,
  knownLocationIds: Set<LocationId>,
  discoveredLocations: ScannerDiscoveryState[],
): TravelState | null {
  if (value === null || value === undefined) {
    return null;
  }

  const travelRecord = getRecord(value, 'Travel state is invalid.');
  const totalSeconds = validateWholeNumber(
    travelRecord.totalSeconds,
    'Travel duration is invalid.',
  );
  const remainingSeconds = validateWholeNumber(
    travelRecord.remainingSeconds,
    'Travel countdown is invalid.',
  );

  if (remainingSeconds > totalSeconds) {
    throw new Error('Travel countdown cannot exceed the travel duration.');
  }

  return {
    origin: validateLocationId(travelRecord.origin, knownLocationIds, 'Travel origin is invalid.'),
    originCoordinates: validateTravelCoordinates(
      travelRecord.originCoordinates,
      travelRecord.origin,
      knownLocationIds,
      discoveredLocations,
      'Travel origin coordinates are invalid.',
    ),
    target: validateLocationId(
      travelRecord.target,
      knownLocationIds,
      'Travel destination is invalid.',
    ),
    targetCoordinates: validateTravelCoordinates(
      travelRecord.targetCoordinates,
      travelRecord.target,
      knownLocationIds,
      discoveredLocations,
      'Travel target coordinates are invalid.',
    ),
    totalSeconds,
    remainingSeconds,
    distanceKm: validateNumber(travelRecord.distanceKm, 'Travel distance is invalid.'),
    earnedResources: validateResourceState(
      travelRecord.earnedResources,
      'Earned travel resources are invalid.',
    ),
    status: validateTravelStatus(travelRecord.status),
  };
}

function validateEquipmentSlots(value: unknown, resources: ResourceState): EquipmentSlotState[] {
  if (value === undefined) {
    return syncEquipmentSlotsWithResources(createInitialEquipmentSlots(), resources);
  }

  if (!Array.isArray(value)) {
    throw new Error('Equipment slots are invalid.');
  }

  const seenElements = new Set<ElementKey>();
  const equipmentSlots = value.map((entry) => {
    const slotRecord = getRecord(entry, 'Equipment slots are invalid.');
    const element = validateElementKey(slotRecord.element, 'Equipment slot element is invalid.');

    if (seenElements.has(element)) {
      throw new Error('Equipment slots contain duplicate elements.');
    }

    seenElements.add(element);

    if (typeof slotRecord.unlocked !== 'boolean') {
      throw new Error('Equipment slot unlock state is invalid.');
    }

    return {
      activationCount: validateWholeNumber(
        slotRecord.activationCount,
        `Equipment slot "${element}" activation count is invalid.`,
      ),
      element,
      unlocked: slotRecord.unlocked,
    };
  });

  return syncEquipmentSlotsWithResources(equipmentSlots, resources);
}

function validateInventorySlots(value: unknown): InventorySlotState[] {
  if (value === undefined) {
    return createInitialInventorySlots();
  }

  if (!Array.isArray(value)) {
    throw new Error('Inventory slots are invalid.');
  }

  if (value.every((entry) => entry === null || isInventoryItemKey(entry))) {
    return migrateLegacyInventorySlots(value);
  }

  if (value.length !== INVENTORY_SLOT_COUNT) {
    throw new Error('Inventory slots are invalid.');
  }

  return value.map((entry, index) => {
    const slotRecord = getRecord(entry, 'Inventory slots are invalid.');
    const expectedItem = CRAFTING_RECIPES[index].item;
    const item = validateInventoryItemKey(slotRecord.item, 'Inventory item is invalid.');

    if (item !== expectedItem) {
      throw new Error('Inventory slots are in the wrong order.');
    }

    return {
      count: validateWholeNumber(slotRecord.count, `Inventory slot "${item}" count is invalid.`),
      item,
    };
  });
}

function validateDiscoveredLocations(value: unknown): ScannerDiscoveryState[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error('Discovered locations are invalid.');
  }

  const seenIds = new Set<ScannerDiscoveryId>();

  return value.map((entry) => {
    const locationRecord = getRecord(entry, 'Discovered locations are invalid.');
    const id = validateScannerDiscoveryId(locationRecord.id, 'Scanner discovery id is invalid.');

    if (seenIds.has(id)) {
      throw new Error('Discovered locations contain duplicate ids.');
    }

    seenIds.add(id);

    const anchor = validateBodyName(locationRecord.anchor, 'Scanner discovery anchor is invalid.');
    const kind = validateScannerDiscoveryKind(locationRecord.kind);
    const name = validateString(locationRecord.name, 'Scanner discovery name is invalid.');
    const color = validateString(locationRecord.color, 'Scanner discovery color is invalid.');

    return {
      anchor,
      color,
      id,
      kind,
      name,
      resourceYield: validateResourceState(
        locationRecord.resourceYield,
        'Scanner discovery resources are invalid.',
      ),
      x: validateSignedNumber(locationRecord.x, 'Scanner discovery X coordinate is invalid.'),
      y: validateSignedNumber(locationRecord.y, 'Scanner discovery Y coordinate is invalid.'),
    };
  });
}

function validateLocationId(
  value: unknown,
  knownLocationIds: Set<LocationId>,
  errorMessage: string,
): LocationId {
  if (typeof value === 'string' && knownLocationIds.has(value as LocationId)) {
    return value as LocationId;
  }

  throw new Error(errorMessage);
}

function validateSelectedDestination(
  value: unknown,
  knownLocationIds: Set<LocationId>,
): LocationId | '' {
  if (value === '') {
    return value;
  }

  return validateLocationId(value, knownLocationIds, 'Selected destination is invalid.');
}

function validateBodyName(value: unknown, errorMessage: string): BodyName {
  if (typeof value === 'string' && value in celestialBodies) {
    return value as BodyName;
  }

  throw new Error(errorMessage);
}

function validateNotification(value: unknown) {
  if (typeof value === 'string' || value === null || value === undefined) {
    return value ?? null;
  }

  throw new Error('Save notification is invalid.');
}

function validateArrivalDialog(value: unknown): ArrivalDialogState {
  if (value === null || value === undefined) {
    return null;
  }

  const dialogRecord = getRecord(value, 'Arrival dialog is invalid.');

  return {
    message: validateString(dialogRecord.message, 'Arrival dialog message is invalid.'),
  };
}

function validateTravelStatus(value: unknown): TravelState['status'] {
  if (value === undefined) {
    return 'active';
  }

  if (value === 'active' || value === 'paused') {
    return value;
  }

  throw new Error('Travel status is invalid.');
}

function validateNextScannerDiscoveryId(
  value: unknown,
  discoveredLocations: ScannerDiscoveryState[],
) {
  if (value === undefined) {
    return getDefaultNextScannerDiscoveryId(discoveredLocations);
  }

  const nextId = validateWholeNumber(value, 'Next scanner discovery id is invalid.');
  return Math.max(nextId, getDefaultNextScannerDiscoveryId(discoveredLocations));
}

function migrateLegacyInventorySlots(value: unknown[]) {
  const migratedSlots = createInitialInventorySlots();

  CRAFTING_RECIPES.forEach((recipe) => {
    if (value[recipe.slotIndex] === recipe.item) {
      migratedSlots[recipe.slotIndex].count = 1;
    }
  });

  return migratedSlots;
}

function createKnownLocationIdSet(discoveredLocations: ScannerDiscoveryState[]) {
  return new Set<LocationId>([
    ...(Object.keys(celestialBodies) as BodyName[]),
    ...discoveredLocations.map((location) => location.id),
  ]);
}

function getDefaultNextScannerDiscoveryId(discoveredLocations: ScannerDiscoveryState[]) {
  const highestNumericId = discoveredLocations.reduce((highestId, location) => {
    const numericId = Number(location.id.replace('scanner-site-', ''));
    return Number.isFinite(numericId) ? Math.max(highestId, numericId) : highestId;
  }, 0);

  return highestNumericId + 1;
}

function validateElementKey(value: unknown, errorMessage: string): ElementKey {
  if (typeof value === 'string' && value in ELEMENTS) {
    return value as ElementKey;
  }

  throw new Error(errorMessage);
}

function validateInventoryItemKey(value: unknown, errorMessage: string): InventoryItemKey {
  if (isInventoryItemKey(value)) {
    return value;
  }

  throw new Error(errorMessage);
}

function validateScannerDiscoveryId(value: unknown, errorMessage: string): ScannerDiscoveryId {
  if (typeof value === 'string' && isScannerDiscoveryId(value)) {
    return value;
  }

  throw new Error(errorMessage);
}

function validateScannerDiscoveryKind(value: unknown): ScannerDiscoveryState['kind'] {
  if (value === 'asteroidCluster' || value === 'debrisField' || value === 'oreDeposit') {
    return value;
  }

  throw new Error('Scanner discovery kind is invalid.');
}

function validateWholeNumber(value: unknown, errorMessage: string) {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }

  throw new Error(errorMessage);
}

function validateNumber(value: unknown, errorMessage: string) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }

  throw new Error(errorMessage);
}

function validateSignedNumber(value: unknown, errorMessage: string) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  throw new Error(errorMessage);
}

function validateString(value: unknown, errorMessage: string) {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  throw new Error(errorMessage);
}

function validateNullableString(value: unknown, errorMessage: string) {
  if (value === undefined || value === null) {
    return null;
  }

  return validateString(value, errorMessage);
}

function validateOptionalCoordinates(value: unknown, errorMessage: string): Coordinates | null {
  if (value === undefined || value === null) {
    return null;
  }

  const coordinateRecord = getRecord(value, errorMessage);

  return {
    x: validateSignedNumber(coordinateRecord.x, errorMessage),
    y: validateSignedNumber(coordinateRecord.y, errorMessage),
  };
}

function validateTravelCoordinates(
  value: unknown,
  locationValue: unknown,
  knownLocationIds: Set<LocationId>,
  discoveredLocations: ScannerDiscoveryState[],
  errorMessage: string,
): Coordinates {
  const fallbackLocationId = validateLocationId(locationValue, knownLocationIds, errorMessage);
  const fallbackState = { discoveredLocations };

  return (
    validateOptionalCoordinates(value, errorMessage) ??
    getLocationCoordinates(fallbackState, fallbackLocationId)
  );
}

function validateNonNegativeNumber(value: unknown, fallbackValue: number) {
  if (value === undefined) {
    return fallbackValue;
  }

  return validateNumber(value, 'Ship fuel value is invalid.');
}

function validatePositiveNumber(value: unknown, fallbackValue: number) {
  if (value === undefined) {
    return fallbackValue;
  }

  const validatedNumber = validateNumber(value, 'Ship max fuel value is invalid.');

  if (validatedNumber <= 0) {
    throw new Error('Ship max fuel value is invalid.');
  }

  return validatedNumber;
}

function getRecord(value: unknown, errorMessage: string) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  throw new Error(errorMessage);
}

function isInventoryItemKey(value: unknown): value is InventoryItemKey {
  return value === 'miningLaser' || value === 'shieldBooster' || value === 'scannerModule';
}
