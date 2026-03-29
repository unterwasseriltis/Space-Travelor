import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSolarVoyage } from '@/features/solar-voyage/hooks/use-solar-voyage';
import type { LocationOption, MapLocation } from '@/features/solar-voyage/model/locations';
import { formatFuelValue } from '@/features/solar-voyage/model/equipment';
import type {
  ElementKey,
  EquipmentSlotState,
  InventoryItemKey,
  InventorySlotState,
  LocationId,
  ResourceState,
  ShipState,
  SpecialResourceState,
  TravelState,
  TravelStatus,
} from '@/features/solar-voyage/model/types';
import {
  CargoPanel,
  EquipmentPanel,
  LaunchMetric,
  MapPanel,
  NavigationPanel,
  ResourcePanel,
  StatusBar,
} from '@/features/solar-voyage/ui/mission-control/panels';
import {
  ArrivalDialog,
  CraftingDialog,
  SettingsButton,
  SettingsDialog,
} from '@/features/solar-voyage/ui/mission-control/dialogs';
import {
  useMissionViewportLayout,
  type MissionViewportLayout,
} from '@/features/solar-voyage/ui/mission-control/viewport';

type MissionControlProps = {
  backgroundImage: string;
};

export function MissionControl({ backgroundImage }: MissionControlProps) {
  const {
    state,
    hasSavedMission,
    availableDestinations,
    coordinatesLabel,
    currentLocationLabel,
    missionTimerLabel,
    isTraveling,
    travelCountdownLabel,
    travelProgress,
    travelStatus,
    currentPosition,
    mapLocations,
    startMission,
    selectDestination,
    startTravel,
    pauseTravel,
    resumeTravel,
    abortTravel,
    activateEquipmentSlot,
    craftInventoryItem,
    pressInventoryItem,
    clearArrivalDialog,
    clearNotification,
    exportSnapshot,
    importSnapshot,
    loadSavedMission,
  } = useSolarVoyage();
  const clearNotificationEvent = useEffectEvent(clearNotification);
  const missionViewportLayout = useMissionViewportLayout();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isCraftingOpen, setIsCraftingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!state.notification) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      clearNotificationEvent();
    }, 3000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [state.notification]);

  useEffect(() => {
    if (!isCraftingOpen && !isSettingsOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCraftingOpen(false);
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCraftingOpen, isSettingsOpen]);

  const handleExport = async () => {
    try {
      const snapshot = exportSnapshot();
      const fileName = createSaveFileName();
      const blob = new Blob([snapshot], { type: 'application/json' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');

      downloadLink.href = downloadUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.URL.revokeObjectURL(downloadUrl);

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(snapshot);
        setSettingsMessage('Current snapshot copied to the clipboard and downloaded as JSON.');
        return;
      }

      setSettingsMessage('Current snapshot downloaded as JSON.');
    } catch {
      setSettingsMessage('Export failed. Please try again.');
    }
  };

  const handleImportButtonClick = () => {
    importInputRef.current?.click();
  };

  const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const importFile = event.target.files?.[0];

    if (!importFile) {
      return;
    }

    try {
      const snapshot = await importFile.text();

      importSnapshot(snapshot);
      setSettingsMessage(`Imported "${importFile.name}" successfully.`);
    } catch (error) {
      setSettingsMessage(
        error instanceof Error ? error.message : 'Import failed. Please try another save file.',
      );
    } finally {
      event.target.value = '';
    }
  };

  return state.phase === 'menu' ? (
    <LaunchMenu
      backgroundImage={backgroundImage}
      hasSavedMission={hasSavedMission}
      importInputRef={importInputRef}
      isSettingsOpen={isSettingsOpen}
      onExport={handleExport}
      onImport={handleImportButtonClick}
      onImportChange={handleImportChange}
      onLoadMission={loadSavedMission}
      onStartMission={startMission}
      onCloseSettings={() => setIsSettingsOpen(false)}
      onToggleSettings={() => setIsSettingsOpen((currentOpen) => !currentOpen)}
      settingsMessage={settingsMessage}
    />
  ) : (
    <MissionWorkspace
      activateEquipmentSlot={activateEquipmentSlot}
      arrivalDialogMessage={state.arrivalDialog?.message ?? null}
      availableDestinations={availableDestinations}
      backgroundImage={backgroundImage}
      coordinatesLabel={coordinatesLabel}
      craftInventoryItem={craftInventoryItem}
      currentLocationLabel={currentLocationLabel}
      currentMapLocation={
        state.travel || state.currentCoordinatesOverride ? null : state.currentLocation
      }
      currentPosition={currentPosition}
      equipmentSlots={state.equipmentSlots}
      importInputRef={importInputRef}
      inventorySlots={state.inventorySlots}
      isCraftingOpen={isCraftingOpen}
      isSettingsOpen={isSettingsOpen}
      missionTimerLabel={missionTimerLabel}
      missionViewportLayout={missionViewportLayout}
      mapLocations={mapLocations}
      notification={state.notification}
      isTraveling={isTraveling}
      onClearArrivalDialog={clearArrivalDialog}
      onExport={handleExport}
      onImport={handleImportButtonClick}
      onImportChange={handleImportChange}
      onInventoryItemClick={pressInventoryItem}
      onPauseTravel={pauseTravel}
      onResumeTravel={resumeTravel}
      onSelectDestination={selectDestination}
      onStartTravel={startTravel}
      onAbortTravel={abortTravel}
      onToggleCrafting={() => setIsCraftingOpen((currentOpen) => !currentOpen)}
      onToggleSettings={() => setIsSettingsOpen((currentOpen) => !currentOpen)}
      resources={state.resources}
      specialResources={state.specialResources}
      selectedDestination={state.selectedDestination}
      settingsMessage={settingsMessage}
      onCloseCrafting={() => setIsCraftingOpen(false)}
      onCloseSettings={() => setIsSettingsOpen(false)}
      ship={state.ship}
      travel={state.travel}
      travelCountdownLabel={travelCountdownLabel}
      travelProgress={travelProgress}
      travelStatus={travelStatus}
    />
  );
}

