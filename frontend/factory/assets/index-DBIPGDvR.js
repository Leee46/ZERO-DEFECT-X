(function() {
  const getBaseUrl = () => window.location.origin;

  let state = {
    isRunning: true,
    speed: 1,
    connectionStatus: "CONNECTED",
    sourceLabel: "SIMULATED FACTORY DATA",
    kpis: {
      produced: 142,
      inspected: 138,
      passed: 129,
      defective: 9,
      defectRate: 6.5
    },
    telemetry: {
      machine_id: "M03",
      product_id: "RING-001",
      batch_id: "B1042",
      operator_shift: "Shift B",
      vibration_mm_s: 4.8,
      temperature_c: 72.0,
      pressure_bar: 6.2,
      spindle_rpm: 1480,
      machine_status: "WARNING"
    },
    logs: [
      { time: new Date().toLocaleTimeString(), level: "info", text: "Virtual Factory SCADA engine initialized." },
      { time: new Date().toLocaleTimeString(), level: "warning", text: "Machine M03 drive spindle vibration elevated (4.8 mm/s)." },
      { time: new Date().toLocaleTimeString(), level: "success", text: "Laptop 1 SCADA backend connection synchronized." }
    ]
  };

  const addLog = (level, text) => {
    const time = new Date().toLocaleTimeString();
    state.logs.unshift({ time, level, text });
    if (state.logs.length > 30) state.logs.pop();
    renderLogs();
  };

  const renderLogs = () => {
    const logBox = document.getElementById('event-log');
    if (!logBox) return;
    logBox.innerHTML = state.logs.map(log => 
      `<div class="log-entry ${log.level}">[${log.time}] <strong>${log.level.toUpperCase()}:</strong> ${log.text}</div>`
    ).join('');
  };

  const renderUI = () => {
    const root = document.getElementById('root');
    if (!root) return;

    const isWarning = state.telemetry.vibration_mm_s > 3.0 || state.telemetry.machine_status === 'WARNING';

    root.innerHTML = `
      <div class="scada-container">
        <!-- Top SCADA Navigation Header -->
        <div class="scada-header">
          <div class="scada-title-box">
            <div class="scada-title-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                <line x1="6" y1="6" x2="6.01" y2="6"></line>
                <line x1="6" y1="18" x2="6.01" y2="18"></line>
              </svg>
            </div>
            <div class="scada-title-text">
              <h1>LAPTOP 2 — VIRTUAL FACTORY SCADA SIMULATOR</h1>
              <p>Manufacturing Line Telemetry Engine & Industrial Process Controller</p>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span class="sim-tag">SIMULATED FACTORY DATA</span>
            <span style="font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: 4px; background: rgba(34,160,107,0.2); border: 1px solid #22A06B; color: #22A06B;">
              ● CONNECTED
            </span>
          </div>
        </div>

        <!-- Transparent SIMULATED FACTORY DATA Banner -->
        <div class="sim-banner">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span><strong>SIMULATED FACTORY DATA:</strong> Emitting physical manufacturing sensor telemetry for Laptop 1 SCADA connection.</span>
        </div>

        <!-- KPI Summary Counter Bar -->
        <div class="kpi-bar">
          <div class="kpi-card">
            <div class="kpi-label">Products Produced</div>
            <div class="kpi-value" id="kpi-produced">${state.kpis.produced}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Products Inspected</div>
            <div class="kpi-value" id="kpi-inspected">${state.kpis.inspected}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Passed</div>
            <div class="kpi-value" style="color: #34D399;" id="kpi-passed">${state.kpis.passed}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Defective</div>
            <div class="kpi-value" style="color: #F87171;" id="kpi-defective">${state.kpis.defective}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Defect Rate</div>
            <div class="kpi-value" style="color: ${state.kpis.defectRate > 5 ? '#F59E0B' : '#60A5FA'};" id="kpi-rate">${state.kpis.defectRate}%</div>
          </div>
        </div>

        <!-- Digital Factory Conveyor Belt Visualization -->
        <div class="conveyor-card">
          <div class="card-header-title">
            <span>PHYSICAL MANUFACTURING LINE & DIGITAL CONVEYOR</span>
            <span style="font-size: 0.75rem; color: #8D9AAA; font-weight: normal;">Active Batch: <strong style="color: #00D2FF">${state.telemetry.batch_id}</strong> | Product: <strong style="color: #00D2FF">${state.telemetry.product_id}</strong></span>
          </div>
          
          <div class="conveyor-track">
            <div class="machine-nodes-row">
              <div class="machine-box active">
                <span class="machine-status-dot green"></span>
                <div class="machine-id">M01</div>
                <div class="machine-name">Precision Milling</div>
              </div>

              <div class="machine-box active">
                <span class="machine-status-dot green"></span>
                <div class="machine-id">M02</div>
                <div class="machine-name">CNC Lathe</div>
              </div>

              <div class="machine-box ${isWarning ? 'warning' : 'active'}">
                <span class="machine-status-dot ${isWarning ? 'yellow' : 'green'}"></span>
                <div class="machine-id">M03</div>
                <div class="machine-name">Stamping Press</div>
              </div>

              <div class="machine-box active">
                <span class="machine-status-dot green"></span>
                <div class="machine-id">M04</div>
                <div class="machine-name">Deburring & Polish</div>
              </div>

              <div class="machine-box active" style="border-color: #8B5CF6;">
                <span class="machine-status-dot green"></span>
                <div class="machine-id">VISION</div>
                <div class="machine-name">AI Inspection</div>
              </div>
            </div>

            <!-- Animated Conveyor Belt line -->
            <div class="conveyor-belt" style="animation-duration: ${2 / state.speed}s;"></div>
          </div>
        </div>

        <!-- Two Column Main Layout -->
        <div class="main-scada-grid">
          <!-- Left Column: Operator Controls & System State -->
          <div>
            <div class="scada-card">
              <div class="card-header-title">
                <span>OPERATOR CONTROLS & FAULT INJECTION</span>
                <span style="font-size: 0.72rem; color: ${state.isRunning ? '#34D399' : '#F59E0B'}; font-weight: bold;">
                  ● ${state.isRunning ? 'PRODUCTION RUNNING' : 'PRODUCTION PAUSED'}
                </span>
              </div>

              <div class="controls-grid">
                <button id="btn-toggle" class="btn-ctrl ${state.isRunning ? 'btn-pause' : 'btn-play'}">
                  ${state.isRunning ? '⏸ Pause Production' : '▶ Resume Production'}
                </button>
                <button id="btn-reset" class="btn-ctrl btn-reset">
                  🔄 Reset Counters
                </button>
                <button id="btn-fault" class="btn-ctrl btn-fault">
                  ⚡ Inject Machine Fault (4.8 mm/s)
                </button>
                <button id="btn-correct" class="btn-ctrl btn-corrective">
                  🛠️ Apply Corrective Action (2.7 mm/s)
                </button>
              </div>

              <button id="btn-force-inspect" class="btn-ctrl btn-inspect" style="width: 100%; margin-top: 0.4rem;">
                🔍 Force Manual Vision Inspection Pulse
              </button>

              <div class="speed-slider-box">
                <span style="font-size: 0.75rem; font-weight: 700; color: #8D9AAA;">SIMULATION SPEED:</span>
                <div style="display: flex; gap: 0.5rem;">
                  <button class="btn-ctrl btn-reset speed-btn" data-speed="1" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; ${state.speed === 1 ? 'border: 1px solid #00D2FF; color: #00D2FF;' : ''}">1x</button>
                  <button class="btn-ctrl btn-reset speed-btn" data-speed="2" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; ${state.speed === 2 ? 'border: 1px solid #00D2FF; color: #00D2FF;' : ''}">2x</button>
                  <button class="btn-ctrl btn-reset speed-btn" data-speed="5" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; ${state.speed === 5 ? 'border: 1px solid #00D2FF; color: #00D2FF;' : ''}">5x</button>
                </div>
              </div>
            </div>

            <!-- Event Log Console -->
            <div class="scada-card">
              <div class="card-header-title">
                <span>SCADA EVENT LOG</span>
                <span style="font-size: 0.7rem; color: #8D9AAA;">LIVE CONSOLE</span>
              </div>
              <div id="event-log" class="event-log-box"></div>
            </div>
          </div>

          <!-- Right Column: Real-time M03 Telemetry Gauges -->
          <div>
            <div class="scada-card">
              <div class="card-header-title">
                <span>MACHINE M03 — SENSOR TELEMETRY</span>
                <span style="font-size: 0.75rem; color: ${isWarning ? '#F59E0B' : '#34D399'}; font-weight: bold;">
                  ${isWarning ? '⚠️ WARNING: ELEVATED VIBRATION' : '✓ NORMAL OPERATING STATE'}
                </span>
              </div>

              <div class="telemetry-grid">
                <div class="gauge-card ${isWarning ? 'warning' : ''}">
                  <div class="kpi-label">Vibration</div>
                  <div class="gauge-val" style="color: ${isWarning ? '#F59E0B' : '#60A5FA'};">${state.telemetry.vibration_mm_s.toFixed(1)}</div>
                  <div style="font-size: 0.7rem; color: #8D9AAA;">mm/s</div>
                </div>

                <div class="gauge-card">
                  <div class="kpi-label">Temperature</div>
                  <div class="gauge-val">${state.telemetry.temperature_c.toFixed(1)}</div>
                  <div style="font-size: 0.7rem; color: #8D9AAA;">°C</div>
                </div>

                <div class="gauge-card">
                  <div class="kpi-label">Pressure</div>
                  <div class="gauge-val">${state.telemetry.pressure_bar.toFixed(1)}</div>
                  <div style="font-size: 0.7rem; color: #8D9AAA;">bar</div>
                </div>

                <div class="gauge-card">
                  <div class="kpi-label">Spindle RPM</div>
                  <div class="gauge-val">${state.telemetry.spindle_rpm}</div>
                  <div style="font-size: 0.7rem; color: #8D9AAA;">RPM</div>
                </div>
              </div>
            </div>

            <div class="scada-card">
              <div class="card-header-title">
                <span>ENVIRONMENT & SHIFT CONTEXT</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div style="background: #162235; padding: 0.75rem; border-radius: 6px; border: 1px solid #26364A; text-align: center;">
                  <span class="kpi-label">OPERATOR SHIFT</span>
                  <div style="font-size: 1.1rem; font-weight: bold; color: #E8EDF3; margin-top: 0.2rem;">${state.telemetry.operator_shift}</div>
                </div>
                <div style="background: #162235; padding: 0.75rem; border-radius: 6px; border: 1px solid #26364A; text-align: center;">
                  <span class="kpi-label">DATA TYPE</span>
                  <div style="font-size: 0.72rem; font-weight: bold; color: #60A5FA; margin-top: 0.4rem;">SIMULATED FACTORY DATA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    renderLogs();
    attachListeners();
  };

  const attachListeners = () => {
    document.getElementById('btn-toggle')?.addEventListener('click', () => {
      state.isRunning = !state.isRunning;
      addLog('info', state.isRunning ? "Production line resumed." : "Production line paused by operator.");
      renderUI();
    });

    document.getElementById('btn-reset')?.addEventListener('click', async () => {
      state.kpis.produced = 0;
      state.kpis.inspected = 0;
      state.kpis.passed = 0;
      state.kpis.defective = 0;
      state.kpis.defectRate = 0.0;
      addLog('info', "Production counters reset.");
      renderUI();
    });

    document.getElementById('btn-fault')?.addEventListener('click', async () => {
      try {
        await fetch(`${getBaseUrl()}/api/factory/reset`, { method: 'POST' });
        addLog('warning', "FAULT INJECTED: Machine M03 vibration elevated to 4.8 mm/s!");
        fetchTelemetry();
      } catch (e) {
        addLog('error', "Failed to inject fault: " + e.message);
      }
    });

    document.getElementById('btn-correct')?.addEventListener('click', async () => {
      try {
        await fetch(`${getBaseUrl()}/api/factory/corrective-action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ machine_id: 'M03', action_type: 'dampen_vibration', target_vibration: 2.7 })
        });
        addLog('success', "CORRECTIVE ACTION APPLIED: M03 vibration reduced to 2.7 mm/s.");
        fetchTelemetry();
      } catch (e) {
        addLog('error', "Failed to apply corrective action: " + e.message);
      }
    });

    document.getElementById('btn-force-inspect')?.addEventListener('click', () => {
      state.kpis.produced += 1;
      state.kpis.inspected += 1;
      if (state.telemetry.vibration_mm_s > 3.0) {
        state.kpis.defective += 1;
        addLog('warning', `Inspection pulse: Workpiece rejected due to elevated vibration.`);
      } else {
        state.kpis.passed += 1;
        addLog('success', `Inspection pulse: Workpiece PASSED quality check.`);
      }
      state.kpis.defectRate = Number(((state.kpis.defective / state.kpis.inspected) * 100).toFixed(1));
      renderUI();
    });

    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sp = Number(e.target.dataset.speed);
        state.speed = sp;
        addLog('info', `Simulation speed set to ${sp}x`);
        renderUI();
      });
    });
  };

  const fetchTelemetry = async () => {
    try {
      const res = await fetch(`${getBaseUrl()}/api/telemetry?machine_id=M03`);
      if (res.ok) {
        const data = await res.json();
        state.telemetry.vibration_mm_s = data.vibration_mm_s !== undefined ? data.vibration_mm_s : 4.8;
        state.telemetry.temperature_c = data.temperature_c !== undefined ? data.temperature_c : 72.0;
        state.telemetry.pressure_bar = data.pressure_bar !== undefined ? data.pressure_bar : 6.2;
        state.telemetry.spindle_rpm = data.spindle_rpm !== undefined ? data.spindle_rpm : 1480;
        state.telemetry.machine_status = data.machine_status || "WARNING";
        renderUI();
      }
    } catch (err) {
      console.warn("Could not fetch live telemetry", err);
      renderUI();
    }
  };

  // Production Step Tick Loop
  setInterval(() => {
    if (!state.isRunning) return;
    state.kpis.produced += Math.floor(Math.random() * 2 * state.speed);
    state.kpis.inspected += Math.floor(Math.random() * 2 * state.speed);
    if (state.telemetry.vibration_mm_s > 3.0) {
      state.kpis.defective += (Math.random() < 0.4 ? 1 : 0);
    }
    state.kpis.passed = Math.max(0, state.kpis.inspected - state.kpis.defective);
    if (state.kpis.inspected > 0) {
      state.kpis.defectRate = Number(((state.kpis.defective / state.kpis.inspected) * 100).toFixed(1));
    }
    const producedEl = document.getElementById('kpi-produced');
    const inspectedEl = document.getElementById('kpi-inspected');
    const passedEl = document.getElementById('kpi-passed');
    const defectiveEl = document.getElementById('kpi-defective');
    const rateEl = document.getElementById('kpi-rate');

    if (producedEl) producedEl.textContent = state.kpis.produced;
    if (inspectedEl) inspectedEl.textContent = state.kpis.inspected;
    if (passedEl) passedEl.textContent = state.kpis.passed;
    if (defectiveEl) defectiveEl.textContent = state.kpis.defective;
    if (rateEl) rateEl.textContent = `${state.kpis.defectRate}%`;
  }, 2000);

  window.addEventListener('DOMContentLoaded', () => {
    renderUI();
    fetchTelemetry();
    setInterval(fetchTelemetry, 3000);
  });
})();
