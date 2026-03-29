import { celestialBodies } from '@/features/solar-voyage/domain/solar-system';
import {
  createInitialGameState,
  createInitialResources,
} from '@/features/solar-voyage/model/game-state';
import {
  getAvailableDestinations,
  getCurrentCoordinatesLabel,
  getCurrentLocationLabel,
  getCurrentPosition,
  getMissionTimerLabel,
  getTravelCountdownLabel,
  getTravelProgress,
} from '@/features/solar-voyage/model/selectors';
import type { GameState } from '@/features/solar-voyage/model/types';

describe('selectors', () => {
  it('lists destinations except the current location', () => {
    const destinations = getAvailableDestinations(createInitialGameState());

    expect(destinations.map((destination) => destination.label)).toContain('Mond');
    expect(destinations.map((destination) => destination.label)).toContain('Phobos');
    expect(destinations.map((destination) => destination.label)).toContain('Ganymed');
    expect(destinations.map((destination) => destination.label)).not.toContain('Erde');
  });

  it('returns the docked body coordinates when not traveling', () => {
    const state = createInitialGameState();

    expect(getCurrentPosition(state)).toEqual(celestialBodies.Erde);
    expect(getCurrentCoordinatesLabel(state)).toBe('X: 1.000 AU | Y: 0.000 AU');
    expect(getCurrentLocationLabel(state)).toBe('Erde');
  });

  it('interpolates position and labels while traveling', () => {
    const state: GameState = {
      ...createInitialGameState(),
      missionElapsedSeconds: 3723,
      travel: {
        distanceKm: 100,
        earnedResources: createInitialResources(),
        origin: 'Erde',
        originCoordinates: celestialBodies.Erde,
        target: 'Mars',
        targetCoordinates: celestialBodies.Mars,
        status: 'active',
        totalSeconds: 200,
        remainingSeconds: 50,
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

  it('uses deep-space coordinates and label overrides when travel has been aborted', () => {
    const state: GameState = {
      ...createInitialGameState(),
      currentCoordinatesOverride: { x: 2.345, y: -1.111 },
      currentLocationLabelOverride: 'Deep Space Hold',
    };

    expect(getCurrentPosition(state)).toEqual({ x: 2.345, y: -1.111 });
    expect(getCurrentCoordinatesLabel(state)).toBe('X: 2.345 AU | Y: -1.111 AU');
    expect(getCurrentLocationLabel(state)).toBe('Deep Space Hold');
  });
});
