import {
  calculateTravelDistanceKm,
  calculateTravelDurationSeconds,
  calculateTravelFuelCost,
  calculateTravelRewards,
} from '@/features/solar-voyage/domain/travel';
import {
  applyEquipmentEffect,
  drainFuel,
  formatFuelValue,
  getEquipmentSlotConfig,
  isFuelDepleted,
  syncEquipmentSlotsWithResources,
} from '@/features/solar-voyage/model/equipment';
import {
  canCraftItem,
  getCraftingRecipe,
  getInventoryItemLabel,
} from '@/features/solar-voyage/model/crafting';
import {
  createInitialGameState,
  createInitialResources,
  getInitialDestination,
} from '@/features/solar-voyage/model/game-state';
import { ELEMENTS } from '@/features/solar-voyage/model/types';
import type { ElementKey, GameAction, GameState } from '@/features/solar-voyage/model/types';

const FUEL_DEPLETED_NOTIFICATION = 'Fuel depleted. Recharge the hydrogen slot to resume travel.';

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

      const requiredFuel = calculateTravelFuelCost(
        state.currentLocation,
        state.selectedDestination,
      );

      if (state.ship.fuel < requiredFuel) {
        return {
          ...state,
          notification: `Not enough fuel. ${formatFuelValue(requiredFuel)} fuel required for this route.`,
        };
      }

      const durationSeconds = calculateTravelDurationSeconds(
        state.currentLocation,
        state.selectedDestination,
      );

      return {
        ...state,
        notification: `Travel to ${state.selectedDestination} started.`,
        travel: {
          origin: state.currentLocation,
          target: state.selectedDestination,
          totalSeconds: durationSeconds,
          remainingSeconds: durationSeconds,
          distanceKm: calculateTravelDistanceKm(state.currentLocation, state.selectedDestination),
          earnedResources: createInitialResources(),
        },
      };
    }

    case 'travel/ticked': {
      if (!state.travel) {
        return state;
      }

      if (isFuelDepleted(state.ship.fuel)) {
        if (state.notification === FUEL_DEPLETED_NOTIFICATION) {
          return state;
        }

        return {
          ...state,
          notification: FUEL_DEPLETED_NOTIFICATION,
        };
      }

      const remainingSeconds = Math.max(0, state.travel.remainingSeconds - 1);
      const remainingFuel = drainFuel(state.ship.fuel);

      if (isFuelDepleted(remainingFuel) && remainingSeconds > 0) {
        return {
          ...state,
          notification: FUEL_DEPLETED_NOTIFICATION,
          ship: {
            ...state.ship,
            fuel: remainingFuel,
          },
        };
      }

      const elapsedSeconds = state.travel.totalSeconds - remainingSeconds;
      const nextRewards = calculateTravelRewards(elapsedSeconds);

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
      const updatedEquipmentSlots = syncEquipmentSlotsWithResources(
        state.equipmentSlots,
        updatedResources,
      );

      if (remainingSeconds === 0) {
        const nextLocation = state.travel.target;
        return {
          ...state,
          currentLocation: nextLocation,
          selectedDestination: getInitialDestination(nextLocation),
          resources: updatedResources,
          equipmentSlots: updatedEquipmentSlots,
          travel: null,
          notification: `Arrival confirmed. Welcome to ${nextLocation}.`,
          ship: {
            ...state.ship,
            fuel: remainingFuel,
          },
        };
      }

      return {
        ...state,
        equipmentSlots: updatedEquipmentSlots,
        resources: updatedResources,
        ship: {
          ...state.ship,
          fuel: remainingFuel,
        },
        travel: {
          ...state.travel,
          remainingSeconds,
          earnedResources: nextEarnedResources,
        },
      };
    }

    case 'equipment/slotUnlocked': {
      const slotConfig = getEquipmentSlotConfig(action.element);

      if (state.resources[action.element] < slotConfig.unlockThreshold) {
        return state;
      }

      return {
        ...state,
        equipmentSlots: state.equipmentSlots.map((slot) =>
          slot.element === action.element ? { ...slot, unlocked: true } : slot,
        ),
      };
    }

    case 'equipment/slotActivated': {
      const slotConfig = getEquipmentSlotConfig(action.element);
      const targetSlot = state.equipmentSlots.find((slot) => slot.element === action.element);

      if (!targetSlot?.unlocked || state.resources[action.element] < slotConfig.activationCost) {
        return state;
      }

      const nextResources = {
        ...state.resources,
        [action.element]: state.resources[action.element] - slotConfig.activationCost,
      };
      const nextShip = applyEquipmentEffect(state.ship, slotConfig);
      const nextEquipmentSlots = syncEquipmentSlotsWithResources(
        state.equipmentSlots.map((slot) =>
          slot.element === action.element
            ? { ...slot, activationCount: slot.activationCount + 1 }
            : slot,
        ),
        nextResources,
      );

      return {
        ...state,
        equipmentSlots: nextEquipmentSlots,
        notification:
          slotConfig.effectKind === 'fuel'
            ? `${ELEMENTS[action.element].name} slot activated. +${formatFuelValue(slotConfig.effectValue)} fuel.`
            : `${ELEMENTS[action.element].name} slot activated. ${slotConfig.placeholderLabel} ${slotConfig.placeholderValue} placeholder applied.`,
        resources: nextResources,
        ship: nextShip,
      };
    }

    case 'crafting/itemCrafted': {
      if (
        state.phase !== 'mission' ||
        !canCraftItem(state.resources, state.inventorySlots, action.item)
      ) {
        return state;
      }

      const recipe = getCraftingRecipe(action.item);
      const nextResources = { ...state.resources };

      recipe.ingredients.forEach((ingredient) => {
        nextResources[ingredient.element] -= ingredient.amount;
      });

      const nextInventorySlots = [...state.inventorySlots];
      nextInventorySlots[recipe.slotIndex] = action.item;

      return {
        ...state,
        inventorySlots: nextInventorySlots,
        notification: `${recipe.label} crafted and moved to inventory slot ${recipe.slotIndex + 1}.`,
        resources: nextResources,
      };
    }

    case 'inventory/itemPressed':
      return {
        ...state,
        notification: `${getInventoryItemLabel(action.item)} is ready, but its action is not implemented yet.`,
      };

    case 'notification/cleared':
      return {
        ...state,
        notification: null,
      };

    default:
      return state;
  }
}
