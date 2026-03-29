import type { ReactNode } from 'react';
import {
  DownloadIcon,
  Hammer,
  SettingsIcon,
  UploadIcon,
  Volume2Icon,
  VolumeXIcon,
  XIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  canCraftItem,
  CRAFTING_RECIPES,
  getInventorySlot,
} from '@/features/solar-voyage/model/crafting';
import { ELEMENTS } from '@/features/solar-voyage/model/types';
import type {
  ArrivalDialogState,
  ElementKey,
  InventoryItemKey,
  InventorySlotState,
} from '@/features/solar-voyage/model/types';
import { getArrivalVisuals } from '@/features/solar-voyage/ui/mission-control/arrival-visuals';

export function AudioToggleButton({ isMuted, onClick }: { isMuted: boolean; onClick: () => void }) {
  return (
    <Button
      aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
      aria-pressed={isMuted}
      className="size-12 rounded-full border border-white/10 bg-slate-950/75 shadow-[0_0_25px_rgba(3,6,17,0.4)] backdrop-blur-md hover:bg-slate-900/90"
      onClick={onClick}
      size="icon-lg"
      type="button"
      variant="outline"
    >
      {isMuted ? (
        <VolumeXIcon className="text-primary size-5" />
      ) : (
        <Volume2Icon className="text-primary size-5" />
      )}
    </Button>
  );
}

export function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      aria-label="Open settings"
      className="size-12 rounded-full border border-white/10 bg-slate-950/75 shadow-[0_0_25px_rgba(3,6,17,0.4)] backdrop-blur-md hover:bg-slate-900/90"
      onClick={onClick}
      size="icon-lg"
      type="button"
      variant="outline"
    >
      <SettingsIcon className="text-primary size-5" />
    </Button>
  );
}

export function CraftingButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      aria-label="Open crafting"
      className="size-10 rounded-full border border-white/10 bg-slate-950/75 shadow-[0_0_25px_rgba(3,6,17,0.4)] backdrop-blur-md hover:bg-slate-900/90"
      onClick={onClick}
      size="icon-sm"
      type="button"
      variant="outline"
    >
      <Hammer className="text-primary size-4" />
    </Button>
  );
}

