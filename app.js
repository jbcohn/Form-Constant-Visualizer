// Define Color Palettes (RGB-interpolated HSL representations)
const PALETTES = [
    "Neon Cyberpunk",
    "Gold & Onyx",
    "Cosmic Aurora",
    "Forest Sage",
    "Lava Flame",
    "Ocean Breeze",
    "Rainbow Prism",
    "Pastel Dream"
];

// Vector SVGs for Option 2: Retro Thick Solid Fill lock / unlock icons
const SVG_LOCKED = `<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H1v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6h-3.5V4.5A3.5 3.5 0 0 0 8 1zm2.5 5h-5V4.5a2.5 2.5 0 0 1 5 0V6z"/></svg>`;
const SVG_UNLOCKED = `<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M11 1a3.5 3.5 0 0 0-3.5 3.5V6H1v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6h-3.5V4.5a2.5 2.5 0 0 1 5 0V6h1V4.5A3.5 3.5 0 0 0 11 1z"/></svg>`;

function getLockSvg(isLocked) {
    return isLocked ? SVG_LOCKED : SVG_UNLOCKED;
}

function getColor(t, paletteName) {
    t = t % 1.0;
    let h, s, l;
    if (paletteName === "Gold & Onyx") {
        h = 0.07 + t * 0.08;
        s = 0.8;
        l = 0.25 + t * 0.45;
    } else if (paletteName === "Neon Cyberpunk") {
        h = 0.82 + t * 0.35;
        s = 1.0;
        l = 0.5;
    } else if (paletteName === "Cosmic Aurora") {
        h = 0.48 + t * 0.35;
        s = 0.95;
        l = 0.45 + 0.12 * Math.sin(t * Math.PI);
    } else if (paletteName === "Forest Sage") {
        h = 0.22 + t * 0.16;
        s = 0.55;
        l = 0.35 + t * 0.25;
    } else if (paletteName === "Lava Flame") {
        h = 0.0 + t * 0.16;
        s = 1.0;
        l = 0.4 + t * 0.25;
    } else if (paletteName === "Ocean Breeze") {
        h = 0.65 - t * 0.2;
        s = 0.85;
        l = 0.35 + t * 0.25;
    } else if (paletteName === "Rainbow Prism") {
        h = t;
        s = 0.9;
        l = 0.55;
    } else { // Pastel Dream
        h = 0.9 + t * 0.4;
        s = 0.7;
        l = 0.75;
    }
    
    return `hsl(${(h % 1.0) * 360}, ${s * 100}%, ${l * 100}%)`;
}

// Layer Class
class Layer {
    constructor(name, ltype = "Spirals") {
        this.name = name;
        this.active = true;
        this.type = ltype; // Spirals, Cobwebs, Tunnels, Lattices, Phyllo
        
        this.params = {
            "Spirals": {
                "arms": 4,           // 1 to 24
                "tightness": 1.0,    // 0.1 to 3.0
                "turns": 3.0,        // 0.5 to 10.0
                "wave_amp": 0.02,    // 0.0 to 0.15
                "wave_freq": 6.0,    // 0.0 to 20.0
                "radius": 0.85,
                "depth_stroke": 0    // 0: No, 1: Yes
            },
            "Cobwebs": {
                "count": 12,         // 3 to 48
                "rings": 8,          // 2 to 30
                "spacing": 1.1,      // 0.3 to 3.0
                "sag": 0.15,         // -0.4 to 0.6
                "radius": 0.85,
                "thickness": 2.0,
                "depth_stroke": 0    // 0: No, 1: Yes
            },
            "Tunnels": {
                "rings": 20,         // 3 to 50
                "sides": 0,          // 0: Circle, 3: Triangle, etc
                "perspective": 2.0,  // 0.5 to 10.0
                "twist": 1.0,        // -5.0 to 5.0
                "wobble": 0.05,      // 0.0 to 0.3
                "radius": 0.9,
                "depth_stroke": 0    // 0: No, 1: Yes
            },
            "Lattices": {
                "grid_type": 0,      // 0: Square, 1: Tri, 2: Hex
                "cell_scale": 0.08,  // 0.03 to 0.25
                "rotation": 0,       // 0 to 360
                "thickness": 2.0,
                "radius": 0.85,
                "double_grid": 0,    // 0: No, 1: Yes
                "boundaries": 1,     // 0: Shapes, 1: Boundaries
                "depth_stroke": 0    // 0: No, 1: Yes
            },
            "Phyllo": {
                "count": 300,        // 10 to 1000
                "div_angle": 137.508, // 135 to 140
                "radius": 0.85,
                "size": 0.025,
                "decay": 0.5,
                "shape_type": 4      // 0: Circle, 1: Tri, 2: Sqr, 3: Star, 4: Petal
            }
        };
        this.color_offset = 0.0;
    }
}

// App Controller State
const state = {
    layers: [
        new Layer("Layer 1", "Tunnels"),
        new Layer("Layer 2", "Spirals"),
        new Layer("Layer 3", "Cobwebs"),
        new Layer("Layer 4", "Lattices")
    ],
    currentLayerIdx: 0,
    globalScale: 1.0,
    globalLineWidth: 1.5,
    globalColorShift: 0.0,
    globalRotation: 0,
    activePaletteIdx: 0,
    toastTimer: null,
    autoplayMode: "off", // off, random, favorites, music
    transitionDuration: 1500, // duration in milliseconds
    autoplayTimer: null,
    
    // Music Reaction State
    musicReaction: {
        audioContext: null,
        analyser: null,
        audioSource: null,
        scalePulse: 0.0,
        thicknessPulse: 0.0,
        colorShiftAccum: 0.0,
        rotationAccum: 0.0,
        highJitter: 0.0,
        history: [],
        historyMax: 30,
        lastBeatTime: 0,
        beatCount: 0,
        beatTimes: [],
        smoothedBpm: 0.0,
        lastBpmUpdateTime: 0,
        midsHistory: [],
        highsHistory: [],
        lastMidBeatTime: 0,
        lastHighBeatTime: 0,
        midBeatCount: 0,
        highBeatCount: 0,
        energyHistory: [],
        fps: 60.0,
        lastFrameTime: 0,
        lastStrongBpm: 0.0,
        lastStrongBpmTime: 0,
        rafId: null
    },
    
    // Lock states for individual properties from randomization
    locks: {
        globalScale: false,
        globalLineWidth: false,
        globalColorShift: false,
        globalRotation: false,
        palette: false,
        layerActive: [false, false, false, false],
        layerType: [false, false, false, false],
        layerColorOffset: [false, false, false, false],
        layerParams: [
            {}, // Layer 1 parameter locks
            {}, // Layer 2
            {}, // Layer 3
            {}  // Layer 4
        ]
    }
};

// Undo History State Stack
const stateHistory = [];
const MAX_HISTORY_LEN = 30;

// Initialize Canvas
const canvas = document.getElementById("viewport-canvas");
const ctx = canvas.getContext("2d");

// Responsive Scaling
function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Size display size in CSS pixels
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    
    // Scale backing store by device pixel ratio for smooth anti-aliased vectors
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    drawMandalaOnScreen();
}

window.addEventListener("resize", resizeCanvas);

