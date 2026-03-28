import {
  deserializeGameStateSnapshot,
  serializeGameStateSnapshot,
} from '@/features/solar-voyage/model/game-persistence';
import { createInitialGameState } from '@/features/solar-voyage/model/game-state';

describe('game persistence', () => {
  it('migrates v1 snapshots without equipment slots', () => {
    const legacyState = createInitialGameState();

    const legacySnapshot = JSON.stringify({
      version: 1,
      savedAt: '2026-03-28T00:00:00.000Z',
      state: {
        ...legacyState,
        equipmentSlots: undefined,
        phase: 'mission',
      },
    });

    const restoredState = deserializeGameStateSnapshot(legacySnapshot);

    expect(restoredState.equipmentSlots).toHaveLength(10);
    expect(restoredState.equipmentSlots.filter((slot) => slot.unlocked)).toHaveLength(5);
    expect(restoredState.equipmentSlots.every((slot) => slot.installedElement === null)).toBe(true);
  });

  it('serializes equipment slots in current snapshots', () => {
    const state = createInitialGameState();
    state.equipmentSlots[0] = {
      ...state.equipmentSlots[0],
      installedElement: 'hydrogen',
    };

    expect(serializeGameStateSnapshot(state)).toContain('"equipmentSlots"');
  });
});
