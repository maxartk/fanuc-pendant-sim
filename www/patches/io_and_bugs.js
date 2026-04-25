/**
 * FANUC iPendant Simulator — I/O Screen Fixes & Bug Fixes
 * =================================================================
 * Patch file: io_and_bugs.js
 *
 * This file provides drop-in replacements and additions for:
 *   1. I/O screen: 5-column format, expanded type cycle, cascade submenu
 *   2. viewProgramDetail() — previously undefined, called from SELECT page F4
 *   3. modifyTPLine() — previously undefined, called from EDIT page F2
 *
 * USAGE (apply these changes to index.html):
 *
 *   A) State additions — add these to the `state` object:
 *        state.gIn   = new Array(32).fill(0);
 *        state.gOut  = new Array(32).fill(0);
 *        state.sIn   = new Array(16).fill(0);   // Panel Input
 *        state.sOut  = new Array(16).fill(0);   // Panel Output
 *        state.flags = new Array(32).fill(0);   // Flag
 *        state.ioDetailProg = null;              // tracks program for DETAIL
 *        state.modifying  = false;              // tracks MODIFY mode
 *        state.modifyField = 0;                 // 0=motion, 1=speed, 2=term
 *        state.modifyDraft = null;               // draft line being edited
 *
 *   B) Replace the existing `renderIO` function with `renderIO_new`
 *   C) Replace the existing `getIOArr` function with `getIOArr_new`
 *   D) Replace the existing `cycleIOType` function with `cycleIOType_new`
 *   E) Add `ioCascadeItems` and `IO_TYPE_MAP` constants
 *   F) Add the I/O cascade to CASCADE_SUBS:  ioSub: { title: 'I/O', items: ioCascadeItems }
 *   G) Replace PAGES.io with PAGES_IO
 *   H) Add PAGES.progDetail and PAGES.tpModify
 *   I) Add viewProgramDetail() and modifyTPLine() functions
 *
 * External dependencies (must exist in the host file):
 *   - state, goPage(), goBack(), toast(), renderPage(), setSoftKeys(),
 *     body, fkEls, PAGES, fmt(), todayStr()
 *   - CSS classes: pg-title, pg-list, pg-row, pg-section, screen-fkeys,
 *     k-col, v-col, sel, sel-edit
 */

/* ===================================================================
   SECTION 1 — I/O SCREEN FIXES
   =================================================================== */

/**
 * IO_TYPE_MAP — maps each I/O type abbreviation to its full title and
 * the property name on the `state` object that holds the array.
 * Rack/slot/start fields are simulated; we shift the starting DIO number
 * by 1 per slot to add realism.
 */
const IO_TYPE_MAP = {
  DI:   { title: 'DIGITAL INPUT',    prop: 'dIn',   rack: 0, slot: 1, count: 32, readOnly: true  },
  DO:   { title: 'DIGITAL OUTPUT',   prop: 'dOut',  rack: 0, slot: 1, count: 32, readOnly: false },
  GI:   { title: 'GROUP INPUT',      prop: 'gIn',   rack: 0, slot: 1, count: 32, readOnly: true  },
  GO:   { title: 'GROUP OUTPUT',     prop: 'gOut',  rack: 0, slot: 1, count: 32, readOnly: false },
  UI:   { title: 'UOP INPUT',        prop: 'uIn',   rack: 0, slot: 1, count: 32, readOnly: true  },
  UO:   { title: 'UOP OUTPUT',       prop: 'uOut',  rack: 0, slot: 1, count: 32, readOnly: false },
  SI:   { title: 'PANEL INPUT',       prop: 'sIn',   rack: 0, slot: 1, count: 16, readOnly: true  },
  SO:   { title: 'PANEL OUTPUT',      prop: 'sOut',  rack: 0, slot: 1, count: 16, readOnly: false },
  RI:   { title: 'ROBOT INPUT',      prop: 'rIn',   rack: 0, slot: 1, count: 32, readOnly: true  },
  RO:   { title: 'ROBOT OUTPUT',     prop: 'rOut',  rack: 0, slot: 1, count: 32, readOnly: false },
  AI:   { title: 'ANALOG INPUT',      prop: 'aIn',   rack: 0, slot: 1, count: 8,  readOnly: true  },
  AO:   { title: 'ANALOG OUTPUT',     prop: 'aOut',  rack: 0, slot: 1, count: 8,  readOnly: false },
  Flag: { title: 'FLAG',              prop: 'flags', rack: 0, slot: 1, count: 32, readOnly: false },
};