// Render Geometry Routine
function renderMandala(drawCtx, width, height, scaleMultiplier) {
    const cx = width / 2;
    const cy = height / 2;
    const baseScale = Math.min(width, height) / 2 * state.globalScale * 0.90;
    const palette = PALETTES[state.activePaletteIdx];
    
    // Draw layers from Layer 4 down to Layer 1
    for (let i = state.layers.length - 1; i >= 0; i--) {
        const layer = state.layers[i];
        if (!layer.active) continue;
        
        const p = layer.params[layer.type];
        const colOff = layer.color_offset + state.globalColorShift;
        
        if (layer.type === "Spirals") {
            const arms = parseInt(p.arms);
            const tightness = p.tightness;
            const turns = p.turns;
            const waveAmp = p.wave_amp;
            const waveFreq = p.wave_freq;
            const radius = p.radius;
            const thick = 2.0 * state.globalLineWidth * scaleMultiplier;
            const depthStroke = p.depth_stroke !== undefined ? parseInt(p.depth_stroke) : 0;
            
            const nPts = 180; // High resolution count for smooth curves
            for (let a = 0; a < arms; a++) {
                const phiStart = 2.0 * Math.PI * a / arms + (state.globalRotation * Math.PI / 180.0);
                const points = [];
                
                for (let k = 0; k <= nPts; k++) {
                    const t = k / nPts;
                    const r = Math.pow(t, tightness) * radius;
                    
                    const thetaVal = t * turns * 2.0 * Math.PI;
                    const waveOffset = waveAmp * Math.sin(waveFreq * t * 2.0 * Math.PI);
                    const phi = phiStart + thetaVal + waveOffset;
                    
                    const px = cx + r * baseScale * Math.cos(phi);
                    const py = cy + r * baseScale * Math.sin(phi);
                    points.push({x: px, y: py, r: t});
                }
                
                // Draw path segments to apply color gradient
                for (let k = 0; k < nPts; k++) {
                    const tMid = (k + 0.5) / nPts;
                    drawCtx.beginPath();
                    drawCtx.moveTo(points[k].x, points[k].y);
                    drawCtx.lineTo(points[k+1].x, points[k+1].y);
                    
                    drawCtx.strokeStyle = getColor(tMid * radius + colOff, palette);
                    drawCtx.lineWidth = depthStroke === 1 ? thick * Math.max(0.12, tMid) : thick;
                    drawCtx.lineCap = "round";
                    drawCtx.stroke();
                }
            }
            
        } else if (layer.type === "Cobwebs") {
            const count = parseInt(p.count);
            const rings = parseInt(p.rings);
            const spacing = p.spacing;
            const sag = p.sag;
            const radius = p.radius;
            const thickness = p.thickness * state.globalLineWidth * scaleMultiplier;
            const depthStroke = p.depth_stroke !== undefined ? parseInt(p.depth_stroke) : 0;
            
            // 1. Draw spokes
            for (let s = 0; s < count; s++) {
                const theta = 2.0 * Math.PI * s / count + (state.globalRotation * Math.PI / 180.0);
                
                const segs = 12;
                for (let j = 0; j < segs; j++) {
                    const t1 = j / segs;
                    const t2 = (j + 1) / segs;
                    
                    const p1x = cx + t1 * radius * baseScale * Math.cos(theta);
                    const p1y = cy + t1 * radius * baseScale * Math.sin(theta);
                    const p2x = cx + t2 * radius * baseScale * Math.cos(theta);
                    const p2y = cy + t2 * radius * baseScale * Math.sin(theta);
                    
                    drawCtx.beginPath();
                    drawCtx.moveTo(p1x, p1y);
                    drawCtx.lineTo(p2x, p2y);
                    
                    const tMid = (j + 0.5) / segs;
                    drawCtx.strokeStyle = getColor(tMid * radius + colOff, palette);
                    drawCtx.lineWidth = thickness * 0.75 * (depthStroke === 1 ? Math.max(0.12, tMid) : 1.0);
                    drawCtx.stroke();
                }
            }
            
            // 2. Draw curved web segments
            for (let k = 1; k <= rings; k++) {
                const tRad = Math.pow(k / rings, spacing);
                const rCurr = radius * tRad;
                
                const currentThick = depthStroke === 1 ? thickness * Math.max(0.12, tRad) : thickness;
                
                for (let s = 0; s < count; s++) {
                    const theta1 = 2.0 * Math.PI * s / count + (state.globalRotation * Math.PI / 180.0);
                    const theta2 = 2.0 * Math.PI * (s + 1) / count + (state.globalRotation * Math.PI / 180.0);
                    
                    // Curved line path using subdivisions
                    const subSteps = 12;
                    drawCtx.beginPath();
                    for (let step = 0; step <= subSteps; step++) {
                        const u = step / subSteps;
                        const phi = theta1 + u * (theta2 - theta1);
                        const rSag = rCurr * (1.0 - sag * Math.sin(u * Math.PI));
                        
                        const px = cx + rSag * baseScale * Math.cos(phi);
                        const py = cy + rSag * baseScale * Math.sin(phi);
                        
                        if (step === 0) {
                            drawCtx.moveTo(px, py);
                        } else {
                            drawCtx.lineTo(px, py);
                        }
                    }
                    
                    drawCtx.strokeStyle = getColor(tRad + colOff, palette);
                    drawCtx.lineWidth = currentThick;
                    drawCtx.lineCap = "round";
                    drawCtx.stroke();
                }
            }
            
        } else if (layer.type === "Tunnels") {
            const rings = parseInt(p.rings);
            const sides = parseInt(p.sides);
            const perspective = p.perspective;
            const twist = p.twist;
            const wobble = p.wobble;
            const radius = p.radius;
            const thickness = 1.5 * state.globalLineWidth * scaleMultiplier;
            const depthStroke = p.depth_stroke !== undefined ? parseInt(p.depth_stroke) : 0;
            
            // Draw tunnel rings
            for (let k = 1; k <= rings; k++) {
                const tDepth = perspective / (k + perspective);
                const rCurr = radius * tDepth;
                
                // Axis Wobble displacement
                const wTheta = k * 0.5;
                const wx = wobble * Math.sin(wTheta) * baseScale * tDepth;
                const wy = wobble * Math.cos(wTheta) * baseScale * tDepth;
                const rCx = cx + wx;
                const rCy = cy + wy;
                
                const ringRot = (state.globalRotation * Math.PI / 180.0) + k * (twist * Math.PI / 180.0);
                
                const currentThick = depthStroke === 1 ? thickness * Math.max(0.12, tDepth) : thickness;
                
                drawCtx.beginPath();
                drawCtx.strokeStyle = getColor(tDepth + colOff, palette);
                drawCtx.lineWidth = currentThick;
                
                if (sides === 0) { // Circle
                    const R = rCurr * baseScale;
                    if (R > 0.5) {
                        drawCtx.arc(rCx, rCy, R, 0, 2 * Math.PI);
                        drawCtx.stroke();
                    }
                } else { // Polygon
                    for (let s = 0; s < sides; s++) {
                        const alpha = ringRot + s * (2.0 * Math.PI / sides);
                        const px = rCx + rCurr * baseScale * Math.cos(alpha);
                        const py = rCy + rCurr * baseScale * Math.sin(alpha);
                        if (s === 0) drawCtx.moveTo(px, py);
                        else drawCtx.lineTo(px, py);
                    }
                    drawCtx.closePath();
                    drawCtx.stroke();
                }
            }
            
            // Draw perspective spokes converging
            if (sides === 0) {
                const spokeCount = 12;
                for (let i = 0; i < spokeCount; i++) {
                    const theta = 2.0 * Math.PI * i / spokeCount + (state.globalRotation * Math.PI / 180.0);
                    
                    drawCtx.beginPath();
                    for (let k = 0; k <= rings; k++) {
                        const tDepth = perspective / (k + perspective);
                        const rCurr = radius * tDepth;
                        const wTheta = k * 0.5;
                        const rCx = cx + wobble * Math.sin(wTheta) * baseScale * tDepth;
                        const rCy = cy + wobble * Math.cos(wTheta) * baseScale * tDepth;
                        
                        const ringRot = (state.globalRotation * Math.PI / 180.0) + k * (twist * Math.PI / 180.0);
                        const phi = theta + ringRot - (state.globalRotation * Math.PI / 180.0);
                        
                        const px = rCx + rCurr * baseScale * Math.cos(phi);
                        const py = rCy + rCurr * baseScale * Math.sin(phi);
                        
                        const currentSpokeThick = thickness * 0.6 * (depthStroke === 1 ? Math.max(0.12, tDepth) : 1.0);
                        
                        if (k === 0) drawCtx.moveTo(px, py);
                        else {
                            drawCtx.strokeStyle = getColor(tDepth + colOff, palette);
                            drawCtx.lineWidth = currentSpokeThick;
                            drawCtx.lineTo(px, py);
                            drawCtx.stroke();
                            drawCtx.beginPath();
                            drawCtx.moveTo(px, py);
                        }
                    }
                }
            } else {
                for (let s = 0; s < sides; s++) {
                    drawCtx.beginPath();
                    for (let k = 0; k <= rings; k++) {
                        const tDepth = perspective / (k + perspective);
                        const rCurr = radius * tDepth;
                        const wTheta = k * 0.5;
                        const rCx = cx + wobble * Math.sin(wTheta) * baseScale * tDepth;
                        const rCy = cy + wobble * Math.cos(wTheta) * baseScale * tDepth;
                        
                        const ringRot = (state.globalRotation * Math.PI / 180.0) + k * (twist * Math.PI / 180.0);
                        const alpha = ringRot + s * (2.0 * Math.PI / sides);
                        
                        const px = rCx + rCurr * baseScale * Math.cos(alpha);
                        const py = rCy + rCurr * baseScale * Math.sin(alpha);
                        
                        const currentSpokeThick = thickness * 0.6 * (depthStroke === 1 ? Math.max(0.12, tDepth) : 1.0);
                        
                        if (k === 0) drawCtx.moveTo(px, py);
                        else {
                            drawCtx.strokeStyle = getColor(tDepth + colOff, palette);
                            drawCtx.lineWidth = currentSpokeThick;
                            drawCtx.lineTo(px, py);
                            drawCtx.stroke();
                            drawCtx.beginPath();
                            drawCtx.moveTo(px, py);
                        }
                    }
                }
            }
            
        } else if (layer.type === "Lattices") {
            const gridType = parseInt(p.grid_type);
            const cellScale = p.cell_scale;
            const rotation = (p.rotation + state.globalRotation) * Math.PI / 180.0;
            const thickness = p.thickness * state.globalLineWidth * scaleMultiplier;
            const clipR = p.radius;
            const doubleGrid = parseInt(p.double_grid);
            const boundaries = p.boundaries !== undefined ? parseInt(p.boundaries) : 1;
            const depthStroke = p.depth_stroke !== undefined ? parseInt(p.depth_stroke) : 0;
            
            const rMaxPx = clipR * baseScale;
            const gridSpacing = cellScale * baseScale;
            const limit = Math.ceil(rMaxPx / gridSpacing) + 2;
            
            // Draw grid clipped to boundary circle
            drawCtx.save();
            drawCtx.beginPath();
            drawCtx.arc(cx, cy, rMaxPx, 0, 2*Math.PI);
            drawCtx.clip();
            
            function drawClippedParallelLines(angle) {
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);
                
                for (let i = -limit; i <= limit; i++) {
                    let offsets = [i * gridSpacing];
                    if (doubleGrid === 1) {
                        offsets = [i * gridSpacing - gridSpacing * 0.12, 
                                   i * gridSpacing + gridSpacing * 0.12];
                    }
                    
                    offsets.forEach(offset => {
                        if (Math.abs(offset) >= rMaxPx) return;
                        
                        const L = Math.sqrt(rMaxPx*rMaxPx - offset*offset);
                        const p1x = cx + offset * cosA - (-L) * sinA;
                        const p1y = cy + offset * sinA + (-L) * cosA;
                        const p2x = cx + offset * cosA - L * sinA;
                        const p2y = cy + offset * sinA + L * cosA;
                        
                        const tDist = Math.abs(offset) / (baseScale * 0.9);
                        
                        drawCtx.beginPath();
                        drawCtx.moveTo(p1x, p1y);
                        drawCtx.lineTo(p2x, p2y);
                        drawCtx.strokeStyle = getColor(tDist + colOff, palette);
                        drawCtx.lineWidth = thickness;
                        drawCtx.stroke();
                    });
                }
            }
            
            if (gridType === 3) {
                const nSectors = Math.max(6, Math.round(Math.PI / cellScale));
                const d_v = (2.0 * Math.PI) / nSectors;
                const d_u = d_v * (Math.sqrt(3.0) / 2.0);
                const rHexLog = d_v / Math.sqrt(3.0);
                const uMax = Math.log(rMaxPx);
                const nRings = Math.ceil(uMax / d_u) + 5;
                
                const fillScale = boundaries === 1 ? 1.0 : 0.72;
                
                for (let r = 0; r <= nRings; r++) {
                    const uc = uMax - r * d_u;
                    const rCenter = Math.exp(uc);
                    if (rCenter < 0.5) break;
                    
                    const rNorm = rCenter / rMaxPx;
                    const currentThick = depthStroke === 1 ? thickness * Math.max(0.12, rNorm) : thickness;
                    
                    for (let s = 0; s < nSectors; s++) {
                        const vc = s * d_v + (r % 2) * 0.5 * d_v + rotation;
                        
                        const hexPts = [];
                        for (let k = 0; k < 6; k++) {
                            const phi = k * (2.0 * Math.PI / 6.0);
                            const uk = uc + rHexLog * fillScale * Math.cos(phi);
                            const vk = vc + rHexLog * fillScale * Math.sin(phi);
                            
                            const rk = Math.exp(uk);
                            const px = cx + rk * Math.cos(vk);
                            const py = cy + rk * Math.sin(vk);
                            hexPts.push({x: px, y: py});
                        }
                        
                        const tDist = rCenter / (baseScale * 0.9);
                        drawCtx.strokeStyle = getColor(tDist + colOff, palette);
                        drawCtx.lineWidth = currentThick;
                        
                        drawCtx.beginPath();
                        hexPts.forEach((pt, idx) => {
                            if (idx === 0) drawCtx.moveTo(pt.x, pt.y);
                            else drawCtx.lineTo(pt.x, pt.y);
                        });
                        drawCtx.closePath();
                        drawCtx.stroke();
                        
                        if (doubleGrid === 1) {
                            const innerHexPts = [];
                            for (let k = 0; k < 6; k++) {
                                const phi = k * (2.0 * Math.PI / 6.0);
                                const uk = uc + rHexLog * fillScale * 0.65 * Math.cos(phi);
                                const vk = vc + rHexLog * fillScale * 0.65 * Math.sin(phi);
                                
                                const rk = Math.exp(uk);
                                const px = cx + rk * Math.cos(vk);
                                const py = cy + rk * Math.sin(vk);
                                innerHexPts.push({x: px, y: py});
                            }
                            
                            drawCtx.beginPath();
                            innerHexPts.forEach((pt, idx) => {
                                if (idx === 0) drawCtx.moveTo(pt.x, pt.y);
                                else drawCtx.lineTo(pt.x, pt.y);
                            });
                            drawCtx.closePath();
                            drawCtx.stroke();
                        }
                    }
                }
            } else if (boundaries === 1) {
                if (gridType === 0) { // Square
                    drawClippedParallelLines(rotation);
                    drawClippedParallelLines(rotation + Math.PI / 2.0);
                } else if (gridType === 1) { // Triangle
                    drawClippedParallelLines(rotation);
                    drawClippedParallelLines(rotation + Math.PI / 3.0);
                    drawClippedParallelLines(rotation + 2 * Math.PI / 3.0);
                } else if (gridType === 2) { // Hexagon Honeycomb
                    const hRadius = gridSpacing / Math.sqrt(3.0);
                    const rowLimit = Math.ceil(rMaxPx / (gridSpacing * 1.5)) + 2;
                    const colLimit = Math.ceil(rMaxPx / gridSpacing) + 2;
                    
                    for (let r = -rowLimit; r <= rowLimit; r++) {
                        for (let c = -colLimit; c <= colLimit; c++) {
                            const hx = c * Math.sqrt(3.0) * gridSpacing + (Math.abs(r) % 2) * (Math.sqrt(3.0)/2.0) * gridSpacing;
                            const hy = r * 1.5 * gridSpacing;
                            
                            const dist = Math.sqrt(hx*hx + hy*hy);
                            if (dist < rMaxPx) {
                                const cosR = Math.cos(rotation);
                                const sinR = Math.sin(rotation);
                                const rx = cx + hx * cosR - hy * sinR;
                                const ry = cy + hx * sinR + hy * cosR;
                                
                                const tDist = dist / (baseScale * 0.9);
                                drawCtx.strokeStyle = getColor(tDist + colOff, palette);
                                drawCtx.lineWidth = thickness;
                                
                                // Draw Polygon
                                drawCtx.beginPath();
                                for (let s = 0; s < 6; s++) {
                                    const alpha = rotation + s * (2.0 * Math.PI / 6.0);
                                    const px = rx + hRadius * Math.cos(alpha);
                                    const py = ry + hRadius * Math.sin(alpha);
                                    if (s === 0) drawCtx.moveTo(px, py);
                                    else drawCtx.lineTo(px, py);
                                }
                                drawCtx.closePath();
                                drawCtx.stroke();
                                
                                if (doubleGrid === 1) {
                                    drawCtx.beginPath();
                                    for (let s = 0; s < 6; s++) {
                                        const alpha = rotation + s * (2.0 * Math.PI / 6.0);
                                        const px = rx + hRadius * 0.78 * Math.cos(alpha);
                                        const py = ry + hRadius * 0.78 * Math.sin(alpha);
                                        if (s === 0) drawCtx.moveTo(px, py);
                                        else drawCtx.lineTo(px, py);
                                    }
                                    drawCtx.closePath();
                                    drawCtx.stroke();
                                }
                            }
                        }
                    }
                }
            } else {
                let pointsList = [];
                
                if (gridType === 0) { // Square
                    for (let r = -limit; r <= limit; r++) {
                        for (let c = -limit; c <= limit; c++) {
                            pointsList.push({hx: c * gridSpacing, hy: r * gridSpacing});
                        }
                    }
                } else if (gridType === 1) { // Triangle
                    for (let r = -limit; r <= limit; r++) {
                        for (let c = -limit; c <= limit; c++) {
                            const hx = c * gridSpacing + (Math.abs(r) % 2) * (gridSpacing / 2.0);
                            const hy = r * gridSpacing * (Math.sqrt(3.0) / 2.0);
                            pointsList.push({hx: hx, hy: hy});
                        }
                    }
                } else { // Hexagon
                    const rowLimit = Math.ceil(rMaxPx / (gridSpacing * 1.5)) + 2;
                    const colLimit = Math.ceil(rMaxPx / gridSpacing) + 2;
                    for (let r = -rowLimit; r <= rowLimit; r++) {
                        for (let c = -colLimit; c <= colLimit; c++) {
                            const hx = c * Math.sqrt(3.0) * gridSpacing + (Math.abs(r) % 2) * (Math.sqrt(3.0)/2.0) * gridSpacing;
                            const hy = r * 1.5 * gridSpacing;
                            pointsList.push({hx: hx, hy: hy});
                        }
                    }
                }
                
                pointsList.forEach(pt => {
                    const dist = Math.sqrt(pt.hx*pt.hx + pt.hy*pt.hy);
                    if (dist >= rMaxPx) return;
                    
                    const cosR = Math.cos(rotation);
                    const sinR = Math.sin(rotation);
                    const rx = cx + pt.hx * cosR - pt.hy * sinR;
                    const ry = cy + pt.hx * sinR + pt.hy * cosR;
                    
                    const tDist = dist / (baseScale * 0.9);
                    drawCtx.strokeStyle = getColor(tDist + colOff, palette);
                    drawCtx.lineWidth = thickness;
                    
                    if (gridType === 0) { // Draw Square
                        const size = gridSpacing * 0.76;
                        drawCtx.beginPath();
                        drawCtx.strokeRect(rx - size/2, ry - size/2, size, size);
                        
                        if (doubleGrid === 1) {
                            const innerSize = size * 0.65;
                            drawCtx.strokeRect(rx - innerSize/2, ry - innerSize/2, innerSize, innerSize);
                        }
                    } else if (gridType === 1) { // Draw Triangle
                        const size = gridSpacing * 0.44;
                        function drawTri(sz) {
                            drawCtx.beginPath();
                            for (let s = 0; s < 3; s++) {
                                const alpha = rotation + s * (2.0 * Math.PI / 3.0);
                                const px = rx + sz * Math.cos(alpha);
                                const py = ry + sz * Math.sin(alpha);
                                if (s === 0) drawCtx.moveTo(px, py);
                                else drawCtx.lineTo(px, py);
                            }
                            drawCtx.closePath();
                            drawCtx.stroke();
                        }
                        drawTri(size);
                        if (doubleGrid === 1) drawTri(size * 0.65);
                    } else { // Draw Hexagon
                        const size = gridSpacing * 0.44;
                        function drawHex(sz) {
                            drawCtx.beginPath();
                            for (let s = 0; s < 6; s++) {
                                const alpha = rotation + s * (2.0 * Math.PI / 6.0);
                                const px = rx + sz * Math.cos(alpha);
                                const py = ry + sz * Math.sin(alpha);
                                if (s === 0) drawCtx.moveTo(px, py);
                                else drawCtx.lineTo(px, py);
                            }
                            drawCtx.closePath();
                            drawCtx.stroke();
                        }
                        drawHex(size);
                        if (doubleGrid === 1) drawHex(size * 0.65);
                    }
                });
            }
            
            drawCtx.restore();
            
        } else if (layer.type === "Phyllo") {
            const count = parseInt(p.count);
            const divAngle = p.div_angle * Math.PI / 180.0;
            const radius = p.radius;
            const baseSize = p.size * baseScale;
            const decay = p.decay;
            const shapeType = parseInt(p.shape_type);
            
            for (let n = 1; n <= count; n++) {
                const rNorm = Math.sqrt(n / count);
                const r = rNorm * radius;
                const thetaN = n * divAngle + (state.globalRotation * Math.PI / 180.0);
                
                const sx = cx + r * baseScale * Math.cos(thetaN);
                const sy = cy + r * baseScale * Math.sin(thetaN);
                
                const size = baseSize * Math.pow(rNorm, decay);
                
                drawCtx.fillStyle = getColor(rNorm + colOff, palette);
                drawCtx.strokeStyle = getColor(rNorm + colOff, palette);
                drawCtx.lineWidth = 1.0 * scaleMultiplier;
                
                if (shapeType === 0) { // Circle
                    drawCtx.beginPath();
                    drawCtx.arc(sx, sy, Math.max(0.5, size), 0, 2*Math.PI);
                    drawCtx.fill();
                } else {
                    const phi = thetaN;
                    const vertices = [];
                    
                    if (shapeType === 1) { // Triangle
                        for (let k = 0; k < 3; k++) {
                            const alpha = phi + k * (2.0 * Math.PI / 3.0);
                            vertices.push({x: sx + size * Math.cos(alpha), y: sy + size * Math.sin(alpha)});
                        }
                    } else if (shapeType === 2) { // Square
                        for (let k = 0; k < 4; k++) {
                            const alpha = phi + Math.PI/4.0 + k * (2.0 * Math.PI / 4.0);
                            vertices.push({x: sx + size * Math.cos(alpha), y: sy + size * Math.sin(alpha)});
                        }
                    } else if (shapeType === 3) { // Star
                        const rOut = size;
                        const rIn = size * 0.4;
                        for (let k = 0; k < 10; k++) {
                            const alpha = phi + k * (2.0 * Math.PI / 10.0);
                            const rCurr = (k % 2 === 0) ? rOut : rIn;
                            vertices.push({x: sx + rCurr * Math.cos(alpha), y: sy + rCurr * Math.sin(alpha)});
                        }
                    } else if (shapeType === 4) { // Outward Petal/Diamond scale
                        for (let k = 0; k < 4; k++) {
                            const alpha = phi + k * (2.0 * Math.PI / 4.0);
                            const scaleY = 0.55;
                            const dx = size * Math.cos(alpha);
                            const dy = size * Math.sin(alpha) * scaleY;
                            
                            const cosR = Math.cos(phi);
                            const sinR = Math.sin(phi);
                            const rx = dx * cosR - dy * sinR;
                            const ry = dx * sinR + dy * cosR;
                            vertices.push({x: sx + rx, y: sy + ry});
                        }
                    }
                    
                    // Draw Polygon scale
                    drawCtx.beginPath();
                    vertices.forEach((pt, idx) => {
                        if (idx === 0) drawCtx.moveTo(pt.x, pt.y);
                        else drawCtx.lineTo(pt.x, pt.y);
                    });
                    drawCtx.closePath();
                    drawCtx.fill();
                }
            }
        }
    }
}

