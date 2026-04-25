/**
 * FANUC iPendant Simulator — STATUS sub-screens & POSITION fixes
 * =================================================================
 * Patch file: status_and_position.js
 *
 * This file provides drop-in replacements for the existing `status` and
 * `position` page definitions inside the PAGES object in index.html.
 *
 * USAGE:
 *   1. Add `state.statusTab = 0;` to the state initialization block.
 *   2. Add `state.statusPage2 = false;` to the state initialization block.
 *   3. Replace the existing PAGES.status object with `PAGES_STATUS`.
 *   4. Replace the existing PAGES.position object with `PAGES_POSITION`.
 *   5. In the CASCADE_SUBS.statusSub items, update targets:
 *        'Axis'      → 'status'
 *        'Version ID' → 'status'  (they all go to the same page, tab controlled by state.statusTab)
 *
 * External dependencies (must exist in the host file):
 *   - state, fmt(), goPage(), toast(), renderPage(), setSoftKeys(),
 *     deadmanHeld(), refreshStatus(), body, fkEls
 *   - CSS classes: pg-title, pg-list, pg-row, pg-section, pg-mono,
 *     screen-fkeys, k-col, v-col, sel, prog-bar
 */

/* ===================================================================
   SECTION 1 — STATUS SUB-SCREENS
   =================================================================== */

/**
 * Render the STATUS / AXIS sub-screen.
 *
 * Reference (REFERENCE_SCREENS.md STATUS F1 AXIS):
 * ┌─────────────────────────────────────┐
 * │ STATUS / AXIS              R-30iB   │
 * │                                     │
 * │          CURRENT   COMMAND           │
 * │ J1      +0.000    +0.000     °      │
 * │ J2      -90.000   -90.000    °      │
 * │ J3      +0.000    +0.000     °      │
 * │ J4      +0.000    +0.000     °      │
 * │ J5      +0.000    +0.000     °      │
 * │ J6      +0.000    +0.000     °      │
 * │                                     │
 * │ Speed: 100%                         │
 * │                                     │
 * └─────────────────────────────────────┘
 */
function renderStatusAxis() {
  // COMMAND positions mirror CURRENT in a sim (no motion program running)
  const cmd = state.positions.slice(); // clone
  let html = '<div class="pg-section" style="display:flex;justify-content:space-between;">'
            + '<span>STATUS / AXIS</span><span style="font-weight:400;">R-30iB</span></div>';
  // Header row
  html += '<div class="pg-list">';
  html += '<div class="pg-row" style="font-weight:700;font-size:10px;">'
        + '<span style="display:inline-block;width:2.6em;"></span>'
        + '<span style="display:inline-block;width:7em;text-align:right;">CURRENT</span>'
        + '<span style="display:inline-block;width:7em;text-align:right;padding-left:4px;">COMMAND</span>'
        + '<span style="display:inline-block;width:1.5em;text-align:right;">&deg;</span>'
        + '</div>';
  for (let i = 0; i < 6; i++) {
    const cur = fmt(state.positions[i]);
    const cm  = fmt(cmd[i]);
    html += `<div class="pg-row" style="font-family:'Courier New',monospace;font-size:11px;">`
          + `<span class="k-col">J${i+1}</span>`
          + `<span class="v-col">${cur}</span>`
          + `<span style="display:inline-block;width:7em;text-align:right;">${cm}</span>`
          + `<span style="display:inline-block;width:1.5em;text-align:right;">°</span>`
          + `</div>`;
  }
  // Speed row
  html += `<div class="pg-row" style="font-family:'Courier New',monospace;font-size:11px;margin-top:4px;">`
        + `<span class="k-col">Speed</span>`
        + `<span class="v-col">${state.speedOverride}%</span>`
        + `</div>`;
  html += '</div>';
  return html;
}

/**
 * Render the STATUS / SAFETY sub-screen.
 *
 * Reference (REFERENCE_SCREENS.md STATUS F2 SAFETY):
 * ┌─────────────────────────────────────┐
 * │ STATUS / SAFETY             R-30iB  │
 * │                                     │
 * │ E-STOP:      ON                     │
 * │ DEADMAN:     OFF                    │
 * │ HOLD:        OFF                    │
 * │ FAULT:       OFF                    │
 * │ DCS:         OK                     │
 * │                                     │
 * └─────────────────────────────────────┘
 */
