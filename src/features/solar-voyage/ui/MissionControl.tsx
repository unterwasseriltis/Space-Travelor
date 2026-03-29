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
  ArrivalDialogState,
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
  AudioToggleButton,
  CraftingDialog,
  SettingsButton,
  SettingsDialog,
  WelcomeDialog,
} from '@/features/solar-voyage/ui/mission-control/dialogs';
import { useTransitHum } from '@/features/solar-voyage/ui/mission-control/use-transit-hum';
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
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isCraftingOpen, setIsCraftingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  useTransitHum({
    isMuted: isAudioMuted,
    isPlaying: state.phase === 'mission' && state.travel?.status === 'active',
  });

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
        setSettingsMessage(
          'Der aktuelle Spielstand wurde in die Zwischenablage kopiert und als JSON heruntergeladen.',
        );
        return;
      }

      setSettingsMessage('Der aktuelle Spielstand wurde als JSON heruntergeladen.');
    } catch {
      setSettingsMessage('Der Export ist fehlgeschlagen. Bitte versuche es erneut.');
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
      setSettingsMessage(`"${importFile.name}" wurde erfolgreich importiert.`);
    } catch (error) {
      setSettingsMessage(
        error instanceof Error
          ? error.message
          : 'Der Import ist fehlgeschlagen. Bitte versuche eine andere Speicherdatei.',
      );
    } finally {
      event.target.value = '';
    }
  };

  const handleStartMission = () => {
    startMission();
    setIsSettingsOpen(false);
    setIsWelcomeOpen(true);
  };

  const handleLoadMission = () => {
    const didLoadMission = loadSavedMission();

    if (didLoadMission) {
      setIsSettingsOpen(false);
    }

    return didLoadMission;
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
      onLoadMission={handleLoadMission}
      onStartMission={handleStartMission}
      onCloseSettings={() => setIsSettingsOpen(false)}
      onToggleSettings={() => setIsSettingsOpen((currentOpen) => !currentOpen)}
      onToggleAudio={() => setIsAudioMuted((currentMuted) => !currentMuted)}
      isAudioMuted={isAudioMuted}
      settingsMessage={settingsMessage}
    />
  ) : (
    <MissionWorkspace
      activateEquipmentSlot={activateEquipmentSlot}
      arrivalDialog={state.arrivalDialog}
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
      isWelcomeOpen={isWelcomeOpen}
      onClearArrivalDialog={clearArrivalDialog}
      onCloseWelcome={() => setIsWelcomeOpen(false)}
      onExport={handleExport}
      onImport={handleImportButtonClick}
      onImportChange={handleImportChange}
      onInventoryItemClick={pressInventoryItem}
      onPauseTravel={pauseTravel}
      onResumeTravel={resumeTravel}
      onSelectDestination={selectDestination}
      onStartTravel={startTravel}
      onAbortTravel={abortTravel}
      onToggleAudio={() => setIsAudioMuted((currentMuted) => !currentMuted)}
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
      isAudioMuted={isAudioMuted}
    />
  );
}

