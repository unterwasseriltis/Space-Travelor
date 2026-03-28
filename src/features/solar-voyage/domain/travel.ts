import { KM_PER_AU, calculateDistanceAu } from '@/features/solar-voyage/domain/solar-system';
import type { BodyName } from '@/features/solar-voyage/domain/solar-system';
import { ELEMENTS } from '@/features/solar-voyage/model/types';
import type { ElementKey, ResourceState } from '@/features/solar-voyage/model/types';

const BASE_RESOURCE_REWARD_PER_SECOND = 1;

export function calculateTravelDurationSeconds(from: BodyName, to: BodyName) {
  const distanceAu = calculateDistanceAu(from, to);
  const minutes = Math.max(1, Math.round(distanceAu * 16));

  return minutes * 60;
}

export function calculateTravelDistanceKm(from: BodyName, to: BodyName) {
  return calculateDistanceAu(from, to) * KM_PER_AU;
}

export function calculateTravelRewards(elapsedSeconds: number): ResourceState {
  const clampedElapsedSeconds = Math.max(0, Math.floor(elapsedSeconds));
  const rewards = {} as ResourceState;

  Object.entries(ELEMENTS).forEach(([key, element]) => {
    rewards[key as ElementKey] = Math.floor(
      clampedElapsedSeconds * BASE_RESOURCE_REWARD_PER_SECOND * element.rarity,
    );
  });

  return rewards;
}

export function calculateHydrogenReward(elapsedSeconds: number) {
  return calculateTravelRewards(elapsedSeconds).hydrogen;
}

export function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
