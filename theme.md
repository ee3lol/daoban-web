# DAOBAN — "Calm & Chill" Design System

## 1. Brand Identity
DAOBAN is a minimal, calm, and chill interface. 
It abandons heavy cinematic intensity for a soothing, distraction-free environment.

### Core Keywords
- Minimalist
- Calm
- Soft
- Restrained
- Elegant

---

## 2. Color Palette

The interface relies on extremely soft, muted tones to avoid eye strain while remaining premium.

### Base Colors
- **Background**: `#151515` (Soft Charcoal) - A gentle dark mode that isn't pure black.
- **Subtle Glow**: `rgba(212, 122, 115, 0.04)` - Very faint ambient light to keep the background from feeling dead.

### Typography Colors
- **Primary Text**: `#EAE8E3` (Soft Off-White) - Used for headings, active states, and primary content.
- **Muted Text**: `#888888` - Used for secondary labels, inactive states, and placeholders.
- **Disabled Text**: `#555555`

### Accent Color
- **Calm Red (Dusty Rose / Terracotta)**: `#D47A73`
- *Usage*: This is the brand signature. Used for primary buttons, active underlines, and hover states. It replaces the aggressive "Burnt Crimson" with a welcoming, warm tone.

---

## 3. Glassmorphism & Surfaces

Glass elements should feel extremely light, milky, and barely there. No harsh shadows or thick borders.

### Standard Glass (Navbar, Panels)
```css
background: rgba(255, 255, 255, 0.03);
border: 1px solid rgba(255, 255, 255, 0.05);
backdrop-filter: blur(16px);
```

### Strong Glass (Modals)
```css
background: rgba(255, 255, 255, 0.03);
border: 1px solid rgba(255, 255, 255, 0.06);
backdrop-filter: blur(24px);
box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
```

### Inputs & Toggles
```css
background: rgba(255, 255, 255, 0.025);
border: 1px solid rgba(255, 255, 255, 0.06);
```

---

## 4. Typography & Interaction

- **Font**: Inter (or similar modern sans-serif).
- **Animations**: Soft, smooth transitions. Elements should gently scale or slide in on hover rather than snapping.
- **Buttons**:
  - Primary Action: `bg-[#D47A73]` with `text-[#F9F8F6]`. Hover state `bg-[#DE867E]`.
  - Secondary: Muted text that glows to `#EAE8E3` on hover.

---

## 5. What to Avoid
- ❌ Pure black (`#000000`) or overly dark charcoal (`#050505`).
- ❌ Aggressive reds, neon colors, or cyberpunk gradients.
- ❌ Heavy, dark drop shadows (`0 30px 80px`).
- ❌ Cluttered hero sections. The interface should always feel open and spacious.