import {
  calculateTravelRewards,
  calculateHydrogenReward,
  calculateTravelDistanceKm,
  calculateTravelDurationSeconds,
  formatCountdown,
  formatDuration,
} from '@/features/solar-voyage/domain/travel';

describe('travel domain', () => {
  it('calculates at least one minute of travel time', () => {
    expect(calculateTravelDurationSeconds('Erde', 'Mond')).toBe(60);
  });

  it('scales hydrogen yield with distance and progress', () => {
    const distance = calculateTravelDistanceKm('Erde', 'Mars');

    expect(calculateHydrogenReward(distance, 0)).toBe(0);
    expect(calculateHydrogenReward(distance, 0.5)).toBeGreaterThan(0);
    expect(calculateHydrogenReward(distance, 1)).toBeGreaterThan(
      calculateHydrogenReward(distance, 0.5),
    );
  });

  it('formats mission time as hh:mm:ss', () => {
    expect(formatDuration(3661)).toBe('01:01:01');
  });

  it('clamps rewards when progress is outside the valid range', () => {
    const distance = calculateTravelDistanceKm('Erde', 'Mars');

    expect(calculateTravelRewards(distance, -1)).toEqual(calculateTravelRewards(distance, 0));
    expect(calculateTravelRewards(distance, 2)).toEqual(calculateTravelRewards(distance, 1));
  });

  it('returns zero distance and zero rewards when the ship does not move', () => {
    const distance = calculateTravelDistanceKm('Erde', 'Erde');

    expect(distance).toBe(0);
    expect(calculateTravelRewards(distance, 1)).toEqual({
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
});
