# D.A.E.D.A.L.U.S.

**Elysium Area — Elite Dangerous — Assembly, Logistics, Upgrades & Settlement**

A full-stack colonization manager for Elite Dangerous. Plan system builds, track commodity deliveries, and visualize your expanding civilization with an interactive Orrery-style system map.

> *Build your wings. Reach new worlds.* 🪶

## What It Does

- **System Orrery** — Interactive SVG system map showing all bodies, orbits, and build slots
- **Build Planner** — MILP-optimized facility placement with economy link analysis
- **Delivery Tracker** — Real-time commodity tracking against construction goals
- **Multi-System Dashboard** — Manage all your colonized systems from one view

## Stack

- React 19 + TypeScript
- Vite
- SVG-based Orrery renderer
- HiGHS solver (via WebAssembly) for build optimization
- Spansh + EDSM APIs for system data

## Getting Started

```bash
npm install
npm run dev
```

## Credits

Build planning solver based on [ed-colonisation-planner](https://github.com/gaborauth/ed-colonisation-planner) by gaborauth (MIT License).

System data from [Spansh](https://spansh.co.uk/) and [EDSM](https://www.edsm.net/).

Elite Dangerous assets from [edassets.org](https://edassets.org/).

---

*Elite Dangerous © Frontier Developments plc. Daedalus is a fan-made tool and is not affiliated with or endorsed by Frontier Developments.*