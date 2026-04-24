// Vilnius sport facilities dashboard
// - Leaflet map with type-colored markers + emoji icons
// - Heatmap overlay (Leaflet.heat) toggle
// - Click marker => selects row in list (scrolls + highlights)
// - Double-click row => opens detail modal with history graphs & amenities

const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ---------- Type color map (adds variety beyond status color) ----------
const TYPE_COLOR = {
  pool:       "#0ea5e9", // cyan
  gym:        "#8b5cf6", // violet
  basketball: "#f97316", // orange
  football:   "#22c55e", // green
  tennis:     "#eab308", // yellow
  ice:        "#06b6d4", // light cyan
  climbing:   "#dc2626", // red
  sauna:      "#ec4899", // pink
  track:      "#14b8a6", // teal
  skate:      "#6366f1", // indigo
  arena:      "#a855f7", // purple
  yoga:       "#84cc16", // lime
};

// ---------- Tiny charts ----------
function Sparkline({ data, color = "#3b82f6", w = 240, h = 40, fill = true }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - (v / max) * (h - 4) - 2]);
  const d = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = d + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      {fill && <path d={area} fill={color} fillOpacity="0.12"/>}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color}/>
    </svg>
  );
}

function HourlyBars({ data, color = "#3b82f6", w = 540, h = 140, nowHour }) {
  const max = Math.max(...data, 1);
  const bw = w / data.length;
  return (
    <svg width={w} height={h + 24} style={{ display: "block" }}>
      {data.map((v, i) => {
        const bh = (v / max) * h;
        const isNow = i === nowHour;
        return (
          <g key={i}>
            <rect
              x={i * bw + 1.5}
              y={h - bh}
              width={bw - 3}
              height={bh}
              rx={2}
              fill={isNow ? "#111827" : color}
              opacity={isNow ? 1 : 0.75}
            />
          </g>
        );
      })}
      {[0, 6, 12, 18, 23].map(h2 => (
        <text key={h2} x={h2 * bw + bw / 2} y={h + 16} fontSize="10" fill="#9ca3af" textAnchor="middle">
          {String(h2).padStart(2, "0")}
        </text>
      ))}
      {nowHour != null && (
        <line x1={nowHour * bw + bw / 2} x2={nowHour * bw + bw / 2} y1={0} y2={h} stroke="#111827" strokeDasharray="2 3" strokeWidth="1" opacity="0.3"/>
      )}
    </svg>
  );
}

function WeeklyHeatmap({ weekly, peakHour }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const cellW = 20, cellH = 20, leftPad = 40, topPad = 22;
  const w = leftPad + 24 * cellW;
  const h = topPad + 7 * cellH + 14;
  const colorFor = (v) => {
    // teal scale
    const t = Math.min(1, v);
    const alpha = 0.08 + t * 0.85;
    return `rgba(16, 185, 129, ${alpha.toFixed(3)})`;
  };
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      {[0, 6, 12, 18].map(hr => (
        <text key={hr} x={leftPad + hr * cellW} y={topPad - 6} fontSize="10" fill="#9ca3af">{String(hr).padStart(2, "0")}</text>
      ))}
      {weekly.map((row, d) => (
        <g key={d}>
          <text x={leftPad - 6} y={topPad + d * cellH + 14} fontSize="10" fill="#6b7280" textAnchor="end">{days[d]}</text>
          {row.map((v, h2) => (
            <rect
              key={h2}
              x={leftPad + h2 * cellW}
              y={topPad + d * cellH}
              width={cellW - 1.5}
              height={cellH - 1.5}
              rx={2}
              fill={colorFor(v)}
              stroke={h2 === peakHour ? "#f59e0b" : "none"}
              strokeWidth={h2 === peakHour ? 1 : 0}
            />
          ))}
        </g>
      ))}
      <text x={leftPad} y={h - 2} fontSize="10" fill="#9ca3af">Less</text>
      <text x={leftPad + 24 * cellW - 20} y={h - 2} fontSize="10" fill="#9ca3af" textAnchor="end">More</text>
    </svg>
  );
}