function renderStatusSafety() {
  const items = [
    { label: 'E-STOP',  value: state.estop ? 'ON' : 'OFF',  alert: state.estop },
    { label: 'DEADMAN', value: deadmanHeld() ? 'ON' : 'OFF', alert: !deadmanHeld() },
    { label: 'HOLD',    value: state.hold ? 'ON' : 'OFF',   alert: state.hold },
    { label: 'FAULT',   value: state.fault ? 'ON' : 'OFF',  alert: state.fault },
    { label: 'DCS',     value: (!state.estop && !state.fault) ? 'OK' : 'NOT OK', alert: (state.estop || state.fault) },
  ];
  let html = '<div class="pg-section" style="display:flex;justify-content:space-between;">'
            + '<span>STATUS / SAFETY</span><span style="font-weight:400;">R-30iB</span></div>';
  html += '<div class="pg-list">';
  items.forEach(it => {
    const color = it.alert ? ' style="color:#d22;font-weight:700;"' : ' style="color:#2a2;font-weight:700;"';
    html += `<div class="pg-row" style="font-family:'Courier New',monospace;">`
          + `<span class="k-col">${it.label}:</span>`
          + `<span class="v-col"${color}>${it.value}</span>`
          + `</div>`;
  });
  html += '</div>';
  return html;
}

/**
 * Render the STATUS / VERSION sub-screen.
 */
function renderStatusVersion() {
  const items = [
    { label: 'Controller',  value: 'R-30iB' },
    { label: 'Robot',       value: 'R-2000iC/165F' },
    { label: 'Software',   value: 'V8.30P/15' },
    { label: 'Servo',      value: 'V8.30/01' },
    { label: 'Robot ID',   value: 'R-2000iC/165F-A' },
    { label: 'Axes',       value: '6' },
    { label: 'iRPickTool',  value: '---' },
    { label: 'Palletize',  value: '---' },
  ];
  let html = '<div class="pg-section" style="display:flex;justify-content:space-between;">'
            + '<span>STATUS / VERSION ID</span><span style="font-weight:400;">R-30iB</span></div>';
  html += '<div class="pg-list">';
  items.forEach(it => {
    html += `<div class="pg-row" style="font-family:'Courier New',monospace;">`
          + `<span class="k-col">${it.label}</span>`
          + `<span class="v-col">${it.value}</span>`
          + `</div>`;
  });
  html += '</div>';
  return html;
}

/**
 * Render the STATUS / MEMORY sub-screen.
 * Shows TP and KAREL memory usage with progress bars.
 */
function renderStatusMemory() {
  // Simulated memory values
  const tpTotal    = 16000; // KB
  const tpUsed     = 3200;
  const tpPct      = Math.round((tpUsed / tpTotal) * 100);
  const karelTotal = 8000;
  const karelUsed  = 1200;
  const karelPct   = Math.round((karelUsed / karelTotal) * 100);
  const varsUsed   = Object.keys(state.sysVars).length;
  const regsUsed   = state.numReg.length;
  const prUsed     = state.prRegs ? 10 : 0;
  const progCount  = state.programs.length;

  let html = '<div class="pg-section" style="display:flex;justify-content:space-between;">'
            + '<span>STATUS / MEMORY</span><span style="font-weight:400;">R-30iB</span></div>';
  html += '<div class="pg-list">';

  // TP Programs
  html += '<div class="pg-row" style="font-family:\'Courier New\',monospace;font-weight:700;">'
        + 'TP PROGRAMS</div>';
  html += `<div class="pg-row" style="font-family:'Courier New',monospace;">`
        + `<span class="k-col">Used</span>`
        + `<span class="v-col">${(tpUsed/1024).toFixed(1)} MB / ${(tpTotal/1024).toFixed(0)} MB</span>`
        + `</div>`;
  html += '<div class="prog-bar"><div style="width:' + tpPct + '%;background:#2fb02f;"></div>'
        + '<span>' + tpPct + '%</span></div>';

  // KAREL
  html += '<div class="pg-row" style="font-family:\'Courier New\',monospace;font-weight:700;margin-top:4px;">'
        + 'KAREL</div>';
  html += `<div class="pg-row" style="font-family:'Courier New',monospace;">`
        + `<span class="k-col">Used</span>`
        + `<span class="v-col">${(karelUsed/1024).toFixed(1)} MB / ${(karelTotal/1024).toFixed(0)} MB</span>`
        + `</div>`;
  html += '<div class="prog-bar"><div style="width:' + karelPct + '%;background:#2c6ba8;"></div>'
        + '<span>' + karelPct + '%</span></div>';

  // Detail counts
  html += '<div class="pg-row" style="font-family:\'Courier New\',monospace;margin-top:4px;">'
        + `<span class="k-col">Programs</span><span class="v-col">${progCount}</span></div>`;
  html += '<div class="pg-row" style="font-family:\'Courier New\',monospace;">'
        + `<span class="k-col">Registers</span><span class="v-col">${regsUsed}</span></div>`;
  html += '<div class="pg-row" style="font-family:\'Courier New\',monospace;">'
        + `<span class="k-col">Pos Regs</span><span class="v-col">${prUsed}</span></div>`;
  html += '<div class="pg-row" style="font-family:\'Courier New\',monospace;">'
        + `<span class="k-col">Sys Vars</span><span class="v-col">${varsUsed}</span></div>`;

  html += '</div>';
  return html;
}