export function SettingsDialog({
  canExport,
  children,
  isOpen,
  message,
  onClose,
  onExport,
  onImport,
}: {
  canExport: boolean;
  children: ReactNode;
  isOpen: boolean;
  message: string | null;
  onClose: () => void;
  onExport: () => void;
  onImport: () => void;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-30 flex items-start justify-end bg-black/45 px-4 py-20 backdrop-blur-sm"
      role="dialog"
    >
      <div className="glass-panel hud-outline w-full max-w-sm rounded-[2rem] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-primary text-xs font-bold tracking-[0.32em] uppercase">Data Link</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-[0.16em] text-white uppercase">
              Save Controls
            </h2>
          </div>
          <Button
            aria-label="Close settings"
            onClick={onClose}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <XIcon />
          </Button>
        </div>

        <p className="text-sm leading-6 text-slate-300">{children}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button
            className="h-12 w-full justify-center gap-2 tracking-[0.18em] uppercase"
            disabled={!canExport}
            onClick={onExport}
            type="button"
          >
            <DownloadIcon />
            Export
          </Button>
          <Button
            className="h-12 w-full justify-center gap-2 tracking-[0.18em] uppercase"
            onClick={onImport}
            type="button"
            variant="secondary"
          >
            <UploadIcon />
            Import
          </Button>
        </div>

        {message ? (
          <p className="border-border bg-muted/45 mt-4 rounded-2xl border px-4 py-3 text-sm text-slate-200">
            {message}
          </p>
        ) : null}

        {!canExport ? (
          <p className="mt-4 text-xs tracking-[0.12em] text-slate-500 uppercase">
            Export unlocks after a mission has been loaded.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function CraftingDialog({
  inventorySlots,
  isOpen,
  onClose,
  onCraft,
  resources,
}: {
  inventorySlots: InventorySlotState[];
  isOpen: boolean;
  onClose: () => void;
  onCraft: (item: InventoryItemKey) => void;
  resources: Record<ElementKey, number>;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-30 flex items-start justify-end bg-black/45 px-4 py-20 backdrop-blur-sm"
      role="dialog"
    >
      <div className="glass-panel hud-outline w-full max-w-md rounded-[2rem] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-primary text-xs font-bold tracking-[0.32em] uppercase">Workbench</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-[0.16em] text-white uppercase">
              Crafting
            </h2>
          </div>
          <Button
            aria-label="Close crafting"
            onClick={onClose}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <XIcon />
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {CRAFTING_RECIPES.map((recipe) => {
            const isCraftable = canCraftItem(resources, recipe.item);
            const slotCount = getInventorySlot(inventorySlots, recipe.item).count;

            return (
              <div
                key={recipe.item}
                className="border-border bg-muted/35 flex flex-col gap-3 rounded-2xl border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold tracking-[0.12em] text-white uppercase">
                      {recipe.label}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{recipe.description}</p>
                    <p className="mt-2 text-[11px] tracking-[0.14em] text-slate-300 uppercase">
                      Aktueller Bestand: {slotCount}
                    </p>
                  </div>
                  <Badge className="bg-primary/15 text-primary">Slot {recipe.slotIndex + 1}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300">
                  {recipe.ingredients.map((ingredient) => {
                    const element = ingredient.element;
                    const elementMeta = ELEMENTS[element];

                    return (
                      <div
                        key={element}
                        className="border-border bg-background/55 rounded-xl border px-3 py-2 text-center"
                      >
                        <p className="text-accent font-bold">{elementMeta.symbol}</p>
                        <p className="mt-1 text-xs text-white">
                          {resources[element]} / {ingredient.amount}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400 uppercase">
                          {elementMeta.name}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <Button
                  className="h-11 tracking-[0.16em] uppercase"
                  disabled={!isCraftable}
                  onClick={() => onCraft(recipe.item)}
                  type="button"
                  variant="secondary"
                >
                  Craft {recipe.label} +1
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ArrivalDialog({
  arrivalDialog,
  isOpen,
  onConfirm,
}: {
  arrivalDialog: ArrivalDialogState;
  isOpen: boolean;
  onConfirm: () => void;
}) {
  if (!isOpen || !arrivalDialog) {
    return null;
  }

  const visuals = getArrivalVisuals(arrivalDialog);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 px-4 py-20 backdrop-blur-sm"
      role="dialog"
    >
      <div className="glass-panel hud-outline w-full max-w-5xl rounded-[2rem] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <section className="border-border bg-muted/30 flex flex-col gap-4 rounded-[1.75rem] border p-4">
            <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-slate-950/60">
              <img
                alt={visuals.portraitAlt}
                className="aspect-[4/5] h-full w-full object-cover"
                src={visuals.portraitSrc}
              />
            </div>
            <div className="space-y-3">
              <Badge className="bg-primary/15 text-primary w-fit">{visuals.portraitLabel}</Badge>
              <p className="text-sm leading-6 text-slate-200">{visuals.greeting}</p>
              <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
                Placeholder portrait for future generated colony contact art.
              </p>
            </div>
          </section>

          <section className="border-border bg-muted/25 flex min-w-0 flex-col gap-5 rounded-[1.75rem] border p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-primary text-xs font-bold tracking-[0.32em] uppercase">
                  Arrival
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-[0.12em] text-white uppercase">
                  {visuals.title}
                </h2>
              </div>
              <Badge className="bg-accent/15 text-accent h-fit w-fit">{visuals.statusLabel}</Badge>
            </div>

            <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-slate-950/60">
              <img
                alt={visuals.sceneAlt}
                className="aspect-[16/9] h-full w-full object-cover"
                src={visuals.sceneSrc}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_220px]">
              <div className="space-y-3">
                <p className="text-base leading-7 text-slate-100">{arrivalDialog.message}</p>
                <p className="text-sm leading-6 text-slate-300">
                  Civil channels are active and local traffic control has already acknowledged the
                  Solar Voyage on approach.
                </p>
              </div>
              <div className="border-border bg-background/40 rounded-[1.25rem] border p-4">
                <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
                  {visuals.sceneLabel}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Placeholder vista for the destination surface, orbital settlement, or docking
                  corridor.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                className="h-11 min-w-28 tracking-[0.18em] uppercase"
                onClick={onConfirm}
                type="button"
              >
                Ok.
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
