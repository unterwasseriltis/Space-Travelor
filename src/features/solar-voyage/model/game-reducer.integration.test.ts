import { calculateTravelRewards } from '@/features/solar-voyage/domain/travel';
import { gameReducer } from '@/features/solar-voyage/model/game-reducer';
import {
  createInitialGameState,
  createInitialResources,
} from '@/features/solar-voyage/model/game-state';

describe('gameReducer integration', () => {
  it('ignores mission and travel ticks when those systems are inactive', () => {
    const initialState = createInitialGameState();

    expect(gameReducer(initialState, { type: 'mission/ticked' })).toEqual(initialState);
    expect(gameReducer(initialState, { type: 'travel/ticked' })).toEqual(initialState);
  });

  it('refuses to start travel to the current location', () => {
    let state = createInitialGameState();

    state = gameReducer(state, { type: 'mission/started' });
    state = gameReducer(state, { type: 'destination/selected', destination: 'Erde' });
    state = gameReducer(state, { type: 'travel/started' });

    expect(state.travel).toBeNull();
    expect(state.notification).toBe('Choose a new destination before accelerating.');
  });

  it('starts a mission and completes travel to the moon', () => {
    let state = createInitialGameState();

    state = gameReducer(state, { type: 'mission/started' });
    expect(state.phase).toBe('mission');

    state = gameReducer(state, { type: 'destination/selected', destination: 'Mond' });
    state = gameReducer(state, { type: 'travel/started' });
    expect(state.travel).not.toBeNull();

    while (state.travel) {
      state = gameReducer(state, { type: 'travel/ticked' });
    }

    expect(state.currentLocation).toBe('Mond');
    expect(state.resources.hydrogen).toBeGreaterThanOrEqual(0);
    expect(state.notification).toContain('Arrival confirmed');
    expect(state.selectedDestination).toBe('Erde');
  });

  it('awards the same resources for the same number of travel seconds across routes', () => {
    const travelForSeconds = (destination: 'Mars' | 'Uranus', seconds: number) => {
      let state = createInitialGameState();

      state = gameReducer(state, { type: 'mission/started' });
      state = gameReducer(state, { type: 'destination/selected', destination });
      state = gameReducer(state, { type: 'travel/started' });

      for (let tick = 0; tick < seconds; tick += 1) {
        state = gameReducer(state, { type: 'travel/ticked' });
      }

      return state.resources;
    };

    expect(travelForSeconds('Mars', 120)).toEqual(travelForSeconds('Uranus', 120));
  });

  it('unlocks a slot automatically when an element reaches 100 units during travel', () => {
    const earnedResources = calculateTravelRewards(99);
    const initialState = createInitialGameState();
    const stateWithTravel = {
      ...initialState,
      phase: 'mission' as const,
      resources: earnedResources,
      ship: {
        ...initialState.ship,
        fuel: 10,
      },
      travel: {
        distanceKm: 100,
        earnedResources,
        origin: 'Erde' as const,
        remainingSeconds: 2,
        target: 'Mars' as const,
        totalSeconds: 101,
      },
    };

    const nextState = gameReducer(stateWithTravel, { type: 'travel/ticked' });

    expect(nextState.resources.hydrogen).toBe(100);
    expect(nextState.equipmentSlots.find((slot) => slot.element === 'hydrogen')?.unlocked).toBe(
      true,
    );
  });

  it('activates the hydrogen slot, consumes resources, and refills fuel', () => {
    const initialState = createInitialGameState();
    const missionState = {
      ...initialState,
      phase: 'mission' as const,
      resources: {
        ...initialState.resources,
        hydrogen: 100,
      },
      ship: {
        ...initialState.ship,
        fuel: 90,
      },
      equipmentSlots: initialState.equipmentSlots.map((slot) =>
        slot.element === 'hydrogen' ? { ...slot, unlocked: true } : slot,
      ),
    };

    const nextState = gameReducer(missionState, {
      type: 'equipment/slotActivated',
      element: 'hydrogen',
    });

    expect(nextState.resources.hydrogen).toBe(0);
    expect(nextState.ship.fuel).toBe(95);
    expect(
      nextState.equipmentSlots.find((slot) => slot.element === 'hydrogen')?.activationCount,
    ).toBe(1);
  });

  it('runs placeholder slots through the same activation flow', () => {
    const initialState = createInitialGameState();
    const missionState = {
      ...initialState,
      phase: 'mission' as const,
      resources: {
        ...initialState.resources,
        oxygen: 100,
      },
      equipmentSlots: initialState.equipmentSlots.map((slot) =>
        slot.element === 'oxygen' ? { ...slot, unlocked: true } : slot,
      ),
    };

    const nextState = gameReducer(missionState, {
      type: 'equipment/slotActivated',
      element: 'oxygen',
    });

    expect(nextState.resources.oxygen).toBe(0);
    expect(
      nextState.equipmentSlots.find((slot) => slot.element === 'oxygen')?.activationCount,
    ).toBe(1);
    expect(nextState.notification).toContain('placeholder applied');
  });

  it('blocks travel when there is not enough fuel for the route', () => {
    const initialState = createInitialGameState();
    const missionState = {
      ...initialState,
      phase: 'mission' as const,
      selectedDestination: 'Uranus' as const,
      ship: {
        ...initialState.ship,
        fuel: 10,
      },
    };

    const nextState = gameReducer(missionState, { type: 'travel/started' });

    expect(nextState.travel).toBeNull();
    expect(nextState.notification).toContain('Not enough fuel');
  });

  it('stops active travel when fuel runs out mid-flight', () => {
    const initialState = createInitialGameState();
    const missionState = {
      ...initialState,
      phase: 'mission' as const,
      ship: {
        ...initialState.ship,
        fuel: 0.005,
      },
      travel: {
        distanceKm: 100,
        earnedResources: createInitialResources(),
        origin: 'Erde' as const,
        remainingSeconds: 3,
        target: 'Mars' as const,
        totalSeconds: 3,
      },
    };

    const nextState = gameReducer(missionState, { type: 'travel/ticked' });

    expect(nextState.travel?.remainingSeconds).toBe(3);
    expect(nextState.ship.fuel).toBe(0);
    expect(nextState.notification).toContain('Fuel depleted');
  });

  it('clears notifications without mutating the rest of the state', () => {
    const initialState = createInitialGameState();
    const stateWithNotification = {
      ...initialState,
      notification: 'Test notification',
    };

    expect(gameReducer(stateWithNotification, { type: 'notification/cleared' })).toEqual({
      ...initialState,
      notification: null,
    });
  });

  it('restores imported state and replaces the notification with import feedback', () => {
    const importedState = {
      ...createInitialGameState(),
      missionElapsedSeconds: 18,
      notification: null,
      phase: 'mission' as const,
    };

    expect(
      gameReducer(createInitialGameState(), {
        type: 'state/restored',
        source: 'import',
        state: importedState,
      }),
    ).toEqual({
      ...importedState,
      notification: 'Save imported successfully.',
    });
  });
});
