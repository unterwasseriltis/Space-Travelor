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

  it('installs equipment by consuming exactly one resource', () => {
    let state = createInitialGameState();
    state = {
      ...state,
      phase: 'mission',
      resources: {
        ...createInitialResources(),
        hydrogen: 1,
      },
    };

    state = gameReducer(state, {
      type: 'equipment/installed',
      element: 'hydrogen',
      slotId: 'propulsion-alpha',
    });

    expect(state.resources.hydrogen).toBe(0);
    expect(
      state.equipmentSlots.find((slot) => slot.id === 'propulsion-alpha')?.installedElement,
    ).toBe('hydrogen');
  });

  it('refuses incompatible element installs for specialized slots', () => {
    let state = createInitialGameState();
    state = {
      ...state,
      phase: 'mission',
      resources: {
        ...createInitialResources(),
        carbon: 1,
      },
    };

    state = gameReducer(state, {
      type: 'equipment/installed',
      element: 'carbon',
      slotId: 'propulsion-alpha',
    });

    expect(state.resources.carbon).toBe(1);
    expect(
      state.equipmentSlots.find((slot) => slot.id === 'propulsion-alpha')?.installedElement,
    ).toBeNull();
  });

  it('applies unlock discounts when expanding a bay', () => {
    let state = createInitialGameState();
    state = {
      ...state,
      phase: 'mission',
      resources: {
        ...createInitialResources(),
        aluminium: 4,
        boron: 1,
        carbon: 6,
      },
    };

    state = gameReducer(state, {
      type: 'equipment/installed',
      element: 'boron',
      slotId: 'systems-alpha',
    });
    state = gameReducer(state, {
      type: 'equipment/installed',
      element: 'aluminium',
      slotId: 'structure-alpha',
    });
    state = gameReducer(state, { type: 'equipment/unlocked', slotId: 'universal-beta' });

    expect(state.resources.carbon).toBe(0);
    expect(state.resources.aluminium).toBe(0);
    expect(state.equipmentSlots.find((slot) => slot.id === 'universal-beta')?.unlocked).toBe(true);
  });

  it('uses installed modules for travel duration and launch bonuses', () => {
    let state = createInitialGameState();
    state = {
      ...state,
      phase: 'mission',
      resources: {
        ...createInitialResources(),
        hydrogen: 1,
        silicon: 1,
        sodium: 1,
      },
    };

    state = gameReducer(state, {
      type: 'equipment/installed',
      element: 'hydrogen',
      slotId: 'propulsion-alpha',
    });
    state = gameReducer(state, {
      type: 'equipment/installed',
      element: 'silicon',
      slotId: 'systems-alpha',
    });
    state = gameReducer(state, {
      type: 'equipment/installed',
      element: 'sodium',
      slotId: 'reactor-alpha',
    });
    state = gameReducer(state, { type: 'destination/selected', destination: 'Mond' });
    state = gameReducer(state, { type: 'travel/started' });

    expect(state.travel?.totalSeconds).toBe(52);
    expect(state.resources.hydrogen).toBe(1);
  });
});
