// Analytics components for the facility detail modal
const { useMemo: useMemoA, useState: useStateA } = React;

// ---------- KPI card ----------
function KPI({ label, value, sub, trend, accent }) {
  return (
    <div className="kpi" style={{ borderTop: `2px solid ${accent || "#3b82f6"}` }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">
        {sub}
        {trend != null && (
          <span className={`trend-pill ${trend >= 0 ? "up" : "down"}`} style={{ marginLeft: 6 }}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ---------- Multi-series time series (line + area + forecast + legend + axes) ----------
// Accepts either the legacy shape (actual, forecast, color) OR new shape (series: [{name, color, data, dashed?, isForecast?, fill?}])
function TimeSeries(props) {
  const { w = 720, h = 200, title, yLabel, yFormat, xLabels, nowIndex, legendPosition = "top" } = props;
  // Normalize to series array
  const series = props.series || [
    { name: props.label || "Entries", color: props.color || "#3b82f6", data: props.actual, fill: true },
    ...(props.forecast && props.forecast.length ? [{ name: "Forecast", color: "#9ca3af", data: [...Array(props.actual.length - 1).fill(null), props.actual[props.actual.length - 1], ...props.forecast], dashed: true, isForecast: true }] : []),
  ];
  const fmt = yFormat || (v => Math.round(v).toLocaleString());

  const plot = { top: 18, right: 14, bottom: 28, left: 46 };
  const pw = w - plot.left - plot.right;
  const ph = h - plot.top - plot.bottom;

  // Flatten data, compute max
  let allVals = [];
  series.forEach(s => s.data.forEach(v => { if (v != null) allVals.push(v); }));
  const maxV = Math.max(...allVals, 1);
  // Nice max (round up to 10/100/1000 etc)
  const niceMax = (() => {
    const raw = maxV * 1.1;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const steps = [1, 2, 2.5, 5, 10];
    for (const s of steps) { if (mag * s >= raw) return mag * s; }
    return raw;
  })();

  const longest = Math.max(...series.map(s => s.data.length));
  const step = longest > 1 ? pw / (longest - 1) : 0;
  const x = i => plot.left + i * step;
  const y = v => plot.top + ph - (v / niceMax) * ph;

  // Paths
  const toPath = (data) => {
    let started = false;
    let d = "";
    data.forEach((v, i) => {
      if (v == null) return;
      const cmd = !started ? "M" : "L";
      d += `${cmd}${x(i).toFixed(1)} ${y(v).toFixed(1)} `;
      started = true;
    });
    return d;
  };

  // Y gridlines
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(p => p * niceMax);

  // Hover state for tooltip
  const [hoverIdx, setHoverIdx] = React.useState(null);
  const svgRef = React.useRef(null);

  const handleMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const scaleX = w / rect.width;
    const localX = px * scaleX - plot.left;
    const idx = Math.round(localX / step);
    if (idx >= 0 && idx < longest) setHoverIdx(idx);
    else setHoverIdx(null);
  };
  const handleLeave = () => setHoverIdx(null);

  return (
    <div className="chart-container">
      {title && <div className="chart-title">{title}</div>}
      {legendPosition === "top" && (
        <div className="chart-legend">
          {series.map((s, i) => (
            <div key={i} className="chart-legend-item">
              <span className={`chart-legend-swatch ${s.dashed ? "dashed" : ""}`} style={{ background: s.dashed ? "transparent" : s.color, borderColor: s.color }}/>
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      )}
      <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block", overflow: "visible" }} onMouseMove={handleMove} onMouseLeave={handleLeave}>
        {/* Y gridlines + labels */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={plot.left} x2={plot.left + pw} y1={y(v)} y2={y(v)} stroke="#f1f5f9" strokeWidth="1"/>
            <text x={plot.left - 8} y={y(v) + 3} fontSize="10" fill="#9ca3af" textAnchor="end" fontFamily="Inter, sans-serif">{fmt(v)}</text>
          </g>
        ))}
        {/* Y axis label */}
        {yLabel && (
          <text x={12} y={plot.top + ph / 2} fontSize="10" fill="#6b7280" textAnchor="middle" transform={`rotate(-90, 12, ${plot.top + ph / 2})`} fontFamily="Inter, sans-serif" fontWeight="500">{yLabel}</text>
        )}
        {/* X axis baseline */}
        <line x1={plot.left} x2={plot.left + pw} y1={plot.top + ph} y2={plot.top + ph} stroke="#e5e7eb" strokeWidth="1"/>

        {/* Forecast band shading */}
        {nowIndex != null && nowIndex < longest - 1 && (
          <rect x={x(nowIndex)} y={plot.top} width={x(longest - 1) - x(nowIndex)} height={ph} fill="#f9fafb"/>
        )}

        {/* Area fills (render first so they sit under lines) */}
        {series.filter(s => s.fill).map((s, i) => {
          let d = "";
          let started = false;
          s.data.forEach((v, j) => {
            if (v == null) return;
            d += (!started ? "M" : "L") + `${x(j).toFixed(1)} ${y(v).toFixed(1)} `;
            started = true;
          });
          const lastIdx = [...s.data].map((v, j) => v != null ? j : -1).filter(j => j >= 0).pop();
          const firstIdx = [...s.data].findIndex(v => v != null);
          if (lastIdx == null || firstIdx == null || firstIdx < 0) return null;
          d += `L${x(lastIdx).toFixed(1)} ${y(0).toFixed(1)} L${x(firstIdx).toFixed(1)} ${y(0).toFixed(1)} Z`;
          return <path key={"fill"+i} d={d} fill={s.color} fillOpacity="0.1"/>;
        })}

        {/* Lines */}
        {series.map((s, i) => (
          <path key={"line"+i} d={toPath(s.data)} fill="none" stroke={s.color} strokeWidth={s.strokeWidth || 1.9}
                strokeDasharray={s.dashed ? "5 4" : "none"} strokeLinejoin="round" strokeLinecap="round"/>
        ))}

        {/* Now line */}
        {nowIndex != null && (
          <g>
            <line x1={x(nowIndex)} x2={x(nowIndex)} y1={plot.top} y2={plot.top + ph} stroke="#111827" strokeDasharray="3 3" opacity="0.35"/>
            <text x={x(nowIndex)} y={plot.top - 5} fontSize="9" fill="#111827" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="600">NOW</text>
          </g>
        )}

        {/* X axis labels */}
        {xLabels && xLabels.map((lbl, i) => lbl ? (
          <text key={i} x={x(i)} y={plot.top + ph + 16} fontSize="10" fill="#9ca3af" textAnchor="middle" fontFamily="Inter, sans-serif">{lbl}</text>
        ) : null)}

        {/* Hover tooltip */}
        {hoverIdx != null && (
          <g>
            <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={plot.top} y2={plot.top + ph} stroke="#94a3b8" strokeWidth="1"/>
            {series.map((s, i) => s.data[hoverIdx] != null && (
              <circle key={i} cx={x(hoverIdx)} cy={y(s.data[hoverIdx])} r="4" fill="#fff" stroke={s.color} strokeWidth="2"/>
            ))}
          </g>
        )}
      </svg>
      {hoverIdx != null && (
        <div className="chart-tooltip">
          <div className="chart-tooltip-title">{xLabels && xLabels[hoverIdx] ? xLabels[hoverIdx] : `Day ${hoverIdx + 1}`}</div>
          {series.map((s, i) => s.data[hoverIdx] != null && (
            <div key={i} className="chart-tooltip-row">
              <span className="chart-tooltip-swatch" style={{ background: s.color }}/>
              <span className="chart-tooltip-label">{s.name}</span>
              <span className="chart-tooltip-value">{fmt(s.data[hoverIdx])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Donut ----------
function Donut({ slices, size = 140, thickness = 22 }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = size / 2 - thickness / 2 - 2;
  const cx = size / 2, cy = size / 2;
  let a0 = -90;
  const paths = slices.map((s, i) => {
    const frac = s.value / total;
    const a1 = a0 + frac * 360;
    const rad0 = a0 * Math.PI / 180;
    const rad1 = a1 * Math.PI / 180;
    const x0 = cx + r * Math.cos(rad0), y0 = cy + r * Math.sin(rad0);
    const x1 = cx + r * Math.cos(rad1), y1 = cy + r * Math.sin(rad1);
    const large = a1 - a0 > 180 ? 1 : 0;
    const d = `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
    a0 = a1;
    return <path key={i} d={d} fill="none" stroke={s.color} strokeWidth={thickness} strokeLinecap="butt"/>;
  });
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={thickness}/>
      {paths}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="20" fontWeight="700" fill="#111827">{total}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="10" fill="#6b7280">total</text>
    </svg>
  );
}

function Legend({ items }) {
  return (
    <div className="legend">
      {items.map((it, i) => (
        <div key={i} className="legend-row">
          <span className="legend-swatch" style={{ background: it.color }}/>
          <span className="legend-label">{it.label}</span>
          <span className="legend-value">{it.value}{it.suffix || "%"}</span>
        </div>
      ))}
    </div>
  );
}

// ---------- Horizontal bars (demographics) ----------
function HBars({ data, color = "#3b82f6" }) {
  const max = Math.max(...data.map(d => d.pct), 1);
  return (
    <div className="hbars">
      {data.map((d, i) => (
        <div key={i} className="hbar-row">
          <div className="hbar-label">{d.label}</div>
          <div className="hbar-track">
            <div className="hbar-fill" style={{ width: (d.pct / max * 100) + "%", background: color }}/>
          </div>
          <div className="hbar-val">{d.pct}%</div>
        </div>
      ))}
    </div>
  );
}

// ---------- Percentile / peer comparison strip ----------
function PeerStrip({ value, peerMin, peerAvg, peerMax, label, suffix = "" }) {
  const span = Math.max(peerMax - peerMin, 1);
  const pos = Math.max(0, Math.min(100, ((value - peerMin) / span) * 100));
  const avgPos = Math.max(0, Math.min(100, ((peerAvg - peerMin) / span) * 100));
  return (
    <div className="peer-strip">
      <div className="peer-label">
        <span>{label}</span>
        <span className="peer-val">{value}{suffix}</span>
      </div>
      <div className="peer-track">
        <div className="peer-avg-tick" style={{ left: avgPos + "%" }} title={`Peer avg ${peerAvg}${suffix}`}/>
        <div className="peer-dot" style={{ left: pos + "%" }}/>
      </div>
      <div className="peer-scale">
        <span>{peerMin}{suffix}</span>
        <span className="peer-avg-text">avg {peerAvg}{suffix}</span>
        <span>{peerMax}{suffix}</span>
      </div>
    </div>
  );
}

Object.assign(window, { KPI, TimeSeries, Donut, Legend, HBars, PeerStrip });
