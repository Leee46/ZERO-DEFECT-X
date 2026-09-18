(function() {
  const getBaseUrl = () => {
    return window.location.origin;
  };

  let currentTelemetry = {
    connection_status: "CONNECTED",
    factory_status: "ONLINE",
    source_label: "SIMULATED FACTORY DATA",
    data_type: "SIMULATED FACTORY DATA",
    machine_id: "M03",
    product_id: "RING-001",
    batch_id: "B1042",
    operator_shift: "Shift B",
    vibration_mm_s: 4.8,
    temperature_c: 72.0,
    pressure_bar: 6.2,
    spindle_rpm: 1480,
    environment_temp_c: 29.0,
    humidity_pct: 68.0,
    machine_status: "WARNING"
  };

  const renderUI = () => {
    const root = document.getElementById('root');
    if (!root) return;

    const isWarning = currentTelemetry.vibration_mm_s > 3.0 || currentTelemetry.machine_status === 'WARNING';

    root.innerHTML = `
      <div class="scada-container">
        <!-- Header -->
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
            <span class="status-badge online">● ONLINE</span>
          </div>
        </div>

        <!-- Transparent Data Banner -->
        <div class="sim-banner">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span><strong>SIMULATED FACTORY DATA:</strong> Emitting physical manufacturing sensor telemetry for Laptop 1 SCADA connection.</span>
        </div>

        <!-- Main Layout -->
        <div class="scada-grid">
          <!-- Left Column -->
          <div>
            <!-- Manufacturing Line Process Flow -->
            <div class="scada-card">
              <div class="card-title">
                <span>PHYSICAL MANUFACTURING PROCESS FLOW</span>
                <span style="font-size: 0.75rem; color: #8D9AAA; font-weight: normal;">Active Batch: <strong style="color:#00D2FF">${currentTelemetry.batch_id}</strong></span>
              </div>
              <div class="pipeline-flow">
                <div class="pipeline-node">
                  <div class="pipeline-node-code">RAW</div>
                  <div class="pipeline-node-label">Material Prep</div>
                </div>
                <span class="pipeline-arrow">→</span>
                <div class="pipeline-node">
                  <div class="pipeline-node-code">M01</div>
                  <div class="pipeline-node-label">Milling</div>
                </div>
                <span class="pipeline-arrow">→</span>
                <div class="pipeline-node">
                  <div class="pipeline-node-code">M02</div>
                  <div class="pipeline-node-label">CNC Lathe</div>
                </div>
                <span class="pipeline-arrow">→</span>
                <div class="pipeline-node ${isWarning ? 'warning' : 'active'}">
                  <div class="pipeline-node-code">M03</div>
                  <div class="pipeline-node-label">Stamping Press</div>
                </div>
                <span class="pipeline-arrow">→</span>
                <div class="pipeline-node">
                  <div class="pipeline-node-code">M04</div>
                  <div class="pipeline-node-label">Polish</div>
                </div>
                <span class="pipeline-arrow">→</span>
                <div class="pipeline-node active">
                  <div class="pipeline-node-code">VISION</div>
                  <div class="pipeline-node-label">QC Inspection</div>
                </div>
              </div>
            </div>

            <!-- Active Machine Sensor Telemetry Gauges -->
            <div class="scada-card">
              <div class="card-title">
                <span>MACHINE M03 — SENSOR TELEMETRY</span>
                <span style="font-size: 0.75rem; color: ${isWarning ? '#F59E0B' : '#22A06B'}; font-weight: bold;">
                  ${isWarning ? '⚠️ ELEVATED VIBRATION DETECTED' : '✓ NORMAL OPERATING CONDITIONS'}
                </span>
              </div>
              <div class="meters-grid">
                <div class="meter-box ${isWarning ? 'warning' : ''}">
                  <div class="meter-label">Vibration</div>
                  <div class="meter-value" style="color: ${isWarning ? '#F59E0B' : '#60A5FA'};">${currentTelemetry.vibration_mm_s.toFixed(1)}</div>
                  <div class="meter-unit">mm/s</div>
                </div>
                <div class="meter-box">
                  <div class="meter-label">Temperature</div>
                  <div class="meter-value">${currentTelemetry.temperature_c.toFixed(1)}</div>
                  <div class="meter-unit">°C</div>
                </div>
                <div class="meter-box">
                  <div class="meter-label">Pressure</div>
                  <div class="meter-value">${currentTelemetry.pressure_bar.toFixed(1)}</div>
                  <div class="meter-unit">bar</div>
                </div>
                <div class="meter-box">
                  <div class="meter-label">Spindle Speed</div>
                  <div class="meter-value">${currentTelemetry.spindle_rpm}</div>
                  <div class="meter-unit">RPM</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div>
            <!-- Simulator Interactive Controls -->
            <div class="scada-card">
              <div class="card-title">
                <span>SIMULATOR CONTROLS</span>
              </div>
              <p style="font-size: 0.78rem; color: #8D9AAA; margin-bottom: 1rem;">
                Control M03 simulated state to test Laptop 1 anomaly detection & corrective action sync:
              </p>

              <button id="btn-anomaly" class="btn-control btn-warning">
                ⚡ Trigger Vibration Anomaly (4.8 mm/s)
              </button>
              
              <button id="btn-correct" class="btn-control btn-primary">
                🛠️ Apply Corrective Action (2.7 mm/s)
              </button>

              <button id="btn-reset" class="btn-control btn-danger">
                🔄 Reset Simulator State
              </button>
            </div>

            <!-- Environment Data -->
            <div class="scada-card">
              <div class="card-title">
                <span>ENVIRONMENTAL CONDITIONS</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div style="background:#162235; padding:0.65rem; border-radius:6px; border:1px solid #26364A; text-align:center;">
                  <span style="font-size:0.7rem; color:#8D9AAA;">ENV TEMP</span>
                  <div style="font-size:1.2rem; font-weight:bold; font-family:var(--font-mono);">${currentTelemetry.environment_temp_c}°C</div>
                </div>
                <div style="background:#162235; padding:0.65rem; border-radius:6px; border:1px solid #26364A; text-align:center;">
                  <span style="font-size:0.7rem; color:#8D9AAA;">HUMIDITY</span>
                  <div style="font-size:1.2rem; font-weight:bold; font-family:var(--font-mono);">${currentTelemetry.humidity_pct}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach Event Listeners
    document.getElementById('btn-anomaly')?.addEventListener('click', async () => {
      try {
        await fetch(`${getBaseUrl()}/api/factory/reset`, { method: 'POST' });
        fetchTelemetry();
      } catch (e) {
        console.error("Error triggering anomaly", e);
      }
    });

    document.getElementById('btn-correct')?.addEventListener('click', async () => {
      try {
        await fetch(`${getBaseUrl()}/api/factory/corrective-action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ machine_id: 'M03', action_type: 'dampen_vibration', target_vibration: 2.7 })
        });
        fetchTelemetry();
      } catch (e) {
        console.error("Error applying corrective action", e);
      }
    });

    document.getElementById('btn-reset')?.addEventListener('click', async () => {
      try {
        await fetch(`${getBaseUrl()}/api/factory/reset`, { method: 'POST' });
        fetchTelemetry();
      } catch (e) {
        console.error("Error resetting simulator", e);
      }
    });
  };

  const fetchTelemetry = async () => {
    try {
      const res = await fetch(`${getBaseUrl()}/api/telemetry?machine_id=M03`);
      if (res.ok) {
        const data = await res.json();
        currentTelemetry.vibration_mm_s = data.vibration_mm_s !== undefined ? data.vibration_mm_s : 4.8;
        currentTelemetry.temperature_c = data.temperature_c !== undefined ? data.temperature_c : 72.0;
        currentTelemetry.pressure_bar = data.pressure_bar !== undefined ? data.pressure_bar : 6.2;
        currentTelemetry.spindle_rpm = data.spindle_rpm !== undefined ? data.spindle_rpm : 1480;
        currentTelemetry.machine_status = data.machine_status || "WARNING";
        renderUI();
      }
    } catch (err) {
      console.warn("Could not fetch live telemetry", err);
      renderUI();
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    renderUI();
    fetchTelemetry();
    setInterval(fetchTelemetry, 3000);
  });
})();
