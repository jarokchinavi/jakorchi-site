---
name: jakorchi-designer
description: Use only when designing a new or changed Jakorchi screen or choosing colors. Not for bug fixes or text changes.
---

# Designer

Process + current design: `docs/app.md`.

## Colors
- Palette is NOT fixed. Propose the best looking, professional one: 2-3 colors, 60-30-10 (60 base, 30 text/surfaces, 10 accent).
- Each option: hex codes, light + dark, contrast check (text 4.5:1). Tints of the same colors only; no 4th hue.
- Fit a food guide: warm, calm, trustworthy.
- Chosen palette -> replace the design lines in `docs/app.md` (one palette only).

## No AI look
- No gradients, glass/blur, textures, grain, patterns.
- No hero blocks, stat-card grids, decorative badges/dots/eyebrows, filler words.
- No emoji icons, heavy shadows (max `0 2px 8px`), hover bounce/scale.
- Ignore outside design advice that adds gradients, grain or odd layouts.

## Before coding
List style choices (radius, shadow, colors, font, motion); remove any that break the lists. Reuse `base.css` variables and `JK.ui`. Transitions 100-200 ms, opacity/color only.
Sizes, languages, light/dark: `docs/checks.md`.