function OccupancyGauge({ pct, color = "#3b82f6", size = 120 }) {
  const r = size / 2 - 8;
  const cx = size / 2, cy = size / 2;
  const startAngle = 135, endAngle = 405; // 270deg arc
  const total = endAngle - startAngle;
  const polar = (a) => {
    const rad = (a - 90) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const arc = (a0, a1) => {
    const [x0, y0] = polar(a0);
    const [x1, y1] = polar(a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };
  const a1 = startAngle + (pct / 100) * total;
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <path d={arc(startAngle, endAngle)} fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round"/>
      <path d={arc(startAngle, a1)} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"/>
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="26" fontWeight="700" fill="#111827" fontVariantNumeric="tabular-nums">{pct}%</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="#6b7280">full</text>
    </svg>
  );
}

// ---------- Popup HTML (Leaflet needs strings) ----------
function popupHTML(f) {
  const s = statusOf(f);
  const meta = STATUS[s];
  const pct = Math.round((f.current / f.capacity) * 100);
  return `
    <div>
      <div class="popup-title">${f.typeIcon} ${f.name}</div>
      <div class="popup-meta">${f.typeName} · ${f.district}</div>
      <div class="popup-row">
        <span class="popup-status" style="background:${meta.color}">${meta.label}</span>
        <span style="font-weight:600">${f.current} / ${f.capacity}</span>
      </div>
      <div class="popup-bar"><div class="popup-bar-fill" style="width:${pct}%;background:${meta.color}"></div></div>
      <div style="font-size:11px;color:#6b7280;text-align:right">${pct}% full</div>
      <div class="popup-details">
        <span class="k">Hours</span><span class="v">${f.hours}</span>
        <span class="k">Price</span><span class="v">${f.price}</span>
      </div>
      <div style="margin-top:10px;font-size:11px;color:#6b7280;text-align:center">Double-click row in list for full history →</div>
    </div>
  `;
}

// ---------- Map ----------
function FacilityMap({ facilities, selectedId, onSelect, heatmapOn, heatMetric }) {
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const markersRef = useRef({});
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (mapObj.current) return;
    const m = L.map(mapRef.current, {
      center: [54.6872, 25.2797],
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap, &copy; CARTO',
      maxZoom: 19, subdomains: "abcd",
    }).addTo(m);
    mapObj.current = m;
  }, []);

  // Markers
  useEffect(() => {
    const m = mapObj.current;
    if (!m) return;
    // Remove markers for facilities no longer in the (filtered) list
    const keepIds = new Set(facilities.map(f => f.id));
    Object.keys(markersRef.current).forEach(id => {
      if (!keepIds.has(id)) {
        m.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });
    facilities.forEach(f => {
      const s = statusOf(f);
      const statusColor = STATUS[s].color;
      const typeColor = TYPE_COLOR[f.type] || "#3b82f6";
      const color = f.isClosed ? "#9ca3af" : typeColor;
      const ring = statusColor;
      const isSel = f.id === selectedId;
      const html = `
        <div class="facility-marker${isSel ? " selected" : ""}" style="background:${color};box-shadow:0 0 0 3px ${ring}88, 0 1px 3px rgba(0,0,0,0.3)">
          <span>${f.typeIcon}</span>
        </div>`;
      const icon = L.divIcon({ html, className: "", iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14] });
      if (markersRef.current[f.id]) {
        markersRef.current[f.id].setIcon(icon);
        markersRef.current[f.id].setPopupContent(popupHTML(f));
      } else {
        const mk = L.marker([f.lat, f.lng], { icon })
          .addTo(m)
          .bindPopup(popupHTML(f), { offset: [0, -4] });
        mk.on("click", () => onSelect(f.id, { fromMap: true }));
        markersRef.current[f.id] = mk;
      }
    });
  }, [facilities, selectedId, onSelect]);

  // Selection -> open popup + pan
  useEffect(() => {
    const m = mapObj.current;
    if (!m || !selectedId) return;
    const mk = markersRef.current[selectedId];
    const f = facilities.find(x => x.id === selectedId);
    if (mk && f) {
      m.setView([f.lat, f.lng], Math.max(m.getZoom(), 13), { animate: true });
      mk.openPopup();
    }
  }, [selectedId, facilities]);

  // Heatmap layer — weight by chosen metric, zoom-aware radius, occupancy-aware gradient
  useEffect(() => {
    const m = mapObj.current;
    if (!m) return;

    const buildHeat = () => {
      if (heatLayerRef.current) { m.removeLayer(heatLayerRef.current); heatLayerRef.current = null; }
      if (!heatmapOn) return;

      // Weight function → always returns a normalized [0..1] "heat" value
      // Live occupancy blends % full (dominant) with log(capacity) so a packed large pool
      // reads hotter than a packed small court, without letting raw size overwhelm ratios.
      const weightFn = (f) => {
        if (f.isClosed) return 0;
        switch (heatMetric) {
          case "pctfull": {
            return Math.min(1, f.current / f.capacity);
          }
          case "24h": return f.todayEntries;
          case "week": return f.weekEntries;
          case "month": return f.monthEntries;
          case "util7d": return Math.min(1, (f.avgUtil || 0) / 100);
          case "live":
          default: {
            const ratio = Math.min(1, f.current / f.capacity);
            // Capacity boost: log-scaled 0..1 across the city's range
            const sizeBoost = Math.log10(Math.max(1, f.capacity)) / Math.log10(500);
            // 80% weight to ratio, 20% to size → packed small court ≈ 0.85; packed huge pool ≈ 1.0
            return Math.max(0, Math.min(1, ratio * 0.8 + ratio * sizeBoost * 0.2));
          }
        }
      };

      const openFacs = facilities.filter(f => !f.isClosed);
      const rawWeights = openFacs.map(weightFn);
      const maxW = Math.max(...rawWeights, 0.001);

      // For count-based metrics (24h/week/month) normalize to the observed max.
      // For ratio-based metrics (live/pctfull/util7d) use the absolute 0..1 scale.
      const isRatioMetric = heatMetric === "live" || heatMetric === "pctfull" || heatMetric === "util7d";

      const pts = openFacs
        .map((f, i) => {
          let w = rawWeights[i];
          if (!isRatioMetric) w = w / maxW;
          // Floor so every open facility shows at least a faint dot
          const intensity = Math.max(0.12, w);
          return [f.lat, f.lng, intensity];
        });

      // Radius scales with zoom — tighter at high zoom, wider at low
      const z = m.getZoom();
      const radius = Math.max(25, Math.min(90, 18 + (16 - z) * 8));
      const blur = Math.round(radius * 0.7);

      heatLayerRef.current = L.heatLayer(pts, {
        radius,
        blur,
        max: 1.0,
        minOpacity: 0.35,
        maxZoom: 18,
        gradient: {
          0.0: "rgba(16,185,129,0.0)",
          0.15: "rgba(16,185,129,0.55)",   // green — quiet
          0.35: "#84cc16",                  // lime
          0.55: "#eab308",                  // yellow — busy
          0.72: "#f97316",                  // orange — hot
          0.88: "#dc2626",                  // red — near full
          1.0:  "#7f1d1d",                  // dark red — full
        },
      }).addTo(m);
    };

    buildHeat();
    // Rebuild on zoom so radius stays tuned to the current scale
    const onZoom = () => buildHeat();
    m.on("zoomend", onZoom);
    return () => { m.off("zoomend", onZoom); };
  }, [heatmapOn, heatMetric, facilities]);

  return <div id="map" ref={mapRef}/>;
}

