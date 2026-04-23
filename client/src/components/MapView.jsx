import { MapContainer, TileLayer, Marker, Tooltip, Popup, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function createPinIcon() {
  return new L.DivIcon({
    className: 'map-pin-pulse',
    html: `<div style="
      width:18px;height:18px;border-radius:50%;
      background:linear-gradient(135deg,#ff6b6b,#ee5a24);
      border:3px solid white;
      box-shadow:0 3px 12px rgba(238,90,36,0.55), 0 1px 4px rgba(0,0,0,0.25);
      cursor:pointer;
      position:relative;
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    tooltipAnchor: [0, -12],
  })
}

function createStackIcon(count) {
  return new L.DivIcon({
    className: '',
    html: `
      <div style="position:relative;width:36px;height:36px;cursor:pointer;">
        <div style="
          width:22px;height:22px;border-radius:50%;
          background:linear-gradient(135deg,#ff6b6b,#ee5a24);
          border:3px solid white;
          box-shadow:0 3px 12px rgba(238,90,36,0.5), 0 1px 4px rgba(0,0,0,0.2);
          position:absolute;bottom:0;left:0;
        "></div>
        <div style="
          position:absolute;top:0;right:0;
          background:linear-gradient(135deg,#4f46e5,#7c3aed);
          color:white;
          border-radius:50%;width:20px;height:20px;
          font-size:9px;font-weight:800;
          display:flex;align-items:center;justify-content:center;
          border:2px solid white;
          box-shadow:0 2px 8px rgba(79,70,229,0.5);
          font-family:system-ui,sans-serif;
          letter-spacing:-0.5px;
        ">${count}</div>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [11, 22],
    popupAnchor: [7, -22],
  })
}

const PIN_ICON = createPinIcon()

// Group points that share the exact same coordinates
function groupPoints(points) {
  const map = {}
  for (const point of points) {
    const key = `${point.lat},${point.lng}`
    if (!map[key]) map[key] = []
    map[key].push(point)
  }
  return Object.values(map)
}

// Single marker — hover tooltip, click opens modal
function SingleMarker({ point, onPointClick }) {
  const map = useMap()
  return (
    <Marker
      position={[point.lat, point.lng]}
      icon={PIN_ICON}
      eventHandlers={{
        click: () => onPointClick(point),
        mouseover: () => map.closePopup(), // close any open stack-popup on hover
      }}
    >
      <Tooltip direction="top" offset={[0, -6]} opacity={1}>
        <div style={{
          background: 'white', borderRadius: 10, overflow: 'hidden',
          width: 190, boxShadow: '0 6px 24px rgba(0,0,0,0.15)', pointerEvents: 'none',
        }}>
          {point.thumbnail ? (
            <div style={{ background: '#f3f4f6', display: 'flex', justifyContent: 'center', alignItems: 'center', maxHeight: 130, overflow: 'hidden' }}>
              <img
                src={point.thumbnail.url || `/uploads/${point.thumbnail.filename}`}
                alt={point.title}
                style={{ width: '100%', height: 'auto', maxHeight: 130, objectFit: 'contain', display: 'block' }}
              />
            </div>
          ) : (
            <div style={{ width: '100%', height: 80, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
              📍
            </div>
          )}
          <div style={{ padding: '10px 13px 12px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111', marginBottom: 3 }}>{point.title}</div>
            <div style={{ color: '#6b7280', fontSize: '0.78rem' }}>{point.short_text}</div>
            <div style={{ color: '#c4c4c4', fontSize: '0.7rem', marginTop: 5 }}>Click to read more →</div>
          </div>
        </div>
      </Tooltip>
    </Marker>
  )
}

// Stacked marker — click opens a popup listing all experiences, pick one to open modal
function StackedMarker({ group, onPointClick }) {
  const map = useMap()
  const icon = createStackIcon(group.length)
  const [first] = group

  function handleSelect(point) {
    map.closePopup()
    onPointClick(point)
  }

  return (
    <Marker position={[first.lat, first.lng]} icon={icon}>
      <Popup className="stack-popup" maxWidth={260} minWidth={220}>
        <div>
          <div style={{
            padding: '10px 14px 8px',
            fontSize: '0.7rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            color: '#9ca3af', borderBottom: '1px solid #f3f4f6',
          }}>
            {group.length} experiences at this location
          </div>
          {group.map((point, i) => (
            <div
              key={point.id}
              onClick={() => handleSelect(point)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                cursor: 'pointer',
                borderTop: i > 0 ? '1px solid #f3f4f6' : 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 7, overflow: 'hidden',
                background: '#f3f4f6', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {point.thumbnail ? (
                  <img
                    src={point.thumbnail.url || `/uploads/${point.thumbnail.filename}`}
                    alt={point.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ fontSize: '1.2rem' }}>📍</span>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111', marginBottom: 2 }}>{point.title}</div>
                <div style={{ color: '#6b7280', fontSize: '0.76rem' }}>{point.short_text}</div>
              </div>
            </div>
          ))}
        </div>
      </Popup>
    </Marker>
  )
}

export default function MapView({ points, onPointClick }) {
  const groups = groupPoints(points)

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxBounds={[[-90, -180], [90, 180]]}
      maxBoundsViscosity={0.8}
      zoomControl={false}
      style={{ height: '100vh', width: '100vw' }}
    >
      {/* CartoDB Voyager — colorful, modern, beautiful labels */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />

      {/* Zoom controls moved to bottom-left */}
      <ZoomControl position="bottomleft" />

      {groups.map((group, i) =>
        group.length === 1 ? (
          <SingleMarker key={i} point={group[0]} onPointClick={onPointClick} />
        ) : (
          <StackedMarker key={i} group={group} onPointClick={onPointClick} />
        )
      )}
    </MapContainer>
  )
}