function LaunchMenu({
  backgroundImage,
  hasSavedMission,
  importInputRef,
  isSettingsOpen,
  onExport,
  onImport,
  onImportChange,
  onLoadMission,
  onStartMission,
  onToggleSettings,
  settingsMessage,
  onCloseSettings,
}: {
  backgroundImage: string;
  hasSavedMission: boolean;
  importInputRef: RefObject<HTMLInputElement | null>;
  isSettingsOpen: boolean;
  onExport: () => Promise<void>;
  onImport: () => void;
  onImportChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onLoadMission: () => boolean;
  onStartMission: () => void;
  onToggleSettings: () => void;
  settingsMessage: string | null;
  onCloseSettings: () => void;
}) {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#030611]">
      <div
        className="fixed inset-0 bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: '100% 100%' }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,6,17,0.92)_0%,rgba(3,6,17,0.6)_42%,rgba(3,6,17,0.1)_100%)]" />

      <div className="starfield fixed inset-0 opacity-40" />
      <SettingsButton onClick={onToggleSettings} />
      <SettingsDialog
        isOpen={isSettingsOpen}
        canExport={false}
        message={settingsMessage}
        onClose={onCloseSettings}
        onExport={() => {
          void onExport();
        }}
        onImport={onImport}
      >
        Import a save file from disk. Autosaves are written to local storage every 5 seconds during
        a mission.
      </SettingsDialog>
      <input
        ref={importInputRef}
        accept=".json,application/json,text/plain"
        aria-label="Import save file"
        className="sr-only"
        onChange={(event) => {
          void onImportChange(event);
        }}
        type="file"
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 md:px-10">
        <div className="grid w-full items-center gap-10 xl:grid-cols-[minmax(0,740px)_1fr]">
          <section className="animate-rise flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <Badge className="bg-primary/15 text-primary w-fit">Mission Control</Badge>
              <p className="text-primary/80 text-sm tracking-[0.5em] uppercase">Launch Interface</p>
              <h1 className="font-[family-name:var(--font-display)] text-5xl leading-none tracking-[0.18em] text-white md:text-8xl">
                Solar Voyage
              </h1>
              <p className="max-w-2xl text-xl leading-9 text-slate-300">
                Step into the restored cockpit and chart the next burn. The bridge is live again,
                with the original artwork driving the whole experience. Navigation, telemetry, and
                resource management are online and ready for the next system jump.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:max-w-sm">
              <Button
                className="h-14 text-lg font-bold tracking-[0.2em] uppercase"
                onClick={onStartMission}
              >
                New Mission
              </Button>
              <Button
                className="h-14 text-lg tracking-[0.2em] uppercase"
                variant="secondary"
                disabled={!hasSavedMission}
                onClick={onLoadMission}
              >
                Load Mission
              </Button>
              <Button
                className="h-14 text-lg tracking-[0.2em] uppercase"
                variant="outline"
                disabled
              >
                Exit Sequence
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <LaunchMetric label="Bridge" value="Online" />
              <LaunchMetric label="Visual Feed" value="Restored" />
              <LaunchMetric label="Stack" value="React TS" />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function MissionWorkspace({
  activateEquipmentSlot,
  arrivalDialogMessage,
  availableDestinations,
  backgroundImage,
  coordinatesLabel,
  craftInventoryItem,
  currentLocationLabel,
  currentMapLocation,
  currentPosition,
  equipmentSlots,
  importInputRef,
  inventorySlots,
  isCraftingOpen,
  isSettingsOpen,
  missionTimerLabel,
  missionViewportLayout,
  mapLocations,
  notification,
  isTraveling,
  onClearArrivalDialog,
  onExport,
  onImport,
  onImportChange,
  onInventoryItemClick,
  onPauseTravel,
  onResumeTravel,
  onSelectDestination,
  onStartTravel,
  onAbortTravel,
  onToggleCrafting,
  onToggleSettings,
  resources,
  specialResources,
  selectedDestination,
  settingsMessage,
  onCloseCrafting,
  onCloseSettings,
  ship,
  travel,
  travelCountdownLabel,
  travelProgress,
  travelStatus,
}: {
  activateEquipmentSlot: (element: ElementKey) => void;
  arrivalDialogMessage: string | null;
  availableDestinations: LocationOption[];
  backgroundImage: string;
  coordinatesLabel: string;
  craftInventoryItem: (item: InventoryItemKey) => void;
  currentLocationLabel: string;
  currentMapLocation: LocationId | null;
  currentPosition: { x: number; y: number };
  equipmentSlots: EquipmentSlotState[];
  importInputRef: RefObject<HTMLInputElement | null>;
  inventorySlots: InventorySlotState[];
  isCraftingOpen: boolean;
  isSettingsOpen: boolean;
  missionTimerLabel: string;
  missionViewportLayout: MissionViewportLayout;
  mapLocations: MapLocation[];
  notification: string | null;
  isTraveling: boolean;
  onClearArrivalDialog: () => void;
  onExport: () => Promise<void>;
  onImport: () => void;
  onImportChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onInventoryItemClick: (item: InventoryItemKey) => void;
  onPauseTravel: () => void;
  onResumeTravel: () => void;
  onSelectDestination: (destination: LocationId | '') => void;
  onStartTravel: () => void;
  onAbortTravel: () => void;
  onToggleCrafting: () => void;
  onToggleSettings: () => void;
  resources: ResourceState;
  specialResources: SpecialResourceState;
  selectedDestination: LocationId | '';
  settingsMessage: string | null;
  onCloseCrafting: () => void;
  onCloseSettings: () => void;
  ship: ShipState;
  travel: TravelState | null;
  travelCountdownLabel: string | null;
  travelProgress: number;
  travelStatus: TravelStatus | null;
}) {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#030611]">
      <div
        className="fixed inset-0 bg-center bg-no-repeat transition-opacity duration-1000"
        style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: '100% 100%' }}
      />
      <div className="fixed inset-0 bg-[linear-gradient(180deg,rgba(3,6,17,0.3)_0%,rgba(3,6,17,0.7)_100%)]" />
      <div className="starfield fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(4,7,17,0.08),rgba(4,7,17,0.35))]" />
      <SettingsButton onClick={onToggleSettings} />
      <SettingsDialog
        isOpen={isSettingsOpen}
        canExport
        message={settingsMessage}
        onClose={onCloseSettings}
        onExport={() => {
          void onExport();
        }}
        onImport={onImport}
      >
        Export a live snapshot of the current mission or import a JSON save file. Autosave keeps
        local storage in sync every 5 seconds.
      </SettingsDialog>
      <ArrivalDialog
        isOpen={Boolean(arrivalDialogMessage)}
        message={arrivalDialogMessage}
        onConfirm={onClearArrivalDialog}
      />
      <CraftingDialog
        inventorySlots={inventorySlots}
        isOpen={isCraftingOpen}
        onClose={onCloseCrafting}
        onCraft={craftInventoryItem}
        resources={resources}
      />
      <input
        ref={importInputRef}
        accept=".json,application/json,text/plain"
        aria-label="Import save file"
        className="sr-only"
        onChange={(event) => {
          void onImportChange(event);
        }}
        type="file"
      />

      <div
        className="absolute top-1/2 left-1/2 z-10"
        style={{
          height: `${missionViewportLayout.height}px`,
          transform: `translate(-50%, -50%) scale(${missionViewportLayout.scale})`,
          transformOrigin: 'center center',
          width: `${missionViewportLayout.width}px`,
        }}
      >
        <div className="flex h-full w-full flex-col gap-5 p-6">
          <header className="grid shrink-0 grid-cols-[260px_minmax(0,1fr)] gap-5">
            <MapPanel
              className="h-full"
              currentLocation={currentMapLocation}
              currentPosition={currentPosition}
              locations={mapLocations}
            />

            <div className="flex min-h-[210px] flex-col gap-5">
              <div className="glass-panel hud-outline grid flex-1 grid-cols-[1fr_auto_1fr] items-center rounded-[2rem] px-8 py-5">
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary/15 text-primary">Standort</Badge>
                  <span className="text-2xl font-semibold text-white">{currentLocationLabel}</span>
                </div>

                <div className="text-center">
                  <p className="text-primary text-xs font-bold tracking-[0.32em] uppercase">
                    Missionszeit
                  </p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-[0.16em] text-white">
                    {missionTimerLabel}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Badge className="bg-accent/20 text-accent">Status</Badge>
                  <span className="text-lg font-medium text-slate-200">
                    {travel ? 'In transit' : currentMapLocation ? 'Docked' : 'Holding'}
                  </span>
                </div>
              </div>

              <div className="glass-panel hud-outline rounded-[2rem] px-6 py-5">
                <div className="grid grid-cols-3 gap-5">
                  <StatusBar
                    label="Rumpf"
                    value={ship.hull}
                    accentClassName="[&_[data-slot=progress-indicator]]:bg-red-400"
                    valueLabel={`${Math.round(ship.hull)}%`}
                  />
                  <StatusBar
                    label="Schilde"
                    value={ship.shields}
                    accentClassName="[&_[data-slot=progress-indicator]]:bg-sky-400"
                    valueLabel={`${Math.round(ship.shields)}%`}
                  />
                  <StatusBar
                    label="Treibstoff"
                    value={ship.fuel}
                    maxValue={ship.maxFuel}
                    accentClassName="[&_[data-slot=progress-indicator]]:bg-emerald-400"
                    valueClassName="w-20"
                    valueLabel={`${formatFuelValue(ship.fuel)} / ${formatFuelValue(ship.maxFuel)}`}
                  />
                </div>
              </div>
            </div>
          </header>

          <section className="grid min-h-0 flex-1 grid-cols-[320px_430px_minmax(0,1fr)] gap-5">
            <aside className="min-h-0">
              <EquipmentPanel
                className="h-full"
                equipmentSlots={equipmentSlots}
                onActivate={activateEquipmentSlot}
                resources={resources}
              />
            </aside>

            <section className="min-h-0">
              <NavigationPanel
                className="h-full"
                coordinatesLabel={coordinatesLabel}
                destinations={availableDestinations}
                isTraveling={isTraveling}
                notification={notification}
                onAbortTravel={onAbortTravel}
                onDestinationChange={onSelectDestination}
                onPauseTravel={onPauseTravel}
                onResumeTravel={onResumeTravel}
                onStartTravel={onStartTravel}
                selectedDestination={selectedDestination}
                travelCountdownLabel={travelCountdownLabel}
                travelProgress={travelProgress}
                travelStatus={travelStatus}
              />
            </section>

            <aside className="grid min-h-0 grid-rows-[minmax(0,1fr)_220px] gap-5">
              <ResourcePanel
                className="min-h-0"
                resources={resources}
                specialResources={specialResources}
              />
              <CargoPanel
                className="min-h-0"
                compact
                inventorySlots={inventorySlots}
                onInventoryItemClick={onInventoryItemClick}
                onOpenCrafting={onToggleCrafting}
                title="Inventory"
              />
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}

function createSaveFileName() {
  return `solar-voyage-save-${new Date().toISOString().replaceAll(':', '-')}.json`;
}
