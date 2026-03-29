import {
  formatCoordinates,
  interpolateCoordinates,
} from '@/features/solar-voyage/domain/solar-system';
import { formatCountdown, formatDuration } from '@/features/solar-voyage/domain/travel';
import {
  getAvailableDestinationOptions,
  getLocationCoordinates,
  getLocationLabel,
  getMapLocations,
} from '@/features/solar-voyage/model/locations';
import type { GameState } from '@/features/solar-voyage/model/types';

export function getAvailableDestinations(state: GameState) {
  return getAvailableDestinationOptions(state);
}

export function getCurrentLocationLabel(state: GameState) {
  return getLocationLabel(state, state.currentLocation);
}

export function getMapMarkers(state: GameState) {
  return getMapLocations(state);
}

export function getCurrentPosition(state: GameState) {
  if (!state.travel) {
    return getLocationCoordinates(state, state.currentLocation);
  }

  const progress = getTravelProgress(state);
  return interpolateCoordinates(
    getLocationCoordinates(state, state.travel.origin),
    getLocationCoordinates(state, state.travel.target),
    progress,
  );
}

export function getCurrentCoordinatesLabel(state: GameState) {
  return formatCoordinates(getCurrentPosition(state));
}

export function getMissionTimerLabel(state: GameState) {
  return formatDuration(state.missionElapsedSeconds);
}

export function getTravelCountdownLabel(state: GameState) {
  if (!state.travel) {
    return null;
  }

  return formatCountdown(state.travel.remainingSeconds);
}

export function getTravelProgress(state: GameState) {
  if (!state.travel) {
    return 0;
  }

  return (state.travel.totalSeconds - state.travel.remainingSeconds) / state.travel.totalSeconds;
}
