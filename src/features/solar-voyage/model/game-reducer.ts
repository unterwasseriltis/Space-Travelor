import { calculateHydrogenReward, calculateTravelDistanceKm, calculateTravelDurationSeconds } from '@/features/solar-voyage/domain/travel';
import { createInitialGameState, getInitialDestination } from '@/features/solar-voyage/model/game-state';
import { GameAction, GameState } from '@/features/solar-voyage/model/types';

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'mission/started':
      return {
        ...createInitialGameState(),
        phase: 'mission',
      };

    case 'mission/ticked':
      if (state.phase !== 'mission') {
        return state;
      }

      return {
        ...state,
        missionElapsedSeconds: state.missionElapsedSeconds + 1,
      };

    case 'destination/selected':
      return {
        ...state,
        selectedDestination: action.destination,
      };

    case 'travel/started': {
      if (state.phase !== 'mission' || state.travel || !state.selectedDestination) {
        return state;
      }

      if (state.selectedDestination === state.currentLocation) {
        return {
          ...state,
          notification: 'Choose a new destination before accelerating.',
        };
      }

      const durationSeconds = calculateTravelDurationSeconds(state.currentLocation, state.selectedDestination);

      return {
        ...state,
        notification: `Travel to ${state.selectedDestination} started.`,
        travel: {
          origin: state.currentLocation,
          target: state.selectedDestination,
          totalSeconds: durationSeconds,
          remainingSeconds: durationSeconds,
          distanceKm: calculateTravelDistanceKm(state.currentLocation, state.selectedDestination),
          earnedHydrogen: 0,
        },
      };
    }

    case 'travel/ticked': {
      if (!state.travel) {
        return state;
      }

      const remainingSeconds = Math.max(0, state.travel.remainingSeconds - 1);
      const progress = (state.travel.totalSeconds - remainingSeconds) / state.travel.totalSeconds;
      const nextHydrogen = calculateHydrogenReward(state.travel.distanceKm, progress);
      const hydrogenDelta = nextHydrogen - state.travel.earnedHydrogen;

      if (remainingSeconds === 0) {
        const nextLocation = state.travel.target;
        return {
          ...state,
          currentLocation: nextLocation,
          selectedDestination: getInitialDestination(nextLocation),
          resources: {
            ...state.resources,
            hydrogen: state.resources.hydrogen + Math.max(0, hydrogenDelta),
          },
          travel: null,
          notification: `Arrival confirmed. Welcome to ${nextLocation}.`,
        };
      }

      return {
        ...state,
        resources: {
          ...state.resources,
          hydrogen: state.resources.hydrogen + Math.max(0, hydrogenDelta),
        },
        travel: {
          ...state.travel,
          remainingSeconds,
          earnedHydrogen: nextHydrogen,
        },
      };
    }

    case 'notification/cleared':
      return {
        ...state,
        notification: null,
      };

    default:
      return state;
  }
}
