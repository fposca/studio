# Monkey Island Duvet

Asset: `retro-monkey-island-duvet-v1.png`.

Mode: generate, built-in image generation tool. The original output is preserved in the generated-images directory; this copy is the project texture.

## Final Prompt

Create a high-resolution 3:4 portrait bitmap BASE COLOR TEXTURE for a realistic cotton duvet / comforter in a 1990s gamer's bedroom. This is a completely flat, orthographic scan of the PRINTED FABRIC, edge to edge, not a photo of a bed, no perspective, no folds, no creases, no quilting, no highlights or cast shadows. The 3D model will supply folds and quilting. Subject: THE SECRET OF MONKEY ISLAND. A beautiful recognizable classic 1990 hand-painted adventure-game illustration printed into slightly washed cotton: young blond Guybrush Threepwood with white pirate shirt and blue coat, a spectral ghost pirate LeChuck, a moonlit tropical island, pirate sailing ship and turquoise sea, distant warm lanterns. Rich painterly detail, vintage painted game-cover style, not pixel art and not modern cartoon. Put the exact highly legible title 'THE SECRET OF' over 'MONKEY ISLAND' in bold antique warm ivory/gold adventure lettering centered in the upper-middle area, fully inside the central 70 percent width; enough breathing room from the top for the folded duvet edge. Main characters and central island all inside the central 70 percent width; keep outer 12 percent left/right and bottom as a quiet deep petrol-teal fabric border with subtle rope-pattern trim, so the edges can drape down. The lower image should show the pirate ship and moonlit water, not additional text. Fine cotton weave visible throughout, natural pigment, slight laundering fade, realistic matte textile print, no shiny poster paper or plastic, no artificial heavy noise. Even neutral diffuse scan lighting. No bedroom, no mattress, no pillows, no extra frame or surrounding background, no watermark. Target 1536x2048 or the highest available portrait resolution.

## Rendering

The image is only the cotton print. Drape, padding, wrinkles, quilting, thickness, piping and folded reverse fabric are modeled in `retroGamerBedding.js`. The illustration is mapped once from head to foot with clamped edges, sRGB color and anisotropic sampling. Fabric micro-relief uses a separate linear-color-space textile map; no emissive material is used.

