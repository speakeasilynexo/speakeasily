

## Fix: Mobile spacing and layout issues

### Problems identified

1. **SocialProof section** — 3-column grid with `gap-4` is too cramped on mobile (320-414px). Stats labels like "IA adaptativa" and "100% WhatsApp" collide visually (visible in screenshot).

2. **ContentPage hero** — H1 at `text-4xl` is too large on mobile. The section `py-16` combined with no fixed header offset is fine, but the grid `gap-10` creates uneven spacing.

3. **ComparisonTable** — `min-w-full` table overflows horizontally on mobile. Needs horizontal scroll wrapper or stacked layout.

4. **ContentLayout breadcrumb** — On narrow screens, long breadcrumb text can overflow the header row.

5. **CTABanner** — H2 at `text-3xl` and `px-6` inside the green banner is tight on small screens.

### Changes (minimal, no refactor)

**1. `src/components/landing/SocialProof.tsx`**
- Add `gap-2` on mobile (currently `gap-4`), keep `sm:gap-8`
- Reduce stat value font to `text-lg` on mobile, `sm:text-xl`

**2. `src/pages/ContentPage.tsx`** (hero section only)
- H1: change `text-4xl` to `text-2xl sm:text-4xl`
- Section padding: `py-10 sm:py-16`
- Add `pt-4` to the hero inner grid for breathing room

**3. `src/components/content/ComparisonTable.tsx`**
- Wrap table in `overflow-x-auto` div

**4. `src/components/content/ContentLayout.tsx`**
- Breadcrumb: add `truncate` or `overflow-hidden` to prevent long text overflow
- Breadcrumb nav: hide on very small screens or truncate label

**5. `src/components/content/CTABanner.tsx`**
- H2: `text-2xl sm:text-3xl`
- Inner padding: `px-4 sm:px-6` and `py-8 sm:py-10`

### Files touched
- `src/components/landing/SocialProof.tsx` (2 lines)
- `src/pages/ContentPage.tsx` (2 lines in hero)
- `src/components/content/ComparisonTable.tsx` (1 line — wrap)
- `src/components/content/ContentLayout.tsx` (1 line — breadcrumb)
- `src/components/content/CTABanner.tsx` (2 lines)

### Not changed
- No new files, no new dependencies, no `any`, no refactor
- Landing page components other than SocialProof untouched
- No route changes