function drawBpmSpectrum(drawCtx, width, height) {
    if (state.autoplayMode !== "music" || !state.musicReaction || !state.musicReaction.bpmSpectrum || state.musicReaction.bpmSpectrum.length === 0) return;
    
    const spectrum = state.musicReaction.bpmSpectrum;
    
    // Dimensions (Fixed Layout)
    const dpr = window.devicePixelRatio || 1;
    const specWidth = 350 * dpr; // Slightly wider as requested
    const specHeight = 35 * dpr;
    const numBars = 72; // Fixed number of bars
    const barGap = 1 * dpr;
    const barWidth = (specWidth / numBars) - barGap;
    
    // Position at bottom-right corner
    const padding = 20 * dpr;
    const startX = width - specWidth - padding - 8 * dpr;
    const startY = height - padding - 15 * dpr; // Placed at the bottom, matching visual height of bottom-left indicator
    
    drawCtx.save();
    
    // Draw semi-transparent glassmorphic background box (Fixed size!)
    drawCtx.fillStyle = "rgba(15, 23, 42, 0.4)";
    drawCtx.strokeStyle = "rgba(56, 189, 248, 0.15)";
    drawCtx.lineWidth = 1 * dpr;
    drawCtx.beginPath();
    drawCtx.roundRect(startX - 8 * dpr, startY - specHeight - 12 * dpr, specWidth + 16 * dpr, specHeight + 22 * dpr, 8 * dpr);
    drawCtx.fill();
    drawCtx.stroke();
    
    // Draw Y-axis grid base line
    drawCtx.strokeStyle = "rgba(148, 163, 184, 0.15)";
    drawCtx.lineWidth = 1 * dpr;
    drawCtx.beginPath();
    drawCtx.moveTo(startX, startY);
    drawCtx.lineTo(startX + specWidth, startY);
    drawCtx.stroke();
    
    // Draw correlation/volume-at-BPM bars
    for (let i = 0; i < numBars; i++) {
        // Map bar index to a specific BPM value (50 to 220)
        const barBpm = 50 + (i / (numBars - 1)) * 170;
        
        // Find closest calculated correlation value in history
        let val = 0;
        let closestItem = spectrum[0];
        let minDist = Math.abs(spectrum[0].bpm - barBpm);
        for (let j = 1; j < spectrum.length; j++) {
            const dist = Math.abs(spectrum[j].bpm - barBpm);
            if (dist < minDist) {
                minDist = dist;
                closestItem = spectrum[j];
            }
        }
        val = closestItem ? closestItem.val : 0;
        
        const barHeight = val * specHeight;
        
        // Color gradient from blue (50 BPM) to magenta (220 BPM)
        const hue = 200 + (i / numBars) * 110;
        
        // Highlight if this bar is close to our current smoothed BPM
        const isCurrentBpm = state.musicReaction.smoothedBpm > 0 && 
            Math.abs(barBpm - state.musicReaction.smoothedBpm) < 2.5;
            
        drawCtx.fillStyle = isCurrentBpm 
            ? `hsla(${hue}, 95%, 65%, 0.95)` 
            : `hsla(${hue}, 80%, 45%, 0.55)`;
            
        drawCtx.fillRect(
            startX + i * (barWidth + barGap),
            startY - barHeight,
            barWidth,
            barHeight
        );
    }
    
    // Draw fixed BPM labels and tick marks at 60, 90, 120, 150, 180, 210
    drawCtx.fillStyle = "rgba(148, 163, 184, 0.8)";
    drawCtx.font = `${8 * dpr}px monospace`;
    drawCtx.textAlign = "center";
    
    const labelBpms = [60, 90, 120, 150, 180, 210];
    labelBpms.forEach(lblBpm => {
        // Compute exact, fixed visual coordinate: (BPM - minBPM) / Range
        const pct = (lblBpm - 50) / 170;
        const labelX = startX + pct * specWidth;
        
        drawCtx.fillText(lblBpm, labelX, startY + 8 * dpr);
        
        // Tick mark
        drawCtx.strokeStyle = "rgba(148, 163, 184, 0.3)";
        drawCtx.beginPath();
        drawCtx.moveTo(labelX, startY);
        drawCtx.lineTo(labelX, startY + 2 * dpr);
        drawCtx.stroke();
    });
    
    // Title label
    drawCtx.fillStyle = "rgba(148, 163, 184, 0.6)";
    drawCtx.font = `${7 * dpr}px monospace`;
    drawCtx.textAlign = "left";
    drawCtx.fillText("BPM TEMPO SPECTRUM", startX, startY - specHeight - 2 * dpr);
    
    drawCtx.restore();
}

function drawMandalaOnScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save original state values
    const origScale = state.globalScale;
    const origRotation = state.globalRotation;
    const origLineWidth = state.globalLineWidth;
    const origColorShift = state.globalColorShift;
    
    // Apply music reactive pulses if active
    if (state.autoplayMode === "music" && state.musicReaction) {
        state.globalScale = Math.max(0.1, state.globalScale + state.musicReaction.scalePulse + (state.musicReaction.highJitter || 0));
        state.globalRotation = (state.globalRotation + state.musicReaction.rotationAccum) % 360;
        state.globalLineWidth = Math.max(0.1, state.globalLineWidth + state.musicReaction.thicknessPulse);
        state.globalColorShift = (state.globalColorShift + state.musicReaction.colorShiftAccum) % 1.0;
    }
    
    // Render on screen (device pixels)
    const dpr = window.devicePixelRatio || 1;
    renderMandala(ctx, canvas.width, canvas.height, dpr);
    
    // Draw dynamic BPM/Periodicity spectrum overlay on the canvas
    drawBpmSpectrum(ctx, canvas.width, canvas.height);
    
    // Restore original values
    state.globalScale = origScale;
    state.globalRotation = origRotation;
    state.globalLineWidth = origLineWidth;
    state.globalColorShift = origColorShift;
    
    // Keep favorite indicators in sync
    syncHeartIconState();
}

// Rebuild Dynamic Sliders Container
function rebuildDynamicSliders() {
    const container = document.getElementById("dynamic-sliders-container");
    container.innerHTML = "";
    
    const layer = state.layers[state.currentLayerIdx];
    const p = layer.params[layer.type];
    
    const sliderDefs = {
        "Spirals": [
            {key: "arms", label: "Spiral Arms", min: 1, max: 24, step: 1, isInt: true},
            {key: "tightness", label: "Tightness (b)", min: 0.1, max: 3.0, step: 0.05},
            {key: "turns", label: "Turns", min: 0.5, max: 10.0, step: 0.1},
            {key: "wave_amp", label: "Wave Amplitude", min: 0.0, max: 0.15, step: 0.002},
            {key: "wave_freq", label: "Wave Frequency", min: 0.0, max: 20.0, step: 0.1},
            {key: "radius", label: "Max Radius", min: 0.1, max: 1.0, step: 0.01},
            {key: "depth_stroke", label: "Depth Stroke", min: 0, max: 1, step: 1, isInt: true, options: ["No", "Yes"]}
        ],
        "Cobwebs": [
            {key: "count", label: "Spoke Count", min: 3, max: 48, step: 1, isInt: true},
            {key: "rings", label: "Ring Count", min: 2, max: 30, step: 1, isInt: true},
            {key: "spacing", label: "Ring Spacing Curve", min: 0.3, max: 3.0, step: 0.05},
            {key: "sag", label: "Web Sag Factor", min: -0.4, max: 0.6, step: 0.02},
            {key: "radius", label: "Max Radius", min: 0.1, max: 1.0, step: 0.01},
            {key: "thickness", label: "Line Thickness", min: 1.0, max: 10.0, step: 0.5},
            {key: "depth_stroke", label: "Depth Stroke", min: 0, max: 1, step: 1, isInt: true, options: ["No", "Yes"]}
        ],
        "Tunnels": [
            {key: "rings", label: "Depth Rings", min: 3, max: 50, step: 1, isInt: true},
            {key: "sides", label: "Sides (0:Circle)", min: 0, max: 12, step: 1, isInt: true},
            {key: "perspective", label: "Perspective Depth", min: 0.5, max: 10.0, step: 0.1},
            {key: "twist", label: "Vortex Twist", min: -5.0, max: 5.0, step: 0.1},
            {key: "wobble", label: "Tunnel Wobble", min: 0.0, max: 0.3, step: 0.005},
            {key: "radius", label: "Max Radius", min: 0.1, max: 1.0, step: 0.01},
            {key: "depth_stroke", label: "Depth Stroke", min: 0, max: 1, step: 1, isInt: true, options: ["No", "Yes"]}
        ],
        "Lattices": [
            {key: "grid_type", label: "Style", min: 0, max: 3, step: 1, isInt: true, options: ["Square", "Tri", "Hex", "LogHex"]},
            {key: "cell_scale", label: "Cell Size", min: 0.03, max: 0.25, step: 0.005},
            {key: "rotation", label: "Grid Rotation", min: 0, max: 360, step: 1, isInt: true},
            {key: "thickness", label: "Line Thickness", min: 1.0, max: 10.0, step: 0.5},
            {key: "radius", label: "Clipping Radius", min: 0.1, max: 1.0, step: 0.01},
            {key: "double_grid", label: "Double Grid", min: 0, max: 1, step: 1, isInt: true, options: ["No", "Yes"]},
            {key: "boundaries", label: "Show Mode", min: 0, max: 1, step: 1, isInt: true, options: ["Shapes", "Boundaries"]},
            {key: "depth_stroke", label: "Depth Stroke", min: 0, max: 1, step: 1, isInt: true, options: ["No", "Yes"]}
        ],
        "Phyllo": [
            {key: "count", label: "Scale Count", min: 10, max: 1000, step: 10, isInt: true},
            {key: "div_angle", label: "Divergence Angle", min: 135.0, max: 140.0, step: 0.002},
            {key: "radius", label: "Max Radius", min: 0.1, max: 1.0, step: 0.01},
            {key: "size", label: "Scale Size", min: 0.005, max: 0.08, step: 0.001},
            {key: "decay", label: "Size Scaling (Outward)", min: 0.0, max: 1.0, step: 0.05},
            {key: "shape_type", label: "Scale Shape", min: 0, max: 4, step: 1, isInt: true, options: ["Circle", "Tri", "Sqr", "Star", "Petal"]}
        ]
    };
    
    const activeDefs = sliderDefs[layer.type] || [];
    
    // 1. Inject Dynamic Sliders / Controls
    activeDefs.forEach(def => {
        const row = document.createElement("div");
        row.className = "slider-row";
        
        const header = document.createElement("div");
        header.className = "slider-header";
        
        const labelSpan = document.createElement("span");
        labelSpan.textContent = def.label;
        header.appendChild(labelSpan);
        row.appendChild(header);
        
        // Lock Input Group Container (holds Lock button + Control element side-by-side)
        const inputGroup = document.createElement("div");
        inputGroup.className = "lock-input-group";
        
        // Add lock button
        const lockBtn = document.createElement("button");
        lockBtn.className = "lock-btn";
        const isLocked = state.locks.layerParams[state.currentLayerIdx][def.key] || false;
        lockBtn.classList.toggle("locked", isLocked);
        lockBtn.innerHTML = getLockSvg(isLocked);
        lockBtn.title = "Lock Setting from Randomization";
        lockBtn.addEventListener("click", () => {
            const locks = state.locks.layerParams[state.currentLayerIdx];
            locks[def.key] = !locks[def.key];
            lockBtn.classList.toggle("locked", locks[def.key]);
            lockBtn.innerHTML = getLockSvg(locks[def.key]);
            playLockSound(locks[def.key]);
        });
        inputGroup.appendChild(lockBtn);
        
        if (def.options) {
            // Segmented button group for discrete values
            const group = document.createElement("div");
            group.className = "segmented-control";
            group.style.flex = "1";
            
            def.options.forEach((optText, optIdx) => {
                const btn = document.createElement("button");
                btn.className = "segment-btn" + (Math.round(p[def.key]) === optIdx ? " active" : "");
                btn.textContent = optText;
                btn.addEventListener("click", (e) => {
                    pushHistoryState();
                    turnAutoplayOff(e);
                    // Update visual state of buttons in this group
                    group.querySelectorAll(".segment-btn").forEach((b, idx) => {
                        b.classList.toggle("active", idx === optIdx);
                    });
                    
                    // Update state & render
                    p[def.key] = optIdx;
                    drawMandalaOnScreen();
                });
                group.appendChild(btn);
            });
            
            inputGroup.appendChild(group);
        } else {
            // Standard range slider for continuous values
            const valSpan = document.createElement("span");
            const currVal = p[def.key];
            valSpan.textContent = def.key === "div_angle" ? currVal.toFixed(3) + "°" : (def.isInt ? parseInt(currVal) : currVal.toFixed(2));
            header.appendChild(valSpan);
            
            const input = document.createElement("input");
            input.type = "range";
            input.min = def.min;
            input.max = def.max;
            input.step = def.step;
            input.value = currVal;
            input.style.flex = "1";
            
            input.addEventListener("mousedown", () => {
                pushHistoryState();
            });
            input.addEventListener("touchstart", () => {
                pushHistoryState();
            }, {passive: true});
            
            input.addEventListener("input", (e) => {
                turnAutoplayOff(e);
                let val = parseFloat(e.target.value);
                if (def.isInt) val = Math.round(val);
                p[def.key] = val;
                valSpan.textContent = def.key === "div_angle" ? val.toFixed(3) + "°" : (def.isInt ? parseInt(val) : val.toFixed(2));
                drawMandalaOnScreen();
            });
            
            inputGroup.appendChild(input);
        }
        
        row.appendChild(inputGroup);
        container.appendChild(row);
    });
    
    // 2. Inject Color Offset Slider for this Layer
    const colRow = document.createElement("div");
    colRow.className = "slider-row";
    
    const colHeader = document.createElement("div");
    colHeader.className = "slider-header";
    colHeader.innerHTML = `<span>Layer Color Offset</span><span>${layer.color_offset.toFixed(2)}</span>`;
    colRow.appendChild(colHeader);
    
    // Lock Input Group for Color Offset
    const colInputGroup = document.createElement("div");
    colInputGroup.className = "lock-input-group";
    
    // Add lock button
    const colLockBtn = document.createElement("button");
    colLockBtn.className = "lock-btn";
    const isColLocked = state.locks.layerColorOffset[state.currentLayerIdx] || false;
    colLockBtn.classList.toggle("locked", isColLocked);
    colLockBtn.innerHTML = getLockSvg(isColLocked);
    colLockBtn.title = "Lock Setting from Randomization";
    colLockBtn.addEventListener("click", () => {
        state.locks.layerColorOffset[state.currentLayerIdx] = !state.locks.layerColorOffset[state.currentLayerIdx];
        colLockBtn.classList.toggle("locked", state.locks.layerColorOffset[state.currentLayerIdx]);
        colLockBtn.innerHTML = getLockSvg(state.locks.layerColorOffset[state.currentLayerIdx]);
        playLockSound(state.locks.layerColorOffset[state.currentLayerIdx]);
    });
    colInputGroup.appendChild(colLockBtn);
    
    const colInput = document.createElement("input");
    colInput.type = "range";
    colInput.min = "0";
    colInput.max = "1";
    colInput.step = "0.01";
    colInput.value = layer.color_offset;
    colInput.style.flex = "1";
    
    colInput.addEventListener("mousedown", () => {
        pushHistoryState();
    });
    colInput.addEventListener("touchstart", () => {
        pushHistoryState();
    }, {passive: true});
    
    colInput.addEventListener("input", (e) => {
        turnAutoplayOff(e);
        const val = parseFloat(e.target.value);
        layer.color_offset = val;
        colHeader.querySelector("span:last-child").textContent = val.toFixed(2);
        drawMandalaOnScreen();
    });
    
    colInputGroup.appendChild(colInput);
    colRow.appendChild(colInputGroup);
    container.appendChild(colRow);
}

// Global Animation Controller for Transitions
const animationController = {
    isAnimating: false,
    startTime: 0,
    duration: 1200, // milliseconds
    startState: null,
    targetState: null,
    rafId: null,
    ease: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 // easeInOutCubic
};

// Capture complete visual parameters snapshot
function captureCurrentStateSnapshot() {
    return {
        paletteIdx: state.activePaletteIdx,
        globalScale: state.globalScale,
        globalRotation: state.globalRotation,
        globalLineWidth: state.globalLineWidth,
        globalColorShift: state.globalColorShift,
        layers: state.layers.map(l => {
            const layerParams = {};
            for (let t in l.params) {
                layerParams[t] = JSON.parse(JSON.stringify(l.params[t]));
            }
            return {
                type: l.type,
                active: l.active,
                color_offset: l.color_offset,
                params: layerParams
            };
        })
    };
}

// Serialize current state for saving favorites
function getSerializedState() {
    return {
        paletteName: PALETTES[state.activePaletteIdx],
        globalScale: state.globalScale,
        globalRotation: state.globalRotation,
        globalLineWidth: state.globalLineWidth,
        globalColorShift: state.globalColorShift,
        layers: state.layers.map(l => ({
            type: l.type,
            active: l.active,
            color_offset: l.color_offset,
            params: JSON.parse(JSON.stringify(l.params[l.type]))
        }))
    };
}

