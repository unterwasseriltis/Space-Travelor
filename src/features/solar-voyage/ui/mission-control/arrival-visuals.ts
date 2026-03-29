import { getArrivalVisualConfig } from '@/config/arrival-visuals';
import { isBodyName } from '@/features/solar-voyage/model/locations';
import type { ArrivalDialogState } from '@/features/solar-voyage/model/types';

type ArrivalVisuals = {
  greeting: string;
  portraitAlt: string;
  portraitLabel: string;
  portraitSrc: string;
  sceneAlt: string;
  sceneLabel: string;
  sceneSrc: string;
  statusLabel: string;
  title: string;
};

export function getArrivalVisuals(arrivalDialog: NonNullable<ArrivalDialogState>): ArrivalVisuals {
  const bodyLocationId =
    arrivalDialog.locationId !== null && isBodyName(arrivalDialog.locationId)
      ? arrivalDialog.locationId
      : null;
  const config = getArrivalVisualConfig(bodyLocationId, arrivalDialog.label);

  return {
    greeting: config.greeting,
    portraitAlt: `${config.portraitLabel} placeholder for ${arrivalDialog.label}`,
    portraitLabel: config.portraitLabel,
    portraitSrc: config.portraitSrc,
    sceneAlt: `${config.sceneLabel} placeholder for ${arrivalDialog.label}`,
    sceneLabel: config.sceneLabel,
    sceneSrc: config.sceneSrc,
    statusLabel: config.statusLabel,
    title: config.title,
  };
}
