import type { BodyName } from '@/features/solar-voyage/domain/solar-system';
import { ELEMENTS } from '@/features/solar-voyage/model/types';
import type { ElementKey, GameState } from '@/features/solar-voyage/model/types';

export const shipSlotLabels = Array.from({ length: 6 }, (_, index) => `Slot ${index + 1}`);
export const inventoryItemLabels = Array.from({ length: 9 }, (_, index) => `Item ${index + 1}`);

export function getInitialDestination(currentLocation: BodyName): BodyName {
  return currentLocation === 'Erde' ? 'Mond' : 'Erde';
}

export function createInitialResources(): Record<ElementKey, number> {
  const resources = {} as Record<ElementKey, number>;
  Object.keys(ELEMENTS).forEach((key) => {
    resources[key as ElementKey] = 0;
  });
  return resources;
}

export function createInitialGameState(): GameState {
  return {
    phase: 'menu',
    currentLocation: 'Erde',
    missionElapsedSeconds: 0,
    selectedDestination: getInitialDestination('Erde'),
    ship: {
      hull: 100,
      shields: 100,
    },
    resources: createInitialResources(),
    travel: null,
    notification: null,
  };
}
