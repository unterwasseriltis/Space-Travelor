import { interpolateCoordinates } from '@/features/solar-voyage/domain/solar-system';
import type { BodyName, Coordinates } from '@/features/solar-voyage/domain/solar-system';
import {
  calculateTravelDistanceKm,
  calculateTravelDurationSeconds,
  calculateTravelFuelCost,
  calculateTravelRewards,
} from '@/features/solar-voyage/domain/travel';
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
  ScannerDiscoveryState,
  SpecialResourceState,
  TravelState,
} from '@/features/solar-voyage/model/types';

const DEEP_SPACE_LABEL = 'Tiefer Weltraum';
const FUEL_DEPLETED_NOTIFICATION =
  'Treibstoff aufgebraucht. Lade den Wasserstoff-Slot nach, um den Flug fortzusetzen.';
const SHIELD_BOOST_AMOUNT = 20;

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'state/restored':
      return {
        ...action.state,
        notification:
          action.source === 'import'
            ? 'Speicherstand erfolgreich importiert.'
            : 'Automatische Speicherung erfolgreich wiederhergestellt.',
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

    case 'travel/started':
      return startTravel(state);

    case 'travel/ticked':
      return tickTravel(state);

    case 'travel/paused':
      if (!state.travel || state.travel.status === 'paused') {
        return state;
      }

      return {
        ...state,
        notification: 'Flug pausiert. Das Schiff haelt seinen aktuellen Vektor.',
        travel: {
          ...state.travel,
          status: 'paused',
        },
      };

    case 'travel/resumed':
      if (!state.travel || state.travel.status !== 'paused') {
        return state;
      }

      return {
        ...state,
        notification: `Flug in Richtung ${getLocationLabel(state, state.travel.target)} fortgesetzt.`,
        travel: {
          ...state.travel,
          status: 'active',
        },
      };

    case 'travel/aborted':
      if (!state.travel) {
        return state;
      }

      return {
        ...state,
        currentCoordinatesOverride: getTravelPosition(state.travel),
        currentLocationLabelOverride: DEEP_SPACE_LABEL,
        notification: 'Flug abgebrochen. Das Schiff bleibt auf seinen aktuellen Koordinaten.',
        selectedDestination: '',
        travel: null,
      };

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
            ? `${ELEMENTS[action.element].name}-Slot aktiviert. +${formatFuelValue(slotConfig.effectValue)} Treibstoff.`
            : `${ELEMENTS[action.element].name}-Slot aktiviert. ${slotConfig.placeholderLabel} ${slotConfig.placeholderValue} als Platzhalter angewendet.`,
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
        notification: `${recipe.label} hergestellt. Bestand in Slot ${recipe.slotIndex + 1} liegt jetzt bei ${nextSlotCount}.`,
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

function startTravel(state: GameState): GameState {
  if (state.phase !== 'mission' || state.travel || !state.selectedDestination) {
    return state;
  }

  const currentCoordinates = getDockedCoordinates(state);
  const destinationCoordinates = getLocationCoordinates(state, state.selectedDestination);
  const requiredFuel = calculateTravelFuelCost(currentCoordinates, destinationCoordinates);
  const destinationLabel = getLocationLabel(state, state.selectedDestination);

  if (
    state.currentCoordinatesOverride === null &&
    state.selectedDestination === state.currentLocation
  ) {
    return {
      ...state,
      notification: 'Waehle vor dem Start ein neues Ziel.',
    };
  }

  if (state.ship.fuel < requiredFuel) {
    return {
      ...state,
      notification: `Nicht genug Treibstoff. Fuer diese Route werden ${formatFuelValue(requiredFuel)} Einheiten benoetigt.`,
    };
  }

  const durationSeconds = calculateTravelDurationSeconds(
    currentCoordinates,
    destinationCoordinates,
  );

  return {
    ...state,
    arrivalDialog: null,
    currentCoordinatesOverride: null,
    currentLocationLabelOverride: null,
    notification: `Flug nach ${destinationLabel} gestartet.`,
    travel: {
      distanceKm: calculateTravelDistanceKm(currentCoordinates, destinationCoordinates),
      earnedResources: createInitialResources(),
      origin: state.currentLocation,
      originCoordinates: currentCoordinates,
      remainingSeconds: durationSeconds,
      status: 'active',
      target: state.selectedDestination,
      targetCoordinates: destinationCoordinates,
      totalSeconds: durationSeconds,
    },
  };
}

function tickTravel(state: GameState): GameState {
  if (!state.travel || state.travel.status !== 'active') {
    return state;
  }

  if (isFuelDepleted(state.ship.fuel)) {
    if (state.notification === FUEL_DEPLETED_NOTIFICATION && state.travel.status === 'paused') {
      return state;
    }

    return {
      ...state,
      notification: FUEL_DEPLETED_NOTIFICATION,
      travel: {
        ...state.travel,
        status: 'paused',
      },
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
      travel: {
        ...state.travel,
        status: 'paused',
      },
    };
  }

  const elapsedSeconds = state.travel.totalSeconds - remainingSeconds;
  const nextRewards = calculateTravelRewards(elapsedSeconds);
  const updatedResources = { ...state.resources };
  const nextEarnedResources = { ...state.travel.earnedResources };

  Object.keys(nextRewards).forEach((key) => {
    const elementKey = key as ElementKey;
    const delta = Math.max(0, nextRewards[elementKey] - state.travel!.earnedResources[elementKey]);
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
        label: nextLocationLabel,
        locationId: nextLocation,
        message: getLocationArrivalMessage(state, nextLocation),
      },
      currentCoordinatesOverride: null,
      currentLocation: nextLocation,
      currentLocationLabelOverride: null,
      equipmentSlots: updatedEquipmentSlots,
      notification: `Ankunft bestaetigt. ${nextLocationLabel} erreicht.`,
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
      earnedResources: nextEarnedResources,
      remainingSeconds,
    },
  };
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
        notification: `Schild-Booster eingesetzt. Schilde +${SHIELD_BOOST_AMOUNT}%`,
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
        notification: `Scannerlauf abgeschlossen. ${discoveries.length} neue Ziele entdeckt.`,
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
      notification: 'Am aktuellen Ort ist kein Roherz-Vorkommen verfuegbar.',
    };
  }

  const targetDiscovery = state.discoveredLocations.find(
    (location) => location.id === state.currentLocation,
  );

  if (!targetDiscovery) {
    return {
      ...state,
      notification: 'Am aktuellen Ort ist kein Roherz-Vorkommen verfuegbar.',
    };
  }

  const nextResources = applyResourceYield(state.resources, targetDiscovery.resourceYield);
  const nextEquipmentSlots = syncEquipmentSlotsWithResources(state.equipmentSlots, nextResources);
  const nextSpecialResources = applySpecialResourceYield(
    state.specialResources,
    rollMiningLaserResources(targetDiscovery),
  );
  const remainingDiscoveries = state.discoveredLocations.filter(
    (location) => location.id !== targetDiscovery.id,
  );
  const fallbackLocation: BodyName = targetDiscovery.anchor;

  return consumeInventoryItem(
    {
      ...state,
      currentCoordinatesOverride: null,
      currentLocation: fallbackLocation,
      currentLocationLabelOverride: null,
      discoveredLocations: remainingDiscoveries,
      equipmentSlots: nextEquipmentSlots,
      resources: nextResources,
      selectedDestination: getInitialDestination(fallbackLocation),
      specialResources: nextSpecialResources,
    },
    'miningLaser',
    {
      notification: createMiningLaserNotification(
        targetDiscovery,
        nextSpecialResources,
        state.specialResources,
      ),
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

function applySpecialResourceYield(
  specialResources: SpecialResourceState,
  reward: SpecialResourceState,
) {
  return {
    diamonds: specialResources.diamonds + reward.diamonds,
    plasma: specialResources.plasma + reward.plasma,
    rawOre: specialResources.rawOre + reward.rawOre,
  };
}

function getDockedCoordinates(state: GameState): Coordinates {
  return state.currentCoordinatesOverride ?? getLocationCoordinates(state, state.currentLocation);
}

function getTravelPosition(travel: TravelState) {
  const progress = (travel.totalSeconds - travel.remainingSeconds) / travel.totalSeconds;

  return interpolateCoordinates(travel.originCoordinates, travel.targetCoordinates, progress);
}

function rollMiningLaserResources(discovery: ScannerDiscoveryState): SpecialResourceState {
  if (discovery.kind === 'debrisField') {
    return { diamonds: 0, plasma: 0, rawOre: 0 };
  }

  const outcomeRoll = Math.random();
  const oreAmount =
    discovery.kind === 'oreDeposit'
      ? 2 + Math.floor(Math.random() * 3)
      : 1 + Math.floor(Math.random() * 3);
  const diamondAmount = 1 + Math.floor(Math.random() * 2);

  if (outcomeRoll < 0.22) {
    return { diamonds: 0, plasma: 0, rawOre: 0 };
  }

  if (outcomeRoll < 0.78) {
    return { diamonds: 0, plasma: 0, rawOre: oreAmount };
  }

  if (outcomeRoll < 0.92) {
    return { diamonds: diamondAmount, plasma: 0, rawOre: 0 };
  }

  return { diamonds: diamondAmount, plasma: 0, rawOre: oreAmount };
}

function createMiningLaserNotification(
  discovery: ScannerDiscoveryState,
  nextSpecialResources: SpecialResourceState,
  previousSpecialResources: SpecialResourceState,
) {
  const rawOreDelta = nextSpecialResources.rawOre - previousSpecialResources.rawOre;
  const diamondDelta = nextSpecialResources.diamonds - previousSpecialResources.diamonds;

  if (rawOreDelta === 0 && diamondDelta === 0) {
    return `Mining-Laser hat Grundmaterialien aus ${discovery.name} geborgen. Keine Spezialressourcen gefunden, Vorkommen erschoepft.`;
  }

  if (rawOreDelta > 0 && diamondDelta > 0) {
    return `Mining-Laser hat ${discovery.name} abgebaut: +${rawOreDelta} Roherze und +${diamondDelta} Diamanten. Vorkommen erschoepft.`;
  }

  if (diamondDelta > 0) {
    return `Mining-Laser hat +${diamondDelta} Diamanten aus ${discovery.name} geborgen. Vorkommen erschoepft.`;
  }

  return `Mining-Laser hat +${rawOreDelta} Roherze aus ${discovery.name} geborgen. Vorkommen erschoepft.`;
}
