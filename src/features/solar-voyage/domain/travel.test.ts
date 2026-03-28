import {
  calculateTravelRewards,
  calculateHydrogenReward,
  calculateTravelDistanceKm,
  calculateTravelDurationSeconds,
  calculateTravelFuelCost,
  formatCountdown,
  formatDuration,
} from '@/features/solar-voyage/domain/travel';

describe('travel domain', () => {
  it('calculates at least one minute of travel time', () => {
    expect(calculateTravelDurationSeconds('Erde', 'Mond')).toBe(60);
  });

  it('scales hydrogen yield with elapsed travel time', () => {
    expect(calculateHydrogenReward(0)).toBe(0);
    expect(calculateHydrogenReward(30)).toBeGreaterThan(0);
    expect(calculateHydrogenReward(60)).toBeGreaterThan(calculateHydrogenReward(30));
  });

  it('derives fuel cost from travel duration', () => {
    expect(calculateTravelFuelCost('Erde', 'Mond')).toBeGreaterThan(0);
    expect(calculateTravelFuelCost('Erde', 'Uranus')).toBeGreaterThan(
      calculateTravelFuelCost('Erde', 'Mond'),
    );
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
});
