import { useEffect, useReducer } from 'react';
import type { BodyName } from '@/features/solar-voyage/domain/solar-system';

import { gameReducer } from '@/features/solar-voyage/model/game-reducer';
import { createInitialGameState } from '@/features/solar-voyage/model/game-state';
import {
  getAvailableDestinations,
  getCurrentCoordinatesLabel,
  getCurrentPosition,
  getMissionTimerLabel,
  getTravelCountdownLabel,
  getTravelProgress,
} from '@/features/solar-voyage/model/selectors';

export function useSolarVoyage() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);
  const isTraveling = Boolean(state.travel);

  useEffect(() => {
    if (state.phase !== 'mission') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      dispatch({ type: 'mission/ticked' });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [state.phase]);

  useEffect(() => {
    if (!isTraveling) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      dispatch({ type: 'travel/ticked' });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isTraveling]);

  return {
    state,
    availableDestinations: getAvailableDestinations(state.currentLocation),
    coordinatesLabel: getCurrentCoordinatesLabel(state),
    missionTimerLabel: getMissionTimerLabel(state),
    travelCountdownLabel: getTravelCountdownLabel(state),
    travelProgress: getTravelProgress(state),
    currentPosition: getCurrentPosition(state),
    startMission: () => dispatch({ type: 'mission/started' }),
    selectDestination: (destination: BodyName | '') => dispatch({ type: 'destination/selected', destination }),
    startTravel: () => dispatch({ type: 'travel/started' }),
    clearNotification: () => dispatch({ type: 'notification/cleared' }),
  };
}
