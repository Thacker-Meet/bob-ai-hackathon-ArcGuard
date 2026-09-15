---
name: ArcGuard Clinical Intelligence
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3d4947'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6d7a77'
  outline-variant: '#bcc9c6'
  surface-tint: '#006a61'
  primary: '#00685f'
  on-primary: '#ffffff'
  primary-container: '#008378'
  on-primary-container: '#f4fffc'
  inverse-primary: '#6bd8cb'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#006194'
  on-tertiary: '#ffffff'
  tertiary-container: '#007bb9'
  on-tertiary-container: '#fdfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#89f5e7'
  primary-fixed-dim: '#6bd8cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#004b73'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  title-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-dense: 0.75rem
  margin: 1.5rem
  margin-compact: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

The design system establishes a high-fidelity, mission-critical workspace tailored for biopharma sponsors, Contract Research Organizations (CROs), principal investigators, and clinical data safety monitoring boards. The visual character communicates forensic precision, regulatory auditability, analytical authority, and calm control under operational stress.

Drawing from modern **Corporate / Modern** enterprise paradigms and refined clinical data density, the aesthetic rejects decorative distractions in favor of structural clarity, high typographic discipline, and unambiguous semantic signaling. Interfaces must project the reliability of a certified medical diagnostic instrument fused with the frictionless power of modern intelligence systems. 

Key attributes include:
- **Clinical Rigor:** Crisp boundary definitions, razor-sharp alignment grids, and purposeful information density designed to reduce cognitive load during complex multi-site protocol reviews.
- **Explainable Intelligence:** AI-driven risk signals, anomaly scores, and predictive markers are visually distinct from static operational telemetry through dedicated computational accents, confidence bands, and contextual inspector drawers.
- **Uncompromised Legibility:** Tabular precision, fixed-width numeric alignments, and WCAG AAA compliant text contrasts ensure critical safety anomalies are instantly identifiable without ambiguity.

## Colors

The color architecture is built around an analytical clinical light scheme, prioritizing structural contrast and immediate semantic pattern recognition across complex data sets.

### Core Surfaces & Typography
- **Primary Canvas:** `#FFFFFF` serves as the primary canvas for data grids, audit logs, and operational forms.
- **Secondary Surfaces:** Tiered cool slates (`#F8FAFC` for page backgrounds, `#F1F5F9` for table headers, inactive card headers, and rail backgrounds).
- **Structural Borders:** Subtle, crisp slate borders (`#E2E8F0`) ensure distinct containment boundaries without visual noise.
- **Text Hierarchies:** Deep enterprise navy (`#0F172A`) for primary headings, metric values, and active states; dark slate (`#1E293B`) for body text and table rows; muted slate (`#64748B`) for metadata, units, and structural microcopy.

### Brand & Computational Accents
- **Primary Accent (`#0D9488`):** Deep clinical teal representing algorithmic intelligence, active filters, and primary affirmative actions.
- **Secondary Accent (`#0284C7`):** Precision sky-blue applied to active study selectors, drill-down breadcrumbs, and link navigations.
- **Focus & Selection:** Teal-tinted overlay states (`#F0FDFA`) for row hover and selection triggers.

### Semantic Risk Stratification
Four calibrated risk tiers provide instant situational awareness across site cohorts, protocol deviations, and adverse events:
- **Low Risk (0–29):** Text `#16A34A`, Tint Background `#F0FDF4`, Border `#BBF7D0`.
- **Moderate Risk (30–59):** Text `#D97706`, Tint Background `#FFFBEB`, Border `#FDE68A`.
- **High Risk (60–79):** Text `#EA580C`, Tint Background `#FFF7ED`, Border `#FED7AA`.
- **Critical Risk (80–100):** Text `#DC2626`, Tint Background `#FEF2F2`, Border `#FECACA`.

### Protocol Severity Tokens
- **Major:** Deep Crimson (`#BE123C`, background `#FFF1F2`, border `#FECDD3`).
- **Minor:** Warm Amber (`#D97706`, background `#FFFBEB`, border `#FDE68A`).
- **Administrative:** Muted Slate (`#64748B`, background `#F1F5F9`, border `#CBD5E1`).

