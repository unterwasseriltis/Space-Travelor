import type { BodyName } from '@/features/solar-voyage/domain/solar-system';
import { createInitialInventorySlots } from '@/features/solar-voyage/model/crafting';
import {
  createInitialEquipmentSlots,
  INITIAL_FUEL,
  MAX_FUEL,
} from '@/features/solar-voyage/model/equipment';
import { createEmptyResourceState } from '@/features/solar-voyage/model/types';
import type { GameState, LocationId } from '@/features/solar-voyage/model/types';

export function getInitialDestination(currentLocation: BodyName): LocationId {
  return currentLocation === 'Erde' ? 'Mond' : 'Erde';
}

export function createInitialResources() {
  return createEmptyResourceState();
}

export function createInitialGameState(): GameState {
  return {
    arrivalDialog: null,
    phase: 'menu',
    currentLocation: 'Erde',
    discoveredLocations: [],
    missionElapsedSeconds: 0,
    nextScannerDiscoveryId: 1,
    selectedDestination: getInitialDestination('Erde'),
    ship: {
      hull: 100,
      shields: 100,
      fuel: INITIAL_FUEL,
      maxFuel: MAX_FUEL,
    },
    resources: createInitialResources(),
    equipmentSlots: createInitialEquipmentSlots(),
    inventorySlots: createInitialInventorySlots(),
    travel: null,
    notification: null,
  };
}
