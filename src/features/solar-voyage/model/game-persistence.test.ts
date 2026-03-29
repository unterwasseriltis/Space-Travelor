import {
  deserializeGameStateSnapshot,
  GAME_STATE_STORAGE_KEY,
  loadStoredGameState,
} from '@/features/solar-voyage/model/game-persistence';
import { createInitialGameState } from '@/features/solar-voyage/model/game-state';

describe('game persistence', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('migrates a legacy v1 snapshot to the fuel and equipment state shape', () => {
    const legacyState = {
      currentLocation: 'Erde',
      missionElapsedSeconds: 12,
      notification: null,
      phase: 'mission',
      resources: {
        aluminium: 0,
        beryllium: 0,
        boron: 0,
        carbon: 0,
        fluorine: 0,
        helium: 0,
        hydrogen: 100,
        lithium: 0,
        magnesium: 0,
        neon: 0,
        nitrogen: 0,
        oxygen: 0,
        silicon: 0,
        sodium: 0,
      },
      selectedDestination: 'Mond',
      ship: {
        hull: 100,
        shields: 100,
      },
      travel: null,
    };

    const migratedState = deserializeGameStateSnapshot(
      JSON.stringify({
        savedAt: '2026-03-29T00:00:00.000Z',
        state: legacyState,
        version: 1,
      }),
    );

    expect(migratedState.ship.fuel).toBe(100);
    expect(migratedState.ship.maxFuel).toBe(100);
    expect(migratedState.equipmentSlots).toHaveLength(14);
    expect(migratedState.inventorySlots).toHaveLength(3);
    expect(migratedState.inventorySlots[0]).toEqual({ count: 0, item: 'miningLaser' });
    expect(migratedState.equipmentSlots.find((slot) => slot.element === 'hydrogen')?.unlocked).toBe(
      true,
    );
  });

  it('loads a legacy local-storage snapshot and rewrites it to the new storage key', () => {
    const legacyState = createInitialGameState();

    localStorage.setItem(
      'space-travelor.game-state.v1',
      JSON.stringify({
        savedAt: '2026-03-29T00:00:00.000Z',
        state: {
          ...legacyState,
          equipmentSlots: undefined,
          ship: {
            hull: legacyState.ship.hull,
            shields: legacyState.ship.shields,
          },
        },
        version: 1,
      }),
    );

    const restoredState = loadStoredGameState();

    expect(restoredState?.ship.fuel).toBe(100);
    expect(localStorage.getItem(GAME_STATE_STORAGE_KEY)).toContain('"version": 3');
    expect(localStorage.getItem('space-travelor.game-state.v1')).toBeNull();
  });
});