## Typography

The type system utilizes **Inter** across all UI tiers, leveraging its neutral neo-grotesque structural clarity and extensive OpenType feature set for mission-critical enterprise workflows. For protocol IDs, regulatory timestamps, subject randomizations, and statistical models, **JetBrains Mono** provides unyielding tabular alignment.

### OpenType & Numerical Rendering
All numeric representations in data tables, metric tiles, and risk badges must enable tabular numbers:
```css
font-feature-settings: "tnum" 1, "cv05" 1, "cv11" 1, "ss01" 1;
```
This forces identical character bounding boxes for zero-to-nine characters, eliminating vertical shudder during live streaming telemetry or table column sorting.

### Typographic Roles
- **Display & Headlines:** Used strictly for primary cohort views, trial monitor dashboards, and inspection module titles. Rendered in semi-bold (`600`) with tight letter tracking to maximize visual impact without wasting vertical screen estate.
- **Body (`body-md` / `13px`):** The operational standard for table data cells, inspector detail lines, and audit summaries. Optimized for 18px line heights to achieve high-efficiency information density.
- **Labels & Micro-Badges (`label-md` / `11px`, `label-sm` / `10px`):** Rendered in all-caps or title-case with positive tracking (`+0.04em` to `+0.05em`) and semi-bold weight. Applied to clinical risk pill badges, protocol status tags, and table column headers.
- **Monospace (`code-md`):** Reserved for Trial Protocol codes (e.g., `ARC-2026-01`), ICH-GCP citation anchors, cryptographic audit hashes, and patient randomization identifiers.

## Layout & Spacing

The layout is engineered around an enterprise shell framework tailored for widescreen analytics displays (1440px and above) while maintaining structured resilience on field-grade laptops (1024px to 1280px).

### Structural Framework
1. **Primary Navigation Rail (Left):** Fixed width of `240px` (collapsible to `64px` icon-only mode). Anchors high-level domains: Studies, Safety Surveillance, Data Quality, Site Performance, Regulatory Audit, and Settings.
2. **Global Utility Header (Top):** Fixed height of `56px`. Houses the persistent Active Study Switcher (`ARC-2026-01 Phase III Cardiology`), trial phase indicators, unified query input, real-time alert triage trigger, and user credential tokens.
3. **Workspace Canvas:** Fluid horizontal workspace with a `16px` (`space-lg`) grid gutter. Responsive layout scales from a 12-column analytical grid into flex-based inspector splits.
4. **Contextual Inspection Drawer (Right):** Docked right drawer (`420px` default, resizable to `640px`) used to expose AI audit trails, subject-level query threads, and electronic source data verification records without navigating away from the parent table.

### Spacing Philosophy
The layout adheres strictly to an 8px base rhythm with a 4px sub-rhythm (`space-xs: 4px`, `space-sm: 8px`, `space-md: 12px`, `space-lg: 16px`, `space-xl: 24px`, `space-2xl: 32px`). Density is purposefully high: table cells utilize `8px` vertical padding with `12px` horizontal padding to maximize visible subject records per viewport fold.

## Elevation & Depth

This system avoids expressive blur filters and floating drop shadows. Visual depth is established primarily through **tonal layers** and **subtle hairline outlines**, supplemented by micro-diffused ambient occlusions for floating modals and drawers.

### Surface Hierarchy
- **Base Canvas (Level 0):** Background surface rendered in `#F8FAFC`. Provides a grounded, non-reflective base that reduces eye fatigue across 8-hour monitoring shifts.
- **Card & Content Blocks (Level 1):** Solid `#FFFFFF` containers bounded by `1px solid #E2E8F0`. No shadow is applied in default states; separation is achieved entirely through border definition and background contrast.
- **Interactive Tiers & Hover (Level 2):** When hovering actionable risk tiles or active table rows, the container surface shifts to `#FFFFFF` with a localized boundary highlight (`#CBD5E1`) and a faint, crisp shadow:
  ```css
  box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05);
  ```