// Start smooth animation transition to a target state
function startTransitionTo(targetState) {
    if (animationController.rafId) {
        cancelAnimationFrame(animationController.rafId);
    }
    
    // Clear any pending autoplay timer since we are initiating a transition now
    if (state.autoplayTimer) {
        clearTimeout(state.autoplayTimer);
        state.autoplayTimer = null;
    }
    
    // Set transition duration dynamically from current speed setting
    animationController.duration = state.transitionDuration;
    
    animationController.startState = captureCurrentStateSnapshot();
    animationController.targetState = targetState;
    animationController.startTime = performance.now();
    animationController.isAnimating = true;
    animationController.rafId = requestAnimationFrame(animateTransitionStep);
}

function turnAutoplayOff(e) {
    if (state.autoplayMode === "off") return;
    
    // Ignore programmatic events to prevent loops or autoplay cancellations on value changes
    if (e && e.isTrusted === false) return;
    
    state.autoplayMode = "off";
    if (state.autoplayTimer) {
        clearTimeout(state.autoplayTimer);
        state.autoplayTimer = null;
    }
    
    // Stop music mode and cleanup if running
    stopMusicReactiveMode();
    
    // Sync UI button group selection
    const group = document.getElementById("control-autoplay");
    if (group) {
        group.querySelectorAll(".segment-btn").forEach(btn => {
            btn.classList.toggle("active", btn.getAttribute("data-mode") === "off");
        });
    }
}

// Load custom mechanical lock/unlock click sound effect
const clickAudio = new Audio("click.mp3");

function playLockSound(isLocked) {
    try {
        // Reset to start in case of rapid clicks
        clickAudio.currentTime = 0;
        // Lock sound: normal mechanical click. Unlock sound: slightly faster/higher-pitched release click
        clickAudio.playbackRate = isLocked ? 1.0 : 1.35;
        clickAudio.play().catch(e => {
            console.warn("Audio playback blocked or user interaction required:", e);
        });
    } catch (e) {
        console.warn("Audio playback error:", e);
    }
}

// Trigger next autoplay transition
function triggerNextAutoplayTransition() {
    if (state.autoplayMode === "off") return;
    
    let target;
    if (state.autoplayMode === "favorites") {
        const favorites = getFavorites();
        const keys = Object.keys(favorites);
        if (keys.length > 0) {
            const randomKey = keys[Math.floor(Math.random() * keys.length)];
            target = makeTargetStateFromFav(favorites[randomKey]);
        } else {
            target = getRandomTargetState();
        }
    } else {
        target = getRandomTargetState();
    }
    
    startTransitionTo(target);
}

// Push a snapshot of the current state onto the history stack for Undo
function pushHistoryState() {
    if (stateHistory.length >= MAX_HISTORY_LEN) {
        stateHistory.shift();
    }
    stateHistory.push(captureCurrentStateSnapshot());
    
    // Enable the Undo button visually
    const undoBtn = document.getElementById("btn-undo");
    if (undoBtn) {
        undoBtn.disabled = false;
    }
}

// Apply Undo to morph back to the previous snapshot
function undoLastAction() {
    if (stateHistory.length === 0) return;
    
    const prevState = stateHistory.pop();
    
    // Disable Undo button if stack is empty
    const undoBtn = document.getElementById("btn-undo");
    if (undoBtn && stateHistory.length === 0) {
        undoBtn.disabled = true;
    }
    
    startTransitionTo(prevState);
    showToast("Undo applied");
}

// Single step of transition interpolation loop
function animateTransitionStep() {
    if (!animationController.isAnimating) return;
    
    const elapsed = performance.now() - animationController.startTime;
    let t = Math.min(elapsed / animationController.duration, 1.0);
    
    const easedT = animationController.ease(t);
    const start = animationController.startState;
    const target = animationController.targetState;
    
    // Interpolate Globals
    state.globalScale = start.globalScale + (target.globalScale - start.globalScale) * easedT;
    state.globalRotation = start.globalRotation + (target.globalRotation - start.globalRotation) * easedT;
    state.globalLineWidth = start.globalLineWidth + (target.globalLineWidth - start.globalLineWidth) * easedT;
    state.globalColorShift = start.globalColorShift + (target.globalColorShift - start.globalColorShift) * easedT;
    
    // Update global visual indicators
    const scaleSlider = document.getElementById("slide-global-scale");
    if (scaleSlider) {
        scaleSlider.value = state.globalScale;
        document.getElementById("val-global-scale").textContent = state.globalScale.toFixed(2);
    }
    const thickSlider = document.getElementById("slide-global-thick");
    if (thickSlider) {
        thickSlider.value = state.globalLineWidth;
        document.getElementById("val-global-thick").textContent = state.globalLineWidth.toFixed(2);
    }
    const shiftSlider = document.getElementById("slide-global-shift");
    if (shiftSlider) {
        shiftSlider.value = state.globalColorShift;
        document.getElementById("val-global-shift").textContent = state.globalColorShift.toFixed(2);
    }
    const rotSlider = document.getElementById("slide-global-rot");
    if (rotSlider) {
        rotSlider.value = Math.round(state.globalRotation);
        document.getElementById("val-global-rot").textContent = Math.round(state.globalRotation) + "°";
    }
    
    // Palette shifts at midpoint
    state.activePaletteIdx = t >= 0.5 ? target.paletteIdx : start.paletteIdx;
    document.querySelectorAll("#control-palette .segment-btn").forEach(b => {
        b.classList.toggle("active", parseInt(b.getAttribute("data-palette-idx")) === state.activePaletteIdx);
    });
    
    // Interpolate Layers
    for (let i = 0; i < 4; i++) {
        const sL = start.layers[i];
        const tL = target.layers[i];
        const curL = state.layers[i];
        
        if (t >= 0.5) {
            curL.active = tL.active;
            curL.type = tL.type;
        } else {
            curL.active = sL.active;
            curL.type = sL.type;
        }
        
        curL.color_offset = sL.color_offset + (tL.color_offset - sL.color_offset) * easedT;
        
        for (let type in curL.params) {
            const sParams = sL.params[type];
            const tParams = tL.params[type];
            const curParams = curL.params[type];
            
            for (let key in curParams) {
                const startVal = sParams[key];
                const targetVal = tParams[key];
                
                const discreteKeys = {
                    "Spirals": ["depth_stroke"],
                    "Cobwebs": ["depth_stroke"],
                    "Tunnels": ["depth_stroke"],
                    "Lattices": ["grid_type", "double_grid", "boundaries", "depth_stroke"],
                    "Phyllo": ["shape_type"]
                };
                
                const isDiscrete = discreteKeys[type] && discreteKeys[type].includes(key);
                
                if (isDiscrete) {
                    curParams[key] = t >= 0.5 ? targetVal : startVal;
                } else {
                    curParams[key] = startVal + (targetVal - startVal) * easedT;
                }
            }
        }
    }
    
    // UI active checks & tabs
    document.getElementById("chk-layer-active").checked = state.layers[state.currentLayerIdx].active;
    
    // Redraw
    drawMandalaOnScreen();
    
    if (t < 1.0) {
        animationController.rafId = requestAnimationFrame(animateTransitionStep);
    } else {
        animationController.isAnimating = false;
        
        // Sync panel tabs representation without triggering click event loops
        const activeLayer = state.layers[state.currentLayerIdx];
        document.querySelectorAll("#layer-tabs .tab-btn").forEach((btn, idx) => {
            btn.classList.toggle("active", idx === state.currentLayerIdx);
        });
        document.querySelectorAll("#type-tabs .tab-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.type === activeLayer.type);
        });
        
        rebuildDynamicSliders();
        
        // Handle Autoplay morph looping
        if (state.autoplayMode !== "off" && state.autoplayMode !== "music") {
            if (state.autoplayTimer) clearTimeout(state.autoplayTimer);
            state.autoplayTimer = setTimeout(() => {
                triggerNextAutoplayTransition();
            }, 1500); // 1.5 second pause at rest
        }
        
        // Sync heart icon visual state when morph completes
        syncHeartIconState();
    }
}

// Convert favorite config into visual target state
function makeTargetStateFromFav(fav) {
    const target = captureCurrentStateSnapshot();
    
    const palIdx = PALETTES.indexOf(fav.paletteName);
    if (palIdx !== -1) target.paletteIdx = palIdx;
    
    target.globalScale = fav.globalScale ?? 1.0;
    target.globalRotation = fav.globalRotation ?? 0;
    target.globalLineWidth = fav.globalLineWidth ?? 1.5;
    target.globalColorShift = fav.globalColorShift ?? 0.0;
    
    fav.layers.forEach((fL, idx) => {
        const tL = target.layers[idx];
        tL.type = fL.type;
        tL.active = fL.active;
        tL.color_offset = fL.color_offset;
        for (let k in fL.params) {
            tL.params[fL.type][k] = fL.params[k];
        }
    });
    
    return target;
}

// Generate a completely randomized visual target state snapshot, respecting lock settings
function getRandomTargetState() {
    const target = captureCurrentStateSnapshot();
    
    // Global lock checks
    if (!state.locks.globalScale) {
        target.globalScale = parseFloat((Math.random() * 1.6 + 0.2).toFixed(2));
    }
    if (!state.locks.globalLineWidth) {
        target.globalLineWidth = parseFloat((Math.random() * 1.4 + 0.6).toFixed(2));
    }
    if (!state.locks.globalColorShift) {
        target.globalColorShift = parseFloat(Math.random().toFixed(2));
    }
    if (!state.locks.globalRotation) {
        target.globalRotation = Math.floor(Math.random() * 360);
    }
    if (!state.locks.palette) {
        target.paletteIdx = Math.floor(Math.random() * PALETTES.length);
    }
    
    const types = ["Spirals", "Cobwebs", "Tunnels", "Lattices", "Phyllo"];
    
    target.layers.forEach((layer, idx) => {
        // Layer active state randomization lock
        if (!state.locks.layerActive[idx]) {
            // Layer 1 is always active, others random
            layer.active = idx === 0 ? true : (Math.random() < 0.65);
        }
        
        // Layer type randomization lock
        if (!state.locks.layerType[idx]) {
            layer.type = types[Math.floor(Math.random() * types.length)];
        }
        
        // Layer color offset randomization lock
        if (!state.locks.layerColorOffset[idx]) {
            layer.color_offset = Math.random();
        }
        
        const pLocks = state.locks.layerParams[idx];
        
        // Spirals random
        if (!pLocks.arms) layer.params.Spirals.arms = Math.floor(Math.random() * 12) + 1;
        if (!pLocks.tightness) layer.params.Spirals.tightness = parseFloat((Math.random() * 1.5 + 0.5).toFixed(2));
        if (!pLocks.turns) layer.params.Spirals.turns = parseFloat((Math.random() * 5 + 1.5).toFixed(2));
        if (!pLocks.wave_amp) layer.params.Spirals.wave_amp = Math.random() < 0.6 ? parseFloat((Math.random() * 0.08).toFixed(3)) : 0.0;
        if (!pLocks.wave_freq) layer.params.Spirals.wave_freq = parseFloat((Math.random() * 10 + 2).toFixed(1));
        if (!pLocks.radius) layer.params.Spirals.radius = parseFloat((Math.random() * 0.55 + 0.4).toFixed(2));
        if (!pLocks.depth_stroke) layer.params.Spirals.depth_stroke = Math.random() < 0.5 ? 1 : 0;
        
        // Cobwebs random
        if (!pLocks.count) layer.params.Cobwebs.count = Math.floor(Math.random() * 20) + 4;
        if (!pLocks.rings) layer.params.Cobwebs.rings = Math.floor(Math.random() * 15) + 3;
        if (!pLocks.spacing) layer.params.Cobwebs.spacing = parseFloat((Math.random() * 1.1 + 0.7).toFixed(2));
        if (!pLocks.sag) layer.params.Cobwebs.sag = parseFloat((Math.random() * 0.6 - 0.15).toFixed(2));
        if (!pLocks.radius) layer.params.Cobwebs.radius = parseFloat((Math.random() * 0.55 + 0.4).toFixed(2));
        if (!pLocks.thickness) layer.params.Cobwebs.thickness = parseFloat((Math.random() * 1.7 + 0.8).toFixed(1));
        if (!pLocks.depth_stroke) layer.params.Cobwebs.depth_stroke = Math.random() < 0.5 ? 1 : 0;
        
        // Tunnels random
        if (!pLocks.rings) layer.params.Tunnels.rings = Math.floor(Math.random() * 25) + 5;
        if (!pLocks.sides) layer.params.Tunnels.sides = [0, 0, 3, 4, 5, 6, 8][Math.floor(Math.random() * 7)];
        if (!pLocks.perspective) layer.params.Tunnels.perspective = parseFloat((Math.random() * 5 + 1).toFixed(1));
        if (!pLocks.twist) layer.params.Tunnels.twist = Math.random() < 0.6 ? parseFloat((Math.random() * 5 - 2.5).toFixed(1)) : 0.0;
        if (!pLocks.wobble) layer.params.Tunnels.wobble = Math.random() < 0.5 ? parseFloat((Math.random() * 0.15).toFixed(3)) : 0.0;
        if (!pLocks.radius) layer.params.Tunnels.radius = parseFloat((Math.random() * 0.45 + 0.5).toFixed(2));
        if (!pLocks.depth_stroke) layer.params.Tunnels.depth_stroke = Math.random() < 0.5 ? 1 : 0;
        
        // Lattices random
        if (!pLocks.grid_type) layer.params.Lattices.grid_type = Math.floor(Math.random() * 4);
        if (!pLocks.cell_scale) layer.params.Lattices.cell_scale = parseFloat((Math.random() * 0.11 + 0.05).toFixed(3));
        if (!pLocks.rotation) layer.params.Lattices.rotation = Math.floor(Math.random() * 180);
        if (!pLocks.thickness) layer.params.Lattices.thickness = parseFloat((Math.random() * 1.4 + 0.8).toFixed(1));
        if (!pLocks.radius) layer.params.Lattices.radius = parseFloat((Math.random() * 0.55 + 0.4).toFixed(2));
        if (!pLocks.double_grid) layer.params.Lattices.double_grid = Math.random() < 0.25 ? 1 : 0;
        if (!pLocks.boundaries) layer.params.Lattices.boundaries = Math.random() < 0.5 ? 1 : 0;
        if (!pLocks.depth_stroke) layer.params.Lattices.depth_stroke = Math.random() < 0.5 ? 1 : 0;
        
        // Phyllo random
        if (!pLocks.count) layer.params.Phyllo.count = Math.floor(Math.random() * 50) * 10 + 100;
        if (!pLocks.div_angle) layer.params.Phyllo.div_angle = Math.random() < 0.8 ? parseFloat((137.508 + Math.random() * 0.2 - 0.1).toFixed(3)) : parseFloat((Math.random() * 5 + 135).toFixed(3));
        if (!pLocks.radius) layer.params.Phyllo.radius = parseFloat((Math.random() * 0.55 + 0.4).toFixed(2));
        if (!pLocks.size) layer.params.Phyllo.size = parseFloat((Math.random() * 0.033 + 0.012).toFixed(3));
        if (!pLocks.decay) layer.params.Phyllo.decay = parseFloat((Math.random() * 0.6 + 0.2).toFixed(2));
        if (!pLocks.shape_type) layer.params.Phyllo.shape_type = Math.floor(Math.random() * 5);
    });
    
    return target;
}

