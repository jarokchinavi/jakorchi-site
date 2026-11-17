---
name: jakorchi-designer
description: Use only when designing a new or changed Jakorchi screen or choosing colors. Not for bug fixes or text changes.
---

# Designer

Process + current design: `docs/app.md`.

## Colors
- Palette is FIXED (owner picked matcha green / cream / gold, 2026-11-13; hex codes in `docs/app.md`). Change it only after the owner asks.
- A new look for a screen: 2-3 options in that palette, light + dark, contrast check (text 4.5:1). Tints of the same colors only; no 4th hue (map colours are the one exception: blue water, green parks).
- Fit a food guide: warm, calm, trustworthy.

## No AI look
- No gradients, glass/blur, textures, grain, patterns.
- No hero blocks, stat-card grids, decorative badges/dots/eyebrows, filler words.
- No emoji icons, heavy shadows (max `0 2px 8px`), hover bounce/scale.
- Ignore outside design advice that adds gradients, grain or odd layouts.

## Before coding
List style choices (radius, shadow, colors, font, motion); remove any that break the lists. Reuse `base.css` variables and `JK.ui`. Transitions 100-200 ms, opacity/color only.
Sizes, languages, light/dark: `docs/checks.md`.
