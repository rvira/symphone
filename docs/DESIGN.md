# Symphone studio design

The interface draws on a working music studio and the physical experience of a concert hall: an oak stage, ivory score paper, black music stands, restrained brass details, and muted section colors. The score and instrument remain the primary controls; the stage provides musical context.

## References

- [Philharmonie Berlin: audience and stage](https://www.berliner-philharmoniker.de/en/stories/why-is-the-audience-seated-behind-the-orchestra/): the ensemble as the spatial and visual center, with a curved arrangement around the conductor.
- [Philharmonie Luxembourg: first visit](https://www.philharmonie.lu/en/visit-us/my-first-visit): the evening programme and the transition into a concert space informed the small movement programme alongside the stage.
- [London Symphony Orchestra: How to Build an Orchestra](https://www.lso.co.uk/learn-and-discover/digital-activities-and-resources/how-to-build-an-orchestra/): clear instrument families, orchestral pictograms and the conductor's relationship to the players.

These are design references, not affiliations. No third-party photographs, logos or artwork are embedded. The seating illustration and stage geometry are original code. The hybrid electronic positions are a product choice, not a claim to reproduce a specific orchestra's seating.

## Palette

Warm paper and charcoal form the neutral surfaces. Strings use sage, woodwinds slate blue, horns antique brass, percussion terracotta, harp dusty rose, and electronic parts muted blue and violet. Color identifies an instrument family rather than decorating every surface.

## Motion and depth

The original Three.js stage is an architectural maquette: oak decking, low terraces, concert chairs, paper on music stands, instrumental shapes, and a conductor. The camera has a very small damped pointer response; there is no automatic orbit or zoom. Clickable physical sections and the parallel HTML buttons select the same instrument.

Bow strokes, small player gestures and timpani mallets follow score activity, live pads, mute and solo. The baton marks the beat. A crescendo warms the key light gradually. Keys have a short mechanical depression. There are no floating particles, spinning decoration or full-screen flashes.

Motion can be switched off locally and follows `prefers-reduced-motion`. The seating plan is also available without a 3D context. Rendering is capped at 30 fps, pixel density at 1.5, and stops drawing when the stage is outside the viewport or the document is hidden. Settled still views do not continuously redraw. Geometry, materials, textures, listeners and the WebGL context are disposed when switching to the plan or unmounting the stage.