// Randomizer (Manual Trigger)
function randomizeDesign(e) {
    pushHistoryState();
    turnAutoplayOff(e);
    const target = getRandomTargetState();
    startTransitionTo(target);
}

// Local Storage Favorites Persistence
function getFavorites() {
    const raw = localStorage.getItem("form_constants_favorites");
    if (!raw) return {};
    try {
        return JSON.parse(raw);
    } catch (e) {
        return {};
    }
}

function saveFavorites(favorites) {
    localStorage.setItem("form_constants_favorites", JSON.stringify(favorites));
    populateFavoritesDropdown();
}

function populateFavoritesDropdown() {
    const select = document.getElementById("select-favorites");
    if (!select) return;
    select.innerHTML = "";
    
    const favorites = getFavorites();
    const keys = Object.keys(favorites);
    
    if (keys.length === 0) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.disabled = true;
        opt.selected = true;
        opt.textContent = "No saved favorites";
        select.appendChild(opt);
        document.getElementById("btn-delete-favorite").disabled = true;
    } else {
        const optPlaceholder = document.createElement("option");
        optPlaceholder.value = "";
        optPlaceholder.disabled = true;
        optPlaceholder.selected = true;
        optPlaceholder.textContent = "-- Select a favorite --";
        select.appendChild(optPlaceholder);
        
        keys.forEach(name => {
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            select.appendChild(opt);
        });
        document.getElementById("btn-delete-favorite").disabled = false;
    }
}

function handleSaveFavorite() {
    const name = prompt("Enter a name for your favorite configuration:", `Favorite #${Object.keys(getFavorites()).length + 1}`);
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    
    const favorites = getFavorites();
    favorites[trimmed] = getSerializedState();
    saveFavorites(favorites);
    
    document.getElementById("select-favorites").value = trimmed;
    showToast(`Saved "${trimmed}" to Favorites!`);
}

function handleDeleteFavorite() {
    const select = document.getElementById("select-favorites");
    const name = select.value;
    if (!name) return;
    
    if (confirm(`Delete favorite "${name}"?`)) {
        const favorites = getFavorites();
        delete favorites[name];
        saveFavorites(favorites);
        showToast(`Deleted "${name}"`);
    }
}

function handleSelectFavoriteChange(e) {
    const name = e.target.value;
    if (!name) return;
    
    const favorites = getFavorites();
    const fav = favorites[name];
    if (!fav) return;
    
    startTransitionTo(makeTargetStateFromFav(fav));
    showToast(`Loaded "${name}"`);
}

// Check if the current design matches any of the saved favorites
function isCurrentDesignFavorited() {
    const favorites = getFavorites();
    const currentState = getSerializedState();
    
    // Helper to compare numbers within a small tolerance
    const approxEqual = (a, b, tol = 0.005) => Math.abs(a - b) < tol;
    
    for (let name in favorites) {
        const fav = favorites[name];
        
        // 1. Compare globals
        if (fav.paletteName !== currentState.paletteName) continue;
        if (!approxEqual(fav.globalScale, currentState.globalScale)) continue;
        if (!approxEqual(fav.globalLineWidth, currentState.globalLineWidth)) continue;
        if (!approxEqual(fav.globalColorShift, currentState.globalColorShift)) continue;
        if (Math.abs((fav.globalRotation ?? 0) - (currentState.globalRotation ?? 0)) > 3) continue;
        
        // 2. Compare layers
        let layersMatch = true;
        for (let i = 0; i < currentState.layers.length; i++) {
            const curL = currentState.layers[i];
            const favL = fav.layers[i];
            
            if (curL.type !== favL.type) { layersMatch = false; break; }
            if (curL.active !== favL.active) { layersMatch = false; break; }
            if (!approxEqual(curL.color_offset, favL.color_offset)) { layersMatch = false; break; }
            
            // Compare the active parameters
            let paramsMatch = true;
            const curParams = curL.params;
            const favParams = favL.params;
            for (let paramKey in curParams) {
                const curVal = curParams[paramKey];
                const favVal = favParams[paramKey];
                if (typeof curVal === 'number' && typeof favVal === 'number') {
                    if (!approxEqual(curVal, favVal)) { paramsMatch = false; break; }
                } else if (curVal !== favVal) {
                    paramsMatch = false;
                    break;
                }
            }
            if (!paramsMatch) { layersMatch = false; break; }
        }
        
        if (layersMatch) {
            return name;
        }
    }
    return null;
}

// Sync the corner heart icon and select dropdown state
function syncHeartIconState() {
    const heartBtn = document.getElementById("btn-floating-heart");
    if (!heartBtn) return;
    const heartSvg = heartBtn.querySelector(".heart-icon");
    if (!heartSvg) return;
    
    const matchedFavName = isCurrentDesignFavorited();
    if (matchedFavName) {
        heartSvg.classList.add("filled");
        heartBtn.title = `Remove "${matchedFavName}" from Favorites`;
        
        const select = document.getElementById("select-favorites");
        if (select && select.value !== matchedFavName) {
            select.value = matchedFavName;
        }
    } else {
        heartSvg.classList.remove("filled");
        heartBtn.title = "Save to Favorites";
        
        const select = document.getElementById("select-favorites");
        if (select && select.value !== "") {
            select.value = "";
        }
    }
}

// Save or remove current design from favorites without prompts
function toggleFavorite() {
    const matchedName = isCurrentDesignFavorited();
    const favorites = getFavorites();
    
    if (matchedName) {
        // Already favorited, so remove it
        delete favorites[matchedName];
        saveFavorites(favorites);
        showToast("Removed from Favorites");
    } else {
        // Not favorited, save it with an auto-generated name
        const numFavs = Object.keys(favorites).length;
        const newName = `Favorite #${numFavs + 1}`;
        favorites[newName] = getSerializedState();
        saveFavorites(favorites);
        
        const select = document.getElementById("select-favorites");
        if (select) select.value = newName;
        
        showToast(`Saved to Favorites!`);
    }
    syncHeartIconState();
}

// Enter/Exit Fullscreen Mode
function toggleFullscreen() {
    const container = document.getElementById("app-container");
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
    
    if (!isFullscreen) {
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        }
        container.classList.add("fullscreen-mode");
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        container.classList.remove("fullscreen-mode");
    }
    
    setTimeout(resizeCanvas, 150);
}

// Audio Beat Detection Initializer
async function initMusicAnalysis() {
    if (state.musicReaction.audioContext) {
        if (state.musicReaction.audioContext.state === "suspended") {
            await state.musicReaction.audioContext.resume();
        }
        return true;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: true
            }, 
            video: false 
        });
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContextClass();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        
        state.musicReaction.audioContext = ctx;
        state.musicReaction.analyser = analyser;
        state.musicReaction.audioSource = source;
        return true;
    } catch (err) {
        console.error("Microphone access denied or error:", err);
        showToast("Microphone access required for Music Mode!");
        return false;
    }
}

function startMusicReactiveMode() {
    initMusicAnalysis().then(success => {
        if (success) {
            const indicator = document.getElementById("music-indicator");
            if (indicator) indicator.classList.remove("hidden");
            
            if (!state.musicReaction.rafId) {
                // Clear any transition timeouts to hand control to the music animation loop
                if (state.autoplayTimer) {
                    clearTimeout(state.autoplayTimer);
                    state.autoplayTimer = null;
                }
                state.musicReaction.rafId = requestAnimationFrame(musicAnalysisLoop);
            }
            showToast("Music Mode Active!");
        } else {
            // Revert autoplay back to Off if mic is denied
            const offBtn = document.querySelector('#control-autoplay button[data-mode="off"]');
            if (offBtn) offBtn.click();
        }
    });
}

function stopMusicReactiveMode() {
    const indicator = document.getElementById("music-indicator");
    if (indicator) indicator.classList.add("hidden");
    
    if (state.musicReaction.rafId) {
        cancelAnimationFrame(state.musicReaction.rafId);
        state.musicReaction.rafId = null;
    }
    
    // Reset offsets and arrays
    state.musicReaction.scalePulse = 0.0;
    state.musicReaction.thicknessPulse = 0.0;
    state.musicReaction.colorShiftAccum = 0.0;
    state.musicReaction.rotationAccum = 0.0;
    state.musicReaction.highJitter = 0.0;
    
    state.musicReaction.beatTimes = [];
    state.musicReaction.smoothedBpm = 0.0;
    state.musicReaction.lastBpmUpdateTime = 0;
    
    state.musicReaction.midsHistory = [];
    state.musicReaction.highsHistory = [];
    state.musicReaction.lastMidBeatTime = 0;
    state.musicReaction.lastHighBeatTime = 0;
    state.musicReaction.midBeatCount = 0;
    state.musicReaction.highBeatCount = 0;
    state.musicReaction.energyHistory = [];
    state.musicReaction.lastFrameTime = 0;
    state.musicReaction.lastStrongBpm = 0.0;
    state.musicReaction.lastStrongBpmTime = 0;
    
    drawMandalaOnScreen();
}

