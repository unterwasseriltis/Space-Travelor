import { celestialBodies } from '@/features/solar-voyage/domain/solar-system';
import {
  createInitialGameState,
  createInitialResources,
} from '@/features/solar-voyage/model/game-state';
import {
  getAvailableDestinations,
  getCurrentCoordinatesLabel,
  getCurrentPosition,
  getMissionTimerLabel,
  getTravelCountdownLabel,
  getTravelProgress,
} from '@/features/solar-voyage/model/selectors';
import type { GameState } from '@/features/solar-voyage/model/types';

describe('selectors', () => {
  it('lists destinations except the current location', () => {
    expect(getAvailableDestinations('Erde')).toEqual([
      'Mond',
      'Venus',
      'Mars',
      'Merkur',
      'Jupiter',
      'Saturn',
      'Uranus',
    ]);
  });

  it('returns the docked body coordinates when not traveling', () => {
    const state = createInitialGameState();

    expect(getCurrentPosition(state)).toEqual(celestialBodies.Erde);
    expect(getCurrentCoordinatesLabel(state)).toBe('X: 1.000 AU | Y: 0.000 AU');
  });

  it('interpolates position and labels while traveling', () => {
    const state: GameState = {
      ...createInitialGameState(),
      missionElapsedSeconds: 3723,
      travel: {
        origin: 'Erde',
        target: 'Mars',
        totalSeconds: 200,
        remainingSeconds: 50,
        distanceKm: 100,
        earnedResources: createInitialResources(),
      },
    };

    expect(getTravelProgress(state)).toBe(0.75);
    expect(getCurrentPosition(state)).toEqual({ x: 1.393, y: 0.6375 });
    expect(getCurrentCoordinatesLabel(state)).toBe('X: 1.393 AU | Y: 0.637 AU');
    expect(getTravelCountdownLabel(state)).toBe('0:50');
    expect(getMissionTimerLabel(state)).toBe('01:02:03');
  });

  it('returns null countdown and zero progress when no travel is active', () => {
    const state = createInitialGameState();

    expect(getTravelCountdownLabel(state)).toBeNull();
    expect(getTravelProgress(state)).toBe(0);
  });
});
