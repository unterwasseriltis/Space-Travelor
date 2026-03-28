import { KM_PER_AU, calculateDistanceAu } from '@/features/solar-voyage/domain/solar-system';
import type { BodyName } from '@/features/solar-voyage/domain/solar-system';
import { createEmptyBonuses, isRareElement } from '@/features/solar-voyage/model/equipment';
import { ELEMENTS } from '@/features/solar-voyage/model/types';
import type { ElementKey, ResourceState, ShipBonuses } from '@/features/solar-voyage/model/types';

const BASE_RESOURCE_REWARD_PER_SECOND = 1;

export function calculateTravelDurationSeconds(
  from: BodyName,
  to: BodyName,
  travelDurationPct = 0,
) {
  const distanceAu = calculateDistanceAu(from, to);
  const minutes = Math.max(1, Math.round(distanceAu * 16));

  return Math.max(15, Math.round(minutes * 60 * (1 - Math.min(travelDurationPct, 35) / 100)));
}

export function calculateTravelDistanceKm(from: BodyName, to: BodyName) {
  return calculateDistanceAu(from, to) * KM_PER_AU;
}

export function calculateTravelRewards(
  elapsedSeconds: number,
  bonuses: ShipBonuses = createEmptyBonuses(),
): ResourceState {
  const clampedElapsedSeconds = Math.max(0, Math.floor(elapsedSeconds));
  const rewards = {} as ResourceState;

  Object.entries(ELEMENTS).forEach(([key, element]) => {
    const elementKey = key as ElementKey;
    let multiplier = 1;

    if (elementKey !== 'hydrogen') {
      multiplier += bonuses.totalRewardPct / 100;
    }

    if (elementKey === 'hydrogen') {
      multiplier += bonuses.hydrogenRewardPct / 100;
    }

    if (isRareElement(elementKey)) {
      multiplier += bonuses.rareRewardPct / 100;
    }

    rewards[elementKey] = Math.floor(
      clampedElapsedSeconds * BASE_RESOURCE_REWARD_PER_SECOND * element.rarity * multiplier,
    );
  });

  rewards.hydrogen +=
    bonuses.launchHydrogenBonus + Math.floor(clampedElapsedSeconds * bonuses.hydrogenPerTick);
  rewards.helium += Math.floor(clampedElapsedSeconds * bonuses.heliumPerTick);
  rewards.oxygen += Math.floor(clampedElapsedSeconds * bonuses.oxygenPerTick);

  return rewards;
}

export function calculateHydrogenReward(elapsedSeconds: number, bonuses?: ShipBonuses) {
  return calculateTravelRewards(elapsedSeconds, bonuses).hydrogen;
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
