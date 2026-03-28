import {
  celestialBodies,
  formatCoordinates,
  interpolateCoordinates,
} from '@/features/solar-voyage/domain/solar-system';
import { formatCountdown, formatDuration } from '@/features/solar-voyage/domain/travel';
import {
  BASE_INVENTORY_SLOTS,
  getAllowedElementsForSlot as getAllowedElementsForSlotFromConfig,
  getShipBonusesFromSlots,
} from '@/features/solar-voyage/model/equipment';
import type { EquipmentSlotType, GameState } from '@/features/solar-voyage/model/types';

export function getAvailableDestinations(currentLocation: GameState['currentLocation']) {
  return Object.keys(celestialBodies).filter(
    (body) => body !== currentLocation,
  ) as GameState['currentLocation'][];
}

export function getCurrentPosition(state: GameState) {
  if (!state.travel) {
    return celestialBodies[state.currentLocation];
  }

  const progress = getTravelProgress(state);
  return interpolateCoordinates(
    celestialBodies[state.travel.origin],
    celestialBodies[state.travel.target],
    progress,
  );
}

export function getCurrentCoordinatesLabel(state: GameState) {
  return formatCoordinates(getCurrentPosition(state));
}

export function getMissionTimerLabel(state: GameState) {
  return formatDuration(state.missionElapsedSeconds);
}

export function getShipBonuses(state: GameState) {
  return getShipBonusesFromSlots(state.equipmentSlots);
}

export function getAvailableInventorySlots(state: GameState) {
  return BASE_INVENTORY_SLOTS + getShipBonuses(state).inventoryBonusSlots;
}

export function getAllowedElementsForSlot(slotType: EquipmentSlotType) {
  return getAllowedElementsForSlotFromConfig(slotType);
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
