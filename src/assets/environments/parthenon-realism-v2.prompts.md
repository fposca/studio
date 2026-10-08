# Parthenon realism materials

Generated with the built-in imagegen tool. Artistic reconstruction, not an archaeological survey.
All selected source images are stored next to this document.

## Weathered stone
Asset: `parthenon-weathered-stone-v2.png`

Use case: historical-scene. Asset type: seamless PBR albedo texture for a realistic real-time 3D ancient Greek temple. Create a square 2048x2048 high-detail flat orthographic scan of aged Pentelic limestone-marble, covering about two meters of stone. Pale warm GRAY ivory stone, medium-light rather than white, small mineral pits, fine chalky crystalline grain, faint gray mineral veins, irregular patina and subtle ochre weathering. Natural broad mottling and crisp fine detail, low saturation, restrained contrast. Entire image is one continuous stone surface, NOT a grid of blocks. Uniform diffuse illumination, no baked directional shadows or highlights, no perspective, no objects, no architecture, no text. Perfectly tileable on all four edges, subtle variation without an obvious repeating landmark. Physically believable aged historic stone, not polished kitchen marble and not yellow sandstone.

## Limestone ground
Asset: `parthenon-limestone-ground-v1.png`

Use case: historical-scene. Asset type: seamless square PBR albedo ground texture for the rocky terrace outside an ancient Greek marble temple. Create a 2048x2048 photorealistic flat top-down scanned surface of compacted pale gray limestone grit and dry muted brown-gray Mediterranean earth. Embedded flat worn limestone fragments, fine irregular gravel, powdery dust and occasional small fissures. Varied scale, quiet organic patches, natural desaturated color. No greenery, no blocks, no paving pattern, no huge rocks, no objects or architecture. Physically believable archaeological bedrock and compacted earth. Uniform diffuse illumination without directional shadows or highlights. Perfectly tileable on all four edges. Sharp material microdetail, not blurry, no text, no watermark.

## Pediment relief
Asset: `parthenon-pediment-relief-v1.png`

Use case: historical-scene. Generate an architectural material texture for a very SHALLOW ancient Greek temple pediment, in photorealistic aged gray marble with finely carved Greek sculptural relief. Wide 3:1 canvas. Crucial layout: the entire triangular sculpture field must occupy ONLY THE BOTTOM ONE THIRD of the image height. Triangle corners at (0%,100%) and (100%,100%), apex at (50%,67%). The upper TWO THIRDS of the image must be blank uniform gray marble, absolutely no sculpture there. Therefore the sculpture triangle itself has width-to-height ratio 9:1, very shallow. Compose many small carved figures across that shallow triangle, about 16 figures, central standing goddess no taller than one-third image height, then sitting and reclining Greek figures toward the corners. Human proportions must remain natural, do NOT squash bodies. Thin or no border, fill triangle down to bottom edge. Flat orthographic front-facing albedo material scan, neutral desaturated gray, soft diffuse lighting and crevice shadows, no sunlight, no perspective, no environment, no text. This image will be UV cropped to the bottom third and mapped onto an actual shallow 3D temple pediment.

The rendered pediment uses the lower sculpted region of the source, with bump and shallow displacement.
`parthenon-preview.jpg` is a screenshot of the live Three.js scene, not generated concept art.