/**
 * Render STATUS / PAGE 2 sub-screens:
 * F1 Prg Timer, F2 Sys Timer, F3 Condition, F4 Program, F5 Notifications
 */
function renderStatusPrgTimer() {
  let html = '<div class="pg-section" style="display:flex;justify-content:space-between;">'
            + '<span>STATUS / Prg Timer</span><span style="font-weight:400;">R-30iB</span></div>';
  html += '<div class="pg-list">';
  const now = new Date();
  const elapsed = state.program ? '00:00:05' : '--:--:--';
  const items = [
    { label: 'Program',      value: state.program || '— none —' },
    { label: 'Elapsed',     value: elapsed },
    { label: 'Run Time',    value: state.program ? '00:00:05' : '--:--:--' },
    { label: 'Idle Time',   value: '00:00:00' },
    { label: 'Part Count',  value: '0' },
    { label: 'Cycle Count', value: '0' },
  ];
  items.forEach(it => {
    html += `<div class="pg-row" style="font-family:'Courier New',monospace;">`
          + `<span class="k-col">${it.label}</span>`
          + `<span class="v-col">${it.value}</span>`
          + `</div>`;
  });
  html += '</div>';
  return html;
}

function renderStatusSysTimer() {
  let html = '<div class="pg-section" style="display:flex;justify-content:space-between;">'
            + '<span>STATUS / Sys Timer</span><span style="font-weight:400;">R-30iB</span></div>';
  html += '<div class="pg-list">';
  const items = [
    { label: 'Timer 1', value: '00:00:00' },
    { label: 'Timer 2', value: '00:00:00' },
    { label: 'Timer 3', value: '00:00:00' },
    { label: 'Timer 4', value: '00:00:00' },
    { label: 'Timer 5', value: '00:00:00' },
    { label: 'Timer 6', value: '00:00:00' },
  ];
  items.forEach(it => {
    html += `<div class="pg-row" style="font-family:'Courier New',monospace;">`
          + `<span class="k-col">${it.label}</span>`
          + `<span class="v-col">${it.value}</span>`
          + `</div>`;
  });
  html += '</div>';
  return html;
}

function renderStatusCondition() {
  let html = '<div class="pg-section" style="display:flex;justify-content:space-between;">'
            + '<span>STATUS / Condition</span><span style="font-weight:400;">R-30iB</span></div>';
  html += '<div class="pg-list">';
  const items = [
    { label: 'Condition 1', value: '---' },
    { label: 'Condition 2', value: '---' },
    { label: 'Condition 3', value: '---' },
    { label: 'Condition 4', value: '---' },
    { label: 'Condition 5', value: '---' },
    { label: 'Condition 6', value: '---' },
  ];
  items.forEach(it => {
    html += `<div class="pg-row" style="font-family:'Courier New',monospace;">`
          + `<span class="k-col">${it.label}</span>`
          + `<span class="v-col">${it.value}</span>`
          + `</div>`;
  });
  html += '</div>';
  return html;
}

