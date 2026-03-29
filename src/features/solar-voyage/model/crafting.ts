import type {
  ElementKey,
  InventoryItemKey,
  InventorySlotState,
  ResourceState,
} from '@/features/solar-voyage/model/types';

export const INVENTORY_SLOT_COUNT = 3;

export type CraftingIngredient = {
  amount: number;
  element: ElementKey;
};

export type CraftingRecipe = {
  description: string;
  ingredients: CraftingIngredient[];
  item: InventoryItemKey;
  label: string;
  slotIndex: number;
};

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    description: 'Baut einen Mining-Laser fuer Slot 1 und erhoeht dessen Bestand um 1.',
    ingredients: [
      { amount: 100, element: 'sodium' },
      { amount: 100, element: 'magnesium' },
      { amount: 100, element: 'carbon' },
    ],
    item: 'miningLaser',
    label: 'Mining-Laser',
    slotIndex: 0,
  },
  {
    description: 'Baut einen Schild-Booster fuer Slot 2 und erhoeht dessen Bestand um 1.',
    ingredients: [
      { amount: 100, element: 'oxygen' },
      { amount: 100, element: 'silicon' },
      { amount: 100, element: 'aluminium' },
    ],
    item: 'shieldBooster',
    label: 'Schild-Booster',
    slotIndex: 1,
  },
  {
    description: 'Baut einen Scanner fuer Slot 3 und erhoeht dessen Bestand um 1.',
    ingredients: [
      { amount: 100, element: 'hydrogen' },
      { amount: 100, element: 'lithium' },
      { amount: 100, element: 'boron' },
    ],
    item: 'scannerModule',
    label: 'Scanner',
    slotIndex: 2,
  },
];

const craftingRecipeByItem: Record<InventoryItemKey, CraftingRecipe> = {
  miningLaser: CRAFTING_RECIPES[0],
  scannerModule: CRAFTING_RECIPES[2],
  shieldBooster: CRAFTING_RECIPES[1],
};

export function createInitialInventorySlots(): InventorySlotState[] {
  return [...CRAFTING_RECIPES]
    .sort((leftRecipe, rightRecipe) => leftRecipe.slotIndex - rightRecipe.slotIndex)
    .map((recipe) => ({
      count: 0,
      item: recipe.item,
    }));
}

export function getCraftingRecipe(item: InventoryItemKey) {
  return craftingRecipeByItem[item];
}

export function getInventoryItemLabel(item: InventoryItemKey) {
  return getCraftingRecipe(item).label;
}

export function getInventorySlot(inventorySlots: InventorySlotState[], item: InventoryItemKey) {
  return inventorySlots.find((slot) => slot.item === item)!;
}

export function canCraftItem(resources: ResourceState, item: InventoryItemKey) {
  const recipe = getCraftingRecipe(item);

  return recipe.ingredients.every((ingredient) => {
    const element = ingredient.element;
    return resources[element] >= ingredient.amount;
  });
}
