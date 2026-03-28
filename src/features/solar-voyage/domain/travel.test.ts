import {
  calculateTravelRewards,
  calculateHydrogenReward,
  calculateTravelDistanceKm,
  calculateTravelDurationSeconds,
  formatCountdown,
  formatDuration,
} from '@/features/solar-voyage/domain/travel';
import { createEmptyBonuses } from '@/features/solar-voyage/model/equipment';

describe('travel domain', () => {
  it('calculates at least one minute of travel time', () => {
    expect(calculateTravelDurationSeconds('Erde', 'Mond')).toBe(60);
  });

  it('scales hydrogen yield with elapsed travel time', () => {
    expect(calculateHydrogenReward(0)).toBe(0);
    expect(calculateHydrogenReward(30)).toBeGreaterThan(0);
    expect(calculateHydrogenReward(60)).toBeGreaterThan(calculateHydrogenReward(30));
  });

  it('formats mission time as hh:mm:ss', () => {
    expect(formatDuration(3661)).toBe('01:01:01');
  });

  it('clamps rewards when elapsed seconds are outside the valid range', () => {
    expect(calculateTravelRewards(-1)).toEqual(calculateTravelRewards(0));
    expect(calculateTravelRewards(2.8)).toEqual(calculateTravelRewards(2));
  });

  it('returns zero distance and zero rewards when the ship does not move', () => {
    const distance = calculateTravelDistanceKm('Erde', 'Erde');

    expect(distance).toBe(0);
    expect(calculateTravelRewards(0)).toEqual({
      aluminium: 0,
      beryllium: 0,
      boron: 0,
      carbon: 0,
      fluorine: 0,
      helium: 0,
      hydrogen: 0,
      lithium: 0,
      magnesium: 0,
      neon: 0,
      nitrogen: 0,
      oxygen: 0,
      silicon: 0,
      sodium: 0,
    });
  });

  it('formats countdown values and clamps negatives to zero', () => {
    expect(formatCountdown(65)).toBe('1:05');
    expect(formatCountdown(-5)).toBe('0:00');
  });

  it('formats negative mission time as zeroed duration', () => {
    expect(formatDuration(-10)).toBe('00:00:00');
  });

  it('applies travel bonuses for duration, rewards, and passive regeneration deterministically', () => {
    const bonuses = createEmptyBonuses();
    bonuses.travelDurationPct = 13;
    bonuses.hydrogenRewardPct = 15;
    bonuses.rareRewardPct = 22;
    bonuses.hydrogenPerTick = 1 / 15;
    bonuses.heliumPerTick = 1 / 30;
    bonuses.launchHydrogenBonus = 1;

    expect(calculateTravelDurationSeconds('Erde', 'Mond', bonuses.travelDurationPct)).toBe(52);
    expect(calculateTravelRewards(30, bonuses)).toMatchObject({
      helium: 26,
      hydrogen: 37,
      silicon: 1,
    });
    expect(calculateHydrogenReward(30, bonuses)).toBe(37);
  });
});