function renderStatusProgram() {
  let html = '<div class="pg-section" style="display:flex;justify-content:space-between;">'
            + '<span>STATUS / Program</span><span style="font-weight:400;">R-30iB</span></div>';
  html += '<div class="pg-list">';
  const items = [
    { label: 'Program',   value: state.program || '— none —' },
    { label: 'Task',      value: '1' },
    { label: 'Line',      value: String(state.progLine || 0) },
    { label: 'Mode',      value: state.mode },
    { label: 'Override',  value: state.speedOverride + '%' },
    { label: 'Step',      value: state.step ? 'ON' : 'OFF' },
    { label: 'Hold',      value: state.hold ? 'ON' : 'OFF' },
    { label: 'Running',   value: state.program ? 'YES' : 'NO' },
  ];
  items.forEach(it => {
    html += `<div class="pg-row" style="font-family:'Courier New',monospace;">`
          + `<span class="k-col">${it.label}</span>`
          + `<span class="v-col">${it.value}</span>`
          + `</div>`;
  });
  html += '</div>';
  return html;
}

function renderStatusNotifications() {
  let html = '<div class="pg-section" style="display:flex;justify-content:space-between;">'
            + '<span>STATUS / Notifications</span><span style="font-weight:400;">R-30iB</span></div>';
  html += '<div class="pg-list">';
  const items = [
    { label: '1', value: 'No notifications' },
    { label: '2', value: '' },
    { label: '3', value: '' },
    { label: '4', value: '' },
    { label: '5', value: '' },
  ];
  items.forEach(it => {
    html += `<div class="pg-row" style="font-family:'Courier New',monospace;">`
          + `<span class="k-col">${it.label}</span>`
          + `<span class="v-col">${it.value}</span>`
          + `</div>`;
  });
  html += '</div>';
  return html;
}

/**
 * The combined STATUS page definition.
 * Uses state.statusTab (0-4) for page 1, and state.statusPage2Sub (0-4) for page 2.
 * state.statusPage2 = false means page 1 soft keys, true means page 2 soft keys.
 */
const PAGES_STATUS = {
  title: () => {
    if (state.statusPage2) {
      const subs = ['Prg Timer', 'Sys Timer', 'Condition', 'Program', 'Notifications'];
      return 'STATUS / ' + (subs[state.statusTab2 || 0] || '');
    }
    const subs = ['AXIS', 'SAFETY', 'VERSION', 'MEMORY', ''];
    return 'STATUS / ' + (subs[state.statusTab || 0] || '');
  },
  subtitle: '',
  custom: () => {
    // Page 2 sub-screens
    if (state.statusPage2) {
      const tab = state.statusTab2 || 0;
      switch (tab) {
        case 0: return renderStatusPrgTimer();
        case 1: return renderStatusSysTimer();
        case 2: return renderStatusCondition();
        case 3: return renderStatusProgram();
        case 4: return renderStatusNotifications();
        default: return renderStatusPrgTimer();
      }
    }
    // Page 1 sub-screens
    const tab = state.statusTab || 0;
    switch (tab) {
      case 0: return renderStatusAxis();
      case 1: return renderStatusSafety();
      case 2: return renderStatusVersion();
      case 3: return renderStatusMemory();
      default: return renderStatusAxis();
    }
  },
  navCount: () => 0,
  softKeys: () => {
    if (state.statusPage2) {
      return ['Prg Timer', 'Sys Timer', 'Condition', 'Program', 'Notifications'];
    }
    return ['AXIS', 'SAFETY', 'VERSION', 'MEMORY', '>'];
  },
  onF: (i) => {
    if (state.statusPage2) {
      // Page 2: each F-key selects a sub-screen directly
      state.statusTab2 = i;
      renderPage();
    } else {
      // Page 1: F1-F4 select tab, F5 goes to page 2
      if (i < 4) {
        state.statusTab = i;
        renderPage();
      } else {
        // F5 > — switch to page 2
        state.statusPage2 = true;
        state.statusTab2 = 0;
        renderPage();
      }
    }
  },
  hint: () => {
    if (state.statusPage2) return 'F1-F5 select sub-screen | PREV returns to page 1';
    return 'F1 AXIS | F2 SAFETY | F3 VERSION | F4 MEMORY | F5 >  page 2';
  },
};

