/* =====================================================================
   FANUC iPendant Simulator — Training Mode Patch
   =====================================================================
   Adds an interactive training mode with step-by-step button guidance.

   Scenarios:
     1. Move robot to HOME position
     2. Jog in JOINT mode

   Access: UTILITIES Hints → F1 TRAIN  (or MENU → UTILITIES → Training Mode)

   Each step highlights the required button(s) with a pulsing yellow glow.
   Pressing the correct button advances to the next step.
   Pressing a wrong button shows a short toast hint.
   ===================================================================== */

(function () {
  'use strict';

  /* ── CSS injection ─────────────────────────────────────────────────── */
  const css = document.createElement('style');
  css.textContent = `
    .tr-hl {
      animation: tr-pulse 0.65s ease-in-out infinite alternate !important;
      position: relative;
      z-index: 20;
    }
    @keyframes tr-pulse {
      from { box-shadow: 0 0 0 2px #ffd700, 0 0  8px 3px #ffd70066; }
      to   { box-shadow: 0 0 0 4px #ffd700, 0 0 22px 8px #ffd700bb; }
    }
    /* Deadman buttons need their own rule (different base style) */
    .deadman.tr-hl {
      animation: tr-pulse 0.65s ease-in-out infinite alternate !important;
    }

    #trPanel {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      bottom: 56px;
      width: min(490px, 96vw);
      background: #0e0e1c;
      border: 2px solid #ffd700;
      border-radius: 8px;
      padding: 8px 12px 10px 12px;
      z-index: 901;
      display: none;
      font-family: 'Courier New', monospace;
      box-shadow: 0 6px 28px rgba(0,0,0,0.80);
      user-select: none;
    }
    #trPanel.show { display: block; }

    #trPanel .tr-head {
      display: flex;
      align-items: baseline;
      gap: 6px;
      margin-bottom: 5px;
    }
    #trPanel .tr-badge {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #ffd700;
      background: rgba(255,215,0,0.12);
      border: 1px solid #ffd700;
      border-radius: 3px;
      padding: 1px 6px;
      text-transform: uppercase;
      flex-shrink: 0;
    }
    #trPanel .tr-scname {
      font-size: 10px;
      color: #ddd;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    #trPanel .tr-prog {
      font-size: 10px;
      color: #888;
      flex-shrink: 0;
    }
    #trPanel .tr-close {
      color: #555;
      cursor: pointer;
      font-size: 14px;
      padding-left: 8px;
      flex-shrink: 0;
      transition: color 0.15s;
    }
    #trPanel .tr-close:hover { color: #fff; }

    #trPanel .tr-instr {
      font-size: 11px;
      color: #f0f0f0;
      background: #070712;
      padding: 7px 10px;
      border-radius: 4px;
      border-left: 3px solid #ffd700;
      line-height: 1.5;
      min-height: 30px;
      white-space: pre-wrap;
    }
    #trPanel .tr-instr.tr-done {
      border-color: #3dff6b;
      color: #3dff6b;
    }
  `;
  document.head.appendChild(css);

  /* ── Panel DOM ─────────────────────────────────────────────────────── */
  const trPanel = document.createElement('div');
  trPanel.id = 'trPanel';
  trPanel.innerHTML = [
    '<div class="tr-head">',
    '  <span class="tr-badge">TRAINING</span>',
    '  <span class="tr-scname" id="trScName"></span>',
    '  <span class="tr-prog"  id="trProg"></span>',
    '  <span class="tr-close" id="trClose" title="Exit training">✕</span>',
    '</div>',
    '<div class="tr-instr" id="trInstr">—</div>',
  ].join('');
  document.body.appendChild(trPanel);
  document.getElementById('trClose').addEventListener('click', stopTraining);

  /* ── Training state ────────────────────────────────────────────────── */
  state.training = {
    active:      false,
    scenarioIdx: null,
    steps:       [],
    stepIdx:     0,
    done:        false,
  };

  /* ── Scenario definitions ──────────────────────────────────────────── */
  /*
   * Each step object:
   *   instr      : string | () => string
   *   targets    : string[] | () => string[]   — CSS selectors to highlight
   *   autoSkip   : () => bool                  — skip step if already satisfied
   *   accept     : (type, data) => bool         — returns true to advance
   *   wrongMsg   : string | (data) => string|null
   *
   * Event types delivered to accept():
   *   'btn'        — physical button pressed (data = btn name, BEFORE handleBtn)
   *   'post-btn'   — AFTER handleBtn ran      (data = btn name)
   *   'jog'        — jog button fired         (data = axis spec e.g. 'J1+')
   *   'deadman-held' — deadman pressed
   *   'poll'       — 100 ms poll tick
   */

  var TRAINING_SCENARIOS = [

    /* ------------------------------------------------------------------ */
    {
      name: 'Move robot to HOME position',
      desc: 'Reset faults → POSITION screen → JOINT coord → reduce speed → hold DEADMAN → jog all axes to 0°.',
      build: function () {
        var steps = [];

        /* Step: RESET if fault active */
        steps.push({
          instr: 'If any FAULT is active (red LED), press RESET to clear it.',
          targets: ['[data-btn="RESET"]'],
          autoSkip: function () { return !state.fault && !state.estop; },
          accept: function (type, data) {
            return type === 'post-btn' && data === 'RESET' && !state.fault && !state.estop;
          },
          wrongMsg: 'Press RESET to clear any active faults before jogging.',
        });

        /* Step: Open POSITION screen */
        steps.push({
          instr: 'Press POSITION to open the joint position screen.',
          targets: ['[data-btn="POSITION"]'],
          accept: function (type, data) {
            return type === 'btn' && data === 'POSITION';
          },
          wrongMsg: 'Press POSITION to see current joint angles.',
        });

        /* Step: Set COORD to JOINT */
        steps.push({
          instr: 'Press COORD to cycle the coordinate system until it shows JOINT.',
          targets: ['[data-btn="COORD"]'],
          autoSkip: function () { return state.coord === 'JOINT'; },
          accept: function (type, data) {
            return type === 'post-btn' && data === 'COORD' && state.coord === 'JOINT';
          },
          wrongMsg: 'Press COORD to switch to JOINT coordinate mode.',
        });

        /* Step: Reduce speed */
        steps.push({
          instr: 'Press SPEEDDN (−%) at least once to lower the speed override before jogging.',
          targets: ['[data-btn="SPEEDDN"]'],
          autoSkip: function () { return state.speedOverride < 100; },
          accept: function (type, data) {
            return type === 'post-btn' && data === 'SPEEDDN';
          },
          wrongMsg: 'Press SPEEDDN (−%) to lower the speed override for safe jogging.',
        });

        /* Step: Hold DEADMAN */
        steps.push({
          instr: 'Press and HOLD a DEADMAN button (left or right side) to enable servo power.',
          targets: ['#deadmanL', '#deadmanR'],
          accept: function (type) {
            return type === 'deadman-held' && deadmanHeld();
          },
          wrongMsg: 'Hold a DEADMAN button first to enable jogging.',
        });

        /* Steps: Jog each axis toward 0 */
        for (var i = 0; i < 6; i++) {
          (function (axisIdx) {
            var n = axisIdx + 1;
            steps.push({
              instr: function () {
                var v = state.positions[axisIdx];
                if (Math.abs(v) <= 5) return 'J' + n + ' is near 0 (' + fmt(v) + '°) — already good!';
                var dir = v > 0 ? '− (negative)' : '+ (positive)';
                return 'Jog J' + n + ' in the ' + dir + ' direction toward 0°.\nCurrent: ' + fmt(v) + '°  |  Hold DEADMAN + press jog button';
              },
              targets: function () {
                var v = state.positions[axisIdx];
                if (Math.abs(v) <= 5) return [];
                return ['[data-jog="J' + n + (v > 0 ? '-' : '+') + '"]'];
              },
              autoSkip: function () { return Math.abs(state.positions[axisIdx]) <= 5; },
              accept: function (type, data) {
                if (type === 'poll') return Math.abs(state.positions[axisIdx]) <= 5;
                if (type === 'jog') {
                  var dir = state.positions[axisIdx] > 0 ? '-' : '+';
                  return data === 'J' + n + dir && Math.abs(state.positions[axisIdx]) <= 5;
                }
                return false;
              },
              wrongMsg: function (data) {
                var v = state.positions[axisIdx];
                if (Math.abs(v) <= 5) return null;
                if (data && data.length >= 3 && data.substring(0,2) === 'J' + n) {
                  /* Right axis, wrong direction or not there yet */
                  return 'Keep jogging J' + n + ' ' + (v > 0 ? '−' : '+') + ' until it reaches near 0° (current: ' + fmt(v) + '°).';
                }
                return 'Hold DEADMAN and press the ' + (v > 0 ? '−' : '+') + ' jog button for J' + n + ' (current: ' + fmt(v) + '°).';
              },
            });
          }(i));
        }

        return steps;
      },
    },

    /* ------------------------------------------------------------------ */
    {
      name: 'Jog in JOINT mode',
      desc: 'Set JOINT coordinate mode, open POSITION screen, hold DEADMAN, then jog J1 through J3 in both directions.',
      build: function () {
        return [
          {
            instr: 'Press COORD to cycle the coordinate system to JOINT mode.',
            targets: ['[data-btn="COORD"]'],
            autoSkip: function () { return state.coord === 'JOINT'; },
            accept: function (type, data) {
              return type === 'post-btn' && data === 'COORD' && state.coord === 'JOINT';
            },
            wrongMsg: 'Press COORD to switch to JOINT coordinate mode.',
          },
          {
            instr: 'Press POSITION to open the joint position screen and see live angle values.',
            targets: ['[data-btn="POSITION"]'],
            accept: function (type, data) { return type === 'btn' && data === 'POSITION'; },
            wrongMsg: 'Press POSITION to open the position display.',
          },
          {
            instr: 'Press and HOLD a DEADMAN button (left or right side) to enable jog motion.',
            targets: ['#deadmanL', '#deadmanR'],
            accept: function (type) { return type === 'deadman-held' && deadmanHeld(); },
            wrongMsg: 'Hold a DEADMAN button to enable jogging.',
          },
          {
            instr: 'Jog J1 in the + direction — press +X (J1) while holding DEADMAN.',
            targets: ['[data-jog="J1+"]'],
            accept: function (type, data) { return type === 'jog' && data === 'J1+'; },
            wrongMsg: 'Hold DEADMAN and press the +X (J1) jog button.',
          },
          {
            instr: 'Jog J1 in the − direction — press −X (J1) to move it back.',
            targets: ['[data-jog="J1-"]'],
            accept: function (type, data) { return type === 'jog' && data === 'J1-'; },
            wrongMsg: 'Hold DEADMAN and press the −X (J1) jog button.',
          },
          {
            instr: 'Jog J2 in the + direction — press +Y (J2) while holding DEADMAN.',
            targets: ['[data-jog="J2+"]'],
            accept: function (type, data) { return type === 'jog' && data === 'J2+'; },
            wrongMsg: 'Hold DEADMAN and press the +Y (J2) jog button.',
          },
          {
            instr: 'Jog J2 in the − direction — press −Y (J2) to move it back.',
            targets: ['[data-jog="J2-"]'],
            accept: function (type, data) { return type === 'jog' && data === 'J2-'; },
            wrongMsg: 'Hold DEADMAN and press the −Y (J2) jog button.',
          },
          {
            instr: 'Jog J3 in the + direction — press +Z (J3) while holding DEADMAN.',
            targets: ['[data-jog="J3+"]'],
            accept: function (type, data) { return type === 'jog' && data === 'J3+'; },
            wrongMsg: 'Hold DEADMAN and press the +Z (J3) jog button.',
          },
          {
            instr: 'Jog J3 in the − direction — press −Z (J3). Last step!',
            targets: ['[data-jog="J3-"]'],
            accept: function (type, data) { return type === 'jog' && data === 'J3-'; },
            wrongMsg: 'Hold DEADMAN and press the −Z (J3) jog button to finish.',
          },
        ];
      },
    },

  ]; /* end TRAINING_SCENARIOS */

  /* ── Helpers ───────────────────────────────────────────────────────── */
  function getTr() { return state.training; }

  function getCurrentStep() {
    var tr = getTr();
    if (!tr.active || tr.done) return null;
    return tr.steps[tr.stepIdx] || null;
  }

  function getInstr(step) {
    if (!step) return '';
    return typeof step.instr === 'function' ? step.instr() : (step.instr || '');
  }

  function getTargets(step) {
    if (!step || !step.targets) return [];
    return typeof step.targets === 'function' ? step.targets() : step.targets;
  }

  /* ── Highlights ────────────────────────────────────────────────────── */
  function clearHighlights() {
    document.querySelectorAll('.tr-hl').forEach(function (el) {
      el.classList.remove('tr-hl');
    });
  }

  function applyHighlights() {
    clearHighlights();
    var step = getCurrentStep();
    if (!step) return;
    var targets = getTargets(step);
    targets.forEach(function (sel) {
      try {
        document.querySelectorAll(sel).forEach(function (el) {
          el.classList.add('tr-hl');
        });
      } catch (e) { /* ignore invalid selector */ }
    });
  }

  /* ── Panel update ──────────────────────────────────────────────────── */
  function updateTrainingPanel() {
    var tr = getTr();
    var panel = document.getElementById('trPanel');
    if (!panel) return;

    if (!tr.active) {
      panel.classList.remove('show');
      clearHighlights();
      return;
    }
    panel.classList.add('show');

    var sc = TRAINING_SCENARIOS[tr.scenarioIdx] || { name: '' };
    var scNameEl   = document.getElementById('trScName');
    var progEl     = document.getElementById('trProg');
    var instrEl    = document.getElementById('trInstr');

    if (scNameEl) scNameEl.textContent = sc.name;

    if (tr.done) {
      if (progEl)  progEl.textContent  = 'COMPLETE';
      if (instrEl) {
        instrEl.textContent = '✔ All steps complete! Great work. Press PREV or ✕ to exit.';
        instrEl.className   = 'tr-instr tr-done';
      }
      clearHighlights();
      return;
    }

    var total = tr.steps.length;
    if (progEl)  progEl.textContent  = 'Step ' + (tr.stepIdx + 1) + ' / ' + total;
    if (instrEl) {
      instrEl.textContent = getInstr(getCurrentStep());
      instrEl.className   = 'tr-instr';
    }
    applyHighlights();
  }

  /* ── Step advancement ──────────────────────────────────────────────── */
  function skipAutoSteps() {
    var tr = getTr();
    while (tr.stepIdx < tr.steps.length) {
      var s = tr.steps[tr.stepIdx];
      if (s.autoSkip && s.autoSkip()) {
        tr.stepIdx++;
      } else {
        break;
      }
    }
  }

  function advanceStep() {
    var tr = getTr();
    tr.stepIdx++;
    skipAutoSteps();
    if (tr.stepIdx >= tr.steps.length) {
      tr.done = true;
      stopTrainingPoll();
      toast('✔ TRAINING COMPLETE — ' + (TRAINING_SCENARIOS[tr.scenarioIdx] || {name:''}).name, 3000);
    }
    updateTrainingPanel();
  }

  /* ── Event dispatcher ──────────────────────────────────────────────── */
  var _lastWrongKey  = '';
  var _lastWrongTime = 0;

  function trainingEvent(type, data) {
    var tr = getTr();
    if (!tr.active || tr.done) return;

    var step = getCurrentStep();
    if (!step) return;

    /* Poll / continuous condition */
    if (type === 'poll') {
      if (step.autoSkip && step.autoSkip()) { advanceStep(); return; }
      if (step.accept && step.accept('poll', data)) { advanceStep(); return; }
      /* Update instruction (might be dynamic) */
      var instrEl = document.getElementById('trInstr');
      if (instrEl && typeof step.instr === 'function') {
        instrEl.textContent = step.instr();
      }
      applyHighlights(); /* targets may shift for jog steps */
      return;
    }

    /* Check acceptance */
    if (step.accept && step.accept(type, data)) {
      advanceStep();
      return;
    }

    /* ---- Wrong-button hint ---- */
    /* Skip hint for internal / navigation events */
    if (type === 'post-btn') return;
    var navBtns = ['UP','DOWN','LEFT','RIGHT','PREV','NEXT','ITEM','SHIFT','ENTER','BS','HELP','DIAGHELP','INFO','DISP'];
    if (type === 'btn' && navBtns.indexOf(data) !== -1) return;

    /* Skip hint if this IS the target button (acceptance happens at post-btn stage) */
    if (type === 'btn') {
      var tgts = getTargets(step);
      var isBtnTarget = tgts.some(function (sel) {
        var m = sel.match(/\[data-btn="([^"]+)"\]/);
        return m && m[1] === data;
      });
      if (isBtnTarget) return;
    }

    /* Skip hint if this is the correct jog direction but target not yet reached */
    if (type === 'jog') {
      var jtgts = getTargets(step);
      var isJogTarget = jtgts.some(function (sel) {
        var m = sel.match(/\[data-jog="([^"]+)"\]/);
        return m && m[1] === data;
      });
      if (isJogTarget) return;
    }

    /* Compute and display the wrong-button message */
    var msg;
    if (step.wrongMsg) {
      msg = typeof step.wrongMsg === 'function' ? step.wrongMsg(data) : step.wrongMsg;
    } else {
      msg = getInstr(step);
    }
    if (!msg) return;

    var now = Date.now();
    var key = type + ':' + (data || '');
    if (key !== _lastWrongKey || (now - _lastWrongTime) > 2000) {
      toast('TRAINING: ' + msg.split('\n')[0], 2000);
      _lastWrongKey  = key;
      _lastWrongTime = now;
    }
  }

  /* ── Start / Stop ──────────────────────────────────────────────────── */
  function startTraining(idx) {
    if (idx < 0 || idx >= TRAINING_SCENARIOS.length) return;
    var sc = TRAINING_SCENARIOS[idx];
    var tr = getTr();
    tr.active      = true;
    tr.scenarioIdx = idx;
    tr.steps       = sc.build();
    tr.stepIdx     = 0;
    tr.done        = false;
    skipAutoSteps();
    if (tr.stepIdx >= tr.steps.length) tr.done = true;
    startTrainingPoll();
    updateTrainingPanel();
    toast('TRAINING: ' + sc.name, 2200);
  }

  function stopTraining() {
    var tr = getTr();
    tr.active      = false;
    tr.done        = false;
    tr.steps       = [];
    tr.scenarioIdx = null;
    stopTrainingPoll();
    updateTrainingPanel(); /* hides panel, clears highlights */
    toast('Training exited.');
  }

  /* ── Poll timer ────────────────────────────────────────────────────── */
  var _pollTimer = null;

  function startTrainingPoll() {
    if (_pollTimer) return;
    _pollTimer = setInterval(function () { trainingEvent('poll'); }, 100);
  }

  function stopTrainingPoll() {
    if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
  }

  /* ── Hook: handleBtn ───────────────────────────────────────────────── */
  var _origHandleBtn = window.handleBtn;
  window.handleBtn = function (btn, el) {
    if (state.training && state.training.active && !state.training.done) {
      trainingEvent('btn', btn);
    }
    _origHandleBtn(btn, el);
    if (state.training && state.training.active && !state.training.done) {
      trainingEvent('post-btn', btn);
    }
  };

  /* ── Hook: startJog ────────────────────────────────────────────────── */
  var _origStartJog = window.startJog;
  window.startJog = function (axisSpec) {
    /* Only fire training event if jog conditions are actually met */
    var willJog = !state.estop && !state.hold && !state.fault && deadmanHeld();
    _origStartJog(axisSpec);
    if (willJog && state.training && state.training.active && !state.training.done) {
      trainingEvent('jog', axisSpec);
    }
  };

  /* ── Hook: deadman buttons ─────────────────────────────────────────── */
  ['deadmanL', 'deadmanR'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('pointerdown', function () {
      /* Defer by one tick so wireDeadman's press() handler runs first */
      setTimeout(function () {
        if (state.training && state.training.active && !state.training.done) {
          trainingEvent('deadman-held');
        }
      }, 0);
    });
  });

  /* ── PAGES.training ────────────────────────────────────────────────── */
  PAGES.training = {
    title: 'TRAINING',
    subtitle: 'Select Scenario',
    custom: function () {
      var html = '<div class="pg-section">SELECT TRAINING SCENARIO</div><div class="pg-list">';
      TRAINING_SCENARIOS.forEach(function (sc, i) {
        var sel = i === state.cursor ? ' sel' : '';
        html += '<div class="pg-row' + sel + '"><span> ' + (i + 1) + '  ' + sc.name + '</span></div>';
        if (i === state.cursor) {
          html += '<div class="pg-row" style="font-size:9px;color:#556;padding:1px 16px 3px;">' + sc.desc + '</div>';
        }
      });
      html += '</div>';
      if (state.training.active) {
        var sc = TRAINING_SCENARIOS[state.training.scenarioIdx] || {};
        html += '<div class="pg-hint">Active: ' + (sc.name || '—') + '  |  F4 to stop</div>';
      }
      return html;
    },
    navCount: function () { return TRAINING_SCENARIOS.length; },
    softKeys: ['START', '', '', 'STOP', 'EXIT'],
    onF: function (i) {
      if (i === 0) { startTraining(state.cursor); }
      if (i === 3) { stopTraining(); renderPage(); }
      if (i === 4) { goBack(); }
    },
    onEnter: function (i) { startTraining(i); },
    hint: 'ENTER or F1 to start | F4 STOP | F5 EXIT',
  };

  /* ── Patch utilHints: add TRAIN soft key ───────────────────────────── */
  var _origUtilHintsOnF = PAGES.utilHints.onF;
  PAGES.utilHints.softKeys = ['TRAIN', 'RUN', '', 'STATUS', '>'];
  PAGES.utilHints.onF = function (i) {
    if (i === 0) { goPage('training'); return; }
    if (_origUtilHintsOnF) _origUtilHintsOnF(i);
  };

  /* ── Add Training Mode to UTILITIES cascade submenu ───────────────── */
  if (CASCADE_SUBS.utilities && CASCADE_SUBS.utilities.items) {
    CASCADE_SUBS.utilities.items.unshift({ label: 'Training Mode', target: 'training' });
  }

  /* ── Re-render if already on home page ────────────────────────────── */
  if (typeof renderPage === 'function' && state.page === 'utilHints') {
    renderPage();
  }

})();