/** Full I/O type cycle order per reference */
const IO_TYPE_CYCLE = ['DI','DO','GI','GO','UI','UO','SI','SO','RI','RO','AI','AO','Flag'];

/**
 * I/O cascade submenu items (appears when user presses RIGHT on
 * "5  I/O" in the MENU cascade).
 * Each target maps to the 'io' page with the appropriate ioPage set.
 */
const ioCascadeItems = [
  { label: 'Cell Intface', target: null },   // not implemented in sim
  { label: 'Custom',       target: null },
  { label: 'Digital',      target: '__io:DI' },
  { label: 'Analog',        target: '__io:AI' },
  { label: 'Group',         target: '__io:GI' },
  { label: 'Robot',         target: '__io:RI' },
  { label: 'UOP',           target: '__io:UI' },
  { label: 'SOP',           target: '__io:SI' },
  { label: 'Interconnect',  target: null },
  { label: 'Link Device',   target: null },
  { label: 'Flag',          target: '__io:Flag' },
];

/**
 * getIOArr_new — replacement for getIOArr()
 * Returns the state array for the current ioPage type, initialising
 * lazily if necessary.
 */
function getIOArr_new() {
  const info = IO_TYPE_MAP[state.ioPage];
  if (!info) return state.dOut; // fallback
  const arr = state[info.prop];
  if (arr) return arr;
  // Lazy-initialise if the property doesn't exist yet
  state[info.prop] = new Array(info.count).fill(0);
  return state[info.prop];
}

/**
 * renderIO_new — replacement for renderIO()
 * Displays 5 columns: RANGE  RACK  SLOT  START  DIO
 * Per reference spec:
 *   DI[1]    0     1      1     ON
 *   DI[2]    0     1      2     OFF
 */
function renderIO_new() {
  const arr = getIOArr_new();
  const info = IO_TYPE_MAP[state.ioPage] || IO_TYPE_MAP['DI'];
  const max = Math.min(16, arr.length);

  let html = '<div class="pg-section" style="display:flex;justify-content:space-between;">'
           + '<span>I/O / ' + info.title + '</span>'
           + '<span style="font-weight:400;">R-30iB</span></div>';

  // Header row
  html += '<div class="pg-list">';
  html += '<div class="pg-row" style="font-weight:700;font-size:10px;font-family:\'Courier New\',monospace;">'
       + '<span style="display:inline-block;width:5.5em;">RANGE</span>'
       + '<span style="display:inline-block;width:3em;text-align:right;">RACK</span>'
       + '<span style="display:inline-block;width:3em;text-align:right;">SLOT</span>'
       + '<span style="display:inline-block;width:4em;text-align:right;">START</span>'
       + '<span style="display:inline-block;width:3.5em;text-align:right;">DIO</span>'
       + '</div>';

  for (let i = 0; i < max; i++) {
    const sel = i === state.cursor ? ' sel' : '';
    const rangeStr = state.ioPage + '[' + (i + 1) + ']';
    const rack = String(info.rack);
    const slot = String(info.slot);
    const start = String(i + 1);

    // For digital types show ON/OFF; for analog show numeric value
    let dioVal;
    if (state.ioPage === 'AI' || state.ioPage === 'AO') {
      dioVal = arr[i].toFixed ? arr[i].toFixed(0) : String(arr[i]);
    } else {
      dioVal = arr[i] ? 'ON' : 'OFF';
    }

    html += '<div class="pg-row' + sel + '" style="font-family:\'Courier New\',monospace;font-size:11px;">'
         + '<span style="display:inline-block;width:5.5em;">' + rangeStr + '</span>'
         + '<span style="display:inline-block;width:3em;text-align:right;">' + rack + '</span>'
         + '<span style="display:inline-block;width:3em;text-align:right;">' + slot + '</span>'
         + '<span style="display:inline-block;width:4em;text-align:right;">' + start + '</span>'
         + '<span style="display:inline-block;width:3.5em;text-align:right;">' + dioVal + '</span>'
         + '</div>';
  }
  html += '</div>';
  return html;
}