/* Navigation helper: PREV from page 2 should return to page 1 */
function statusGoBack() {
  if (state.statusPage2) {
    state.statusPage2 = false;
    state.statusTab2 = 0;
    renderPage();
    return true;
  }
  return false;
}


/* ===================================================================
   SECTION 2 — POSITION FIXES
   =================================================================== */

/**
 * The fixed POSITION page definition.
 *
 * Changes from original:
 *   - Title format: "POSITION (JOINT)" / "POSITION (USER)" etc. with "R-30iB" on right
 *   - In JOINT mode:
 *       * Added CFG line: "N U T  0 0 0"
 *       * Added E1/E2 rows showing "Not configured" status
 *       * Added UTOOL_NUM and UFRAME_NUM as separate data rows
 *   - In CARTESIAN mode (USER/WORLD/TOOL/JGFRM):
 *       * CONFIG line format: "N U T  0 0 0"
 *       * E1 external axis row
 *       * UTOOL_NUM and UFRAME_NUM as separate data rows (not just subtitle)
 */
const PAGES_POSITION = {
  title: () => {
    const coordName = state.coord; // JOINT, USER, WORLD, TOOL, JGFRM
    return 'POSITION (' + coordName + ')';
  },
  subtitle: 'R-30iB',
  custom: () => {
    if (state.coord === 'JOINT') {
      return renderPositionJoint();
    } else {
      return renderPositionCartesian();
    }
  },
  navCount: () => {
    if (state.coord === 'JOINT') return 10; // J1-J6 + CFG + E1 + UTOOL + UFRAME
    return 10; // X,Y,Z,W,P,R + CONFIG + E1 + UTOOL + UFRAME
  },
  softKeys: ['JOINT', 'USER', 'WORLD', 'TOOL', 'JGFRM'],
  onF: (i) => {
    const coords = ['JOINT', 'USER', 'WORLD', 'TOOL', 'JGFRM'];
    if (i >= 0 && i < coords.length) {
      state.coord = coords[i];
      refreshStatus();
      renderPage();
    }
  },
  onEnter: (i) => {
    if (state.coord === 'JOINT' && i >= 0 && i < 6) {
      toast('J' + (i + 1) + ': ' + fmt(state.positions[i]) + ' deg');
    }
  },
  hint: 'Hold DEADMAN, press jog keys — values update live. F1-F5 change coord system.',
};

/**
 * Render JOINT mode position screen.
 *
 * Reference (REFERENCE_SCREENS.md POSITION JOINT format):
 * ┌─────────────────────────────────────┐
 * │ POSITION (JOINT)          R-30iB    │
 * │                                     │
 * │ J1  +0.000    °                     │
 * │ J2  -90.000   °                     │
 * │ J3  +0.000    °                     │
 * │ J4  +0.000    °                     │
 * │ J5  +0.000    °                     │
 * │ J6  +0.000    °                     │
 * │                                     │
 * │ E1  +0.000    °    (if configured)  │
 * │ E2  +0.000    °    (if configured)  │
 * │                                     │
 * │ UTOOL_NUM: 1    UFRAME_NUM: 1      │
 * │ CFG: N U T  0 0 0                  │
 * └─────────────────────────────────────┘
 */
