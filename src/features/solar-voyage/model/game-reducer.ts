import {
  calculateTravelDistanceKm,
  calculateTravelDurationSeconds,
  calculateTravelRewards,
} from '@/features/solar-voyage/domain/travel';
import {
  getDiscountedUnlockCost,
  getShipBonusesFromSlots,
  isElementCompatibleWithSlot,
  slotIdLabels,
} from '@/features/solar-voyage/model/equipment';
import {
  createInitialGameState,
  createInitialResources,
  getInitialDestination,
} from '@/features/solar-voyage/model/game-state';
import type { ElementKey, GameAction, GameState } from '@/features/solar-voyage/model/types';

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'state/restored':
      return {
        ...action.state,
        notification:
          action.source === 'import'
            ? 'Save imported successfully.'
            : 'Autosave restored successfully.',
      };

    case 'mission/started':
      return {
        ...createInitialGameState(),
        phase: 'mission',
      };

    case 'mission/ticked':
      if (state.phase !== 'mission') {
        return state;
      }

      return {
        ...state,
        missionElapsedSeconds: state.missionElapsedSeconds + 1,
      };

    case 'destination/selected':
      return {
        ...state,
        selectedDestination: action.destination,
      };

    case 'travel/started': {
      if (state.phase !== 'mission' || state.travel || !state.selectedDestination) {
        return state;
      }

      if (state.selectedDestination === state.currentLocation) {
        return {
          ...state,
          notification: 'Choose a new destination before accelerating.',
        };
      }

      const shipBonuses = getShipBonusesFromSlots(state.equipmentSlots);
      const durationSeconds = calculateTravelDurationSeconds(
        state.currentLocation,
        state.selectedDestination,
        shipBonuses.travelDurationPct,
      );
      const earnedResources = createInitialResources();
      const updatedResources = { ...state.resources };

      if (shipBonuses.launchHydrogenBonus > 0) {
        earnedResources.hydrogen = shipBonuses.launchHydrogenBonus;
        updatedResources.hydrogen += shipBonuses.launchHydrogenBonus;
      }

      return {
        ...state,
        notification: `Travel to ${state.selectedDestination} started.`,
        resources: updatedResources,
        travel: {
          origin: state.currentLocation,
          target: state.selectedDestination,
          totalSeconds: durationSeconds,
          remainingSeconds: durationSeconds,
          distanceKm: calculateTravelDistanceKm(state.currentLocation, state.selectedDestination),
          earnedResources,
        },
      };
    }

    case 'travel/ticked': {
      if (!state.travel) {
        return state;
      }

      const remainingSeconds = Math.max(0, state.travel.remainingSeconds - 1);
      const elapsedSeconds = state.travel.totalSeconds - remainingSeconds;
      const shipBonuses = getShipBonusesFromSlots(state.equipmentSlots);
      const nextRewards = calculateTravelRewards(elapsedSeconds, shipBonuses);

      const updatedResources = { ...state.resources };
      const nextEarnedResources = { ...state.travel.earnedResources };

      Object.keys(nextRewards).forEach((key) => {
        const elementKey = key as ElementKey;
        const delta = Math.max(
          0,
          nextRewards[elementKey] - state.travel!.earnedResources[elementKey],
        );
        updatedResources[elementKey] += delta;
        nextEarnedResources[elementKey] = nextRewards[elementKey];
      });

      if (remainingSeconds === 0) {
        const nextLocation = state.travel.target;

        if (shipBonuses.arrivalHydrogenBonus > 0) {
          updatedResources.hydrogen += shipBonuses.arrivalHydrogenBonus;
        }

        return {
          ...state,
          currentLocation: nextLocation,
          selectedDestination: getInitialDestination(nextLocation),
          resources: updatedResources,
          travel: null,
          notification: `Arrival confirmed. Welcome to ${nextLocation}.`,
        };
      }

      return {
        ...state,
        resources: updatedResources,
        travel: {
          ...state.travel,
          remainingSeconds,
          earnedResources: nextEarnedResources,
        },
      };
    }

    case 'equipment/installed': {
      if (state.phase !== 'mission' || state.travel) {
        return state;
      }

      const slotIndex = state.equipmentSlots.findIndex((slot) => slot.id === action.slotId);

      if (slotIndex < 0) {
        return state;
      }

      const slot = state.equipmentSlots[slotIndex];

      if (
        !slot.unlocked ||
        slot.installedElement ||
        !isElementCompatibleWithSlot(slot.type, action.element) ||
        state.resources[action.element] < 1
      ) {
        return state;
      }

      const equipmentSlots = state.equipmentSlots.map((currentSlot, index) =>
        index === slotIndex ? { ...currentSlot, installedElement: action.element } : currentSlot,
      );

      return {
        ...state,
        equipmentSlots,
        notification: `Installed ${action.element} in ${slotIdLabels[slot.id]}.`,
        resources: {
          ...state.resources,
          [action.element]: state.resources[action.element] - 1,
        },
      };
    }

    case 'equipment/removed': {
      if (state.phase !== 'mission' || state.travel) {
        return state;
      }

      const slotIndex = state.equipmentSlots.findIndex((slot) => slot.id === action.slotId);

      if (slotIndex < 0) {
        return state;
      }

      const slot = state.equipmentSlots[slotIndex];

      if (!slot.unlocked || !slot.installedElement) {
        return state;
      }

      const equipmentSlots = state.equipmentSlots.map((currentSlot, index) =>
        index === slotIndex ? { ...currentSlot, installedElement: null } : currentSlot,
      );

      return {
        ...state,
        equipmentSlots,
        notification: `Removed module from ${slotIdLabels[slot.id]}.`,
      };
    }

    case 'equipment/unlocked': {
      if (state.phase !== 'mission' || state.travel) {
        return state;
      }

      const slotIndex = state.equipmentSlots.findIndex((slot) => slot.id === action.slotId);

      if (slotIndex < 0) {
        return state;
      }

      const slot = state.equipmentSlots[slotIndex];

      if (slot.unlocked || !slot.unlockCost) {
        return state;
      }

      const shipBonuses = getShipBonusesFromSlots(state.equipmentSlots);
      const unlockCost = getDiscountedUnlockCost(slot.unlockCost, shipBonuses.unlockDiscountPct);

      if (!unlockCost) {
        return state;
      }

      const hasRequiredResources = Object.entries(unlockCost).every(([key, value]) => {
        if (typeof value !== 'number') {
          return true;
        }

        return state.resources[key as ElementKey] >= value;
      });

      if (!hasRequiredResources) {
        return state;
      }

      const resources = { ...state.resources };

      Object.entries(unlockCost).forEach(([key, value]) => {
        if (typeof value !== 'number') {
          return;
        }

        resources[key as ElementKey] -= value;
      });

      const equipmentSlots = state.equipmentSlots.map((currentSlot, index) =>
        index === slotIndex ? { ...currentSlot, unlocked: true } : currentSlot,
      );

      return {
        ...state,
        equipmentSlots,
        notification: `Unlocked ${slotIdLabels[slot.id]}.`,
        resources,
      };
    }

    case 'notification/cleared':
      return {
        ...state,
        notification: null,
      };

    default:
      return state;
  }
}