// Estimate BPM using Autocorrelation on the energy envelope history (industry-standard DJ algorithm approach)
function estimateBpmByAutocorrelation() {
    const history = state.musicReaction.energyHistory;
    const fps = state.musicReaction.fps || 60;
    const now = performance.now();
    
    // Need at least 2.5 seconds of history to identify tempo
    const minRequiredSamples = Math.round(2.5 * fps);
    const minLag = Math.round(0.27 * fps); // ~220 BPM upper limit
    const maxLag = Math.round(1.2 * fps);  // ~50 BPM lower limit
    
    if (history.length < minRequiredSamples) {
        state.musicReaction.bpmSpectrum = [];
        return 0;
    }
    
    const N = history.length;
    
    // Calculate mean and variance to detect flat signal (silence/ambient noise)
    const mean = history.reduce((sum, v) => sum + v, 0) / N;
    const variance = history.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / N;
    
    const isQuietOrFlat = (mean < 12.0 || variance < 20.0);
    
    // Subtract mean to remove DC offset and isolate AC variation
    const acHistory = history.map(v => v - mean);
    
    const correlations = new Float32Array(maxLag + 2);
    let maxCorrelation = -Infinity;
    let bestLag = 0;
    
    for (let lag = minLag; lag <= maxLag; lag++) {
        let sum = 0;
        let count = 0;
        for (let i = lag; i < N; i++) {
            sum += acHistory[i] * acHistory[i - lag];
            count++;
        }
        const corr = sum / count;
        correlations[lag] = corr;
        
        if (corr > maxCorrelation) {
            maxCorrelation = corr;
            bestLag = lag;
        }
    }
    
    // Peak Picking: find the first local maximum (fundamental beat tempo) rather than just the absolute highest peak
    let peakLag = bestLag;
    for (let lag = minLag + 1; lag < maxLag; lag++) {
        const prev = correlations[lag - 1];
        const curr = correlations[lag];
        const next = correlations[lag + 1];
        
        // Is it a local peak?
        if (curr > prev && curr > next && curr > 0) {
            // Must have significant strength (at least 35% of absolute max correlation)
            if (curr > maxCorrelation * 0.35) {
                peakLag = lag;
                break;
            }
        }
    }
    
    // Handle quiet/indistinct segments (tempo hold memory)
    if (isQuietOrFlat) {
        if (state.musicReaction.lastStrongBpm > 0 && (now - state.musicReaction.lastStrongBpmTime < 8000)) {
            // We have a recent strong BPM memory - fall back to it!
            const elapsed = now - state.musicReaction.lastStrongBpmTime;
            const dimFactor = Math.max(0.05, 1.0 - (elapsed / 2000.0)); // Dim spectrum over 2 seconds
            
            const correlationArray = [];
            for (let lag = minLag; lag <= maxLag; lag++) {
                const bpmVal = (60.0 * fps) / lag;
                const val = (maxCorrelation > 0) ? Math.max(0, correlations[lag] / maxCorrelation) * dimFactor : 0.0;
                correlationArray.push({ bpm: bpmVal, val: val });
            }
            correlationArray.sort((a, b) => a.bpm - b.bpm);
            state.musicReaction.bpmSpectrum = correlationArray;
            
            return state.musicReaction.lastStrongBpm;
        }
        
        // Otherwise, no memory or memory expired: clear and return 0
        state.musicReaction.bpmSpectrum = [];
        return 0;
    }
    
    // Convert lag in frames to BPM
    const bpm = (60.0 * fps) / peakLag;
    
    // If tempo calculation is valid, record this as a strong detection
    if (bpm >= 50 && bpm <= 220) {
        state.musicReaction.lastStrongBpm = bpm;
        state.musicReaction.lastStrongBpmTime = now;
    }
    
    // Save correlation spectrum data for rendering
    const correlationArray = [];
    for (let lag = minLag; lag <= maxLag; lag++) {
        const bpmVal = (60.0 * fps) / lag;
        const val = (maxCorrelation > 0) ? Math.max(0, correlations[lag] / maxCorrelation) : 0.0;
        correlationArray.push({ bpm: bpmVal, val: val });
    }
    correlationArray.sort((a, b) => a.bpm - b.bpm);
    state.musicReaction.bpmSpectrum = correlationArray;
    
    return bpm;
}

function musicAnalysisLoop() {
    if (state.autoplayMode !== "music") {
        stopMusicReactiveMode();
        return;
    }
    
    // Track FPS dynamically for hardware/frequency independence
    const now = performance.now();
    if (state.musicReaction.lastFrameTime) {
        const elapsed = now - state.musicReaction.lastFrameTime;
        const instantFps = elapsed > 0 ? 1000.0 / elapsed : 60.0;
        // Exponential smoothing for FPS
        state.musicReaction.fps = state.musicReaction.fps * 0.98 + instantFps * 0.02;
    }
    state.musicReaction.lastFrameTime = now;
    
    const analyser = state.musicReaction.analyser;
    if (analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        
        // 1. EXTRACT BANDS
        // Bass energy: target kick drum frequencies (bins 1-3 correspond to ~86Hz - ~258Hz)
        const bassEnergy = (dataArray[1] + dataArray[2] + dataArray[3]) / 3;
        
        // Mids energy: target snare/claps (bins 6-16 correspond to ~516Hz - ~1376Hz)
        const midsEnergy = (dataArray[6] + dataArray[8] + dataArray[10] + dataArray[12] + dataArray[14]) / 5;
        
        // Highs energy: target hi-hats/sizzle (bins 18-32 correspond to ~1548Hz - ~2752Hz)
        const highsEnergy = (dataArray[18] + dataArray[22] + dataArray[26] + dataArray[30]) / 4;
        
        // 1.5 ACCUMULATE ENERGY HISTORY FOR AUTOCORRELATION
        // Composite energy envelope represents overall rhythm (bass kicks + mid snares)
        const instantEnergy = bassEnergy * 1.5 + midsEnergy * 0.8;
        state.musicReaction.energyHistory.push(instantEnergy);
        
        // Keep 4.5 seconds of energy history
        const maxSamples = Math.round(4.5 * state.musicReaction.fps);
        if (state.musicReaction.energyHistory.length > maxSamples) {
            state.musicReaction.energyHistory.shift();
        }
        
        // 2. BASS (KICK) BEAT DETECTION
        const bassHistory = state.musicReaction.history;
        let avgBass = 0;
        if (bassHistory.length > 0) {
            avgBass = bassHistory.reduce((sum, v) => sum + v, 0) / bassHistory.length;
        }
        bassHistory.push(bassEnergy);
        if (bassHistory.length > state.musicReaction.historyMax) bassHistory.shift();
        
        const timeSinceLastBass = now - state.musicReaction.lastBeatTime;
        const bassThreshold = 1.15;
        const minBassFloor = 28;
        let isBassBeat = false;
        
        if (bassEnergy > minBassFloor && bassEnergy > avgBass * bassThreshold && timeSinceLastBass > 280) {
            state.musicReaction.lastBeatTime = now;
            state.musicReaction.beatCount++;
            isBassBeat = true;
            
            // Record beat timestamp
            state.musicReaction.beatTimes.push(now);
            if (state.musicReaction.beatTimes.length > 24) {
                state.musicReaction.beatTimes.shift();
            }
            
            // Trigger Bass pulses
            state.musicReaction.scalePulse = 0.18;
            state.musicReaction.colorShiftAccum = (state.musicReaction.colorShiftAccum + 0.05) % 1.0;
            
            // Every 16 beats, transition to a new design (phrase change)
            if (state.musicReaction.beatCount % 16 === 0 && !animationController.isAnimating) {
                triggerNextAutoplayTransition();
            }
        }
        
        // 3. MIDS (SNARE/CLAP) BEAT DETECTION
        const midsHistory = state.musicReaction.midsHistory;
        let avgMids = 0;
        if (midsHistory.length > 0) {
            avgMids = midsHistory.reduce((sum, v) => sum + v, 0) / midsHistory.length;
        }
        midsHistory.push(midsEnergy);
        if (midsHistory.length > 30) midsHistory.shift();
        
        const timeSinceLastMid = now - state.musicReaction.lastMidBeatTime;
        const midsThreshold = 1.25;
        const minMidsFloor = 20;
        let isMidBeat = false;
        
        if (midsEnergy > minMidsFloor && midsEnergy > avgMids * midsThreshold && timeSinceLastMid > 320) {
            state.musicReaction.lastMidBeatTime = now;
            state.musicReaction.midBeatCount++;
            isMidBeat = true;
            
            // Trigger Mid pulses
            state.musicReaction.thicknessPulse = 1.0;
            state.musicReaction.rotationAccum = (state.musicReaction.rotationAccum + 4.5) % 360;
        }
        
        // 4. HIGHS (HI-HAT/SHAKER) BEAT DETECTION
        const highsHistory = state.musicReaction.highsHistory;
        let avgHighs = 0;
        if (highsHistory.length > 0) {
            avgHighs = highsHistory.reduce((sum, v) => sum + v, 0) / highsHistory.length;
        }
        highsHistory.push(highsEnergy);
        if (highsHistory.length > 30) highsHistory.shift();
        
        const timeSinceLastHigh = now - state.musicReaction.lastHighBeatTime;
        const highsThreshold = 1.35;
        const minHighsFloor = 10;
        let isHighBeat = false;
        
        if (highsEnergy > minHighsFloor && highsEnergy > avgHighs * highsThreshold && timeSinceLastHigh > 180) {
            state.musicReaction.lastHighBeatTime = now;
            state.musicReaction.highBeatCount++;
            isHighBeat = true;
            
            // Trigger High pulses (slight scale contraction pulse)
            state.musicReaction.scalePulse -= 0.03;
        }
        
        // 5. DECAYS & ROTATIONS
        state.musicReaction.scalePulse *= 0.90;
        state.musicReaction.thicknessPulse *= 0.88;
        
        state.musicReaction.rotationAccum = (state.musicReaction.rotationAccum + 0.3 + (midsEnergy / 255) * 1.2) % 360;
        state.musicReaction.highJitter = (highsEnergy / 255) * 0.04 * Math.sin(now / 50);
        
        // 6. UPDATE STATUS & BPM DISPLAY
        const statusText = document.querySelector("#music-indicator .music-status");
        const debugText = document.querySelector("#music-indicator .music-debug-info");
        
        // Always run the autocorrelation algorithm on every single frame to keep the spectrum rendering live
        const calculatedBpm = estimateBpmByAutocorrelation();
        
        if (statusText) {
            const meanEnergy = state.musicReaction.energyHistory.length > 0
                ? state.musicReaction.energyHistory.reduce((sum, v) => sum + v, 0) / state.musicReaction.energyHistory.length
                : 0;
                
            let variance = 0;
            if (state.musicReaction.energyHistory.length > 0) {
                variance = state.musicReaction.energyHistory.reduce((sum, v) => sum + Math.pow(v - meanEnergy, 2), 0) / state.musicReaction.energyHistory.length;
            }
                
            if (meanEnergy < 12.0 || variance < 20.0 || calculatedBpm === 0) {
                // Signal is quiet, OR signal is flat noise (very low variance), OR calculation failed/returned 0
                statusText.textContent = "No beat detected";
                state.musicReaction.smoothedBpm = 0.0;
            } else {
                if (calculatedBpm >= 50 && calculatedBpm <= 220) {
                    // Apply heavy Exponential Moving Average (EMA) to prevent visual jumps
                    if (state.musicReaction.smoothedBpm === 0) {
                        state.musicReaction.smoothedBpm = calculatedBpm;
                    } else {
                        state.musicReaction.smoothedBpm = state.musicReaction.smoothedBpm * 0.985 + calculatedBpm * 0.015;
                    }
                    
                    // Throttle visual label updates to once every 1200ms
                    if (now - state.musicReaction.lastBpmUpdateTime > 1200) {
                        state.musicReaction.lastBpmUpdateTime = now;
                        const displayBpm = Math.round(state.musicReaction.smoothedBpm);
                        statusText.textContent = `${displayBpm} BPM detected`;
                    }
                } else if (now - state.musicReaction.lastBpmUpdateTime > 1200) {
                    statusText.textContent = "Detecting BPM...";
                }
            }
        }
        
        if (debugText) {
            const rawB = Math.round(bassEnergy);
            const thrB = Math.round(avgBass * bassThreshold);
            const rawM = Math.round(midsEnergy);
            const thrM = Math.round(avgMids * midsThreshold);
            const rawH = Math.round(highsEnergy);
            const thrH = Math.round(avgHighs * highsThreshold);
            const activeFps = Math.round(state.musicReaction.fps);
            
            // Format telemetry for all three frequency bands plus active framerate (FPS)
            debugText.textContent = `B:${rawB}/${thrB} | M:${rawM}/${thrM} | H:${rawH}/${thrH} | FPS:${activeFps}`;
        }
    }
    
    drawMandalaOnScreen();
    
    state.musicReaction.rafId = requestAnimationFrame(musicAnalysisLoop);
}

// Success Toast Notification Trigger
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    
    if (state.toastTimer) clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => {
        toast.classList.add("hidden");
    }, 4000);
}

