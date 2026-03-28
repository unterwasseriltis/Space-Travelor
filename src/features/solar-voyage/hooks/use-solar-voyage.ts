import { useEffect, useReducer, useRef } from 'react';
import type { BodyName } from '@/features/solar-voyage/domain/solar-system';

import { gameReducer } from '@/features/solar-voyage/model/game-reducer';
import {
  deserializeGameStateSnapshot,
  loadStoredGameState,
  saveGameStateSnapshot,
  serializeGameStateSnapshot,
} from '@/features/solar-voyage/model/game-persistence';
import { createInitialGameState } from '@/features/solar-voyage/model/game-state';
import {
  getAvailableDestinations,
  getCurrentCoordinatesLabel,
  getCurrentPosition,
  getMissionTimerLabel,
  getTravelCountdownLabel,
  getTravelProgress,
} from '@/features/solar-voyage/model/selectors';
import type { ElementKey } from '@/features/solar-voyage/model/types';

export function useSolarVoyage() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);
  const isTraveling = Boolean(state.travel);
  const hasSavedMission = state.phase === 'mission' || loadStoredGameState() !== null;
  const latestStateRef = useRef(state);

  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

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

  useEffect(() => {
    if (state.phase !== 'mission') {
      return undefined;
    }

    saveGameStateSnapshot(latestStateRef.current);

    const handlePageHide = () => {
      saveGameStateSnapshot(latestStateRef.current);
    };

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [state.phase]);

  useEffect(() => {
    if (
      state.phase !== 'mission' ||
      state.missionElapsedSeconds === 0 ||
      state.missionElapsedSeconds % 5 !== 0
    ) {
      return;
    }

    saveGameStateSnapshot(state);
  }, [state]);

  const restoreState = (source: 'autosave' | 'import', rawSnapshot: string) => {
    const restoredState = deserializeGameStateSnapshot(rawSnapshot);

    saveGameStateSnapshot(restoredState);
    dispatch({ type: 'state/restored', source, state: restoredState });
  };

  const loadSavedMission = () => {
    const restoredState = loadStoredGameState();

    if (!restoredState) {
      return false;
    }

    dispatch({ type: 'state/restored', source: 'autosave', state: restoredState });
    return true;
  };

  return {
    state,
    hasSavedMission,
    availableDestinations: getAvailableDestinations(state.currentLocation),
    coordinatesLabel: getCurrentCoordinatesLabel(state),
    missionTimerLabel: getMissionTimerLabel(state),
    travelCountdownLabel: getTravelCountdownLabel(state),
    travelProgress: getTravelProgress(state),
    currentPosition: getCurrentPosition(state),
    startMission: () => dispatch({ type: 'mission/started' }),
    selectDestination: (destination: BodyName | '') =>
      dispatch({ type: 'destination/selected', destination }),
    startTravel: () => dispatch({ type: 'travel/started' }),
    activateEquipmentSlot: (element: ElementKey) =>
      dispatch({ type: 'equipment/slotActivated', element }),
    clearNotification: () => dispatch({ type: 'notification/cleared' }),
    exportSnapshot: () => serializeGameStateSnapshot(state),
    importSnapshot: (rawSnapshot: string) => restoreState('import', rawSnapshot),
    loadSavedMission,
  };
}