/**
 * cycleIOType_new — replacement for cycleIOType()
 * Cycles through all 13 I/O types in the reference order.
 */
function cycleIOType_new() {
  const idx = IO_TYPE_CYCLE.indexOf(state.ioPage);
  state.ioPage = IO_TYPE_CYCLE[(idx + 1) % IO_TYPE_CYCLE.length];
  state.cursor = 0;
  renderPage();
}

/**
 * PAGES_IO — replacement for PAGES.io
 * Now uses 5-column renderIO_new with full type cycle,
 * F2 ON / F3 OFF / F4 SIM soft keys, and readOnly awareness.
 */
const PAGES_IO = {
  title: () => state.ioPage,
  subtitle: () => {
    const info = IO_TYPE_MAP[state.ioPage];
    const cnt = info ? info.count : 32;
    return '[1-' + Math.min(16, cnt) + ']';
  },
  custom: () => renderIO_new(),
  navCount: () => {
    const info = IO_TYPE_MAP[state.ioPage];
    return Math.min(16, info ? info.count : 16);
  },
  softKeys: ['[TYPE]', 'ON', 'OFF', 'SIM', '>'],
  onF: (i) => {
    if (i === 0) { // [TYPE] — cycle to next I/O type
      const idx = IO_TYPE_CYCLE.indexOf(state.ioPage);
      state.ioPage = IO_TYPE_CYCLE[(idx + 1) % IO_TYPE_CYCLE.length];
      state.cursor = 0;
      toast('I/O TYPE: ' + state.ioPage);
      renderPage();
    }
    else if (i === 1) { // F2 ON
      const info = IO_TYPE_MAP[state.ioPage];
      if (info && info.readOnly) {
        toast(state.ioPage + '[' + (state.cursor + 1) + '] = ON (read only)');
      } else {
        const arr = getIOArr_new();
        arr[state.cursor] = 1;
        toast(state.ioPage + '[' + (state.cursor + 1) + '] = ON');
        renderPage();
      }
    }
    else if (i === 2) { // F3 OFF
      const info = IO_TYPE_MAP[state.ioPage];
      if (info && info.readOnly) {
        toast(state.ioPage + '[' + (state.cursor + 1) + '] = OFF (read only)');
      } else {
        const arr = getIOArr_new();
        arr[state.cursor] = 0;
        toast(state.ioPage + '[' + (state.cursor + 1) + '] = OFF');
        renderPage();
      }
    }
    else if (i === 3) { // F4 SIM
      toast('SIMULATE: ' + state.ioPage + '[' + (state.cursor + 1) + ']');
      toast('Temporary override active');
    }
    else if (i === 4) { // F5 >
      toast('NEXT page');
    }
  },
  onEnter: (i) => toggleIO(i),
  hint: 'F1 TYPE | F2 ON | F3 OFF | F4 SIM | ENTER toggles',
};


/* ===================================================================
   SECTION 2 — Bug Fix: viewProgramDetail()
   =================================================================== */

/**
 * viewProgramDetail — called from SELECT screen F4 (DETAIL).
 * Shows program name, comment, size, created date, modified date, sub type.
 * Navigates to the 'progDetail' page.
 */
function viewProgramDetail() {
  const p = state.programs[state.cursor];
  if (!p) { toast('No program selected'); return; }
  state.ioDetailProg = state.cursor;   // remember which program to show
  goPage('progDetail');
}

