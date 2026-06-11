---
name: Ethos Research System
colors:
  surface: '#faf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#faf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f4f0'
  surface-container: '#efeeea'
  surface-container-high: '#e9e8e4'
  surface-container-highest: '#e3e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#494740'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ed'
  outline: '#7a776f'
  outline-variant: '#cbc6bd'
  surface-tint: '#605e5a'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1d1b18'
  on-primary-container: '#86837f'
  inverse-primary: '#cac6c1'
  secondary: '#605e56'
  on-secondary: '#ffffff'
  secondary-container: '#e3dfd4'
  on-secondary-container: '#65635a'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1d1b1d'
  on-tertiary-container: '#878385'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e6e2dc'
  primary-fixed-dim: '#cac6c1'
  on-primary-fixed: '#1d1b18'
  on-primary-fixed-variant: '#484743'
  secondary-fixed: '#e6e2d7'
  secondary-fixed-dim: '#cac6bc'
  on-secondary-fixed: '#1d1c15'
  on-secondary-fixed-variant: '#48473f'
  tertiary-fixed: '#e7e1e3'
  tertiary-fixed-dim: '#cac5c8'
  on-tertiary-fixed: '#1d1b1d'
  on-tertiary-fixed-variant: '#494648'
  background: '#faf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e3e2df'
  border-subtle: '#E4E2DB'
  border-emphasis: '#CBC9C1'
  text-tertiary: '#A09E96'
  replacement-bg: '#EAF3DE'
  replacement-text: '#27500A'
  replacement-border: '#639922'
  reduction-bg: '#FAEEDA'
  reduction-text: '#633806'
  reduction-border: '#BA7517'
  refinement-bg: '#E1F5EE'
  refinement-text: '#085041'
  refinement-border: '#1D9E75'
  info-bg: '#E6F1FB'
  info-text: '#0C447C'
  info-border: '#378ADD'
typography:
  headline-lg:
    fontFamily: DM Sans
    fontSize: 17px
    fontWeight: '500'
    lineHeight: 24px
  body-base:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
  nav-logo:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '500'
    letterSpacing: -0.01em
  nav-link:
    fontFamily: DM Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: normal
  card-title:
    fontFamily: DM Sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
  label-caps:
    fontFamily: DM Sans
    fontSize: 13px
    fontWeight: '500'
    letterSpacing: 0.04em
  metadata:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: normal
  badge-button:
    fontFamily: DM Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: normal
  small-label:
    fontFamily: DM Sans
    fontSize: 11px
    fontWeight: '500'
    letterSpacing: 0.06em
  monospace-data:
    fontFamily: DM Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: normal
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-padding: 24px
  section-gap: 48px
  card-gap: 16px
  element-gap: 12px
  fine-gap: 8px
  gutter: 16px
  margin-label: 14px
---

## Brand & Style

This design system is built on the philosophy of **Scientific Precision**. It is designed for researchers and academics who require high-density information environments that remain legible and stress-free during extended use. The brand personality is professional, restrained, and authoritative, eschewing decorative trends in favor of functional clarity.

The aesthetic follows a **Minimalist / Modern** approach with a specific "paper-like" warmth. By replacing clinical whites with soft off-whites, the UI reduces eye strain and evokes the feeling of a physical research journal. Color is used as a functional tool rather than a decorative element; it is strictly reserved for semantic signaling—specifically the "3R" scientific classifications—to ensure that the researcher's focus is immediately directed to critical data points.

**Design Principles:**
- **Functional Monochromatism:** Navigation and structural elements remain in a grayscale palette to prioritize data.
- **Academic Warmth:** Use the off-white background to create a sophisticated, trustworthy atmosphere.
- **Information Density:** High-density layouts that use systematic spacing to prevent clutter.
- **Hierarchy through Opacity:** Use reduced opacity (65%) for secondary information to maintain a clean visual path for primary results.

## Colors

The palette is anchored by the **Neutral Foundational** set. The primary background (`#F7F6F2`) provides a warm, non-clinical base, while the primary text and CTAs use a deep charcoal (`#1A1916`) to ensure maximum legibility and contrast.

**Color Usage Rules:**
- **Monochrome Foundation:** All navigation, icons, structural borders, and standard buttons must use the neutral scale (Black/White/Gray). 
- **The 3R Semantic Palette:** Saturated color is exclusively reserved for the 3R badges:
    - **Green (Replacement):** For methods that replace animal subjects.
    - **Amber (Reduction):** For methods that reduce the number of subjects.
    - **Teal (Refinement):** For methods that refine procedures to lessen impact.