function renderPositionJoint() {
  let html = '';
  html += '<div class="pg-list">';

  // J1-J6 axis rows
  for (let i = 0; i < 6; i++) {
    const val = state.positions[i];
    const sel = i === state.cursor ? ' sel' : '';
    html += `<div class="pg-row${sel}" style="font-family:'Courier New',monospace;">`
          + `<span class="k-col">J${i + 1}</span>`
          + `<span class="v-col">${fmt(val)}</span>`
          + `<span style="display:inline-block;width:1.5em;text-align:right;">\u00B0</span>`
          + `</div>`;
  }

  // External axes E1, E2 — show "Not configured" if not present
  html += `<div class="pg-row" style="font-family:'Courier New',monospace;color:#888;">`
        + `<span class="k-col">E1</span>`
        + `<span class="v-col">Not configured</span>`
        + `</div>`;
  html += `<div class="pg-row" style="font-family:'Courier New',monospace;color:#888;">`
        + `<span class="k-col">E2</span>`
        + `<span class="v-col">Not configured</span>`
        + `</div>`;

  // UTOOL_NUM and UFRAME_NUM as separate rows
  html += `<div class="pg-row" style="font-family:'Courier New',monospace;">`
        + `<span class="k-col">UTOOL_NUM</span>`
        + `<span class="v-col">${state.utool || 1}</span>`
        + `</div>`;
  html += `<div class="pg-row" style="font-family:'Courier New',monospace;">`
        + `<span class="k-col">UFRAME_NUM</span>`
        + `<span class="v-col">${state.uframe || 1}</span>`
        + `</div>`;

  // CFG line in JOINT mode
  html += `<div class="pg-row" style="font-family:'Courier New',monospace;color:#ffaa00;">`
        + `<span class="k-col">CFG</span>`
        + `<span class="v-col">N U T  0 0 0</span>`
        + `</div>`;

  html += '</div>';
  return html;
}

/**
 * Render CARTESIAN mode position screen (USER, WORLD, TOOL, JGFRM).
 *
 * Reference (REFERENCE_SCREENS.md POSITION CARTESIAN format):
 * ┌─────────────────────────────────────┐
 * │ POSITION (USER)           R-30iB    │
 * │                                     │
 * │  X  +0.000    mm                    │
 * │  Y  +0.000    mm                    │
 * │  Z  +0.000    mm                    │
 * │  W  +0.000    °                     │
 * │  P  +0.000    °                     │
 * │  R  +0.000    °                     │
 * │                                     │
 * │ CONFIG: N U T  0 0 0                │
 * │ E1  +0.000    °                     │
 * │                                     │
 * │ UTOOL_NUM: 1    UFRAME_NUM: 1      │
 * └─────────────────────────────────────┘
 */
function renderPositionCartesian() {
  const c = state.cart;
  const coordName = state.coord; // USER, WORLD, TOOL, JGFRM

  let html = '';
  html += `<div class="pg-section">CARTESIAN  (${coordName})</div>`;
  html += '<div class="pg-list">';

  // X, Y, Z in mm
  const xyzLabels = ['X', 'Y', 'Z'];
  const xyzVals   = [c.x, c.y, c.z];
  const xyzUnits  = ['mm', 'mm', 'mm'];
  for (let i = 0; i < 3; i++) {
    const sel = i === state.cursor ? ' sel' : '';
    html += `<div class="pg-row${sel}" style="font-family:'Courier New',monospace;">`
          + `<span class="k-col">${xyzLabels[i]}</span>`
          + `<span class="v-col">${fmt(xyzVals[i]).padStart(10)} ${xyzUnits[i]}</span>`
          + `</div>`;
  }

  // W, P, R in degrees
  const wprLabels = ['W', 'P', 'R'];
  const wprVals   = [c.w, c.p, c.r];
  for (let i = 0; i < 3; i++) {
    const sel = (i + 3) === state.cursor ? ' sel' : '';
    html += `<div class="pg-row${sel}" style="font-family:'Courier New',monospace;">`
          + `<span class="k-col">${wprLabels[i]}</span>`
          + `<span class="v-col">${fmt(wprVals[i]).padStart(10)} \u00B0</span>`
          + `</div>`;
  }

  // CONFIG line
  html += `<div class="pg-row" style="font-family:'Courier New',monospace;color:#ffaa00;">`
        + `<span class="k-col">CONFIG</span>`
        + `<span class="v-col">N U T  0 0 0</span>`
        + `</div>`;

  // E1 external axis
  html += `<div class="pg-row" style="font-family:'Courier New',monospace;color:#888;">`
        + `<span class="k-col">E1</span>`
        + `<span class="v-col">Not configured</span>`
        + `</div>`;

  // UTOOL_NUM and UFRAME_NUM as separate rows (not just subtitle)
  html += `<div class="pg-row" style="font-family:'Courier New',monospace;">`
        + `<span class="k-col">UTOOL_NUM</span>`
        + `<span class="v-col">${state.utool || 1}</span>`
        + `</div>`;
  html += `<div class="pg-row" style="font-family:'Courier New',monospace;">`
        + `<span class="k-col">UFRAME_NUM</span>`
        + `<span class="v-col">${state.uframe || 1}</span>`
        + `</div>`;

  html += '</div>';
  return html;
}


