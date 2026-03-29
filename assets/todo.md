# Solar Voyage Asset TODO

The arrival dialog now uses generated SVG placeholders for colony portraits and destination vistas. We should replace them with final art generated in Grok or another external image tool.

## Generate first

- `arrival-portrait-<location>.png`
  Size: 1024x1280
  Use: Colony liaison portrait panel in the arrival dialog
  Prompt direction: retro-futurist colony representative, cockpit-comms framing, clean silhouette lighting, confident welcoming expression, cinematic sci-fi matte painting detail
- `arrival-vista-<location>.png`
  Size: 1600x900
  Use: Destination image panel in the arrival dialog
  Prompt direction: colonized solar-system destination seen on arrival, orbital docks or surface habitat visible, optimistic hard-sci-fi tone, strong environmental storytelling

## Destinations to cover

- Merkur
- Venus
- Erde
- Mond
- Mars
- Phobos
- Deimos
- Jupiter
- Amalthea
- Io
- Europa
- Ganymed
- Kallisto
- Saturn
- Tethys
- Dione
- Rhea
- Titan
- Iapetus
- Uranus
- Miranda
- Ariel
- Umbriel
- Titania
- Oberon

## Shared extras

- `arrival-portrait-survey-relay.png`
  Size: 1024x1280
  Use: Generic contact for scanner-generated discoveries
- `arrival-vista-survey-relay.png`
  Size: 1600x900
  Use: Generic approach art for asteroid clusters, debris fields, and ore deposits
- `arrival-overlay-frame.png`
  Size: 1600x900 with transparency
  Use: Optional reusable HUD frame if we want the art to feel more diegetic across every arrival screen