/**
 * renderProgramDetail — renders the PROGRAM DETAIL screen content.
 * Reads from state.programs[state.ioDetailProg].
 *
 * Reference (REFERENCE_SCREENS.md SELECT F4 DETAIL):
 * ┌─────────────────────────────────────┐
 * │ PROGRAM DETAIL             R-30iB   │
 * │                                      │
 * │ Program: HOME.TP                     │
 * │ Comment: Home position               │
 * │ Size: 52 bytes                       │
 * │ Created: 2026/04/01 10:00            │
 * │ Modified: 2026/04/25 15:30           │
 * │                                      │
 * │ Sub Type:                            │
 * │                                      │
 * │ F1 PREV   F2        F3              │
 * │ F4        F5                        │
 * └─────────────────────────────────────┘
 */
function renderProgramDetail() {
  const idx = (state.ioDetailProg != null) ? state.ioDetailProg : state.cursor;
  const p = state.programs[idx];
  if (!p) {
    return '<div class="pg-section">No program selected</div>';
  }

  // Derive or use available fields
  const name     = p.name || '—';
  const comment  = p.comment || '';
  const size     = p.size || (p.lines ? p.lines * 24 : 0);  // estimate if not stored
  const created  = p.created || p.date || '—';
  const modified = p.modified || p.date || '—';
  const subType  = p.subType || '';

  let html = '<div class="pg-section" style="display:flex;justify-content:space-between;">'
           + '<span>PROGRAM DETAIL</span>'
           + '<span style="font-weight:400;">R-30iB</span></div>';
  html += '<div class="pg-list">';

  const rows = [
    { label: 'Program',  value: name },
    { label: 'Comment',  value: comment },
    { label: 'Size',     value: size + ' bytes' },
    { label: 'Created',  value: created },
    { label: 'Modified', value: modified },
    { label: 'Sub Type', value: subType },
  ];

  rows.forEach(r => {
    html += '<div class="pg-row" style="font-family:\'Courier New\',monospace;">'
         + '<span class="k-col">' + r.label + '</span>'
         + '<span class="v-col">' + r.value + '</span>'
         + '</div>';
  });

  html += '</div>';
  return html;
}

/**
 * PAGES_PROG_DETAIL — the page definition for PROGRAM DETAIL view.
 */
const PAGES_PROG_DETAIL = {
  title: 'PROGRAM DETAIL',
  subtitle: 'R-30iB',
  custom: () => renderProgramDetail(),
  navCount: () => 0,   // no cursor navigation
  softKeys: ['PREV', '', '', '', ''],
  onF: (i) => {
    if (i === 0) { // F1 PREV
      goBack();
    }
  },
  hint: 'F1 PREV to return to SELECT',
};


/* ===================================================================
   SECTION 3 — Bug Fix: modifyTPLine()
   =================================================================== */

/**
 * modifyTPLine — called from EDIT screen F2 (MODIFY).
 * Enters a MODIFY sub-mode for the current TP line, allowing editing
 * of motion type, speed, and termination.
 *
 * Reference (REFERENCE_SCREENS.md EDIT screen):
 * The MODIFY sub-mode should present a simple editor for the selected
 * line with F1 CONFIRM to apply, F2 CANCEL to abort.
 */