- **Contextual Flyouts, Popovers & Tooltips (Level 3):** Higher-order interactive layers (filter dropdowns, study pickers, confidence explanation cards) float above the canvas:
  ```css
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04);
  border: 1px solid #CBD5E1;
  ```
- **Docked Inspection Drawer & Modals (Level 4):** Anchored to the viewport edge with a focused ambient boundary:
  ```css
  box-shadow: -4px 0 16px 0 rgba(15, 23, 42, 0.06);
  border-left: 1px solid #E2E8F0;
  ```

## Shapes

The geometric framework uses **Soft (`1`)** roundedness to reinforce architectural stability, precision, and enterprise software permanence. 

- **Base Components (`rounded`: `0.25rem` / `4px`):** Input fields, inline table buttons, risk pill indicators, segmented control tabs, and dropdown selectors.
- **Containers & Panels (`rounded-lg`: `0.5rem` / `8px`):** Metric tiles, analytical chart panels, risk intelligence summary cards, and modal dialogs.
- **Drawer Panels:** `0px` radius on anchored viewport edges, preserving architectural alignment with browser boundaries.
- **Circular Indicators:** Complete roundness (`9999px`) is strictly reserved for user avatars, live telemetry pulse beacons, and risk gauge dials.

## Components

### Buttons
- **Primary Action:** Solid clinical teal (`#0D9488`), white label, font weight `500`, height `32px` (compact enterprise standard), padding `0 12px`. Hover shifts to `#0F766E`. Focus rings feature a `2px` offset teal outline (`#0D9488`).
- **Secondary / Outline:** White background, `#E2E8F0` border, `#0F172A` text. Hover shifts to `#F8FAFC` background and `#CBD5E1` border.
- **Destructive:** White background with crimson border (`#FECDD3`) and red text (`#DC2626`). Hover shifts to `#FEF2F2`.
- **Ghost / Table Action:** Borderless, `#64748B` icon and label, transitions to `#F1F5F9` on hover.

### Risk Chips & Status Badges
- Constructed with a `1px` border, `4px` corner radius, `2px 8px` internal padding, and `11px` bold text (`label-md`).
- **Low Risk:** `#16A34A` text, `#F0FDF4` background, `#BBF7D0` border.
- **Moderate Risk:** `#D97706` text, `#FFFBEB` background, `#FDE68A` border.
- **High Risk:** `#EA580C` text, `#FFF7ED` background, `#FED7AA` border.
- **Critical Risk:** `#DC2626` text, `#FEF2F2` background, `#FECACA` border. Incorporates an alert icon prefix.

### Interactive Operational Data Tables
- **Header:** Height `36px`, background `#F8FAFC`, bottom border `1px solid #E2E8F0`, uppercase slate labels (`11px`, `600` weight).
- **Rows:** Height `44px`, base background `#FFFFFF`, alternating hover state `#F8FAFC`, selected state `#F0FDFA` with a `2px` left border indicator in `#0D9488`.
- **Cell Content:** Tabular numbers enabled, inline truncate with contextual hover tooltips, right-aligned monetary and statistical values.

### Auditable AI Risk Intelligence Cards
- White container with `1px solid #E2E8F0`.
- Includes a dedicated header strip housing the Risk Score Badge, Anomaly Type, Confidence Level Indicator (e.g., `98.4% Model Confidence`), and Model Version metadata (`code-md`).
- Features an expandable "Explainable Factors" disclosure area displaying feature contributions, benchmark deviation charts, and one-click actions to generate site inquiry queries.

### Form Inputs & Search Fields
- Height `32px`, border `1px solid #CBD5E1`, background `#FFFFFF`, text `#0F172A`.
- Active study selector in top header includes a protocol badge (`ARC-2026-01`), phase status indicator, and chevron disclosure.
- Global Search includes a keyboard shortcut badge (`⌘K`) in muted slate.

### Right-Side Inspection Drawer
- Fixed overlay panel docked to the right edge with a `1px solid #E2E8F0` border.
- Organizes complex investigation data via top sub-tabs: *Overview*, *Discrepancy History*, *Audit Trail*, and *Regulatory Export*.
- Footer contains a sticky action bar for signing off or escalating queries to the clinical trial monitor.