import React, { useState } from 'react';
import { AssetRecord, HazardLayerType, TamilNaduMicroZoneId } from '../../types/risk';
import { TAMIL_NADU_ZONES } from '../../data/tamilNaduGeodata';
import { formatINR } from '../../utils/catRiskEngine';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  Layers,
  Info,
  MapPin,
  Compass,
  Building,
  Shield,
  Eye,
  AlertCircle,
} from 'lucide-react';

interface RiskMapViewProps {
  assets: AssetRecord[];
  selectedZone: TamilNaduMicroZoneId;
  onSelectZone: (zone: TamilNaduMicroZoneId) => void;
  onSelectAsset?: (asset: AssetRecord) => void;
}

export const RiskMapView: React.FC<RiskMapViewProps> = ({
  assets,
  selectedZone,
  onSelectZone,
  onSelectAsset,
}) => {
  const [activeHazard, setActiveHazard] = useState<HazardLayerType>('flood');
  const [layerOpacity, setLayerOpacity] = useState<number>(75);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredZone, setHoveredZone] = useState<TamilNaduMicroZoneId | null>(null);
  const [showAssetMarkers, setShowAssetMarkers] = useState<boolean>(true);
  const [selectedAssetModal, setSelectedAssetModal] = useState<AssetRecord | null>(null);

  const currentZoneData = TAMIL_NADU_ZONES[selectedZone];
  const hoveredZoneData = hoveredZone ? TAMIL_NADU_ZONES[hoveredZone] : null;

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.2, z + 0.25));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.8, z - 0.25));
  const handleResetZoom = () => setZoomLevel(1);

  // Dynamic color for active hazard layer on zones
  const getZoneHazardFill = (zoneId: TamilNaduMicroZoneId): string => {
    const z = TAMIL_NADU_ZONES[zoneId];
    if (!z) return '#151b24';
    const score = z.hazardScores[activeHazard];

    // High contrast dark heat gradient
    if (activeHazard === 'flood') {
      if (score >= 90) return 'rgba(30, 144, 255, 0.75)'; // High flood azure
      if (score >= 75) return 'rgba(30, 144, 255, 0.50)';
      if (score >= 60) return 'rgba(30, 144, 255, 0.32)';
      return 'rgba(30, 144, 255, 0.15)';
    } else if (activeHazard === 'cyclone') {
      if (score >= 90) return 'rgba(239, 68, 68, 0.75)'; // High cyclone crimson
      if (score >= 75) return 'rgba(239, 68, 68, 0.50)';
      if (score >= 60) return 'rgba(239, 68, 68, 0.32)';
      return 'rgba(239, 68, 68, 0.15)';
    } else if (activeHazard === 'storm_surge') {
      if (score >= 85) return 'rgba(217, 119, 6, 0.75)'; // Surge amber
      if (score >= 60) return 'rgba(217, 119, 6, 0.45)';
      if (score >= 20) return 'rgba(217, 119, 6, 0.25)';
      return 'rgba(217, 119, 6, 0.05)';
    } else {
      // Rainfall
      if (score >= 90) return 'rgba(16, 185, 129, 0.75)'; // Emerald
      if (score >= 75) return 'rgba(16, 185, 129, 0.50)';
      if (score >= 60) return 'rgba(16, 185, 129, 0.32)';
      return 'rgba(16, 185, 129, 0.15)';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[680px]">
      {/* Geospatial Map Canvas Column */}
      <div className="lg:col-span-8 flex flex-col rounded-lg bg-[#0a0d13] border border-[#1a2230] relative overflow-hidden">
        {/* Top Floating Map Controls Toolbar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Hazard Layer Selector Tabs */}
          <div className="pointer-events-auto flex items-center p-1 rounded-md bg-[#0e131b]/95 backdrop-blur-md border border-[#232f42] shadow-xl">
            <button
              onClick={() => setActiveHazard('flood')}
              className={`px-3 py-1.5 rounded text-xs font-medium font-mono transition-colors cursor-pointer ${
                activeHazard === 'flood'
                  ? 'bg-[#1e3a8a] text-sky-200 border border-sky-500/40'
                  : 'text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              Flooding (Riverine/Urban)
            </button>
            <button
              onClick={() => setActiveHazard('cyclone')}
              className={`px-3 py-1.5 rounded text-xs font-medium font-mono transition-colors cursor-pointer ${
                activeHazard === 'cyclone'
                  ? 'bg-[#7f1d1d] text-rose-200 border border-rose-500/40'
                  : 'text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              Cyclone & Wind
            </button>
            <button
              onClick={() => setActiveHazard('rainfall')}
              className={`px-3 py-1.5 rounded text-xs font-medium font-mono transition-colors cursor-pointer ${
                activeHazard === 'rainfall'
                  ? 'bg-[#064e3b] text-emerald-200 border border-emerald-500/40'
                  : 'text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              Extreme Rainfall
            </button>
            <button
              onClick={() => setActiveHazard('storm_surge')}
              className={`px-3 py-1.5 rounded text-xs font-medium font-mono transition-colors cursor-pointer ${
                activeHazard === 'storm_surge'
                  ? 'bg-[#78350f] text-amber-200 border border-amber-500/40'
                  : 'text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              Storm Surge
            </button>
          </div>

          {/* Zoom & Reset Controls */}
          <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-md bg-[#0e131b]/95 backdrop-blur-md border border-[#232f42] shadow-xl">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-[#cbd5e1] hover:text-[#f8fafc] hover:bg-[#1a2332] rounded transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-[#cbd5e1] hover:text-[#f8fafc] hover:bg-[#1a2332] rounded transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 text-[#cbd5e1] hover:text-[#f8fafc] hover:bg-[#1a2332] rounded transition-colors cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-[#232f42] mx-1" />
            <button
              onClick={() => setShowAssetMarkers(!showAssetMarkers)}
              className={`px-2 py-1 text-[11px] font-mono rounded transition-colors cursor-pointer flex items-center gap-1 ${
                showAssetMarkers
                  ? 'bg-[#d4af37]/20 text-[#dfba4f] border border-[#d4af37]/40'
                  : 'text-[#64748b] hover:text-[#cbd5e1]'
              }`}
            >
              <Building className="w-3 h-3" />
              <span>Assets</span>
            </button>
          </div>
        </div>

        {/* Map Canvas (Interactive SVG Projection) */}
        <div className="flex-1 w-full h-full flex items-center justify-center p-4 relative bg-[#07090c]">
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <svg
              viewBox="0 0 750 850"
              className="w-full h-full max-h-[800px] select-none"
              style={{ filter: 'drop-shadow(0 0 15px rgba(0,0,0,0.8))' }}
            >
              <defs>
                {/* Bay of Bengal grid line pattern */}
                <pattern id="seaGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="#101722"
                    strokeWidth="0.5"
                  />
                </pattern>
                {/* Subtle gold glow for active selected zone */}
                <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background Maritime Canvas */}
              <rect width="750" height="850" fill="url(#seaGrid)" />

              {/* Bay of Bengal label */}
              <text
                x="620"
                y="520"
                fill="#243247"
                fontSize="14"
                fontFamily="Outfit, sans-serif"
                letterSpacing="4"
                fontWeight="500"
                textAnchor="middle"
              >
                BAY OF BENGAL
              </text>
              <text
                x="620"
                y="540"
                fill="#1b2533"
                fontSize="10"
                fontFamily="monospace"
                letterSpacing="2"
                textAnchor="middle"
              >
                COROMANDEL COASTLINE
              </text>

              {/* State Outline Silhouette Boundary */}
              <path
                d="M 470,120 L 595,150 L 605,190 L 560,330 L 555,480 L 510,510 L 400,750 L 320,800 L 290,750 L 250,550 L 150,420 L 140,320 L 220,300 L 400,210 Z"
                fill="#0d1117"
                stroke="#1f293d"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />

              {/* 9 Micro-Zones Polygons */}
              {Object.values(TAMIL_NADU_ZONES).map((zone) => {
                const isSelected = zone.id === selectedZone;
                const isHovered = zone.id === hoveredZone;
                const hazardFill = getZoneHazardFill(zone.id);

                return (
                  <g
                    key={zone.id}
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => onSelectZone(zone.id)}
                    onMouseEnter={() => setHoveredZone(zone.id)}
                    onMouseLeave={() => setHoveredZone(null)}
                  >
                    <path
                      d={zone.svgPath}
                      fill={hazardFill}
                      fillOpacity={layerOpacity / 100}
                      stroke={isSelected ? '#dfba4f' : isHovered ? '#f8fafc' : '#2b394f'}
                      strokeWidth={isSelected ? '2.5' : isHovered ? '1.8' : '1'}
                      filter={isSelected ? 'url(#goldGlow)' : undefined}
                      className="transition-all duration-200"
                    />

                    {/* Zone Label at Center Coordinate */}
                    <text
                      x={zone.centerSvg.x}
                      y={zone.centerSvg.y}
                      textAnchor="middle"
                      fill={isSelected ? '#dfba4f' : '#f1f5f9'}
                      fontSize="11"
                      fontFamily="Outfit, sans-serif"
                      fontWeight={isSelected ? '600' : '400'}
                      letterSpacing="0.5"
                      pointerEvents="none"
                    >
                      {zone.name}
                    </text>

                    {/* Score Subtitle */}
                    <text
                      x={zone.centerSvg.x}
                      y={zone.centerSvg.y + 13}
                      textAnchor="middle"
                      fill={isSelected ? '#ecd279' : '#94a3b8'}
                      fontSize="9"
                      fontFamily="monospace"
                      pointerEvents="none"
                    >
                      {activeHazard.toUpperCase()}: {zone.hazardScores[activeHazard]}
                    </text>
                  </g>
                );
              })}

              {/* Exposed Asset Markers on Map */}
              {showAssetMarkers &&
                assets.map((asset) => {
                  const zone = TAMIL_NADU_ZONES[asset.zone];
                  if (!zone) return null;

                  // Compute relative SVG coordinates near zone center
                  const markerX = zone.centerSvg.x + (asset.lng - zone.lng) * 45;
                  const markerY = zone.centerSvg.y - (asset.lat - zone.lat) * 45;

                  return (
                    <g
                      key={asset.id}
                      className="cursor-pointer group"
                      onClick={() => {
                        setSelectedAssetModal(asset);
                        onSelectZone(asset.zone);
                        if (onSelectAsset) onSelectAsset(asset);
                      }}
                    >
                      <circle
                        cx={markerX}
                        cy={markerY}
                        r="5"
                        fill="#d4af37"
                        stroke="#090b0e"
                        strokeWidth="1.5"
                        className="transition-transform group-hover:scale-150"
                      />
                      <circle
                        cx={markerX}
                        cy={markerY}
                        r="9"
                        fill="none"
                        stroke="rgba(212, 175, 55, 0.4)"
                        strokeWidth="1"
                        className="animate-ping"
                      />
                    </g>
                  );
                })}
            </svg>
          </div>

          {/* Hover Inspection Tooltip */}
          {hoveredZoneData && (
            <div className="absolute bottom-16 left-6 p-3 rounded-md bg-[#0e131b]/95 backdrop-blur-md border border-[#242f42] text-xs shadow-2xl pointer-events-none max-w-xs animate-in fade-in">
              <div className="font-semibold text-[#f8fafc] flex items-center justify-between">
                <span>{hoveredZoneData.name}</span>
                <span className="font-mono text-[10px] text-[#d4af37]">
                  {hoveredZoneData.elevationMeters}m MSL
                </span>
              </div>
              <div className="text-[11px] text-[#94a3b8] mt-0.5">{hoveredZoneData.regionalTitle}</div>
              <div className="mt-2 pt-2 border-t border-[#1a2230] grid grid-cols-2 gap-2 font-mono text-[10px]">
                <div>
                  <span className="text-[#64748b]">Active Layer: </span>
                  <span className="text-[#f8fafc] font-medium">
                    {hoveredZoneData.hazardScores[activeHazard]}/100
                  </span>
                </div>
                <div>
                  <span className="text-[#64748b]">Exposure: </span>
                  <span className="text-[#dfba4f]">
                    {formatINR(hoveredZoneData.totalExposedValueInr)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Map Legend & Opacity Slider Strip */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 rounded-md bg-[#0e131b]/95 backdrop-blur-md border border-[#232f42] text-xs">
            {/* Opacity Control */}
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-[#64748b]" />
              <span className="text-[#94a3b8] text-[11px] font-mono">Layer Opacity:</span>
              <input
                type="range"
                min="20"
                max="100"
                value={layerOpacity}
                onChange={(e) => setLayerOpacity(Number(e.target.value))}
                className="w-24 accent-[#d4af37] cursor-pointer"
              />
              <span className="font-mono text-[11px] text-[#dfba4f]">{layerOpacity}%</span>
            </div>

            {/* Gradient Legend */}
            <div className="flex items-center gap-3 text-[11px] font-mono text-[#94a3b8]">
              <span>Low Susceptibility</span>
              <div className="w-28 h-2 rounded-full bg-gradient-to-r from-slate-800 via-amber-600 to-rose-600 border border-[#1f293a]" />
              <span className="text-rose-400">Extreme Peak</span>
            </div>

            {/* CRS Footnote */}
            <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-[#64748b]">
              <Compass className="w-3 h-3 text-[#d4af37]" />
              <span>CRS: EPSG:4326 (WGS84)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Selected-Zone Evidence & Asset Detail Panel */}
      <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto">
        {/* Selected Zone Deep-Dive Evidence Card */}
        <div className="p-5 rounded-lg bg-[#0e131b] border border-[#1a2230] space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#d4af37]">
                Selected Tamil Nadu Micro-Zone
              </div>
              <h2 className="text-lg font-semibold text-[#f8fafc] mt-0.5">{currentZoneData.name}</h2>
              <div className="text-xs text-[#94a3b8]">{currentZoneData.regionalTitle}</div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                currentZoneData.vulnerabilityGrade === 'Extreme'
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
              }`}
            >
              {currentZoneData.vulnerabilityGrade}
            </span>
          </div>

          {/* Geographic Coordinates & Elevation */}
          <div className="grid grid-cols-2 gap-2.5 p-3 rounded bg-[#090b0e] border border-[#161f2c] font-mono text-xs">
            <div>
              <div className="text-[10px] text-[#64748b]">Geographic Center</div>
              <div className="text-[#cbd5e1] font-medium mt-0.5">
                {currentZoneData.lat.toFixed(4)}°N, {currentZoneData.lng.toFixed(4)}°E
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#64748b]">Mean Elevation</div>
              <div className="text-[#dfba4f] font-medium mt-0.5">
                {currentZoneData.elevationMeters}m MSL
              </div>
            </div>
          </div>

          {/* Primary Risk Driver */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-[#f8fafc] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Primary Risk Driver</span>
            </div>
            <p className="text-xs text-[#94a3b8] leading-relaxed bg-[#0a0d13] p-2.5 rounded border border-[#161f2c]">
              {currentZoneData.primaryRiskDriver}
            </p>
          </div>

          {/* Multi-Hazard Scores Bar Breakdown */}
          <div className="space-y-2 pt-2 border-t border-[#161f2c]">
            <div className="text-xs font-medium text-[#f8fafc]">Hydro-Meteorological Scores</div>

            {/* Flood */}
            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span className="text-[#cbd5e1]">Riverine & Urban Flood</span>
                <span className="text-sky-400 font-medium">{currentZoneData.hazardScores.flood}/100</span>
              </div>
              <div className="w-full h-1.5 bg-[#141b25] rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full"
                  style={{ width: `${currentZoneData.hazardScores.flood}%` }}
                />
              </div>
            </div>

            {/* Cyclone */}
            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span className="text-[#cbd5e1]">Cyclone & Wind Field</span>
                <span className="text-rose-400 font-medium">{currentZoneData.hazardScores.cyclone}/100</span>
              </div>
              <div className="w-full h-1.5 bg-[#141b25] rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${currentZoneData.hazardScores.cyclone}%` }}
                />
              </div>
            </div>

            {/* Rainfall */}
            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span className="text-[#cbd5e1]">Extreme Convective Deluge</span>
                <span className="text-emerald-400 font-medium">{currentZoneData.hazardScores.rainfall}/100</span>
              </div>
              <div className="w-full h-1.5 bg-[#141b25] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${currentZoneData.hazardScores.rainfall}%` }}
                />
              </div>
            </div>

            {/* Storm Surge */}
            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span className="text-[#cbd5e1]">Coastal Storm Surge</span>
                <span className="text-amber-400 font-medium">{currentZoneData.hazardScores.storm_surge}/100</span>
              </div>
              <div className="w-full h-1.5 bg-[#141b25] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${currentZoneData.hazardScores.storm_surge}%` }}
                />
              </div>
            </div>
          </div>

          {/* Historical Disaster Events on Record */}
          <div className="p-3 rounded bg-[#090b0e] border border-[#161f2c] flex items-center justify-between text-xs">
            <span className="text-[#94a3b8]">Documented Disasters (1970 - 2024):</span>
            <span className="font-mono text-[#f8fafc] font-semibold">
              {currentZoneData.historicalEventsCount} Catastrophes
            </span>
          </div>
        </div>

        {/* Selected Asset Modal / Quick Popover */}
        {selectedAssetModal && (
          <div className="p-4 rounded-lg bg-[#0e131b] border border-[#d4af37]/40 space-y-2 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#d4af37]">Selected Asset Marker</span>
                <h4 className="text-sm font-semibold text-[#f8fafc]">{selectedAssetModal.name}</h4>
              </div>
              <button
                onClick={() => setSelectedAssetModal(null)}
                className="text-[#64748b] hover:text-[#f8fafc] text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-[#94a3b8] font-mono grid grid-cols-2 gap-1 pt-1">
              <div>
                TIV: <span className="text-[#dfba4f]">{formatINR(selectedAssetModal.insuredValueInr)}</span>
              </div>
              <div>Type: {selectedAssetModal.type}</div>
              <div>Curve: {selectedAssetModal.constructionCategory}</div>
              <div>Plinth: {selectedAssetModal.plinthHeightMeters}m</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
