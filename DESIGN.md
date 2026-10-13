# EasyJob Design System Contract (DESIGN.md)
*Crafted following the Impeccable Frontend Methodology (pbakaus/impeccable)*

---

## 1. Visual Identity & Register
- **Brand Personality**: High-trust, energetic, neighborhood-scale utility with German statutory rigor. Friendly and approachable for 13–17-year-old youth workers while remaining solid and authoritative for adult hirers and parents.
- **Aesthetic Stance**: Clean architectural minimalism with tactile depth. Strictly rejects generic "AI slop" (floating purple-to-blue gradients, untinted slate, and cookie-cutter FAB bars).

---

## 2. Color System & Contrast Bounds
| Token | Light Mode Value | Dark Mode Value | Semantic Role |
| :--- | :--- | :--- | :--- |
| `--qj-primary` | `#0070f3` | `#38bdf8` | Primary Brand Signal & Active States |
| `--qj-primary-hover` | `#005bb5` | `#0284c7` | Interactive Press Focus |
| `--qj-accent-gold` | `#f59e0b` | `#fbbf24` | Fair-Pay Boosts & Microjob Bonuses |
| `--qj-accent-success` | `#10b981` | `#34d399` | Completion & Safety Verified |
| `--qj-accent-danger` | `#dc2626` | `#ef4444` | Emergency SOS, Logout, Violations |
| `--qj-bg` | `#f8fafc` (Warm Slate) | `#0b0f17` (Obsidian Lacquer) | Canvas Ground |
| `--qj-card` | `#ffffff` | `#131b2a` | Elevated Content Surfaces |
| `--qj-surface-muted` | `#f1f5f9` | `#1a2438` | Segment Wells & Search Bars |
| `--qj-border` | `#e2e8f0` | `#23324d` | Hairline Surface Borders |
| `--qj-text-main` | `#0f172a` | `#f8fafc` | High-Contrast Headings & Body |
| `--qj-text-muted` | `#475569` | `#94a3b8` | Supporting Descriptions (WCAG AA) |

*Rule: Neutrals are strictly tinted to avoid sterile pure grays. Dark mode uses deep obsidian lacquer `#0b0f17` with warm tinted boundaries.*

---

## 3. Navigation & Menu Architecture (100 Anti-Patterns Defense)
*Enforces full compliance with `.skills/impeccable/rules/ai-menu-slop-100.md`.*
1. **Architectural Dock Invariants**:
   - **Height & Vertical Space**: Maximum 58px (+ safe-area-inset-bottom). Strictly rejects bloated 75px–85px bars (Anti-Pattern #22).
   - **Internal Padding Economy**: Streamlined 3px top/bottom padding to maximize screen canvas (Anti-Pattern #23).
   - **Hairline Specular Rim**: Specular highlight `inset 0 1px 0 rgba(255, 255, 255, 0.85)` in light, `0.06` in dark.
   - **Ambient Occlusion**: Multi-stop grounded shadow (`0 -4px 20px -2px rgba(15, 23, 42, 0.05)`).
2. **Active State (Fluid Capsule & Optical Anchor)**:
   - **Zero Flat 3px Underline Sticks** (Anti-Pattern #3): Replaced by a subtle tinted fluid capsule (`rgba(0, 145, 255, 0.09)`) and a delicate 3.5px anchor micro-dot with soft bloom.
3. **Primary Action ("Create" Jewel Button)**:
   - **No Cookie-Cutter FAB or Squeezed Pill** (Anti-Pattern #1 & #37): Sculpted jewel button with dual-tone depth, specular rim highlight, and tactile physical press feedback.
4. **Ergonomics & Touch Target Invariant**:
   - Every single interactive tap zone meets or exceeds 44×44px (Anti-Pattern #61) while maintaining proportional optical spacing.
   - Labels have deliberate tracking (`0.01em`) and optical sizing, never truncating or wrapping clumsily (Anti-Pattern #35 & #46).
5. **No Clutter & No Floating Stalkers**:
   - Zero floating debug or widget pills pinned over content or dock (Anti-Pattern #25).
   - Zero stacked keyhole filters eating screen height (Anti-Pattern #24 & #33).
   - Clean, breathing content canvas with streamlined screen padding.

---

## 4. Typography & Spatial Rhythm
- **Primary Face**: System-native grotesque typography with deliberate tracking (`-0.02em` on hero titles, `0.01em` on labels).
- **Tabular Figures**: Monospace numerals (`var(--qj-font-mono)`) for timestamps, currency amounts (€/h), and statutory timers.
- **Touch Target Invariant**: All clickable buttons and navigation elements meet or exceed 44×44px interactive tap zones.
- **Spatial Economy**: Tightened screen container gaps (`0.85rem-0.9rem`) and optimized card padding to guarantee at least 2 full cards are visible on standard 390px viewports without scrolling.

---

## 5. Motion & Tactile Feedback
- **Easing Curve**: Physics-based springs (`cubic-bezier(0.2, 0.8, 0.2, 1)`) for micro-interactions.
- **Haptic Depress**: All tap targets provide physical press confirmation via `:active { transform: scale(0.92); }`.
- **Zero Cheap Bounces**: Avoid exaggerated cartoonish elastic animations (Anti-Pattern #64).