function modifyTPLine() {
  if (!state.tpLines || !state.tpLines.length) {
    toast('No program loaded');
    return;
  }
  const lineIdx = state.cursor;
  if (lineIdx < 0 || lineIdx >= state.tpLines.length) {
    toast('Select a line first');
    return;
  }

  const raw = state.tpLines[lineIdx];

  // Parse TP line: e.g. "  3: J P[1]  100%  FINE ;" or "  5: CALL SUB1 ;"
  // Extract prefix (line number + colon), motion type (J/L/C), position (P[n]), speed, termination
  const tpLineRegex = /^(\s*\d+:\s*)([JLC])\s+(P\[\d+\]|PR\[\d+\])\s+(\S+)\s+(FINE|CNT\d+)\s*(;.*)?$/;
  const callRegex = /^(\s*\d+:\s*)(CALL\s+\S+)\s*(;.*)?$/;
  const endRegex = /^(\s*\d+:\s*)(END)\s*(;.*)?$/;

  let parsed;
  let match;

  if ((match = raw.match(tpLineRegex))) {
    parsed = {
      prefix:    match[1],
      motionType: match[2],
      position:  match[3],
      speed:     match[4],
      termination: match[5],
      suffix:    match[6] || '',
      isMotion:  true,
    };
  } else if ((match = raw.match(callRegex)) || (match = raw.match(endRegex))) {
    toast('Cannot modify non-motion line');
    return;
  } else {
    // Try a looser parse: motion lines without termination
    const looseRegex = /^(\s*\d+:\s*)([JLC])\s+(P\[\d+\]|PR\[\d+\])\s+(\S+)\s*(;.*)?$/;
    match = raw.match(looseRegex);
    if (match) {
      parsed = {
        prefix:      match[1],
        motionType:  match[2],
        position:    match[3],
        speed:       match[4],
        termination: 'FINE',
        suffix:      match[5] || '',
        isMotion:    true,
      };
    } else {
      toast('Cannot modify this line');
      return;
    }
  }

  // Store draft for editing
  state.modifying   = true;
  state.modifyField  = 0;   // 0=motion, 1=speed, 2=termination
  state.modifyDraft  = parsed;

  goPage('tpModify');
}

/**
 * renderModifyEditor — renders the MODIFY sub-screen for a TP line.
 * Shows the current line with selectable fields and cycling values.
 */
function renderModifyEditor() {
  if (!state.modifyDraft) {
    return '<div class="pg-section">No line selected</div>';
  }
  const d = state.modifyDraft;

  // Cycle options for each field
  const motionTypes = ['J', 'L', 'C'];
  const speeds = ['100%', '500mm/sec', '300mm/sec', '200mm/sec', '100mm/sec', '50mm/sec', '10mm/sec', '2000mm/sec'];
  const terminations = ['FINE', 'CNT0', 'CNT5', 'CNT10', 'CNT20', 'CNT50', 'CNT75', 'CNT100'];

  const fieldIdx = state.modifyField || 0;

  let html = '<div class="pg-section" style="display:flex;justify-content:space-between;">'
           + '<span>MODIFY LINE</span>'
           + '<span style="font-weight:400;">R-30iB</span></div>';

  // Show the original line
  html += '<div class="pg-list">';

  html += '<div class="pg-row comment" style="font-family:\'Courier New\',monospace;font-size:10px;">'
       + '<span>Original: ' + (state.tpLines[state.cursor] || '').substring(0, 40) + '</span>'
       + '</div>';

  html += '<div class="pg-row" style="font-family:\'Courier New\',monospace;font-size:11px;margin-top:6px;">'
       + '<span style="font-weight:700;">Field 1 — Motion Type:</span>'
       + '</div>';

  // Motion type
  const mSel = fieldIdx === 0 ? ' sel-edit' : '';
  html += '<div class="pg-row' + mSel + '" style="font-family:\'Courier New\',monospace;font-size:12px;padding-left:8px;">'
       + '<span class="k-col">Type</span>'
       + '<span class="v-col">' + d.motionType + '</span>'
       + '</div>';

  // Speed
  const sSel = fieldIdx === 1 ? ' sel-edit' : '';
  html += '<div class="pg-row' + sSel + '" style="font-family:\'Courier New\',monospace;font-size:12px;padding-left:8px;">'
       + '<span class="k-col">Speed</span>'
       + '<span class="v-col">' + d.speed + '</span>'
       + '</div>';

  // Termination
  const tSel = fieldIdx === 2 ? ' sel-edit' : '';
  html += '<div class="pg-row' + tSel + '" style="font-family:\'Courier New\',monospace;font-size:12px;padding-left:8px;">'
       + '<span class="k-col">Term</span>'
       + '<span class="v-col">' + d.termination + '</span>'
       + '</div>';

  // Preview line
  const preview = d.prefix + d.motionType + ' ' + d.position + '  ' + d.speed + '  ' + d.termination + d.suffix;
  html += '<div class="pg-row" style="font-family:\'Courier New\',monospace;font-size:10px;margin-top:4px;color:#555;">'
       + '<span>Preview: ' + preview.substring(0, 40) + '</span>'
       + '</div>';

  html += '</div>';
  return html;
}