// ---------- Facility list ----------
function FacilityTable({ facilities, allCount, selectedId, onSelect, onOpenDetail, scrollTrigger, q, setQ, typeFilter, setTypeFilter, statusFilter, setStatusFilter }) {
  const [sortBy, setSortBy] = useState("occupancy");
  const [sortDir, setSortDir] = useState("desc");
  const rowRefs = useRef({});

  // facilities prop is already filtered by App — only sort here.
  const rows = useMemo(() => {
    const list = facilities.slice();
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let va, vb;
      switch (sortBy) {
        case "name": va = a.name; vb = b.name; break;
        case "type": va = a.typeName; vb = b.typeName; break;
        case "district": va = a.district; vb = b.district; break;
        case "capacity": va = a.capacity; vb = b.capacity; break;
        case "current": va = a.current; vb = b.current; break;
        case "today": va = a.todayEntries; vb = b.todayEntries; break;
        case "week": va = a.weekEntries; vb = b.weekEntries; break;
        case "month": va = a.monthEntries; vb = b.monthEntries; break;
        case "trend": va = a.trendPct; vb = b.trendPct; break;
        case "rating": va = a.rating; vb = b.rating; break;
        case "occupancy":
        default:
          va = a.current / a.capacity; vb = b.current / b.capacity;
      }
      if (typeof va === "string") return va.localeCompare(vb) * dir;
      return (va - vb) * dir;
    });
    return list;
  }, [facilities, sortBy, sortDir]);

  // Clear filters so selected row is visible (if map pick hid it)
  useEffect(() => {
    if (!selectedId || !scrollTrigger) return;
    const found = rows.find(f => f.id === selectedId);
    if (!found) {
      setQ(""); setTypeFilter(""); setStatusFilter("");
    }
  }, [scrollTrigger]); // eslint-disable-line

  // Scroll selected into view inside list container (NOT the page) on map-triggered selects
  useEffect(() => {
    if (!selectedId || !scrollTrigger) return;
    const el = rowRefs.current[selectedId];
    const scroller = document.querySelector(".list-scroll");
    if (el && scroller) {
      const scrollerRect = scroller.getBoundingClientRect();
      const rowRect = el.getBoundingClientRect();
      const offset = rowRect.top - scrollerRect.top - 60; // 60px = header height
      scroller.scrollBy({ top: offset, behavior: "smooth" });
      el.classList.add("flash");
      setTimeout(() => el.classList.remove("flash"), 1400);
    }
  }, [scrollTrigger, selectedId]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir(col === "name" || col === "type" || col === "district" ? "asc" : "desc"); }
  };
  const arrow = (col) => sortBy === col ? <span className="arrow">{sortDir === "asc" ? "↑" : "↓"}</span> : null;

  return (
    <section className="list-section" id="facility-list">
      <div className="list-header">
        <div>
          <h2>Facilities</h2>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            {rows.length} of {allCount} shown{(q || typeFilter || statusFilter) ? " · filtered" : ""} · <span style={{ color: "#3b82f6" }}>double-click a row for full history</span>
          </div>
        </div>
        <div className="list-controls">
          <input type="text" placeholder="Search name, district, type…" value={q} onChange={e => setQ(e.target.value)}/>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            {TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="low">Available</option>
            <option value="medium">Busy</option>
            <option value="full">Full</option>
            <option value="closed">Closed</option>
          </select>
          <select value={sortBy} onChange={e => { setSortBy(e.target.value); setSortDir(e.target.value === "name" || e.target.value === "district" ? "asc" : "desc"); }}>
            <option value="occupancy">Sort: current availability</option>
            <option value="current">Sort: people inside now</option>
            <option value="today">Sort: visits · last 24h</option>
            <option value="week">Sort: visits · this week</option>
            <option value="month">Sort: visits · this month</option>
            <option value="trend">Sort: weekly change</option>
            <option value="rating">Sort: rating</option>
            <option value="name">Sort: name (A–Z)</option>
            <option value="district">Sort: district</option>
            <option value="capacity">Sort: capacity</option>
          </select>
          <button
            className="sort-dir-btn"
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
            title={sortDir === "asc" ? "Ascending" : "Descending"}
          >{sortDir === "asc" ? "↑" : "↓"}</button>
        </div>
      </div>
      <div className="list-scroll">
        <table className="facility-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("name")}>Name {arrow("name")}</th>
              <th onClick={() => toggleSort("district")}>District {arrow("district")}</th>
              <th onClick={() => toggleSort("current")}>People {arrow("current")}</th>
              <th onClick={() => toggleSort("occupancy")} className="bar-cell">Availability {arrow("occupancy")}</th>
              <th>Status</th>
              <th onClick={() => toggleSort("today")} style={{ textAlign: "right" }}>24h {arrow("today")}</th>
              <th onClick={() => toggleSort("week")} style={{ textAlign: "right" }}>Week {arrow("week")}</th>
              <th onClick={() => toggleSort("month")} style={{ textAlign: "right" }}>Month {arrow("month")}</th>
              <th onClick={() => toggleSort("trend")} style={{ textAlign: "right" }}>Trend {arrow("trend")}</th>
              <th>Last scan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(f => {
              const s = statusOf(f);
              const meta = STATUS[s];
              const pct = Math.round((f.current / f.capacity) * 100);
              const typeColor = TYPE_COLOR[f.type] || "#3b82f6";
              return (
                <tr
                  key={f.id}
                  ref={el => { if (el) rowRefs.current[f.id] = el; }}
                  className={selectedId === f.id ? "selected" : ""}
                  onClick={() => onSelect(f.id)}
                  onDoubleClick={() => onOpenDetail(f.id)}
                  title="Double-click for full history"
                >
                  <td>
                    <div className="td-name-wrap">
                      <div className="td-icon" style={{ background: typeColor + "22", color: typeColor }}>{f.typeIcon}</div>
                      <div>
                        <div className="td-name">{f.name}</div>
                        <div className="td-type">{f.typeName} · {f.subtype}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td-district">{f.district}</td>
                  <td className="td-mono">{f.current} / {f.capacity}</td>
                  <td className="bar-cell">
                    <div className="bar-wrap">
                      <div className="bar"><div className="bar-fill" style={{ width: pct + "%", background: meta.color }}/></div>
                      <span className="bar-val">{pct}%</span>
                    </div>
                  </td>
                  <td>
                    <span className="status-badge">
                      <span className="dot" style={{ background: meta.color }}/>{meta.label}
                    </span>
                  </td>
                  <td className="td-mono" style={{ textAlign: "right" }}>{f.todayEntries.toLocaleString()}</td>
                  <td className="td-mono" style={{ textAlign: "right" }}>{f.weekEntries.toLocaleString()}</td>
                  <td className="td-mono" style={{ textAlign: "right" }}>{f.monthEntries.toLocaleString()}</td>
                  <td style={{ textAlign: "right" }}>
                    <span className={`trend-pill ${f.trendPct >= 0 ? "up" : "down"}`}>
                      {f.trendPct >= 0 ? "▲" : "▼"} {Math.abs(f.trendPct)}%
                    </span>
                  </td>
                  <td className="td-muted">{f.lastScan}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan="10" style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No facilities match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------- Detail Modal (Analytics) ----------
function DetailModal({ facility, facilities, onClose }) {
  const [range, setRange] = useState("30d"); // 7d / 30d / 90d
  const [showForecast, setShowForecast] = useState(true);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  if (!facility) return null;
  const f = facility;
  const s = statusOf(f);
  const meta = STATUS[s];
  const pct = Math.round((f.current / f.capacity) * 100);
  const typeColor = TYPE_COLOR[f.type] || "#3b82f6";
  const nowHour = new Date().getHours();

  // Series slice by range
  const series = range === "7d" ? f.daily90.slice(-7)
                : range === "30d" ? f.daily90.slice(-30)
                : f.daily90;
  const rangeTotal = series.reduce((s2, v) => s2 + v, 0);
  const rangeAvg = Math.round(rangeTotal / series.length);
  const rangeMax = Math.max(...series);

  // Week-over-week growth (emerging trend indicator)
  const last7 = f.daily90.slice(-7).reduce((s2, v) => s2 + v, 0);
  const prev7 = f.daily90.slice(-14, -7).reduce((s2, v) => s2 + v, 0);
  const wowPct = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : 0;
  const last30 = f.daily90.slice(-30).reduce((s2, v) => s2 + v, 0);
  const prev30 = f.daily90.slice(-60, -30).reduce((s2, v) => s2 + v, 0);
  const momPct = prev30 > 0 ? Math.round(((last30 - prev30) / prev30) * 100) : 0;

  // Date labels (ending today)
  const aLen = series.length;
  const now = new Date();
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const makeXLabels = (len, fLen) => {
    const labels = [];
    for (let i = 0; i < len; i++) {
      const daysBack = len - 1 - i;
      const d = new Date(now); d.setDate(now.getDate() - daysBack);
      const show = len <= 14 ? true : (len <= 30 ? i % 5 === 0 || i === len - 1 : i % 15 === 0 || i === len - 1);
      labels.push(show ? `${d.getDate()} ${monthNames[d.getMonth()]}` : "");
    }
    for (let i = 0; i < fLen; i++) {
      const d = new Date(now); d.setDate(now.getDate() + i + 1);
      const show = fLen <= 14 ? (i === 0 || i === fLen - 1 || i === Math.floor(fLen / 2)) : false;
      labels.push(show ? `${d.getDate()} ${monthNames[d.getMonth()]}` : "");
    }
    return labels;
  };
  const fSeries = showForecast ? f.forecast14 : [];
  const combinedSeries = [...series, ...fSeries.map((v, i) => v)];
  const fPaddedForChart = showForecast && fSeries.length
    ? [...Array(aLen - 1).fill(null), series[aLen - 1], ...fSeries]
    : null;
  const xLabels = makeXLabels(aLen, showForecast ? fSeries.length : 0);
  const nowIdx = aLen - 1;

  // Peer comparison (same type) — use full pool (incl. self) for min/max so dots stay in range
  const peers = facilities.filter(p => p.type === f.type && p.id !== f.id);
  const peerPool = facilities.filter(p => p.type === f.type);
  const peerAvgUtil = Math.round(peerPool.reduce((s, p) => s + p.avgUtil, 0) / Math.max(peerPool.length, 1));
  const peerMinUtil = Math.min(...peerPool.map(p => p.avgUtil));
  const peerMaxUtil = Math.max(...peerPool.map(p => p.avgUtil));
  const peerAvgDwell = Math.round(peerPool.reduce((s, p) => s + p.avgDwellMin, 0) / Math.max(peerPool.length, 1));
  const peerMinDwell = Math.round(Math.min(...peerPool.map(p => p.avgDwellMin)));
  const peerMaxDwell = Math.round(Math.max(...peerPool.map(p => p.avgDwellMin)));

  // Rank for this facility among peers of same type
  const peerGrowths = peerPool.map(p => {
    const l7 = p.daily90.slice(-7).reduce((s2, v) => s2 + v, 0);
    const p7 = p.daily90.slice(-14, -7).reduce((s2, v) => s2 + v, 0);
    return p7 > 0 ? Math.round(((l7 - p7) / p7) * 100) : 0;
  });
  const peerAvgGrowth = Math.round(peerGrowths.reduce((s, v) => s + v, 0) / Math.max(peerGrowths.length, 1));
  const peerMinGrowth = Math.min(...peerGrowths);
  const peerMaxGrowth = Math.max(...peerGrowths);
  const ranked = [f, ...peers].sort((a, b) => b.monthEntries - a.monthEntries);
  const rank = ranked.findIndex(x => x.id === f.id) + 1;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-analytics" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Hero */}
        <div className="modal-hero" style={{ background: `linear-gradient(135deg, ${typeColor}18, ${typeColor}05)` }}>
          <div className="modal-hero-left">
            <div className="modal-type-chip" style={{ background: typeColor + "22", color: typeColor }}>
              <span style={{ fontSize: 18 }}>{f.typeIcon}</span>
              <span>{f.typeName}</span>
            </div>
            <h2 className="modal-title">{f.name}</h2>
            <div className="modal-sub">{f.subtype}</div>
            <div className="modal-meta-row">
              <span>📍 {f.address}</span><span>·</span><span>{f.district}</span>
              <span>·</span><span className="td-muted">ID {f.id}</span>
            </div>
            <div className="modal-meta-row">
              <span className="status-badge" style={{ background: meta.color + "18", color: meta.color }}>
                <span className="dot" style={{ background: meta.color }}/>{meta.label}
              </span>
              <span className="rating">★ {f.rating} <span style={{ color: "#9ca3af" }}>({f.reviews})</span></span>
              <span className="rank-pill">#{rank} of {peers.length + 1} {f.typeName.toLowerCase()}s by volume</span>
            </div>
          </div>
          <div className="modal-hero-right">
            <OccupancyGauge pct={pct} color={meta.color}/>
            <div className="gauge-caption">
              <div><strong>{f.current}</strong> / {f.capacity}</div>
              <div className="td-muted" style={{ fontSize: 12 }}>Live occupancy</div>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="kpi-strip">
          <KPI label="Entries today" value={f.todayEntries.toLocaleString()} sub={`${f.uniqueToday} unique visitors`} trend={f.trendPct} accent={typeColor}/>
          <KPI label="Avg time spent" value={`${Math.round(f.avgDwellMin)} min`} sub={`city avg ${peerAvgDwell} min`} accent="#8b5cf6"/>
          <KPI label="Avg fullness" value={`${f.avgUtil}%`} sub="last 7 days" accent="#f59e0b"/>
          <KPI label="Returning visitors" value={`${f.repeatRate}%`} sub="visited twice in 30 days" accent="#ec4899"/>
          <KPI label="This week vs last" value={`${wowPct >= 0 ? "+" : ""}${wowPct}%`} sub={`${last7.toLocaleString()} entries this week`} accent={wowPct >= 0 ? "#10b981" : "#ef4444"}/>
          <KPI label="Times near full" value={f.capacityBreaches30d} sub="days over 90% in last 30" accent={f.capacityBreaches30d > 5 ? "#ef4444" : "#9ca3af"}/>
        </div>

        {/* Range selector + time series */}
        <div className="chart-block">
          <div className="section-title">
            <span>Daily visits · {range === "7d" ? "last 7 days" : range === "30d" ? "last 30 days" : "last 90 days"}{showForecast ? " + 14-day forecast" : ""}</span>
            <div className="range-controls">
              <div className="range-tabs">
                {["7d", "30d", "90d"].map(r => (
                  <button key={r} className={range === r ? "on" : ""} onClick={() => setRange(r)}>{r}</button>
                ))}
              </div>
              <label className="forecast-toggle">
                <input type="checkbox" checked={showForecast} onChange={e => setShowForecast(e.target.checked)}/>
                Forecast
              </label>
            </div>
          </div>
          <TimeSeries
            series={[
              { name: "Daily entries", color: typeColor, data: [...series, ...(showForecast ? Array(fSeries.length).fill(null) : [])], fill: true, strokeWidth: 2 },
              ...(showForecast && fSeries.length ? [{ name: "Forecast", color: typeColor, data: [...Array(aLen - 1).fill(null), series[aLen - 1], ...fSeries], dashed: true }] : []),
            ]}
            w={720}
            h={220}
            yLabel="entries / day"
            xLabels={xLabels}
            nowIndex={showForecast && fSeries.length ? nowIdx : null}
            yFormat={v => Math.round(v).toLocaleString()}
          />
          <div className="chart-legend-row">
            <span>total <strong>{rangeTotal.toLocaleString()}</strong></span>
            <span>avg <strong>{rangeAvg.toLocaleString()}/day</strong></span>
            <span>peak <strong>{rangeMax.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Growth & utilization insight */}
        <div className="chart-block">
          <div className="section-title">
            <span>How usage is trending</span>
            <div className="money-summary">
              <span className={`money-chip ${wowPct >= 0 ? "profit" : "loss"}`}>
                This week {wowPct >= 0 ? "+" : ""}{wowPct}% · {last7.toLocaleString()} vs {prev7.toLocaleString()} last week
              </span>
              <span className={`money-chip ${momPct >= 0 ? "profit" : "loss"}`}>
                This month {momPct >= 0 ? "+" : ""}{momPct}% · {last30.toLocaleString()} vs {prev30.toLocaleString()} last month
              </span>
              <span className="money-chip" style={{ background: "#f3f4f6", color: "#374151" }}>
                {f.avgUtil}% avg fullness
              </span>
            </div>
          </div>
          <div className="insight-note">
            {(() => {
              if (wowPct > 15 && f.avgUtil > 80) return "🔥 Demand is surging and the facility is regularly full. Consider expanding hours.";
              if (wowPct > 15) return "📈 Visits are growing fast. Good time to promote this facility.";
              if (wowPct < -15 && f.avgUtil < 30) return "⚠️ Visits are dropping and the facility is mostly empty. Something may need attention.";
              if (wowPct < -10) return "📉 Visits are noticeably down this week.";
              if (f.avgUtil > 85) return "⚡ Almost always full. Room for another location or more hours.";
              if (f.avgUtil < 30) return "💤 Mostly empty. Worth reviewing schedule or programming.";
              return "✓ Usage is stable. Nothing urgent.";
            })()}
          </div>
        </div>

        {/* 3-column analytics grid */}
        <div className="analytics-grid">
          {/* Entry method donut */}
          <div className="analytics-card">
            <div className="section-title">How people check in <span className="section-sub">last 30 days</span></div>
            <div className="donut-row">
              <Donut slices={[
                { value: f.entryMethod.qr,   color: "#3b82f6" },
                { value: f.entryMethod.nfc,  color: "#10b981" },
                { value: f.entryMethod.card, color: "#f59e0b" },
              ]}/>
              <Legend items={[
                { label: "QR code",  value: f.entryMethod.qr,   color: "#3b82f6" },
                { label: "NFC tap",  value: f.entryMethod.nfc,  color: "#10b981" },
                { label: "Card",     value: f.entryMethod.card, color: "#f59e0b" },
              ]}/>
            </div>
          </div>

          {/* Membership mix donut */}
          <div className="analytics-card">
            <div className="section-title">Visitor type <span className="section-sub">last 30 days</span></div>
            <div className="donut-row">
              <Donut slices={[
                { value: f.memberMix.member,  color: "#8b5cf6" },
                { value: f.memberMix.daypass, color: "#06b6d4" },
                { value: f.memberMix.walkin,  color: "#f97316" },
              ]}/>
              <Legend items={[
                { label: "Members",  value: f.memberMix.member,  color: "#8b5cf6" },
                { label: "Day pass", value: f.memberMix.daypass, color: "#06b6d4" },
                { label: "Walk-in",  value: f.memberMix.walkin,  color: "#f97316" },
              ]}/>
            </div>
          </div>

          {/* Age demographics */}
          <div className="analytics-card">
            <div className="section-title">Age groups <span className="section-sub">anonymous</span></div>
            <HBars data={f.ageBuckets} color={typeColor}/>
            <div className="gender-row">
              <span>♂ {f.gender.m}%</span>
              <div className="gender-bar">
                <div style={{ width: f.gender.m + "%", background: "#3b82f6" }}/>
                <div style={{ width: f.gender.f + "%", background: "#ec4899" }}/>
              </div>
              <span>{f.gender.f}% ♀</span>
            </div>
          </div>

          {/* Dwell histogram */}
          <div className="analytics-card">
            <div className="section-title">
              How long people stay
              <span className="section-sub">avg {Math.round(f.avgDwellMin)} min</span>
            </div>
            <HBars data={f.dwellBuckets} color="#8b5cf6"/>
          </div>

          {/* Today hourly bars */}
          <div className="analytics-card wide">
            <div className="section-title">
              Today · people by hour
              <span className="section-sub">busiest {Math.max(...f.history)} at {String(f.history.indexOf(Math.max(...f.history))).padStart(2,"0")}:00 · now {f.history[nowHour]}</span>
            </div>
            <HourlyBars data={f.history} color={typeColor} nowHour={nowHour} w={500} h={110}/>
          </div>

          {/* Weekly heatmap */}
          <div className="analytics-card wide">
            <div className="section-title">
              Typical week
              <span className="section-sub">busiest at {String(f.peakHour).padStart(2,"0")}:00</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <WeeklyHeatmap weekly={f.weekly} peakHour={f.peakHour}/>
            </div>
          </div>
        </div>

        {/* Compared to similar facilities */}
        <div className="chart-block">
          <div className="section-title">
            Compared to similar facilities
            <span className="section-sub">vs {peers.length} other {f.typeName.toLowerCase()}s in Vilnius</span>
          </div>
          <div className="peer-grid">
            <PeerStrip label="Fullness (7-day avg)" value={f.avgUtil} peerMin={peerMinUtil} peerAvg={peerAvgUtil} peerMax={peerMaxUtil} suffix="%"/>
            <PeerStrip label="Avg time spent" value={Math.round(f.avgDwellMin)} peerMin={peerMinDwell} peerAvg={peerAvgDwell} peerMax={peerMaxDwell} suffix=" min"/>
            <PeerStrip label="Weekly change" value={wowPct} peerMin={peerMinGrowth} peerAvg={peerAvgGrowth} peerMax={peerMaxGrowth} suffix="%"/>
          </div>
        </div>

        {/* Ops / info footer */}
        <div className="modal-grid">
          <div className="modal-info">
            <div className="info-row"><span className="k">Hours</span><span className="v">{f.hours}</span></div>
            <div className="info-row"><span className="k">Pricing</span><span className="v">{f.price}</span></div>
            <div className="info-row"><span className="k">Phone</span><span className="v">{f.phone}</span></div>
            <div className="info-row"><span className="k">Website</span><span className="v">{f.website}</span></div>
            <div className="info-row"><span className="k">Staff on duty</span><span className="v">{f.staffOnDuty}</span></div>
            <div className="info-row"><span className="k">Last scan</span><span className="v">{f.lastScan}</span></div>
          </div>
          <div className="modal-amenities">
            <div className="section-title">Amenities</div>
            {f.amenities.length === 0 ? (
              <div className="td-muted">No amenities listed</div>
            ) : (
              <div className="amenity-grid">
                {f.amenities.map(a => {
                  const m2 = AMENITY_META[a];
                  if (!m2) return null;
                  return (
                    <div key={a} className="amenity-chip"><span>{m2.icon}</span><span>{m2.label}</span></div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Header ----------
function Header({ facilities, heatmapOn, setHeatmapOn, heatMetric, setHeatMetric, onOpenOverview }) {
  const stats = useMemo(() => {
    const open = facilities.filter(f => !f.isClosed);
    const total = open.reduce((s, f) => s + f.current, 0);
    const cap = open.reduce((s, f) => s + f.capacity, 0);
    const full = open.filter(f => statusOf(f) === "full").length;
    return { total, cap, full, open: open.length, all: facilities.length };
  }, [facilities]);

  return (
    <header className="header">
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <h1>Sport Facilities · Vilnius</h1>
        <span className="sub">Live occupancy dashboard</span>
      </div>
      <div className="header-stats">
        <div><strong>{stats.total}</strong> / {stats.cap} people inside</div>
        <div><strong>{stats.open}</strong> / {stats.all} open</div>
        <div><strong>{stats.full}</strong> full</div>
        <div className="heatmap-group">
          <button
            className={`heatmap-toggle ${heatmapOn ? "on" : ""}`}
            onClick={() => setHeatmapOn(v => !v)}
            title="Toggle heatmap overlay"
          >
            <span className="heat-dot"/> Heatmap {heatmapOn ? "on" : "off"}
          </button>
          {heatmapOn && (
            <select
              className="heat-metric"
              value={heatMetric}
              onChange={e => setHeatMetric(e.target.value)}
              title="Heatmap metric"
            >
              <option value="live">Live · how full right now</option>
              <option value="pctfull">% full (simple)</option>
              <option value="util7d">Avg fullness · last 7 days</option>
              <option value="24h">Visits · last 24h</option>
              <option value="week">Visits · this week</option>
              <option value="month">Visits · this month</option>
            </select>
          )}
          {heatmapOn && (
            <div className="heat-legend" title="Heat intensity scale">
              <span className="heat-legend-label">cold</span>
              <div className="heat-legend-bar"/>
              <span className="heat-legend-label">hot</span>
            </div>
          )}
        </div>
        <button className="overview-btn" onClick={onOpenOverview} title="City-wide analytics overview">
          <span className="ov-dot"/> Overview
        </button>
      </div>
    </header>
  );
}

// ---------- Overview (city-wide analytics) Modal ----------
function OverviewModal({ facilities, onClose, onOpenFacility }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const stats = useMemo(() => {
    const open = facilities.filter(f => !f.isClosed);
    const totalInside = open.reduce((s, f) => s + f.current, 0);
    const totalCap = open.reduce((s, f) => s + f.capacity, 0);
    const entriesToday = facilities.reduce((s, f) => s + (f.todayEntries || 0), 0);
    const entriesWeek = facilities.reduce((s, f) => s + (f.weekEntries || 0), 0);
    const entriesMonth = facilities.reduce((s, f) => s + (f.monthEntries || 0), 0);
    // Aggregate daily entries series (30 days) + growth series (60 days for WoW/MoM trend view)
    const dailyEntries30 = Array(30).fill(0);
    const dailyEntries60 = Array(60).fill(0);
    facilities.forEach(f => {
      if (f.daily90) {
        f.daily90.slice(-30).forEach((v, i) => { dailyEntries30[i] += v; });
        f.daily90.slice(-60).forEach((v, i) => { dailyEntries60[i] += v; });
      }
    });
    // City-wide WoW / MoM growth
    const city_last7 = dailyEntries60.slice(-7).reduce((s, v) => s + v, 0);
    const city_prev7 = dailyEntries60.slice(-14, -7).reduce((s, v) => s + v, 0);
    const cityWoW = city_prev7 > 0 ? Math.round(((city_last7 - city_prev7) / city_prev7) * 100) : 0;
    const city_last30 = dailyEntries60.slice(-30).reduce((s, v) => s + v, 0);
    const city_prev30 = dailyEntries60.slice(-60, -30).reduce((s, v) => s + v, 0);
    const cityMoM = city_prev30 > 0 ? Math.round(((city_last30 - city_prev30) / city_prev30) * 100) : 0;

    // Per-facility growth (week-over-week entries)
    const facilityGrowth = facilities.map(f => {
      const l7 = (f.daily90 || []).slice(-7).reduce((s, v) => s + v, 0);
      const p7 = (f.daily90 || []).slice(-14, -7).reduce((s, v) => s + v, 0);
      const wow = p7 > 0 ? Math.round(((l7 - p7) / p7) * 100) : 0;
      const l30 = (f.daily90 || []).slice(-30).reduce((s, v) => s + v, 0);
      const p30 = (f.daily90 || []).slice(-60, -30).reduce((s, v) => s + v, 0);
      const mom = p30 > 0 ? Math.round(((l30 - p30) / p30) * 100) : 0;
      return { f, wow, mom, last7: l7, avgUtil: f.avgUtil };
    });
    const growing = [...facilityGrowth].sort((a, b) => b.wow - a.wow).slice(0, 6);
    const declining = [...facilityGrowth].sort((a, b) => a.wow - b.wow).slice(0, 6);
    const pressured = [...facilityGrowth].filter(g => g.avgUtil >= 80).sort((a, b) => b.avgUtil - a.avgUtil).slice(0, 6);
    const underused = [...facilityGrowth].filter(g => g.avgUtil < 40).sort((a, b) => a.avgUtil - b.avgUtil).slice(0, 6);

    const uniqueToday = facilities.reduce((s, f) => s + (f.uniqueToday || 0), 0);
    const avgUtil = Math.round(facilities.reduce((s, f) => s + (f.avgUtil || 0), 0) / Math.max(facilities.length, 1));
    const avgDwell = Math.round(facilities.reduce((s, f) => s + (f.avgDwellMin || 0), 0) / Math.max(facilities.length, 1));
    const avgNps = Math.round(facilities.reduce((s, f) => s + (f.nps || 0), 0) / Math.max(facilities.length, 1));
    const incidents = facilities.reduce((s, f) => s + (f.incidents7d || 0), 0);
    const staff = facilities.reduce((s, f) => s + (f.staffOnDuty || 0), 0);
    const avgTrend = Math.round(facilities.reduce((s, f) => s + (f.trendPct || 0), 0) / Math.max(facilities.length, 1));

    // Most popular sports (by entries this week)
    const byType = {};
    facilities.forEach(f => {
      if (!byType[f.type]) byType[f.type] = { type: f.type, name: f.typeName, icon: f.typeIcon, entries: 0, entriesPrev: 0, count: 0, current: 0, capacity: 0, utilSum: 0 };
      byType[f.type].entries += f.weekEntries || 0;
      byType[f.type].entriesPrev += (f.daily90 || []).slice(-14, -7).reduce((s, v) => s + v, 0);
      byType[f.type].count += 1;
      byType[f.type].current += f.current;
      byType[f.type].capacity += f.capacity;
      byType[f.type].utilSum += f.avgUtil || 0;
    });
    Object.values(byType).forEach(t => {
      t.wow = t.entriesPrev > 0 ? Math.round(((t.entries - t.entriesPrev) / t.entriesPrev) * 100) : 0;
      t.avgUtil = Math.round(t.utilSum / Math.max(t.count, 1));
    });
    const sports = Object.values(byType).sort((a, b) => b.entries - a.entries);
    const topEntries = sports[0]?.entries || 1;

    // City-wide hourly (sum weekly rows → avg hour across week, weighted by capacity)
    const hours = Array(24).fill(0);
    facilities.forEach(f => {
      if (!f.weekly) return;
      f.weekly.forEach(row => row.forEach((v, h) => { hours[h] += v * f.capacity; }));
    });
    const hoursMax = Math.max(...hours, 1);
    const hoursNorm = hours.map(v => v / hoursMax);
    let peakHour = 0; hours.forEach((v, h) => { if (v > hours[peakHour]) peakHour = h; });

    // By district
    const byDist = {};
    facilities.forEach(f => {
      const k = f.district;
      if (!byDist[k]) byDist[k] = { name: k, entries: 0, count: 0, current: 0, capacity: 0 };
      byDist[k].entries += f.weekEntries || 0;
      byDist[k].count += 1;
      byDist[k].current += f.current;
      byDist[k].capacity += f.capacity;
    });
    const districts = Object.values(byDist).sort((a, b) => b.entries - a.entries);
    const distMax = districts[0]?.entries || 1;

    // Entry method (aggregated)
    const methods = { card: 0, qr: 0, nfc: 0 };
    facilities.forEach(f => {
      if (!f.entryMethod) return;
      Object.keys(methods).forEach(k => { methods[k] += f.entryMethod[k] || 0; });
    });
    const methodTotal = methods.card + methods.qr + methods.nfc || 1;

    // Records
    const busiest = [...facilities].sort((a, b) => b.weekEntries - a.weekEntries)[0];
    const highestRated = [...facilities].sort((a, b) => b.rating - a.rating)[0];
    const mostFull = [...facilities].filter(f => !f.isClosed).sort((a, b) => (b.current / b.capacity) - (a.current / a.capacity))[0];
    const fastestGrowing = [...facilities].sort((a, b) => b.trendPct - a.trendPct)[0];
    const longestDwell = [...facilities].sort((a, b) => b.avgDwellMin - a.avgDwellMin)[0];

    return {
      totalInside, totalCap, entriesToday, entriesWeek, entriesMonth,
      dailyEntries30, cityWoW, cityMoM, city_last7, city_prev7, city_last30, city_prev30,
      growing, declining, pressured, underused,
      uniqueToday, avgUtil, avgDwell, avgNps, incidents, staff, avgTrend,
      sports, topEntries, hoursNorm, peakHour,
      districts, distMax, methods, methodTotal,
      busiest, highestRated, mostFull, fastestGrowing, longestDwell,
    };
  }, [facilities]);

  const typeColor = (id) => {
    const m = { pool: "#06b6d4", gym: "#ef4444", basketball: "#f97316", tennis: "#84cc16", football: "#10b981", ice: "#3b82f6", climbing: "#a855f7", sauna: "#f43f5e", track: "#eab308" };
    return m[id] || "#6b7280";
  };

  const fmtMoney = (n) => "€" + n.toLocaleString("en-US");
  const fmtNum = (n) => n.toLocaleString("en-US");
  const hourHue = (v) => {
    // 0 cold blue → 0.5 amber → 1 red
    if (v < 0.25) return `rgba(59, 130, 246, ${0.15 + v * 2})`;
    if (v < 0.6) return `rgba(245, 158, 11, ${0.3 + v * 0.7})`;
    return `rgba(239, 68, 68, ${0.5 + v * 0.5})`;
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal overview-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="ov-hero">
          <div>
            <h2>City Overview · Vilnius</h2>
            <div className="ov-sub">Aggregate analytics across {facilities.length} facilities · data window: last 30 days</div>
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "right", paddingTop: 6 }}>
            <div>Live · updated just now</div>
            <div>Powered by Pulse Analytics</div>
          </div>
        </div>

        <div className="ov-kpis">
          <div className="ov-kpi">
            <div className="k">People inside now</div>
            <div className="v">{fmtNum(stats.totalInside)}</div>
            <div className="d">of {fmtNum(stats.totalCap)} capacity · {Math.round(stats.totalInside / stats.totalCap * 100)}%</div>
          </div>
          <div className="ov-kpi">
            <div className="k">Entries today</div>
            <div className="v">{fmtNum(stats.entriesToday)}</div>
            <div className={`d ${stats.avgTrend >= 0 ? "up" : "down"}`}>{stats.avgTrend >= 0 ? "▲" : "▼"} {Math.abs(stats.avgTrend)}% vs last week</div>
          </div>
          <div className="ov-kpi">
            <div className="k">This week vs last</div>
            <div className="v" style={{ color: stats.cityWoW >= 0 ? "#15803d" : "#b91c1c" }}>{stats.cityWoW >= 0 ? "+" : ""}{stats.cityWoW}%</div>
            <div className="d">{fmtNum(stats.city_last7)} vs {fmtNum(stats.city_prev7)} entries</div>
          </div>
          <div className="ov-kpi">
            <div className="k">This month vs last</div>
            <div className="v" style={{ color: stats.cityMoM >= 0 ? "#15803d" : "#b91c1c" }}>{stats.cityMoM >= 0 ? "+" : ""}{stats.cityMoM}%</div>
            <div className="d">{fmtNum(stats.city_last30)} vs {fmtNum(stats.city_prev30)} entries</div>
          </div>
          <div className="ov-kpi">
            <div className="k">Avg utilization</div>
            <div className="v">{stats.avgUtil}%</div>
            <div className="d">avg dwell {stats.avgDwell} min</div>
          </div>
        </div>

        <div className="ov-grid">
          {/* Emerging Usage Trends (full width) */}
          <div className="ov-card ov-full-row">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h3>Emerging usage trends</h3>
                <div className="ov-card-sub">City-wide entries · last 30 days vs prior 30 days</div>
              </div>
              <div className="money-summary">
                <span className={`money-chip ${stats.cityWoW >= 0 ? "profit" : "loss"}`}>This week {stats.cityWoW >= 0 ? "+" : ""}{stats.cityWoW}%</span>
                <span className={`money-chip ${stats.cityMoM >= 0 ? "profit" : "loss"}`}>This month {stats.cityMoM >= 0 ? "+" : ""}{stats.cityMoM}%</span>
                <span className="money-chip" style={{ background: "#f3f4f6", color: "#374151" }}>{fmtNum(stats.entriesMonth)} entries 30d</span>
              </div>
            </div>
            <TimeSeries
              series={[
                { name: "Daily entries", color: "#3b82f6", data: stats.dailyEntries30, fill: true, strokeWidth: 2 },
              ]}
              w={860}
              h={200}
              yLabel="entries / day"
              xLabels={(() => {
                const labels = []; const now = new Date();
                const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                for (let i = 0; i < 30; i++) {
                  const d = new Date(now); d.setDate(now.getDate() - (29 - i));
                  labels.push(i % 5 === 0 || i === 29 ? `${d.getDate()} ${monthNames[d.getMonth()]}` : "");
                }
                return labels;
              })()}
              yFormat={v => Math.round(v).toLocaleString()}
            />
            <div className="trend-lists">
              <div className="trend-list">
                <div className="trend-list-title" style={{ color: "#15803d" }}>📈 Growing fastest</div>
                <div className="trend-list-sub">Biggest jump in visits this week</div>
                {stats.growing.map(g => (
                  <div key={g.f.id} className="trend-row" onClick={() => onOpenFacility(g.f.id)}>
                    <div className="trend-icon">{g.f.typeIcon}</div>
                    <div className="trend-body">
                      <div className="trend-name">{g.f.name}</div>
                      <div className="trend-meta">{g.f.typeName} · {g.f.district} · {g.avgUtil}% full</div>
                    </div>
                    <div className="trend-delta up">+{g.wow}%</div>
                  </div>
                ))}
              </div>
              <div className="trend-list">
                <div className="trend-list-title" style={{ color: "#b91c1c" }}>📉 Declining</div>
                <div className="trend-list-sub">Steepest drop in visits this week</div>
                {stats.declining.map(g => (
                  <div key={g.f.id} className="trend-row" onClick={() => onOpenFacility(g.f.id)}>
                    <div className="trend-icon">{g.f.typeIcon}</div>
                    <div className="trend-body">
                      <div className="trend-name">{g.f.name}</div>
                      <div className="trend-meta">{g.f.typeName} · {g.f.district} · {g.avgUtil}% full</div>
                    </div>
                    <div className="trend-delta down">{g.wow}%</div>
                  </div>
                ))}
              </div>
              <div className="trend-list">
                <div className="trend-list-title" style={{ color: "#c2410c" }}>⚡ Often full</div>
                <div className="trend-list-sub">Regularly above 80% capacity</div>
                {stats.pressured.length === 0 ? (
                  <div className="trend-empty">No facilities under capacity pressure</div>
                ) : stats.pressured.map(g => (
                  <div key={g.f.id} className="trend-row" onClick={() => onOpenFacility(g.f.id)}>
                    <div className="trend-icon">{g.f.typeIcon}</div>
                    <div className="trend-body">
                      <div className="trend-name">{g.f.name}</div>
                      <div className="trend-meta">{g.f.typeName} · {g.f.district} · busiest {String(g.f.peakHour || 18).padStart(2, "0")}:00</div>
                    </div>
                    <div className="trend-delta up">{g.avgUtil}%</div>
                  </div>
                ))}
              </div>
              <div className="trend-list">
                <div className="trend-list-title" style={{ color: "#0369a1" }}>💤 Quiet</div>
                <div className="trend-list-sub">Below 40% capacity most days</div>
                {stats.underused.length === 0 ? (
                  <div className="trend-empty">No quiet facilities</div>
                ) : stats.underused.map(g => (
                  <div key={g.f.id} className="trend-row" onClick={() => onOpenFacility(g.f.id)}>
                    <div className="trend-icon">{g.f.typeIcon}</div>
                    <div className="trend-body">
                      <div className="trend-name">{g.f.name}</div>
                      <div className="trend-meta">{g.f.typeName} · {g.f.district} · {g.wow >= 0 ? "+" : ""}{g.wow}% this week</div>
                    </div>
                    <div className="trend-delta" style={{ color: "#0369a1" }}>{g.avgUtil}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sports trend — which sport types are emerging */}
          <div className="ov-card">
            <h3>Sport types · trend</h3>
            <div className="ov-card-sub">Entries this week · WoW change · click to drill down</div>
            {stats.sports.map(s => (
              <div key={s.type} className="ov-sport-row">
                <div className="ov-icon">{s.icon}</div>
                <div>
                  <div className="ov-name">{s.name}</div>
                  <div className="ov-meta">{s.count} {s.count === 1 ? "facility" : "facilities"} · {fmtNum(s.entries)} entries · {s.avgUtil}% util</div>
                  <div className="ov-bar-wrap">
                    <div className="ov-bar-fill" style={{ width: `${(s.entries / stats.topEntries) * 100}%`, background: typeColor(s.type) }}/>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums", paddingLeft: 8, color: s.wow >= 0 ? "#15803d" : "#b91c1c" }}>
                  {s.wow >= 0 ? "+" : ""}{s.wow}%
                </div>
              </div>
            ))}
          </div>

          {/* Records & highlights */}
          <div className="ov-card">
            <h3>Records & highlights</h3>
            <div className="ov-card-sub">Top performers across the city</div>
            {[
              { icon: "🔥", tint: "#fee2e2", title: "Busiest this week", f: stats.busiest, ctx: `${fmtNum(stats.busiest?.weekEntries || 0)} entries` },
              { icon: "⭐", tint: "#fef3c7", title: "Highest rated", f: stats.highestRated, ctx: `${stats.highestRated?.rating} ★ · ${fmtNum(stats.highestRated?.reviews || 0)} reviews` },
              { icon: "📈", tint: "#dbeafe", title: "Fastest growing", f: stats.fastestGrowing, ctx: `+${stats.fastestGrowing?.trendPct}% vs last week` },
              { icon: "⏱", tint: "#ede9fe", title: "Longest avg stay", f: stats.longestDwell, ctx: `${Math.round(stats.longestDwell?.avgDwellMin || 0)} min avg dwell` },
              { icon: "🧍", tint: "#fce7f3", title: "Most packed right now", f: stats.mostFull, ctx: stats.mostFull ? `${stats.mostFull.current}/${stats.mostFull.capacity} · ${Math.round(stats.mostFull.current / stats.mostFull.capacity * 100)}% full` : "—" },
            ].map((r, i) => r.f && (
              <div key={i} className="ov-record" onClick={() => onOpenFacility(r.f.id)} style={{ cursor: "pointer" }} title="Click to see full analytics">
                <div className="ov-rec-icon" style={{ background: r.tint }}>{r.icon}</div>
                <div className="ov-rec-body">
                  <div className="ov-rec-title">{r.title}</div>
                  <div className="ov-rec-value" title={r.f.name}>{r.f.name}</div>
                  <div className="ov-rec-ctx">{r.ctx} · {r.f.district}</div>
                </div>
              </div>
            ))}
          </div>

          {/* City activity by hour */}
          <div className="ov-card ov-full-row">
            <h3>City-wide activity by hour</h3>
            <div className="ov-card-sub">All facilities combined · peak at {String(stats.peakHour).padStart(2, "0")}:00</div>
            <div className="ov-hours">
              {stats.hoursNorm.map((v, h) => (
                <div key={h} className="ov-hour" style={{ background: hourHue(v), height: 8 + v * 32 }} title={`${String(h).padStart(2, "0")}:00 · ${Math.round(v * 100)}% of peak`}/>
              ))}
            </div>
            <div className="ov-hour-labels">
              {Array.from({ length: 24 }, (_, h) => <div key={h}>{h % 3 === 0 ? String(h).padStart(2, "0") : ""}</div>)}
            </div>
          </div>

          {/* Districts */}
          <div className="ov-card">
            <h3>Top districts by activity</h3>
            <div className="ov-card-sub">Weekly entries · {stats.districts.length} districts</div>
            {stats.districts.slice(0, 8).map(d => (
              <div key={d.name} className="ov-district-row">
                <div className="ov-d-name">{d.name}</div>
                <div className="ov-d-bar"><div className="ov-d-bar-fill" style={{ width: `${(d.entries / stats.distMax) * 100}%` }}/></div>
                <div className="ov-d-meta">{fmtNum(d.entries)}</div>
              </div>
            ))}
          </div>

          {/* Entry methods */}
          <div className="ov-card">
            <h3>Entry methods</h3>
            <div className="ov-card-sub">How visitors check in across the network</div>
            <div className="ov-method-grid">
              {[
                { key: "card", label: "Entry card", color: "#3b82f6" },
                { key: "qr", label: "QR code", color: "#10b981" },
                { key: "nfc", label: "NFC / mobile", color: "#a855f7" },
              ].map(m => {
                const pct = Math.round(stats.methods[m.key] / stats.methodTotal * 100);
                return (
                  <div key={m.key} className="ov-method">
                    <div className="ov-m-label">{m.label}</div>
                    <div className="ov-m-value">{pct}%</div>
                    <div className="ov-m-pct">{fmtNum(Math.round(stats.methods[m.key] * stats.entriesMonth / stats.methodTotal / 100) * 100)} of {fmtNum(stats.entriesMonth)} entries</div>
                    <div className="ov-m-bar"><div className="ov-m-fill" style={{ width: `${pct}%`, background: m.color }}/></div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16, paddingTop: 14, borderTop: "1px dashed #f3f4f6" }}>
              <div><div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Unique visitors today</div><div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginTop: 2 }}>{fmtNum(stats.uniqueToday)}</div></div>
              <div><div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Avg fullness</div><div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginTop: 2 }}>{stats.avgUtil}%</div></div>
              <div><div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Staff on duty</div><div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginTop: 2 }}>{fmtNum(stats.staff)}</div></div>
              <div><div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Avg time spent</div><div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginTop: 2 }}>{stats.avgDwell} min</div></div>
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 28px 22px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#9ca3af" }}>
          <div>Click any record card to drill into that facility's analytics</div>
          <button className="overview-btn" onClick={onClose} style={{ background: "#fff", color: "#111827", border: "1px solid #d1d5db" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ---------- App ----------
function App() {
  const [facilities, setFacilities] = useState(() => FACILITIES.slice());
  const [selectedId, setSelectedId] = useState(null);
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const [detailId, setDetailId] = useState(null);
  // Lifted filter state — shared between map + list
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [heatmapOn, setHeatmapOn] = useState(false);
  const [heatMetric, setHeatMetric] = useState("live");
  const [overviewOpen, setOverviewOpen] = useState(false);

  const handleSelect = useCallback((id, opts = {}) => {
    setSelectedId(id);
    if (opts.fromMap) setScrollTrigger(t => t + 1);
  }, []);

  // Gentle live tick
  useEffect(() => {
    const iv = setInterval(() => {
      setFacilities(prev => {
        const next = prev.slice();
        const i = Math.floor(Math.random() * next.length);
        const f = { ...next[i] };
        if (f.isClosed) return next;
        const delta = Math.random() < 0.55 ? 1 : -1;
        f.current = Math.max(0, Math.min(f.capacity, f.current + delta));
        f.lastScan = "just now";
        next[i] = f;
        return next;
      });
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  const detailFacility = detailId ? facilities.find(f => f.id === detailId) : null;

  // Filtered facility list — shared by map + table
  const filteredFacilities = useMemo(() => {
    let list = facilities;
    if (q) {
      const s = q.toLowerCase();
      list = list.filter(f => f.name.toLowerCase().includes(s) || f.district.toLowerCase().includes(s) || f.typeName.toLowerCase().includes(s));
    }
    if (typeFilter) list = list.filter(f => f.type === typeFilter);
    if (statusFilter) list = list.filter(f => statusOf(f) === statusFilter);
    return list;
  }, [facilities, q, typeFilter, statusFilter]);

  return (
    <div className="app">
      <Header facilities={facilities} heatmapOn={heatmapOn} setHeatmapOn={setHeatmapOn} heatMetric={heatMetric} setHeatMetric={setHeatMetric} onOpenOverview={() => setOverviewOpen(true)}/>
      <div className="map-section">
        <FacilityMap
          facilities={filteredFacilities}
          allFacilities={facilities}
          selectedId={selectedId}
          onSelect={handleSelect}
          heatmapOn={heatmapOn}
          heatMetric={heatMetric}
        />
      </div>
      <FacilityTable
        facilities={filteredFacilities}
        allCount={facilities.length}
        selectedId={selectedId}
        onSelect={handleSelect}
        onOpenDetail={setDetailId}
        scrollTrigger={scrollTrigger}
        q={q} setQ={setQ}
        typeFilter={typeFilter} setTypeFilter={setTypeFilter}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
      />
      <div className="footer-note">
        {filteredFacilities.length} of {facilities.length} facilities shown · data updates every 3s · click a pin to jump to its row · double-click a row for full history · Vilnius, LT
      </div>
      {detailFacility && <DetailModal facility={detailFacility} facilities={facilities} onClose={() => setDetailId(null)}/>}
      {overviewOpen && <OverviewModal facilities={facilities} onClose={() => setOverviewOpen(false)} onOpenFacility={(id) => { setOverviewOpen(false); setQ(""); setTypeFilter(""); setStatusFilter(""); setDetailId(id); }}/>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
