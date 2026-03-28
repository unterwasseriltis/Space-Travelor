import {
  calculateHydrogenReward,
  calculateTravelDistanceKm,
  calculateTravelDurationSeconds,
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
});