/* ===================================================================
   SECTION 3 — INTEGRATION INSTRUCTIONS
   ===================================================================
 *
 * To integrate this patch into index.html, make these changes:
 *
 * 1. Add properties to the state object (around line 931):
 *
 *    Add after `dispPage: 'position',`:
 *
 *      statusTab: 0,        // current STATUS sub-screen (0=AXIS, 1=SAFETY, 2=VERSION, 3=MEMORY)
 *      statusPage2: false,   // whether STATUS page 2 soft keys are active
 *      statusTab2: 0,        // current STATUS page 2 sub-screen index
 *
 * 2. Replace the PAGES.status object (lines ~1578-1625) with PAGES_STATUS
 *    defined above.
 *
 * 3. Replace the PAGES.position object (lines ~1532-1576) with PAGES_POSITION
 *    defined above.
 *
 * 4. Update the CASCADE_SUBS.statusSub items (lines ~1431-1445) to ensure
 *    all targets point to 'status', but also set the appropriate tab:
 *
 *    Change the activateSubmenuItem() function (around line 1487) to detect
 *    when a STATUS submenu item is selected and set state.statusTab accordingly.
 *    Alternatively, update the items to use action functions:
 *
 *      { label: 'Axis',              action: () => { state.statusTab = 0; state.statusPage2 = false; goPage('status'); } },
 *      { label: 'Version ID',        action: () => { state.statusTab = 2; state.statusPage2 = false; goPage('status'); } },
 *      { label: 'Stop Signal',       action: () => { state.statusTab = 1; state.statusPage2 = false; goPage('status'); } },
 *      { label: 'Exec-hist',         target: 'status' },
 *      { label: 'Memory',            action: () => { state.statusTab = 3; state.statusPage2 = false; goPage('status'); } },
 *      { label: 'Motion Profiler',   target: null },
 *      { label: 'Robot Condition',    target: null },
 *      { label: 'Servo-off History',  target: null },
 *      { label: 'Prg Timer',         action: () => { state.statusPage2 = true; state.statusTab2 = 0; goPage('status'); } },
 *      { label: '-- NEXT --',         target: null },
 *
 * 5. In the goBack() function or wherever PREV/back navigation is handled,
 *    add a check for the STATUS page 2 state:
 *
 *    Before the standard goBack logic, add:
 *      // If on STATUS page 2, go back to page 1 first
 *      if (state.page === 'status' && state.statusPage2) {
 *        state.statusPage2 = false;
 *        state.statusTab2 = 0;
 *        renderPage();
 *        return;
 *      }
 *
 * 6. Update the utilHints page's onF handler (line ~1518) to go to
 *    the STATUS page and set statusTab to 1 (SAFETY):
 *      onF: i => { if (i === 3) { state.statusTab = 0; state.statusPage2 = false; goPage('status'); } },
 *
 * 7. The softKeys property is now a function. Ensure that renderPage()
 *    (line ~1291) handles this:
 *      setSoftKeys(typeof p.softKeys === 'function' ? p.softKeys() : (p.softKeys || []));
 *    If it currently only does: setSoftKeys(p.softKeys || []); then update it.
 *
 * 8. The hint property is now a function for PAGES_STATUS. Ensure that
 *    renderPage() (line ~1274) handles this:
 *      if (p.hint) html += `<div class="pg-hint">${typeof p.hint === 'function' ? p.hint() : p.hint}</div>`;
 *    If it currently only does static strings, update it.
 */

/* ===================================================================
   SECTION 4 — CONVENIENCE: Patch helper that can be called at startup
   =================================================================== */