function LaunchMenu({
  backgroundImage,
  hasSavedMission,
  importInputRef,
  isAudioMuted,
  isSettingsOpen,
  onExport,
  onImport,
  onImportChange,
  onLoadMission,
  onStartMission,
  onToggleAudio,
  onToggleSettings,
  settingsMessage,
  onCloseSettings,
}: {
  backgroundImage: string;
  hasSavedMission: boolean;
  importInputRef: RefObject<HTMLInputElement | null>;
  isAudioMuted: boolean;
  isSettingsOpen: boolean;
  onExport: () => Promise<void>;
  onImport: () => void;
  onImportChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onLoadMission: () => boolean;
  onStartMission: () => void;
  onToggleAudio: () => void;
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
      <div className="fixed top-6 right-6 z-40 flex items-center gap-3">
        <AudioToggleButton isMuted={isAudioMuted} onClick={onToggleAudio} />
        <SettingsButton onClick={onToggleSettings} />
      </div>
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
        Importiere eine Speicherdatei von der Festplatte. Automatische Speicherungen werden waehrend
        einer Mission alle 5 Sekunden im lokalen Speicher abgelegt.
      </SettingsDialog>
      <input
        ref={importInputRef}
        accept=".json,application/json,text/plain"
        aria-label="Speicherdatei importieren"
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
              <Badge className="bg-primary/15 text-primary w-fit">Missionszentrale</Badge>
              <p className="text-primary/80 text-sm tracking-[0.5em] uppercase">Startoberflaeche</p>
              <h1 className="font-[family-name:var(--font-display)] text-5xl leading-none tracking-[0.18em] text-white md:text-8xl">
                Space Travelor
              </h1>
              <p className="max-w-2xl text-xl leading-9 text-slate-300">
                Nimm im wiederhergestellten Cockpit Platz und plane den naechsten Kurs. Bruecke,
                Navigation, Telemetrie und Ressourcenverwaltung sind aktiv und bereit fuer den
                naechsten Sprung durch das Sonnensystem.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:max-w-sm">
              <Button
                className="h-14 text-lg font-bold tracking-[0.2em] uppercase"
                onClick={onStartMission}
              >
                Neue Mission
              </Button>
              <Button
                className="h-14 text-lg tracking-[0.2em] uppercase"
                variant="secondary"
                disabled={!hasSavedMission}
                onClick={onLoadMission}
              >
                Mission Laden
              </Button>
              <Button
                className="h-14 text-lg tracking-[0.2em] uppercase"
                variant="outline"
                disabled
              >
                Beenden
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <LaunchMetric label="Bruecke" value="Aktiv" />
              <LaunchMetric label="Bildfeed" value="Wiederhergestellt" />
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
  arrivalDialog,
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
  isWelcomeOpen,
  missionTimerLabel,
  missionViewportLayout,
  mapLocations,
  notification,
  isTraveling,
  onClearArrivalDialog,
  onCloseWelcome,
  onExport,
  onImport,
  onImportChange,
  onInventoryItemClick,
  onPauseTravel,
  onResumeTravel,
  onSelectDestination,
  onStartTravel,
  onAbortTravel,
  onToggleAudio,
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
  isAudioMuted,
}: {
  activateEquipmentSlot: (element: ElementKey) => void;
  arrivalDialog: ArrivalDialogState;
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
  isWelcomeOpen: boolean;
  missionTimerLabel: string;
  missionViewportLayout: MissionViewportLayout;
  mapLocations: MapLocation[];
  notification: string | null;
  isTraveling: boolean;
  onClearArrivalDialog: () => void;
  onCloseWelcome: () => void;
  onExport: () => Promise<void>;
  onImport: () => void;
  onImportChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onInventoryItemClick: (item: InventoryItemKey) => void;
  onPauseTravel: () => void;
  onResumeTravel: () => void;
  onSelectDestination: (destination: LocationId | '') => void;
  onStartTravel: () => void;
  onAbortTravel: () => void;
  onToggleAudio: () => void;
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
  isAudioMuted: boolean;
}) {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#030611]">
      <div
        className="fixed inset-0 bg-center bg-no-repeat transition-opacity duration-1000"
        style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: '100% 100%' }}
      />
      <div className="fixed inset-0 bg-[linear-gradient(180deg,rgba(3,6,17,0.3)_0%,rgba(3,6,17,0.7)_100%)]" />
      <div className="starfield fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(4,7,17,0.08),rgba(4,7,17,0.35))]" />
      <div className="fixed top-6 right-6 z-40 flex items-center gap-3">
        <AudioToggleButton isMuted={isAudioMuted} onClick={onToggleAudio} />
        <SettingsButton onClick={onToggleSettings} />
      </div>
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
        Exportiere einen Live-Spielstand der aktuellen Mission oder importiere eine JSON-Datei. Die
        automatische Speicherung haelt den lokalen Speicher alle 5 Sekunden synchron.
      </SettingsDialog>
      <WelcomeDialog isOpen={isWelcomeOpen} onClose={onCloseWelcome} />
      <ArrivalDialog
        arrivalDialog={arrivalDialog}
        isOpen={Boolean(arrivalDialog)}
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
        aria-label="Speicherdatei importieren"
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
                    {travel ? 'Im Transit' : currentMapLocation ? 'Angedockt' : 'Warteschleife'}
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
                title="Inventar"
              />
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}

function createSaveFileName() {
  return `space-travelor-save-${new Date().toISOString().replaceAll(':', '-')}.json`;
}
