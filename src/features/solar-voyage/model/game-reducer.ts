import {
  calculateTravelDistanceKm,
  calculateTravelDurationSeconds,
  calculateTravelFuelCost,
  calculateTravelRewards,
} from '@/features/solar-voyage/domain/travel';
import type { BodyName } from '@/features/solar-voyage/domain/solar-system';
import {
  canCraftItem,
  getCraftingRecipe,
  getInventorySlot,
} from '@/features/solar-voyage/model/crafting';
import {
  applyEquipmentEffect,
  drainFuel,
  formatFuelValue,
  getEquipmentSlotConfig,
  isFuelDepleted,
  syncEquipmentSlotsWithResources,
} from '@/features/solar-voyage/model/equipment';
import {
  createInitialGameState,
  createInitialResources,
  getInitialDestination,
} from '@/features/solar-voyage/model/game-state';
import {
  createScannerDiscoveries,
  getLocationArrivalMessage,
  getLocationCoordinates,
  getLocationLabel,
  isBodyName,
} from '@/features/solar-voyage/model/locations';
import { ELEMENTS } from '@/features/solar-voyage/model/types';
import type {
  ElementKey,
  GameAction,
  GameState,
  InventoryItemKey,
  ResourceState,
} from '@/features/solar-voyage/model/types';

const FUEL_DEPLETED_NOTIFICATION = 'Fuel depleted. Recharge the hydrogen slot to resume travel.';
const SHIELD_BOOST_AMOUNT = 20;

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

      const currentCoordinates = getLocationCoordinates(state, state.currentLocation);
      const destinationCoordinates = getLocationCoordinates(state, state.selectedDestination);
      const requiredFuel = calculateTravelFuelCost(currentCoordinates, destinationCoordinates);
      const destinationLabel = getLocationLabel(state, state.selectedDestination);

      if (state.ship.fuel < requiredFuel) {
        return {
          ...state,
          notification: `Not enough fuel. ${formatFuelValue(requiredFuel)} fuel required for this route.`,
        };
      }

      const durationSeconds = calculateTravelDurationSeconds(
        currentCoordinates,
        destinationCoordinates,
      );

      return {
        ...state,
        arrivalDialog: null,
        notification: `Travel to ${destinationLabel} started.`,
        travel: {
          origin: state.currentLocation,
          target: state.selectedDestination,
          totalSeconds: durationSeconds,
          remainingSeconds: durationSeconds,
          distanceKm: calculateTravelDistanceKm(currentCoordinates, destinationCoordinates),
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
        const nextLocationLabel = getLocationLabel(state, nextLocation);
        const nextSelectedDestination = isBodyName(nextLocation)
          ? getInitialDestination(nextLocation)
          : '';

        return {
          ...state,
          arrivalDialog: {
            message: getLocationArrivalMessage(state, nextLocation),
          },
          currentLocation: nextLocation,
          equipmentSlots: updatedEquipmentSlots,
          notification: `Arrival confirmed. ${nextLocationLabel} reached.`,
          resources: updatedResources,
          selectedDestination: nextSelectedDestination,
          ship: {
            ...state.ship,
            fuel: remainingFuel,
          },
          travel: null,
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
      if (state.phase !== 'mission' || !canCraftItem(state.resources, action.item)) {
        return state;
      }

      const recipe = getCraftingRecipe(action.item);
      const nextResources = { ...state.resources };

      recipe.ingredients.forEach((ingredient) => {
        const element = ingredient.element;
        nextResources[element] -= ingredient.amount;
      });

      const nextInventorySlots = state.inventorySlots.map((slot) =>
        slot.item === action.item ? { ...slot, count: slot.count + 1 } : slot,
      );
      const nextSlotCount = getInventorySlot(nextInventorySlots, action.item).count;

      return {
        ...state,
        inventorySlots: nextInventorySlots,
        notification: `${recipe.label} crafted. Slot ${recipe.slotIndex + 1} stock increased to ${nextSlotCount}.`,
        resources: nextResources,
      };
    }

    case 'inventory/itemPressed':
      return handleInventoryItemPressed(state, action.item);

    case 'arrivalDialog/cleared':
      return {
        ...state,
        arrivalDialog: null,
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

function handleInventoryItemPressed(state: GameState, item: InventoryItemKey): GameState {
  if (state.phase !== 'mission') {
    return state;
  }

  const selectedSlot = getInventorySlot(state.inventorySlots, item);

  if (selectedSlot.count <= 0) {
    return state;
  }

  switch (item) {
    case 'miningLaser':
      return activateMiningLaser(state);

    case 'shieldBooster':
      return consumeInventoryItem(state, item, {
        notification: `Shield Booster used. Shields +${SHIELD_BOOST_AMOUNT}%`,
        ship: {
          ...state.ship,
          shields: Math.min(100, state.ship.shields + SHIELD_BOOST_AMOUNT),
        },
      });

    case 'scannerModule': {
      const discoveries = createScannerDiscoveries(state);

      return consumeInventoryItem(state, item, {
        discoveredLocations: [...state.discoveredLocations, ...discoveries],
        nextScannerDiscoveryId: state.nextScannerDiscoveryId + discoveries.length,
        notification: `Scanner ping complete. ${discoveries.length} neue Ziele entdeckt.`,
      });
    }

    default:
      return state;
  }
}

function activateMiningLaser(state: GameState): GameState {
  if (isBodyName(state.currentLocation)) {
    return {
      ...state,
      notification: 'No raw ore deposit is available at the current location.',
    };
  }

  const targetDiscovery = state.discoveredLocations.find(
    (location) => location.id === state.currentLocation,
  );

  if (!targetDiscovery) {
    return {
      ...state,
      notification: 'No raw ore deposit is available at the current location.',
    };
  }

  const nextResources = applyResourceYield(state.resources, targetDiscovery.resourceYield);
  const nextEquipmentSlots = syncEquipmentSlotsWithResources(state.equipmentSlots, nextResources);
  const remainingDiscoveries = state.discoveredLocations.filter(
    (location) => location.id !== targetDiscovery.id,
  );
  const fallbackLocation: BodyName = targetDiscovery.anchor;

  return consumeInventoryItem(
    {
      ...state,
      currentLocation: fallbackLocation,
      discoveredLocations: remainingDiscoveries,
      equipmentSlots: nextEquipmentSlots,
      resources: nextResources,
      selectedDestination: getInitialDestination(fallbackLocation),
    },
    'miningLaser',
    {
      notification: `Mining Laser extracted raw ore from ${targetDiscovery.name}. The site has been depleted.`,
    },
  );
}

function consumeInventoryItem(
  state: GameState,
  item: InventoryItemKey,
  updates: Partial<GameState>,
): GameState {
  return {
    ...state,
    ...updates,
    inventorySlots: state.inventorySlots.map((slot) =>
      slot.item === item ? { ...slot, count: Math.max(0, slot.count - 1) } : slot,
    ),
  };
}

function applyResourceYield(resources: ResourceState, reward: ResourceState) {
  const nextResources = { ...resources };

  Object.keys(reward).forEach((key) => {
    const elementKey = key as ElementKey;
    nextResources[elementKey] += reward[elementKey];
  });

  return nextResources;
}