/**
 * Call once after PAGES is defined to patch the status and position pages.
 * This replaces the existing entries in the PAGES object.
 *
 * Also patches:
 *   - renderPage() to support function-typed softKeys and hints
 *   - goBack() to handle STATUS page 2 → page 1 navigation
 */
function applyStatusAndPositionPatch() {
  // ── 1. Patch PAGES ──────────────────────────────────────────────
  PAGES.status   = PAGES_STATUS;
  PAGES.position = PAGES_POSITION;

  // ── 2. Ensure state properties exist ─────────────────────────────
  if (typeof state.statusTab    === 'undefined') state.statusTab    = 0;
  if (typeof state.statusPage2  === 'undefined') state.statusPage2   = false;
  if (typeof state.statusTab2   === 'undefined') state.statusTab2   = 0;

  // ── 3. Patch renderPage() to support function-typed softKeys & hints
  // Original code has:
  //   setSoftKeys(p.softKeys || []);
  //   ... html += `<div class="pg-hint">${p.hint}</div>`;
  // We wrap both to support functions.
  const _origRenderPage = renderPage;
  renderPage = function() {
    // Temporarily normalise the current page's softKeys & hint to strings
    const p = PAGES[state.page];
    if (p) {
      if (typeof p.softKeys === 'function') {
        p._softKeysFn  = p.softKeys;
        p.softKeys     = p.softKeys();
      }
      if (typeof p.hint === 'function') {
        p._hintFn = p.hint;
        p.hint    = p.hint();
      }
    }
    _origRenderPage();
    // Restore functions
    if (p) {
      if (p._softKeysFn) { p.softKeys = p._softKeysFn; delete p._softKeysFn; }
      if (p._hintFn)     { p.hint    = p._hintFn;     delete p._hintFn;     }
    }
  };

  // ── 4. Patch goBack() for STATUS page 2 ─────────────────────────
  const _origGoBack = goBack;
  goBack = function() {
    if (state.page === 'status' && state.statusPage2) {
      state.statusPage2 = false;
      state.statusTab2  = 0;
      renderPage();
      return;
    }
    _origGoBack();
  };

  // ── 5. Patch CASCADE_SUBS.statusSub to use action callbacks ─────
  // This ensures selecting a submenu item jumps to the right STATUS tab.
  if (CASCADE_SUBS && CASCADE_SUBS.statusSub) {
    CASCADE_SUBS.statusSub = {
      title: 'STATUS 1',
      items: [
        { label: ' Axis',              action: () => { state.statusTab = 0; state.statusPage2 = false; goPage('status'); } },
        { label: ' Version ID',        action: () => { state.statusTab = 2; state.statusPage2 = false; goPage('status'); } },
        { label: ' Stop Signal',       action: () => { state.statusTab = 1; state.statusPage2 = false; goPage('status'); } },
        { label: ' Exec-hist',         action: () => { state.statusPage2 = false; state.statusTab = 0; goPage('status'); } },
        { label: ' Memory',            action: () => { state.statusTab = 3; state.statusPage2 = false; goPage('status'); } },
        { label: ' Prg Timer',         action: () => { state.statusPage2 = true; state.statusTab2 = 0; goPage('status'); } },
        { label: ' Sys Timer',         action: () => { state.statusPage2 = true; state.statusTab2 = 1; goPage('status'); } },
        { label: ' Condition',         action: () => { state.statusPage2 = true; state.statusTab2 = 2; goPage('status'); } },
        { label: ' Program',           action: () => { state.statusPage2 = true; state.statusTab2 = 3; goPage('status'); } },
        { label: ' Notifications',     action: () => { state.statusPage2 = true; state.statusTab2 = 4; goPage('status'); } },
      ],
    };
  }

  // ── 6. Patch activateSubmenuItem() to support action callbacks ───
  // The original only uses item.target → goPage(item.target).
  // We add support for item.action as a callback.
  const _origActivateSub = activateSubmenuItem;
  activateSubmenuItem = function() {
    const sub = CASCADE_SUBS[state.cascadeSub];
    if (!sub) return;
    const item = sub.items[state.subCursor || 0];
    if (!item) return;
    if (item.action) {
      item.action();
      closeSubmenu();
      return;
    }
    _origActivateSub();
  };

  console.log('[PATCH] status_and_position.js applied successfully.');
}