- **Information Blue:** Used sparingly for jurisdictional indicators (e.g., "Brasil/Intl.") and regulatory source links.
- **Dimmed State:** For low-relevance data (scores &lt; 65%), the text and element opacity should be reduced to 65% to visually de-prioritize the item without hiding it.

## Typography

The system utilizes **DM Sans** for its humanist yet geometric qualities, providing a professional and highly legible experience across all interfaces. For technical data—such as result scores, parameters, and database counts—**DM Mono** is used to signal "data" and "precision."

**Hierarchy Guidelines:**
- **Headlines:** Keep sizes modest (max 17px) to maintain the high-density aesthetic. Hierarchy is achieved through weight and spacing rather than massive scale.
- **Technical Data:** Always use the `monospace-data` token for scores (e.g., "95%") and technical parameters to distinguish them from descriptive prose.
- **Labels:** Use uppercase with increased letter spacing for section headers to provide a clear structural anchor for the eye.

## Layout & Spacing

The layout model utilizes a **Fixed Grid** approach for internal content, centered within the browser to maintain focus, while the Top Navigation Bar remains fluid. The system relies on a rigorous 4px/8px baseline rhythm.

**Layout Structure:**
- **Desktop:** A 12-column structure with 16px gutters. Page content is typically housed in a central container with 24px side padding.
- **Sidebar Exception:** Sidebars are reserved exclusively for the "Search" (S4) interface to allow for iterative filtering. All other screens use a single-column, centered flow.
- **Reflow:** On mobile devices, side-by-side elements (like 3R badges and score indicators) stack vertically if they exceed 320px in total width.
- **Density:** Use the `fine-gap` (8px) for related metadata clusters and the `card-gap` (16px) to separate distinct result entities.

## Elevation & Depth

This design system is **Strictly Flat**. It rejects the use of box-shadows and blurred depth in favor of clear structural boundaries.

**Depth Layers:**
- **Foundational Layer:** The page background (`#F7F6F2`).
- **Surface Layer:** Cards, inputs, and the app frame use a white background (`#FFFFFF`) to pop against the warm foundation.
- **Boundaries:** Depth is communicated via 1px solid borders.
    - Use `border-subtle` (#E4E2DB) for general containment and separators.
    - Use `border-emphasis` (#CBC9C1) for interactive element shells like inputs and hover states.
- **Opacity as Hierarchy:** Instead of lifting objects "closer" to the user with shadows, de-prioritize lower-relevance items by dropping their opacity to 65%.

## Shapes

The shape language is refined and "Soft-Modern," balancing the technical nature of the content with a contemporary feel. 

**Rounding Logic:**
- **Primary Elements:** Result cards and input fields use a standard 8px-10px radius (`rounded-lg`).
- **Secondary Elements:** Buttons, chips, and small interactive points use a 6px radius (`rounded-md`).
- **Outer Frame:** The main application container uses a 14px radius (`rounded-xl`) to define the overall workspace.
- **Pills:** Semantic badges (3Rs) and language toggles use a full **Pill** (20px+) radius to distinguish them from structural elements.

## Components

**Buttons & CTAs:**
- **Primary CTA:** Solid charcoal fill (#1A1916) with white text. No shadows. 6px radius.
- **Secondary/Export:** Outlined with `border-emphasis`. Transitions to a subtle gray background on hover.

**Input Fields:**
- **Shells:** White background with a 1px `border-emphasis`. 
- **Focus State:** Border color transitions to primary charcoal (#1A1916) with no "glow" or shadow.
- **Language Toggle:** A pill-shaped container inside the input shell for immediate context.

**Result Cards:**
- **Structure:** White background, 1px `border-subtle`. 
- **3R Badges:** Placed in the top-left or top-right of the card as the primary visual anchor.
- **Hover:** Border transitions to `border-emphasis` over 0.12s.

**Badges (3Rs & Jurisdiction):**
- **3Rs:** Use the semantic palette (e.g., Replacement uses `--rep-bg`, `--rep-text`, and `--rep-border`). 1px border is mandatory to ensure the colors don't feel "floating."
- **Jurisdiction:** Use the "Info" blue palette with 12px `badge-button` typography.

**Icons:**
- 14px x 14px custom SVG line icons.
- Stroke: 1.8 weight, rounded caps and joins.
- No fills, except for semantic status dots.