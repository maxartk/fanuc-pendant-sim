/* =====================================================================
   FANUC iPendant Simulator — Remaining Screen Fixes Patch
   =====================================================================
   Apply after main script loads.  This patch modifies the global state,
   PAGES, CASCADE_SUBS, MENU1_ITEMS, and override functions to implement:

     1. SELECT  — COMMENT column + DETAIL view
     2. EDIT    — ► cursor indicator + title format fix
     3. DATA    — VR, PAL, KV, KP register types
     4. ALARM   — Haptic Log + date format fix
     5. FILE    — S/W Install cascade item
     6. MENU    — I/O cascade submenu + UTILITIES/ALARM item fixes
     7. SETUP   — Missing sub-menus + remove Password

   Usage: Add <script src="patches/remaining_screens.js"></script>
          after the main <script> block in index.html
   ===================================================================== */

(function () {
  'use strict';

  /* =================================================================
     1. SELECT — Add COMMENT column + DETAIL view
     ================================================================= */

  // Add comment fields to existing programs
  state.programs.forEach(p => { if (typeof p.comment === 'undefined') p.comment = ''; });
  if (state.programs[0]) state.programs[0].comment = '';
  if (state.programs[1]) state.programs[1].comment = 'Test program';
  if (state.programs[2]) state.programs[2].comment = '';

  // Track which program is shown in detail view
  state.selectDetailProg = null;

  // Override renderPrograms — PROGRAM / COMMENT two-column layout
  window.renderPrograms = function () {
    let html = '<div class="pg-section">PROGRAM        COMMENT</div><div class="pg-list">';
    state.programs.forEach((p, i) => {
      const sel = i === state.cursor ? ' sel' : '';
      const comment = p.comment || '';
      html += '<div class="pg-row' + sel + '"><span> ' +
              p.name.padEnd(16).slice(0, 16) + comment + '</span></div>';
    });
    html += '</div>';
    return html;
  };

  // Override createProgram to include comment field
  window.createProgram = function () {
    let name = 'NEWPROG.TP', i = 1;
    while (state.programs.some(p => p.name === name)) { name = 'NEWPROG' + i + '.TP'; i++; }
    state.programs.push({ name: name, lines: 0, date: todayStr(), comment: '' });
    toast('Created ' + name); renderPage();
  };

  // Override copyProgram to include comment field
  window.copyProgram = function () {
    const p = state.programs[state.cursor]; if (!p) return;
    let name = 'COPY_' + p.name, i = 1;
    while (state.programs.some(pr => pr.name === name)) { name = 'COPY' + i + '_' + p.name; i++; }
    state.programs.push({ name: name, lines: p.lines, date: todayStr(), comment: p.comment || '' });
    toast('Copied -> ' + name); renderPage();
  };

  // Update SELECT page title
  PAGES.select.title = 'PROGRAM SELECT';
  PAGES.select.subtitle = 'R-30iB';

  // viewProgramDetail — navigate to program detail page
  window.viewProgramDetail = function () {
    const prog = state.programs[state.cursor];
    if (!prog) { toast('No program selected'); return; }
    state.selectDetailProg = prog;
    goPage('progDetail');
  };

  // Program Detail page
  PAGES.progDetail = {
    title: () => 'PROGRAM DETAIL',
    subtitle: 'R-30iB',
    custom: () => {
      const p = state.selectDetailProg;
      if (!p) return '<div class="pg-section">No program</div>';
      let html = '<div class="pg-section">PROGRAM DETAIL</div><div class="pg-list">';
      html += '<div class="pg-row"><span class="k-col">Program:</span><span class="v-col">' + p.name + '</span></div>';
      html += '<div class="pg-row"><span class="k-col">Comment:</span><span class="v-col">' + (p.comment || '\u2014') + '</span></div>';
      html += '<div class="pg-row"><span class="k-col">Size:</span><span class="v-col">' + (p.lines * 40 || 52) + ' bytes</span></div>';
      html += '<div class="pg-row"><span class="k-col">Created:</span><span class="v-col">2026/04/01 10:00</span></div>';
      html += '<div class="pg-row"><span class="k-col">Modified:</span><span class="v-col">2026/04/25 15:30</span></div>';
      html += '<div class="pg-row"><span class="k-col">Sub Type:</span><span class="v-col">TP</span></div>';
      html += '</div>';
      return html;
    },
    softKeys: ['PREV', '', '', '', ''],
    onF: (i) => {
      if (i === 0) goPage('select');
    },
    hint: 'F1 PREV to return to SELECT',
  };

  /* =================================================================
     2. EDIT — ► cursor indicator + title format fix
     ================================================================= */

  // Title format: EDIT / HOME.TP    R-30iB
  PAGES.edit.title = () => 'EDIT / ' + (state.currentProgram || '\u2014none\u2014');
  PAGES.edit.subtitle = () => 'R-30iB';

  // Override renderTPProgram — add ► cursor indicator on current line
  window.renderTPProgram = function () {
    if (!state.tpLines) state.tpLines = ['/PROG  HOME', '/ATTR', '  1: J P[1] 100% ;', '  2: L P[2] 500mm/sec ;', '  3: END ;'];
    let html = '<div class="pg-section">TP PROGRAM</div><div class="pg-list">';
    state.tpLines.forEach((line, i) => {
      const sel = i === state.cursor ? ' sel' : '';
      const cursor = i === state.cursor ? '\u25BA' : ' ';   // ► on selected line
      html += '<div class="pg-row' + sel + '"><span>' + cursor + String(i + 1).padStart(3) + ': ' + line.substring(0, 45) + '</span></div>';
    });
    html += '</div>';
    return html;
  };

  /* =================================================================
     3. DATA — Add missing register types (VR, PAL, KV, KP)
     ================================================================= */

  // Lazy-init state properties for new register types
  state.vrRegs  = null;   // Vision Registers
  state.palRegs = null;   // Pallet Registers
  state.kvVars  = null;   // KAREL Vars
  state.kpRegs  = null;   // KAREL Positions

  var DATA_TYPES = ['R', 'PR', 'SR', 'VR', 'PAL', 'KV', 'KP'];

  var DATA_TYPE_TITLES = {
    R:   'REGISTER',
    PR:  'POSITION REGISTER',
    SR:  'STRING REGISTER',
    VR:  'VISION REGISTER',
    PAL: 'PALLET REGISTER',
    KV:  'KAREL VARIABLES',
    KP:  'KAREL POSITIONS',
  };

  // Renderers for new register types
  window.renderVRRegisters = function () {
    if (!state.vrRegs) state.vrRegs = Array.from({ length: 10 }, function () {
      return { found: false, score: 0, offsetX: 0, offsetY: 0 };
    });
    var html = '<div class="pg-section">VISION REG  VR[1-10]</div><div class="pg-list">';
    state.vrRegs.forEach(function (v, i) {
      var sel = i === state.cursor ? ' sel' : '';
      var line = 'VR[' + String(i + 1).padStart(2, ' ') + ']  Found:' + (v.found ? 'YES' : ' NO') +
                 '  Score:' + v.score.toFixed(1) + '  X:' + v.offsetX.toFixed(1);
      html += '<div class="pg-row' + sel + '"><span> ' + line + '</span></div>';
    });
    html += '</div>';
    return html;
  };

  window.renderPALRegisters = function () {
    if (!state.palRegs) state.palRegs = Array.from({ length: 10 }, function (_, i) {
      return { id: i + 1, reg1: 0, reg2: 0, status: 'IDLE' };
    });
    var html = '<div class="pg-section">PALLET REG  PAL[1-10]</div><div class="pg-list">';
    state.palRegs.forEach(function (p, i) {
      var sel = i === state.cursor ? ' sel' : '';
      var line = 'PAL[' + String(i + 1).padStart(2, ' ') + ']  R1:' + String(p.reg1).padStart(3) +
                 '  R2:' + String(p.reg2).padStart(3) + '  ' + p.status;
      html += '<div class="pg-row' + sel + '"><span> ' + line + '</span></div>';
    });
    html += '</div>';
    return html;
  };

  window.renderKVRegisters = function () {
    if (!state.kvVars) state.kvVars = Array.from({ length: 20 }, function (_, i) {
      return { name: 'VAR' + (i + 1), val: 0 };
    });
    var html = '<div class="pg-section">KAREL VARS  KV[1-20]</div><div class="pg-list">';
    state.kvVars.forEach(function (v, i) {
      var sel = i === state.cursor ? ' sel' : '';
      var line = 'KV[' + String(i + 1).padStart(2, ' ') + ']  ' + v.name.padEnd(10) + '= ' + v.val.toFixed(3);
      html += '<div class="pg-row' + sel + '"><span> ' + line + '</span></div>';
    });
    html += '</div>';
    return html;
  };

  window.renderKPRegisters = function () {
    if (!state.kpRegs) state.kpRegs = Array.from({ length: 10 }, function () {
      return { x: 0, y: 0, z: 0, w: 0, p: 0, r: 0 };
    });
    var html = '<div class="pg-section">KAREL POSNS  KP[1-10]</div><div class="pg-list">';
    state.kpRegs.forEach(function (kp, i) {
      var sel = i === state.cursor ? ' sel' : '';
      var line = 'KP[' + String(i + 1).padStart(2, ' ') + ']  X:' + kp.x.toFixed(1) +
                 '  Y:' + kp.y.toFixed(1) + '  Z:' + kp.z.toFixed(1);
      html += '<div class="pg-row' + sel + '"><span> ' + line + '</span></div>';
    });
    html += '</div>';
    return html;
  };

  // Override DATA page — title, subtitle, custom renderer, type cycle
  PAGES.data.title = 'DATA';
  PAGES.data.subtitle = function () { return DATA_TYPE_TITLES[state.dataType] || 'REGISTER'; };
  PAGES.data.custom = function () {
    var t = state.dataType;
    if (t === 'R')   return renderRegisters();
    if (t === 'PR')  return renderPRRegisters();
    if (t === 'SR')  return renderSRRegisters();
    if (t === 'VR')  return renderVRRegisters();
    if (t === 'PAL') return renderPALRegisters();
    if (t === 'KV')  return renderKVRegisters();
    if (t === 'KP')  return renderKPRegisters();
    return renderRegisters();
  };
  PAGES.data.navCount = function () {
    var t = state.dataType;
    if (t === 'R')   return state.numReg.length;
    if (t === 'PR')  return 10;
    if (t === 'SR')  return 20;
    if (t === 'VR')  return 10;
    if (t === 'PAL') return 10;
    if (t === 'KV')  return 20;
    if (t === 'KP')  return 10;
    return state.numReg.length;
  };

  // Override F-keys for DATA page — full type cycle + handlers
  PAGES.data.onF = function (i) {
    if (i === 0) {   // [TYPE]
      var idx = DATA_TYPES.indexOf(state.dataType || 'R');
      state.dataType = DATA_TYPES[(idx + 1) % DATA_TYPES.length];
      state.cursor = 0;
      toast('TYPE: ' + (DATA_TYPE_TITLES[state.dataType] || state.dataType));
      renderPage();
    } else if (i === 1) {   // CLEAR
      if (state.dataType === 'R') {
        state.numReg[state.cursor] = 0;
        toast('R[' + (state.cursor + 1) + '] = 0');
      } else if (state.dataType === 'PR') {
        if (!state.prRegs) state.prRegs = Array.from({ length: 10 }, function () { return { x: 0, y: 0, z: 0, w: 0, p: 0, r: 0 }; });
        Object.assign(state.prRegs[state.cursor], { x: 0, y: 0, z: 0, w: 0, p: 0, r: 0 });
        toast('PR[' + (state.cursor + 1) + '] cleared');
      } else {
        toast(state.dataType + '[' + (state.cursor + 1) + '] cleared');
      }
      renderPage();
    } else if (i === 2) {   // SET TO
      if (state.dataType === 'R') {
        startEdit({ target: { kind: 'numReg', idx: state.cursor }, label: 'R[' + (state.cursor + 1) + '] =', buffer: '' });
      } else {
        toast(state.dataType + '[' + (state.cursor + 1) + '] SET TO');
      }
    } else if (i === 3) {   // COMPARE
      toast('COMPARE: Select reference register');
    } else if (i === 4) {
      toast('NEXT page');
    }
  };

  PAGES.data.onEnter = function (i) {
    if (state.dataType === 'R') {
      startEdit({ target: { kind: 'numReg', idx: i }, label: 'R[' + (i + 1) + '] =', buffer: '' });
    } else if (state.dataType === 'PR') {
      goPage('offset');
      state.prIndex = i;
      renderPage();
    } else {
      toast(state.dataType + '[' + (i + 1) + ']');
    }
  };

  /* =================================================================
     4. ALARM — Haptic Log cascade item + date format fix
     ================================================================= */

  // Title format: ALARM / ACTIVE  or  ALARM / HISTORY
  PAGES.alarm.title = function () { return 'ALARM / ' + (state.showAlarmHist ? 'HISTORY' : 'ACTIVE'); };
  PAGES.alarm.subtitle = function () { return 'R-30iB'; };

  // Fix date format: MM/DD/YY  HH:MM  CODE  (per reference spec)
  PAGES.alarm.rows = function () {
    if (state.showAlarmHist) {
      return [
        ' 1  04/25/26  15:30  SRVO-002',
        ' 2  04/25/26  14:20  SRVO-001',
        ' 3  04/24/26  09:10  SYST-026',
        ' 4  04/23/26  18:30  SYST-010',
        ' 5  04/23/26  14:22  SRVO-062',
      ];
    }
    return state.fault
      ? [
          ' 1  SRVO-002  Teach Pendant E-stop',
          ' 2  SRVO-001  Operator panel E-stop',
          ' 3  SYST-026  System normal power-up',
        ]
      : [
          ' 1  -- no active alarms --',
          ' 2  SYST-026  System normal power-up',
          ' 3  SYST-010  Power failure recovery',
        ];
  };

  // Fix alarmSub cascade: add Haptic Log, remove Password Log
  CASCADE_SUBS.alarmSub.items = [
    { label: 'Alarm Log',   target: 'alarm' },
    { label: 'Motion Log',  target: 'alarm' },
    { label: 'System Log',  target: 'alarm' },
    { label: 'Appl Log',    target: 'alarm' },
    { label: 'Comm Log',    target: 'alarm' },
    { label: 'Haptic Log',  target: 'alarm' },
  ];

  /* =================================================================
     5. FILE — Add S/W Install to cascade
     ================================================================= */

  CASCADE_SUBS.fileSub.items = [
    { label: 'File',         target: 'fileList' },
    { label: 'File Memory',  target: 'fileList' },
    { label: 'S/W Install',  target: 'swInstall' },
    { label: 'Auto Backup',  target: 'backup' },
  ];

  // S/W Install stub page
  PAGES.swInstall = {
    title: 'S/W INSTALL',
    subtitle: 'Software Installation',
    rows: function () {
      return [
        ' 1  Install application',
        ' 2  Install option',
        ' 3  Install robot image',
        '',
        '  \u2014 Select device \u2014',
      ];
    },
    softKeys: ['DEVICE', '', '', '', '>'],
    onF: function (i) {
      if (i === 0) toast('Select storage device for installation');
    },
    onEnter: function (i) { toast('S/W Install \u2014 not simulated'); },
    hint: 'F1 DEVICE | ENTER to select',
  };

  /* =================================================================
     6. MENU — I/O cascade submenu + UTILITIES/ALARM item fixes
     ================================================================= */

  // New I/O cascade submenu
  CASCADE_SUBS.ioSub = {
    title: 'I/O 1',
    items: [
      { label: 'Cell Intface', target: 'io' },
      { label: 'Custom',       target: 'io' },
      { label: 'Digital',      target: 'io' },
      { label: 'Analog',       target: 'io' },
      { label: 'Group',        target: 'io' },
      { label: 'Robot',        target: 'io' },
      { label: 'UOP',          target: 'io' },
      { label: 'SOP',          target: 'io' },
      { label: 'Interconnect', target: 'io' },
      { label: 'Link Device',  target: null },
      { label: 'Flag',         target: 'io' },
    ],
  };

  // change I/O menu item target to open cascade submenu
  // MENU1_ITEMS[4] = { label: ' 5  I/O', target: 'io', arrow: true }
  MENU1_ITEMS[4].target = 'ioSub';

  // Fix UTILITIES cascade: remove Home & Robot Condition, add Angle Entry Shift & Group Excng
  CASCADE_SUBS.utilities.items = [
    { label: 'Hints',              target: 'utilHints' },
    { label: 'iRCalibration',      target: null },
    { label: 'Prog Adjust',        target: null },
    { label: 'Program Shift',      target: null },
    { label: 'Mirror Image Shift', target: null },
    { label: 'Tool Offset',        target: null },
    { label: 'Frame Offset',       target: null },
    { label: 'Angle Entry Shift',  target: null },
    { label: 'Group Excng',        target: null },
  ];

  /* =================================================================
     7. SETUP — Missing sub-menus, remove Password
     ================================================================= */

  // Reorder and expand SETUP items per reference spec (16 items, no Password)
  PAGES.setup.title = 'SETUP';
  PAGES.setup.rows = function () {
    return [
      ' 1  Prog Select',
      ' 2  General',
      ' 3  Coll Guard',
      ' 4  Frames',
      ' 5  Macro',
      ' 6  Ref Position',
      ' 7  Port Init',
      ' 8  Ovrd Select',
      ' 9  User Alarm',
      ' 10 Error Table',
      ' 11 iPendant Setup',
      ' 12 BG Logic',
      ' 13 Resume Tol.',
      ' 14 Haptic',
      ' 15 Host Comm',
      ' 16 Diag Video Mon',
    ];
  };

  PAGES.setup.onEnter = function (i) {
    var targets = [
      'setupProgSelect', 'setupGeneral', 'setupCollGuard', 'frames',
      'setupMacro', 'setupRefPos', 'setupPortInit', 'setupOvrdSelect',
      'setupUserAlarm', 'setupErrorTable', 'setupIPendant', 'setupBGLogic',
      'setupResumeTol', 'setupHaptic', 'setupHostComm', 'setupDiagVideo',
    ];
    if (i === 3) { goPage('frames'); return; }
    if (i < targets.length && PAGES[targets[i]]) { goPage(targets[i]); return; }
    toast('SETUP ' + (i + 1) + ' (iter 4)');
  };

  // SETUP cascade submenu (shown from MENU)
  CASCADE_SUBS.setup = {
    title: 'SETUP 1',
    items: [
      { label: 'Prog Select',      target: 'setupProgSelect' },
      { label: 'General',           target: 'setupGeneral' },
      { label: 'Coll Guard',       target: 'setupCollGuard' },
      { label: 'Frames',            target: 'frames' },
      { label: 'Macro',            target: 'setupMacro' },
      { label: 'Ref Position',     target: 'setupRefPos' },
      { label: 'Port Init',         target: 'setupPortInit' },
      { label: 'Ovrd Select',      target: 'setupOvrdSelect' },
      { label: 'User Alarm',       target: 'setupUserAlarm' },
      { label: 'Error Table',      target: 'setupErrorTable' },
      { label: 'iPendant Setup',   target: 'setupIPendant' },
      { label: 'BG Logic',         target: 'setupBGLogic' },
      { label: 'Resume Tol.',      target: 'setupResumeTol' },
      { label: 'Haptic',           target: 'setupHaptic' },
      { label: 'Host Comm',        target: 'setupHostComm' },
      { label: 'Diag Video Mon',   target: 'setupDiagVideo' },
    ],
  };

  // Stub pages for SETUP sub-menus
  function setupStub(title) {
    return {
      title: 'SETUP / ' + title.toUpperCase(),
      subtitle: 'R-30iB',
      rows: function () {
        return [
          '  ' + title + ' settings',
          '',
          '  \u2014 press PREV to go back \u2014',
        ];
      },
      softKeys: ['PREV', '', '', '', ''],
      onF: function (i) { if (i === 0) { state.pageStack.pop(); goPage('mainMenu'); } },
      onEnter: function () { toast(title + ' \u2014 not simulated'); },
      hint: 'PREV to return | ' + title,
    };
  }

  PAGES.setupProgSelect = setupStub('Prog Select');
  PAGES.setupGeneral     = setupStub('General');
  PAGES.setupCollGuard    = setupStub('Coll Guard');
  PAGES.setupMacro       = setupStub('Macro');
  PAGES.setupRefPos       = setupStub('Ref Position');
  PAGES.setupPortInit     = setupStub('Port Init');
  PAGES.setupOvrdSelect  = setupStub('Ovrd Select');
  PAGES.setupUserAlarm   = setupStub('User Alarm');
  PAGES.setupErrorTable  = setupStub('Error Table');
  PAGES.setupIPendant    = setupStub('iPendant Setup');
  PAGES.setupBGLogic     = setupStub('BG Logic');
  PAGES.setupResumeTol   = setupStub('Resume Tol.');
  PAGES.setupHaptic      = setupStub('Haptic');
  PAGES.setupHostComm    = setupStub('Host Comm');
  PAGES.setupDiagVideo   = setupStub('Diag Video Mon');

  /* =================================================================
     Patch DATA type hint
     ================================================================= */

  PAGES.data.hint = 'F1 TYPE (cycles: R\u2192PR\u2192SR\u2192VR\u2192PAL\u2192KV\u2192KP) | F2 CLEAR | F3 SET TO | ENTER edit';

  /* =================================================================
     Re-render current page to reflect changes
     ================================================================= */

  try { renderPage(); } catch (e) { /* page not yet visible at load time */ }

})();