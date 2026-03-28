# Equipment-System mit scrollbaren Bays und Element-Modulen

## Zusammenfassung

- Das linke Equipment-Panel ersetzt die aktuelle Platzhalterliste durch ein echtes, vertikal scrollbares `EquipmentPanel` mit 10 sichtbaren Slot-Karten in fester Reihenfolge.
- Das System wird als Hybrid gebaut: 5 Slots sind zu Missionsstart offen, 5 weitere sind sichtbar, aber per Ressourcen-Ausbau freischaltbar.
- Jedes Element wird zu einem installierbaren Modul. Einbau verbraucht `1` Ressourceneinheit, Ausbau gibt nichts zurueck, identische Module stacken.
- V1 fokussiert auf Reise- und Ertragsboni: Reisedauer, Ressourcen-Ertrag, Treibstoff-Regeneration, Unlock-Kosten und Inventarkapazitaet.

## Wichtige Modell- und Interface-Aenderungen

- `GameState` bekommt `equipmentSlots: EquipmentSlotState[]`.
- Neue Typen:
  - `EquipmentSlotType = 'universal' | 'propulsion' | 'systems' | 'reactor' | 'structure'`
  - `EquipmentSlotState = { id: string; type: EquipmentSlotType; unlocked: boolean; installedElement: ElementKey | null; unlockCost: Partial<ResourceState> | null }`
  - `ShipBonuses = { travelDurationPct: number; hydrogenPerTick: number; heliumPerTick: number; oxygenPerTick: number; totalRewardPct: number; hydrogenRewardPct: number; rareRewardPct: number; unlockDiscountPct: number; inventoryBonusSlots: number }`
- Neue Actions im Reducer:
  - `equipment/installed`
  - `equipment/removed`
  - `equipment/unlocked`
- Neue Selektoren:
  - `getShipBonuses(state)`
  - `getAvailableInventorySlots(state)`
  - optional `getAllowedElementsForSlot(slotType)`
- Persistenz auf Snapshot `v2` anheben und `v1` Saves beim Laden auf das neue Default-Equipment migrieren statt zu verwerfen.

## Konkrete Spielregeln

- Slot-Layout in fixer Reihenfolge:
  - `universal-alpha` offen
  - `propulsion-alpha` offen
  - `systems-alpha` offen
  - `reactor-alpha` offen
  - `structure-alpha` offen
  - `universal-beta` gesperrt, Kosten: `carbon 8`, `aluminium 4`
  - `propulsion-beta` gesperrt, Kosten: `hydrogen 24`, `oxygen 8`
  - `systems-beta` gesperrt, Kosten: `silicon 6`, `neon 4`
  - `reactor-beta` gesperrt, Kosten: `helium 10`, `lithium 6`
  - `structure-beta` gesperrt, Kosten: `carbon 12`, `magnesium 6`
- Slot-Kompatibilitaet:
  - `universal`: alle Elemente
  - `propulsion`: `hydrogen`, `oxygen`, `fluorine`, `magnesium`
  - `systems`: `silicon`, `neon`, `beryllium`, `boron`
  - `reactor`: `helium`, `lithium`, `sodium`, `nitrogen`
  - `structure`: `carbon`, `aluminium`
- Stacking und Caps:
  - Prozentboni addieren sich.
  - Gesamtreduktion auf Reisedauer bei `35%` kappen.
  - Unlock-Rabatt bei `35%` kappen.
  - Passive Tick-Boni addieren sich und laufen in `travel/ticked`.
- Element-Thematik und Startwerte:
  - `hydrogen`: `-8%` Reisedauer
  - `oxygen`: `+15%` Wasserstoff-Ertrag
  - `fluorine`: `+10%` Gesamt-Ertrag, ausser Wasserstoff
  - `magnesium`: `-5%` Reisedauer
  - `silicon`: `+10%` Rare-Element-Ertrag und `-5%` Reisedauer
  - `neon`: `+12%` Rare-Element-Ertrag
  - `beryllium`: `+8%` Rare-Element-Ertrag
  - `boron`: `+10%` Unlock-Rabatt
  - `helium`: `+1 hydrogen` alle `15s` Flugzeit
  - `lithium`: `+1 helium` alle `30s` Flugzeit
  - `sodium`: `+1 hydrogen` bei Abflug und `+1 hydrogen` bei Ankunft
  - `nitrogen`: `+1 oxygen` alle `30s` Flugzeit
  - `carbon`: `+2` Inventar-Slots
  - `aluminium`: `+15%` Unlock-Rabatt
- `Rare-Element` fuer Boni eindeutig definieren als alle Elemente mit `rarity <= 0.17`.

## UI- und Ablauf-Aenderungen

- Das linke Panel in [MissionControl.tsx](/c:/Users/tekkn/Programmieren/SpaceTraverlor/src/features/solar-voyage/ui/MissionControl.tsx) wird zu einem `flex`-Container mit `min-h-0`; die Slot-Liste selbst bekommt `overflow-y-auto`, analog zum bestehenden Ressourcenpanel.
- Jede Slot-Karte zeigt Typ, Status, installierte Ressource, Kurzbonus und eine klare Aktion:
  - leer/offen: Element-Auswahl aus kompatiblen Ressourcen mit Bestand `> 0`
  - belegt: `Remove`
  - gesperrt: `Unlock` plus Kostenanzeige
- Das Inventar bleibt rechts, aber die sichtbare Anzahl richtet sich nicht mehr an einer festen Label-Liste aus, sondern an `9 + inventoryBonusSlots`.
- Der aktuelle Platzhaltertext bei Equipment/Inventory wird entfernt; fuer leere Slots stattdessen kurze Systemtexte wie `Empty bay` oder `Expansion locked`.

## Testplan

- Reducer-Test: Einbau verbraucht genau `1` Ressource und setzt das Modul in den korrekten Slot.
- Reducer-Test: inkompatible Elemente koennen nicht in spezialisierte Slots eingesetzt werden.
- Reducer-Test: Unlock zieht Kosten unter Beruecksichtigung von Rabatt sauber ab und schaltet genau den Zielslot frei.
- Reducer-Test: `travel/started` und `travel/ticked` wenden Dauer-, Reward- und Regen-Boni deterministisch an.
- Persistenz-Test: altes Save ohne `equipmentSlots` laedt erfolgreich mit Default-Slots.
- Component-Test: Equipment-Panel rendert 10 Slots, zeigt gesperrte Bays sichtbar an und erlaubt Install/Unlock ueber die UI.
- Abschluss-Checks bei Implementierung: `npm run format`, `npm run test`, `npm run lint`.

## Annahmen und Defaults

- Der Nutzerwunsch `silicion` wird als `silicon / Silizium` normalisiert.
- Ausbau zerstoert das alte Modul bewusst; es gibt in V1 keinen Refund und kein separates Crafting.
- Slot-Freischaltung passiert direkt ueber Ressourcen-Ausbau, nicht ueber Missionsmeilensteine oder Ort-spezifische Drops.
- Die vorhandenen Schild- und Huelle-Werte bleiben in diesem Schritt unberuehrt; alle neuen Moduleffekte greifen nur in Reise-, Ertrags-, Unlock- und Inventarsysteme ein.
