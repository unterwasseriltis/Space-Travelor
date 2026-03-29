import type {
  ElementKey,
  InventoryItemKey,
  InventorySlotState,
  ResourceState,
} from '@/features/solar-voyage/model/types';

export const INVENTORY_SLOT_COUNT = 9;

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
    description: 'Assembles a mining laser placeholder for the first inventory slot.',
    ingredients: [
      { amount: 100, element: 'sodium' },
      { amount: 100, element: 'magnesium' },
      { amount: 100, element: 'carbon' },
    ],
    item: 'miningLaser',
    label: 'Mining Laser',
    slotIndex: 0,
  },
  {
    description: 'Builds a shield booster placeholder for the second inventory slot.',
    ingredients: [
      { amount: 100, element: 'oxygen' },
      { amount: 100, element: 'silicon' },
      { amount: 100, element: 'aluminium' },
    ],
    item: 'shieldBooster',
    label: 'Shield Booster',
    slotIndex: 1,
  },
  {
    description: 'Builds a scanner module placeholder for the third inventory slot.',
    ingredients: [
      { amount: 100, element: 'hydrogen' },
      { amount: 100, element: 'lithium' },
      { amount: 100, element: 'boron' },
    ],
    item: 'scannerModule',
    label: 'Scanner Module',
    slotIndex: 2,
  },
];

const craftingRecipeByItem: Record<InventoryItemKey, CraftingRecipe> = {
  miningLaser: CRAFTING_RECIPES[0],
  scannerModule: CRAFTING_RECIPES[2],
  shieldBooster: CRAFTING_RECIPES[1],
};

export function createInitialInventorySlots(): InventorySlotState[] {
  return Array.from({ length: INVENTORY_SLOT_COUNT }, () => null);
}

export function getCraftingRecipe(item: InventoryItemKey) {
  return craftingRecipeByItem[item];
}

export function getInventoryItemLabel(item: InventoryItemKey) {
  return getCraftingRecipe(item).label;
}

export function canCraftItem(
  resources: ResourceState,
  inventorySlots: InventorySlotState[],
  item: InventoryItemKey,
) {
  const recipe = getCraftingRecipe(item);

  return (
    inventorySlots[recipe.slotIndex] === null &&
    recipe.ingredients.every((ingredient) => resources[ingredient.element] >= ingredient.amount)
  );
}
