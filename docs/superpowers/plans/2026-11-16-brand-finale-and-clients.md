# Brand finale and clients integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the “Одно целое” ending and place the interactive brand ribbon on the clients page.

**Later user revisions, 2026-11-16:** The orange overview is replaced by the ribbon. The ordinary view and its controls have been removed completely. The public section is now named “Маркетинг” at marketing.html, with a preserving redirect from klienty.html. Earlier ordinary-view clauses below are historical.

**Architecture:** Retain the existing CSS/Three.js scene in a same-origin frame. The clients document owns scrolling and supplies section progress. The frame keeps its existing standalone mode. Generate the clients markup through pages.py, because all four SPA entry documents share that markup.

**Tech Stack:** Static HTML, CSS, native JavaScript, existing local Three.js r180, Python page generator.

**Spec:** User request in this chat, 2026-11-16; concrete interpretation below.

## Design

The ending becomes a composed pale exhibition panel. Two upright lines “ОДНО / ЦЕЛОЕ.” balance a physical orbital logo. A small final row connects meaning, sign and rules. A clear “Обсудить бренд” link leads to the existing client enquiry section. The camera settles on this composition instead of leaving a long empty foreground.

The ribbon is a full-width “Бренд” chapter after the current four-service overview and before the separate ZERNO case. Existing SMM, advertising, website and case content stay available. There is one page scrollbar, with no independent scrolling window inside the ribbon.

## Global Constraints

- Preserve the accepted ribbon, materials, orbit geometry and peripheral exhibits.
- Type remains perpendicular to the surface; soft shadows contain no readable text.
- Modify source generator; do not manually patch generated entry HTML.
- Preserve existing dirty work; no commit, reset, deployment or unrelated changes.
- Honor reduced motion and retain the explicit ordinary-view control.
- Frame messages require matching origin and source window.

## Review Focus

- Enter/leave the ribbon in both scroll directions without trapping the page.
- Jump to brand, final composition and enquiry anchors.
- Change SPA view away from clients and return without duplicate render loops.
- Normal and ordinary flow on desktop and a narrow viewport.
- All original local assets and central 3D logo still load.

### Task 1: Finale

**Files:** studies/brand-flight/index.html, scene.css, scene.js, volume.js, build_geometry.py, text-outlines.json.

- [x] Replace the sparse closing slab with split upright type, a physical logo and a small connected material row.
- [x] Adjust the final floor length and camera pose.
- [x] Export local glyphs, check JS syntax and inspect the final frame in browser.

### Task 2: Page integration

**Files:** sistema/brand-flight.js, sistema/brand-flight.css, sistema/tools/pages.py and generated entry HTML.

- [x] Add lazy, same-origin embedded mode and parent-owned progress.
- [x] Expand the frame into document flow for ordinary viewing.
- [x] Add the brand chapter and stylesheet/script through the page generator.
- [x] Verify native scroll, links, return travel, ordinary view, resize and console.
- [x] Save current screenshots and leave the clients page open.
