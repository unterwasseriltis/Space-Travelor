import { MOON_ARRIVAL_VISUAL_CONFIG } from '@/config/arrival-visuals';
import { getArrivalVisuals } from '@/features/solar-voyage/ui/mission-control/arrival-visuals';

describe('getArrivalVisuals', () => {
  it('uses the configured portrait and scene images from the arrival config', () => {
    const visuals = getArrivalVisuals({
      locationId: 'Mond',
      message: 'Willkommen auf dem Mond.',
      label: 'Mond',
    });

    expect(visuals.portraitSrc).toBe(MOON_ARRIVAL_VISUAL_CONFIG.portraitSrc);
    expect(visuals.sceneSrc).toBe(MOON_ARRIVAL_VISUAL_CONFIG.sceneSrc);
  });
});