/**
 * PAGES_TP_MODIFY — the page definition for the MODIFY sub-screen.
 * F1 CONFIRM applies changes, F2 CANCEL aborts.
 * UP/DOWN selects field (motion/speed/termination), LEFT/RIGHT cycles values.
 */
const PAGES_TP_MODIFY = {
  title: 'MODIFY',
  subtitle: 'Edit TP Line',
  custom: () => renderModifyEditor(),
  navCount: () => 3, // 3 editable fields
  softKeys: ['CONFIRM', 'CANCEL', '', '', ''],
  onF: (i) => {
    if (i === 0) { // F1 CONFIRM
      if (!state.modifyDraft || !state.tpLines) { goBack(); return; }
      const d = state.modifyDraft;
      const newLine = d.prefix + d.motionType + ' ' + d.position + '  ' + d.speed + '  ' + d.termination + d.suffix;
      state.tpUndoStack.push(state.tpLines.slice());
      state.tpLines[state.cursor] = newLine;
      state.modifying  = false;
      state.modifyDraft = null;
      state.modifyField = 0;
      toast('Line modified');
      goBack();
    }
    else if (i === 1) { // F2 CANCEL
      state.modifying  = false;
      state.modifyDraft = null;
      state.modifyField = 0;
      toast('Modify cancelled');
      goBack();
    }
  },
  onEnter: (i) => {
    // ENTER cycles to next field
    state.modifyField = ((state.modifyField || 0) + 1) % 3;
    renderPage();
  },
  hint: 'UP/DOWN select field | LEFT/RIGHT cycle values | F1 CONFIRM | F2 CANCEL',
};

/**
 * handleModifyNavigation — helper to be called from the global
 * UP/DOWN/LEFT/RIGHT button handlers when on the tpModify page.
 * UP/DOWN changes the field selection, LEFT/RIGHT cycles the value.
 *
 * Returns true if the key was handled (caller should not proceed
 * with default navigation).
 */
function handleModifyNavigation(dir) {
  if (state.page !== 'tpModify' || !state.modifyDraft) return false;

  const motionTypes = ['J', 'L', 'C'];
  const speeds = ['100%', '2000mm/sec', '1000mm/sec', '500mm/sec', '300mm/sec', '200mm/sec', '100mm/sec', '50mm/sec', '10mm/sec'];
  const terminations = ['FINE', 'CNT0', 'CNT5', 'CNT10', 'CNT20', 'CNT50', 'CNT75', 'CNT100'];
  const fieldIdx = state.modifyField || 0;

  const d = state.modifyDraft;

  if (dir === 'up') {
    state.modifyField = (fieldIdx - 1 + 3) % 3;
    renderPage();
    return true;
  }
  if (dir === 'down') {
    state.modifyField = (fieldIdx + 1) % 3;
    renderPage();
    return true;
  }
  if (dir === 'left' || dir === 'right') {
    const advance = dir === 'right' ? 1 : -1;
    if (fieldIdx === 0) {
      // Cycle motion type
      let idx = motionTypes.indexOf(d.motionType);
      idx = ((idx + advance) % motionTypes.length + motionTypes.length) % motionTypes.length;
      d.motionType = motionTypes[idx];
    } else if (fieldIdx === 1) {
      // Cycle speed
      let idx = speeds.indexOf(d.speed);
      if (idx < 0) idx = 0;
      idx = ((idx + advance) % speeds.length + speeds.length) % speeds.length;
      d.speed = speeds[idx];
    } else if (fieldIdx === 2) {
      // Cycle termination
      let idx = terminations.indexOf(d.termination);
      if (idx < 0) idx = 0;
      idx = ((idx + advance) % terminations.length + terminations.length) % terminations.length;
      d.termination = terminations[idx];
    }
    renderPage();
    return true;
  }
  return false;
}

/**
 * handleIODetailSubmenu — helper for the cascade submenu.
 * When a cascade submenu item has target like '__io:DI', this function
 * parses it, sets state.ioPage, and navigates to the io page.
 * Returns true if the target was an I/O submenu shortcut.
 */
