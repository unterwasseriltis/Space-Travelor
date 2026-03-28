import { celestialBodies } from '@/features/solar-voyage/domain/solar-system';
import type { BodyName } from '@/features/solar-voyage/domain/solar-system';
import { createInitialEquipmentSlots } from '@/features/solar-voyage/model/equipment';
import { ELEMENTS } from '@/features/solar-voyage/model/types';
import type {
  ElementKey,
  EquipmentSlotState,
  GamePhase,
  GameState,
  ResourceState,
  ShipState,
  TravelState,
} from '@/features/solar-voyage/model/types';

export const GAME_STATE_STORAGE_KEY = 'space-travelor.game-state.v1';
const GAME_STATE_SNAPSHOT_VERSION = 2;

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
}

export function loadStoredGameState() {
  const storage = getBrowserStorage();

  if (!storage) {
    return null;
  }

  const rawSnapshot = storage.getItem(GAME_STATE_STORAGE_KEY);

  if (!rawSnapshot) {
    return null;
  }

  try {
    return deserializeGameStateSnapshot(rawSnapshot);
  } catch {
    storage.removeItem(GAME_STATE_STORAGE_KEY);
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
    if (snapshotRecord.version !== 1 && snapshotRecord.version !== GAME_STATE_SNAPSHOT_VERSION) {
      throw new Error('Save data version is not supported.');
    }
  }

  const gameStateSource = 'state' in snapshotRecord ? snapshotRecord.state : snapshotRecord;

  return validateGameState(gameStateSource);
}

function validateGameState(gameState: unknown): GameState {
  const stateRecord = getRecord(gameState, 'Save data is missing the game state.');
  const phase = validatePhase(stateRecord.phase);
  const currentLocation = validateBodyName(
    stateRecord.currentLocation,
    'Current location is invalid.',
  );
  const selectedDestination = validateSelectedDestination(stateRecord.selectedDestination);
  const missionElapsedSeconds = validateWholeNumber(
    stateRecord.missionElapsedSeconds,
    'Mission timer is invalid.',
  );
  const ship = validateShipState(stateRecord.ship);
  const resources = validateResourceState(stateRecord.resources, 'Resource totals are invalid.');
  const equipmentSlots = validateEquipmentSlots(stateRecord.equipmentSlots);
  const travel = validateTravelState(stateRecord.travel);
  const notification = validateNotification(stateRecord.notification);

  if (phase === 'menu' && travel) {
    throw new Error('Menu saves cannot contain active travel.');
  }

  return {
    phase,
    currentLocation,
    missionElapsedSeconds,
    selectedDestination,
    ship,
    resources,
    equipmentSlots,
    travel,
    notification,
  };
}

function validatePhase(value: unknown): GamePhase {
  if (value === 'menu' || value === 'mission') {
    return value;
  }

  throw new Error('Game phase is invalid.');
}

function validateBodyName(value: unknown, errorMessage: string): BodyName {
  if (typeof value === 'string' && value in celestialBodies) {
    return value as BodyName;
  }

  throw new Error(errorMessage);
}

function validateSelectedDestination(value: unknown): BodyName | '' {
  if (value === '') {
    return value;
  }

  return validateBodyName(value, 'Selected destination is invalid.');
}

function validateShipState(value: unknown): ShipState {
  const shipRecord = getRecord(value, 'Ship state is invalid.');

  return {
    hull: validateWholeNumber(shipRecord.hull, 'Ship hull value is invalid.'),
    shields: validateWholeNumber(shipRecord.shields, 'Ship shield value is invalid.'),
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

function validateEquipmentSlots(value: unknown): EquipmentSlotState[] {
  if (typeof value === 'undefined') {
    return createInitialEquipmentSlots();
  }

  if (!Array.isArray(value)) {
    throw new Error('Equipment slots are invalid.');
  }

  const defaultSlots = createInitialEquipmentSlots();

  if (value.length !== defaultSlots.length) {
    throw new Error('Equipment slot count is invalid.');
  }

  return value.map((slotValue, index) => {
    const defaultSlot = defaultSlots[index];
    const slotRecord = getRecord(slotValue, 'Equipment slot is invalid.');

    if (slotRecord.id !== defaultSlot.id || slotRecord.type !== defaultSlot.type) {
      throw new Error('Equipment slot identity is invalid.');
    }

    if (typeof slotRecord.unlocked !== 'boolean') {
      throw new Error('Equipment slot unlock state is invalid.');
    }

    const installedElement = validateInstalledElement(slotRecord.installedElement);

    return {
      ...defaultSlot,
      unlocked: slotRecord.unlocked,
      installedElement,
    };
  });
}

function validateTravelState(value: unknown): TravelState | null {
  if (value === null) {
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
    origin: validateBodyName(travelRecord.origin, 'Travel origin is invalid.'),
    target: validateBodyName(travelRecord.target, 'Travel destination is invalid.'),
    totalSeconds,
    remainingSeconds,
    distanceKm: validateNumber(travelRecord.distanceKm, 'Travel distance is invalid.'),
    earnedResources: validateResourceState(
      travelRecord.earnedResources,
      'Earned travel resources are invalid.',
    ),
  };
}

function validateNotification(value: unknown) {
  if (typeof value === 'string' || value === null) {
    return value;
  }

  throw new Error('Save notification is invalid.');
}

function validateInstalledElement(value: unknown): ElementKey | null {
  if (value === null) {
    return null;
  }

  if (typeof value === 'string' && value in ELEMENTS) {
    return value as ElementKey;
  }

  throw new Error('Installed element is invalid.');
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

function getRecord(value: unknown, errorMessage: string) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  throw new Error(errorMessage);
}