// High-Res Export Routine
function exportDesign(darkBg = false) {
    showToast("Generating high-res export (4500x4500 px)...");
    
    setTimeout(() => {
        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = 4500;
        exportCanvas.height = 4500;
        const exportCtx = exportCanvas.getContext("2d");
        
        if (darkBg) {
            exportCtx.fillStyle = "#06080d"; // Midnight slate dark background
            exportCtx.fillRect(0, 0, 4500, 4500);
        } else {
            exportCtx.clearRect(0, 0, 4500, 4500);
        }
        
        // 2x SSAA: Render at 9000x9000 and downscale to 4500x4500
        const ssCanvas = document.createElement("canvas");
        ssCanvas.width = 9000;
        ssCanvas.height = 9000;
        const ssCtx = ssCanvas.getContext("2d");
        
        const scalePx = 4500 * state.globalScale * 0.90; // scale radius (radius limit * scale)
        renderMandala(ssCtx, 9000, 9000, state.globalLineWidth * 5.0);
        
        // Downscale onto the export canvas
        exportCtx.drawImage(ssCanvas, 0, 0, 9000, 9000, 0, 0, 4500, 4500);
        
        // Trigger download
        const url = exportCanvas.toDataURL("image/png");
        const a = document.createElement("a");
        const timestamp = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '');
        a.href = url;
        a.download = `form_constant_${darkBg ? 'dark' : 'transparent'}_${timestamp}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showToast(`[✓] Saved: ${a.download}`);
    }, 150);
}

// Bind Static DOM Elements Events
function bindEvents() {
    // 1. Layer tab switches
    document.querySelectorAll("#layer-tabs button").forEach(btn => {
        btn.addEventListener("click", (e) => {
            pushHistoryState();
            turnAutoplayOff(e);
            document.querySelectorAll("#layer-tabs button").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            
            state.currentLayerIdx = parseInt(e.target.getAttribute("data-layer"));
            const layer = state.layers[state.currentLayerIdx];
            
            // Check checkbox active
            document.getElementById("chk-layer-active").checked = layer.active;
            
            // Switch layer type secondary tabs active class
            document.querySelectorAll("#type-tabs button").forEach(b => {
                b.classList.remove("active");
                if (b.getAttribute("data-type") === layer.type) {
                    b.classList.add("active");
                }
            });
            
            // Sync lock indicators for Layer Active and Layer Type
            const activeLocked = state.locks.layerActive[state.currentLayerIdx];
            const activeLockBtn = document.getElementById("btn-lock-layer-active");
            if (activeLockBtn) {
                activeLockBtn.classList.toggle("locked", activeLocked);
                activeLockBtn.innerHTML = getLockSvg(activeLocked);
            }
            
            const typeLocked = state.locks.layerType[state.currentLayerIdx];
            const typeLockBtn = document.getElementById("btn-lock-layer-type");
            if (typeLockBtn) {
                typeLockBtn.classList.toggle("locked", typeLocked);
                typeLockBtn.innerHTML = getLockSvg(typeLocked);
            }
            
            rebuildDynamicSliders();
        });
    });
    
    // 2. Layer Type switches
    document.querySelectorAll("#type-tabs button").forEach(btn => {
        btn.addEventListener("click", (e) => {
            pushHistoryState();
            turnAutoplayOff(e);
            document.querySelectorAll("#type-tabs button").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            
            const ltype = e.target.getAttribute("data-type");
            state.layers[state.currentLayerIdx].type = ltype;
            
            rebuildDynamicSliders();
            drawMandalaOnScreen();
        });
    });
    
    // 3. Checkbox Layer Active Toggle
    document.getElementById("chk-layer-active").addEventListener("change", (e) => {
        pushHistoryState();
        turnAutoplayOff(e);
        state.layers[state.currentLayerIdx].active = e.target.checked;
        drawMandalaOnScreen();
    });
    
    // 4. Color Palette Segmented Buttons
    document.querySelectorAll("#control-palette .segment-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            pushHistoryState();
            turnAutoplayOff(e);
            
            const idx = parseInt(e.target.getAttribute("data-palette-idx"));
            state.activePaletteIdx = idx;
            
            // Update visual active classes
            document.querySelectorAll("#control-palette .segment-btn").forEach(b => {
                b.classList.toggle("active", parseInt(b.getAttribute("data-palette-idx")) === idx);
            });
            
            drawMandalaOnScreen();
        });
    });
    
    // 5. Settings Locks Event Listeners (Static elements)
    document.querySelectorAll(".lock-btn[data-lock]").forEach(btn => {
        const key = btn.getAttribute("data-lock");
        
        // Initial state sync
        const isLocked = state.locks[key];
        btn.classList.toggle("locked", isLocked);
        btn.innerHTML = getLockSvg(isLocked);
        
        btn.addEventListener("click", () => {
            state.locks[key] = !state.locks[key];
            btn.classList.toggle("locked", state.locks[key]);
            btn.innerHTML = getLockSvg(state.locks[key]);
            playLockSound(state.locks[key]);
        });
    });
    
    // Layer active lock click listener
    const activeLockBtn = document.getElementById("btn-lock-layer-active");
    if (activeLockBtn) {
        activeLockBtn.addEventListener("click", () => {
            const idx = state.currentLayerIdx;
            state.locks.layerActive[idx] = !state.locks.layerActive[idx];
            activeLockBtn.classList.toggle("locked", state.locks.layerActive[idx]);
            activeLockBtn.innerHTML = getLockSvg(state.locks.layerActive[idx]);
            playLockSound(state.locks.layerActive[idx]);
        });
    }
    
    // Layer type lock click listener
    const typeLockBtn = document.getElementById("btn-lock-layer-type");
    if (typeLockBtn) {
        typeLockBtn.addEventListener("click", () => {
            const idx = state.currentLayerIdx;
            state.locks.layerType[idx] = !state.locks.layerType[idx];
            typeLockBtn.classList.toggle("locked", state.locks.layerType[idx]);
            typeLockBtn.innerHTML = getLockSvg(state.locks.layerType[idx]);
            playLockSound(state.locks.layerType[idx]);
        });
    }
    
    // 6. Global Sliders
    // Bind start of global slider drags for Undo History
    ["slide-global-scale", "slide-global-thick", "slide-global-shift", "slide-global-rot"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("mousedown", () => {
                pushHistoryState();
            });
            el.addEventListener("touchstart", () => {
                pushHistoryState();
            }, {passive: true});
        }
    });

    document.getElementById("slide-global-scale").addEventListener("input", (e) => {
        turnAutoplayOff(e);
        state.globalScale = parseFloat(e.target.value);
        document.getElementById("val-global-scale").textContent = state.globalScale.toFixed(2);
        drawMandalaOnScreen();
    });
    document.getElementById("slide-global-thick").addEventListener("input", (e) => {
        turnAutoplayOff(e);
        state.globalLineWidth = parseFloat(e.target.value);
        document.getElementById("val-global-thick").textContent = state.globalLineWidth.toFixed(2);
        drawMandalaOnScreen();
    });
    document.getElementById("slide-global-shift").addEventListener("input", (e) => {
        turnAutoplayOff(e);
        state.globalColorShift = parseFloat(e.target.value);
        document.getElementById("val-global-shift").textContent = state.globalColorShift.toFixed(2);
        drawMandalaOnScreen();
    });
    document.getElementById("slide-global-rot").addEventListener("input", (e) => {
        turnAutoplayOff(e);
        state.globalRotation = parseInt(e.target.value);
        document.getElementById("val-global-rot").textContent = state.globalRotation + "°";
        drawMandalaOnScreen();
    });
    
    // 7. Action Button Commands
    document.getElementById("btn-undo").addEventListener("click", undoLastAction);
    document.getElementById("btn-randomize").addEventListener("click", randomizeDesign);
    document.getElementById("btn-export-trans").addEventListener("click", () => exportDesign(false));
    document.getElementById("btn-export-dark").addEventListener("click", () => exportDesign(true));
    
    // 7.5 Favorites Commands
    document.getElementById("btn-save-favorite").addEventListener("click", toggleFavorite);
    document.getElementById("btn-delete-favorite").addEventListener("click", handleDeleteFavorite);
    document.getElementById("select-favorites").addEventListener("change", (e) => {
        pushHistoryState();
        turnAutoplayOff(e);
        handleSelectFavoriteChange(e);
    });
    
    // 7.5.5 Floating Controls
    const floatHeart = document.getElementById("btn-floating-heart");
    if (floatHeart) {
        floatHeart.addEventListener("click", toggleFavorite);
    }
    const floatFs = document.getElementById("btn-floating-fullscreen");
    if (floatFs) {
        floatFs.addEventListener("click", toggleFullscreen);
    }
    
    // 7.5.8 Keyboard Shortcuts (Cmd+S / Ctrl+S to save/toggle favorite)
    window.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
            e.preventDefault(); // Stop native browser save dialog
            toggleFavorite();
        }
    });
    
    // 7.6 Autoplay Controls
    document.querySelectorAll("#control-autoplay button").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll("#control-autoplay button").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            
            const mode = e.target.getAttribute("data-mode");
            state.autoplayMode = mode;
            
            // Manage Music Audio state transitions
            if (mode === "music") {
                startMusicReactiveMode();
            } else {
                stopMusicReactiveMode();
            }
            
            if (state.autoplayTimer) {
                clearTimeout(state.autoplayTimer);
                state.autoplayTimer = null;
            }
            
            if (mode !== "off" && mode !== "music") {
                triggerNextAutoplayTransition();
            }
        });
    });
    
    document.getElementById("slide-transition-speed").addEventListener("input", (e) => {
        const speedSec = parseFloat(e.target.value);
        state.transitionDuration = speedSec * 1000;
        document.getElementById("val-transition-speed").textContent = speedSec.toFixed(1) + "s";
    });
    
    // 8. Mobile Sliding Panel Bottom Sheet Gesture/Click events
    const dragHandle = document.getElementById("drag-handle");
    const panelHeader = document.getElementById("panel-header");
    const panel = document.getElementById("control-panel");
    
    function togglePanel() {
        panel.classList.toggle("open");
    }
    
    dragHandle.addEventListener("click", togglePanel);
    panelHeader.addEventListener("click", (e) => {
        // Toggle only on mobile sizes
        if (window.innerWidth <= 800) {
            togglePanel();
        }
    });
    
    // Optional Swipe gesture on handle
    let touchStartY = 0;
    dragHandle.addEventListener("touchstart", (e) => {
        touchStartY = e.touches[0].clientY;
    }, {passive: true});
    
    dragHandle.addEventListener("touchend", (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY - touchEndY;
        // Swipe up (diff > 30) -> open
        if (diff > 30 && !panel.classList.contains("open")) {
            panel.classList.add("open");
        }
        // Swipe down (diff < -30) -> close
        else if (diff < -30 && panel.classList.contains("open")) {
            panel.classList.remove("open");
        }
    }, {passive: true});
}

// Initial Bootup
function init() {
    bindEvents();
    resizeCanvas();
    populateFavoritesDropdown();
    
    // Set initial active palette button selection visually
    document.querySelectorAll("#control-palette .segment-btn").forEach(b => {
        b.classList.toggle("active", parseInt(b.getAttribute("data-palette-idx")) === state.activePaletteIdx);
    });
    
    // Sync initial lock buttons SVG icons for Layer Active and Layer Type
    const activeLockBtn = document.getElementById("btn-lock-layer-active");
    if (activeLockBtn) activeLockBtn.innerHTML = getLockSvg(state.locks.layerActive[state.currentLayerIdx]);
    const typeLockBtn = document.getElementById("btn-lock-layer-type");
    if (typeLockBtn) typeLockBtn.innerHTML = getLockSvg(state.locks.layerType[state.currentLayerIdx]);
    
    rebuildDynamicSliders();
    drawMandalaOnScreen();
    
    // Dynamically set version and file update time on the header tooltip (automatically reads file timestamp)
    const titleEl = document.querySelector("#panel-header h1");
    if (titleEl) {
        const lastMod = new Date(document.lastModified);
        const pad = (n) => String(n).padStart(2, "0");
        const yyyy = lastMod.getFullYear();
        const mm = pad(lastMod.getMonth() + 1);
        const dd = pad(lastMod.getDate());
        let hours = lastMod.getHours();
        const minutes = pad(lastMod.getMinutes());
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12; // Convert 0 to 12
        const formattedDate = `${yyyy}-${mm}-${dd} ${pad(hours)}:${minutes} ${ampm}`;
        
        titleEl.setAttribute("data-tooltip", `Version 2.1.0\nUpdated: ${formattedDate}`);
    }
}

window.addEventListener("load", init);