function handleIODetailSubmenu(target) {
  if (target && target.startsWith('__io:')) {
    const type = target.substring(5);
    if (IO_TYPE_MAP[type]) {
      state.ioPage = type;
      state.cursor = 0;
      state.cascadeSub = null;
      state.subCursor = 0;
      goPage('io', false);
      return true;
    }
  }
  return false;
}


/* ===================================================================
   SECTION 4 — INTEGRATION NOTES
   =================================================================== */

/**
 * INTEGRATION INSTRUCTIONS FOR index.html:
 *
 * 1. Add to the `state` object (near line 1011):
 *      gIn:   new Array(32).fill(0),
 *      gOut:  new Array(32).fill(0),
 *      sIn:   new Array(16).fill(0),
 *      sOut:  new Array(16).fill(0),
 *      flags: new Array(32).fill(0),
 *      ioDetailProg: null,
 *      modifying: false,
 *      modifyField: 0,
 *      modifyDraft: null,
 *
 * 2. Replace the `io:` entry in the MENU1_ITEMS (line 1383) arrow target
 *    to also add the cascade submenu.  Change:
 *      { label: ' 5  I/O', target: 'io', arrow: true },
 *    to keep it as-is — the cascade will be defined in CASCADE_SUBS.
 *
 * 3. Add the I/O cascade submenu to CASCADE_SUBS (after line 1453):
 *      ioSub: {
 *        title: 'I/O',
 *        items: ioCascadeItems,
 *      },
 *
 * 4. In the `activateSubmenuItem()` function (around line 1487-1493),
 *    add before the `if (item.target) goPage(item.target)` line:
 *      if (handleIODetailSubmenu(item.target)) return;
 *
 * 5. Replace `renderIO` function (line 2370-2381) with `renderIO_new`.
 *    Delete old renderIO, define renderIO = renderIO_new, or rename.
 *
 * 6. Replace `getIOArr` function (line 2358-2368) with `getIOArr_new`.
 *
 * 7. Replace `cycleIOType` function (line 2385-2390) with `cycleIOType_new`.
 *
 * 8. Replace PAGES.io (line 1792-1835) with PAGES_IO.
 *
 * 9. Add new PAGES entries:
 *      progDetail: PAGES_PROG_DETAIL,
 *      tpModify:   PAGES_TP_MODIFY,
 *
 * 10. Replace the `viewProgramDetail` call (line 1881) — no change needed
 *     since the function is now defined.
 *
 * 11. Replace the `modifyTPLine` call (line 1899) — no change needed
 *     since the function is now defined.
 *
 * 12. In the global button handler (the switch/case for UP/DOWN/LEFT/RIGHT),
 *     add a check at the beginning of each directional case:
 *       case 'UP':    if (handleModifyNavigation('up'))    break; ...
 *       case 'DOWN':  if (handleModifyNavigation('down'))  break; ...
 *       case 'LEFT':  if (handleModifyNavigation('left'))  break; ...
 *       case 'RIGHT': if (handleModifyNavigation('right')) break; ...
 *
 * 13. In the PAGES.io type cycle (onF handler, i === 0), the cycle now
 *     uses IO_TYPE_CYCLE instead of the old 8-item array. This is already
 *     handled by PAGES_IO.
 *
 * 14. (Optional) Enrich state.programs entries with more fields:
 *      { name: 'HOME.TP', comment: 'Home position', lines: 5,
 *        size: 120, date: '10-APR-26', created: '2026/04/01 10:00',
 *        modified: '2026/04/25 15:30', subType: '' }
 *      { name: 'SAMPLE1.TP', comment: 'Test program', lines: 12,
 *        size: 288, date: '10-APR-26', created: '2026/04/05 09:00',
 *        modified: '2026/04/20 14:00', subType: '' }
 *      { name: 'TEST.TP', comment: '', lines: 8,
 *        size: 192, date: '15-APR-26', created: '2026/04/15 08:00',
 *        modified: '2026/04/15 08:00', subType: '' }
 */