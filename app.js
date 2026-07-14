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
    activePresetIdx: 0,
    toastTimer: null
};

// Default Preset Configurations for Form Constants (Exactly 4 layers per preset)
const PRESETS = [
    {
        name: "Hypnagogic Tunnel",
        palette: "Neon Cyberpunk",
        layers: [
            {type: "Tunnels", active: true, params: {rings: 28, sides: 6, perspective: 2.0, twist: 1.5, wobble: 0.08, radius: 0.9}, col_off: 0.0},
            {type: "Cobwebs", active: true, params: {count: 12, rings: 8, spacing: 1.4, sag: 0.25, radius: 0.9, thickness: 1.5}, col_off: 0.3},
            {type: "Spirals", active: false, params: {arms: 4, tightness: 1.0, turns: 3.0, wave_amp: 0.02, wave_freq: 6.0, radius: 0.85}, col_off: 0.0},
            {type: "Lattices", active: false, params: {grid_type: 0, cell_scale: 0.08, rotation: 0, thickness: 2.0, radius: 0.85, double_grid: 0}, col_off: 0.0}
        ]
    },
    {
        name: "Spiral Vortex",
        palette: "Cosmic Aurora",
        layers: [
            {type: "Spirals", active: true, params: {arms: 2, tightness: 0.8, turns: 4.5, wave_amp: 0.05, wave_freq: 8.0, radius: 0.95}, col_off: 0.0},
            {type: "Spirals", active: true, params: {arms: 2, tightness: 0.8, turns: 4.5, wave_amp: 0.05, wave_freq: 8.0, radius: 0.95}, col_off: 0.5},
            {type: "Tunnels", active: false, params: {rings: 20, sides: 0, perspective: 2.0, twist: 1.0, wobble: 0.05, radius: 0.9}, col_off: 0.0},
            {type: "Lattices", active: false, params: {grid_type: 1, cell_scale: 0.08, rotation: 0, thickness: 2.0, radius: 0.85, double_grid: 0}, col_off: 0.0}
        ]
    },
    {
        name: "Honeycomb Lattice",
        palette: "Gold & Onyx",
        layers: [
            {type: "Lattices", active: true, params: {grid_type: 2, cell_scale: 0.06, rotation: 0, thickness: 2.0, radius: 0.9, double_grid: 0}, col_off: 0.0},
            {type: "Tunnels", active: true, params: {rings: 5, sides: 6, perspective: 5.0, twist: 0.0, wobble: 0.0, radius: 0.9}, col_off: 0.25},
            {type: "Cobwebs", active: true, params: {count: 6, rings: 1, spacing: 1.0, sag: 0.0, radius: 0.9, thickness: 2.0}, col_off: 0.5},
            {type: "Spirals", active: false, params: {arms: 4, tightness: 1.0, turns: 3.0, wave_amp: 0.02, wave_freq: 6.0, radius: 0.85}, col_off: 0.0}
        ]
    },
    {
        name: "Labyrinth Web",
        palette: "Lava Flame",
        layers: [
            {type: "Cobwebs", active: true, params: {count: 18, rings: 12, spacing: 1.1, sag: 0.35, radius: 0.9, thickness: 1.8}, col_off: 0.0},
            {type: "Lattices", active: true, params: {grid_type: 0, cell_scale: 0.05, rotation: 45, thickness: 1.5, radius: 0.9, double_grid: 1}, col_off: 0.4},
            {type: "Tunnels", active: false, params: {rings: 20, sides: 0, perspective: 2.0, twist: 1.0, wobble: 0.05, radius: 0.9}, col_off: 0.0},
            {type: "Spirals", active: false, params: {arms: 4, tightness: 1.0, turns: 3.0, wave_amp: 0.02, wave_freq: 6.0, radius: 0.85}, col_off: 0.0}
        ]
    },
    {
        name: "Golden Phyllotaxis",
        palette: "Forest Sage",
        layers: [
            {type: "Phyllo", active: true, params: {count: 480, div_angle: 137.508, radius: 0.9, size: 0.038, decay: 0.5, shape_type: 4}, col_off: 0.0},
            {type: "Cobwebs", active: true, params: {count: 13, rings: 1, spacing: 1.0, sag: 0.0, radius: 0.92, thickness: 2.0}, col_off: 0.5},
            {type: "Tunnels", active: false, params: {rings: 20, sides: 0, perspective: 2.0, twist: 1.0, wobble: 0.05, radius: 0.9}, col_off: 0.0},
            {type: "Lattices", active: false, params: {grid_type: 0, cell_scale: 0.08, rotation: 0, thickness: 2.0, radius: 0.85, double_grid: 0}, col_off: 0.0}
        ]
    }
];

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

// Draw to Screen Viewport (Retina and anti-aliased via scaling)
function drawMandalaOnScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render on screen (device pixels)
    const dpr = window.devicePixelRatio || 1;
    renderMandala(ctx, canvas.width, canvas.height, dpr);
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
        
        if (def.options) {
            // Segmented button group for discrete values
            const group = document.createElement("div");
            group.className = "segmented-control";
            
            def.options.forEach((optText, optIdx) => {
                const btn = document.createElement("button");
                btn.className = "segment-btn" + (Math.round(p[def.key]) === optIdx ? " active" : "");
                btn.textContent = optText;
                btn.addEventListener("click", () => {
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
            
            row.appendChild(group);
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
            
            input.addEventListener("input", (e) => {
                let val = parseFloat(e.target.value);
                if (def.isInt) val = Math.round(val);
                p[def.key] = val;
                valSpan.textContent = def.key === "div_angle" ? val.toFixed(3) + "°" : (def.isInt ? parseInt(val) : val.toFixed(2));
                drawMandalaOnScreen();
            });
            
            row.appendChild(input);
        }
        
        container.appendChild(row);
    });
    
    // 2. Inject Color Offset Slider for this Layer
    const colRow = document.createElement("div");
    colRow.className = "slider-row";
    
    const colHeader = document.createElement("div");
    colHeader.className = "slider-header";
    colHeader.innerHTML = `<span>Layer Color Offset</span><span>${layer.color_offset.toFixed(2)}</span>`;
    
    const colInput = document.createElement("input");
    colInput.type = "range";
    colInput.min = "0";
    colInput.max = "1";
    colInput.step = "0.01";
    colInput.value = layer.color_offset;
    
    colInput.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value);
        layer.color_offset = val;
        colHeader.querySelector("span:last-child").textContent = val.toFixed(2);
        drawMandalaOnScreen();
    });
    
    colRow.appendChild(colHeader);
    colRow.appendChild(colInput);
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
    animationController.startState = captureCurrentStateSnapshot();
    animationController.targetState = targetState;
    animationController.startTime = performance.now();
    animationController.isAnimating = true;
    animationController.rafId = requestAnimationFrame(animateTransitionStep);
}

// Single step of transition interpolation loop
function animateTransitionStep(timestamp) {
    if (!animationController.isAnimating) return;
    
    const elapsed = timestamp - animationController.startTime;
    let t = Math.min(elapsed / animationController.duration, 1.0);
    
    const easedT = animationController.ease(t);
    const start = animationController.startState;
    const target = animationController.targetState;
    
    // Interpolate Globals
    state.globalRotation = start.globalRotation + (target.globalRotation - start.globalRotation) * easedT;
    state.globalLineWidth = start.globalLineWidth + (target.globalLineWidth - start.globalLineWidth) * easedT;
    state.globalColorShift = start.globalColorShift + (target.globalColorShift - start.globalColorShift) * easedT;
    
    // Update global visual indicators
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
    document.getElementById("lbl-palette").textContent = PALETTES[state.activePaletteIdx];
    
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
    }
}

// Convert template preset config into visual target state
function makeTargetStateFromPreset(preset) {
    const target = captureCurrentStateSnapshot();
    
    const palIdx = PALETTES.indexOf(preset.palette);
    if (palIdx !== -1) target.paletteIdx = palIdx;
    
    preset.layers.forEach((plyr, idx) => {
        const targetLayer = target.layers[idx];
        targetLayer.type = plyr.type;
        targetLayer.active = plyr.active;
        targetLayer.color_offset = plyr.col_off;
        for (let k in plyr.params) {
            targetLayer.params[plyr.type][k] = plyr.params[k];
        }
    });
    
    return target;
}

// Convert favorite config into visual target state
function makeTargetStateFromFav(fav) {
    const target = captureCurrentStateSnapshot();
    
    const palIdx = PALETTES.indexOf(fav.paletteName);
    if (palIdx !== -1) target.paletteIdx = palIdx;
    
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

// Preset Loader
function loadPreset(preset, animate = true) {
    const targetState = makeTargetStateFromPreset(preset);
    
    if (animate) {
        startTransitionTo(targetState);
    } else {
        state.activePaletteIdx = targetState.paletteIdx;
        document.getElementById("lbl-palette").textContent = PALETTES[state.activePaletteIdx];
        
        preset.layers.forEach((plyr, idx) => {
            const layer = state.layers[idx];
            layer.type = plyr.type;
            layer.active = plyr.active;
            layer.color_offset = plyr.col_off;
            for (let k in plyr.params) {
                layer.params[layer.type][k] = plyr.params[k];
            }
        });
        
        document.getElementById("chk-layer-active").checked = state.layers[state.currentLayerIdx].active;
        
        const activeLayer = state.layers[state.currentLayerIdx];
        document.querySelectorAll("#layer-tabs .tab-btn").forEach((btn, idx) => {
            btn.classList.toggle("active", idx === state.currentLayerIdx);
        });
        document.querySelectorAll("#type-tabs .tab-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.type === activeLayer.type);
        });
        
        rebuildDynamicSliders();
        drawMandalaOnScreen();
    }
}

// Randomizer
function randomizeDesign() {
    const target = captureCurrentStateSnapshot();
    
    target.layers[0].active = true;
    for (let i = 1; i < 4; i++) {
        target.layers[i].active = Math.random() < 0.65;
    }
    
    const types = ["Spirals", "Cobwebs", "Tunnels", "Lattices", "Phyllo"];
    
    target.layers.forEach(layer => {
        layer.type = types[Math.floor(Math.random() * types.length)];
        layer.color_offset = Math.random();
        
        // Spirals random
        layer.params.Spirals.arms = Math.floor(Math.random() * 12) + 1;
        layer.params.Spirals.tightness = parseFloat((Math.random() * 1.5 + 0.5).toFixed(2));
        layer.params.Spirals.turns = parseFloat((Math.random() * 5 + 1.5).toFixed(2));
        layer.params.Spirals.wave_amp = Math.random() < 0.6 ? parseFloat((Math.random() * 0.08).toFixed(3)) : 0.0;
        layer.params.Spirals.wave_freq = parseFloat((Math.random() * 10 + 2).toFixed(1));
        layer.params.Spirals.radius = parseFloat((Math.random() * 0.55 + 0.4).toFixed(2));
        layer.params.Spirals.depth_stroke = Math.random() < 0.5 ? 1 : 0;
        
        // Cobwebs random
        layer.params.Cobwebs.count = Math.floor(Math.random() * 20) + 4;
        layer.params.Cobwebs.rings = Math.floor(Math.random() * 15) + 3;
        layer.params.Cobwebs.spacing = parseFloat((Math.random() * 1.1 + 0.7).toFixed(2));
        layer.params.Cobwebs.sag = parseFloat((Math.random() * 0.6 - 0.15).toFixed(2));
        layer.params.Cobwebs.radius = parseFloat((Math.random() * 0.55 + 0.4).toFixed(2));
        layer.params.Cobwebs.thickness = parseFloat((Math.random() * 1.7 + 0.8).toFixed(1));
        layer.params.Cobwebs.depth_stroke = Math.random() < 0.5 ? 1 : 0;
        
        // Tunnels random
        layer.params.Tunnels.rings = Math.floor(Math.random() * 25) + 5;
        layer.params.Tunnels.sides = [0, 0, 3, 4, 5, 6, 8][Math.floor(Math.random() * 7)];
        layer.params.Tunnels.perspective = parseFloat((Math.random() * 5 + 1).toFixed(1));
        layer.params.Tunnels.twist = Math.random() < 0.6 ? parseFloat((Math.random() * 5 - 2.5).toFixed(1)) : 0.0;
        layer.params.Tunnels.wobble = Math.random() < 0.5 ? parseFloat((Math.random() * 0.15).toFixed(3)) : 0.0;
        layer.params.Tunnels.radius = parseFloat((Math.random() * 0.45 + 0.5).toFixed(2));
        layer.params.Tunnels.depth_stroke = Math.random() < 0.5 ? 1 : 0;
        
        // Lattices random
        layer.params.Lattices.grid_type = Math.floor(Math.random() * 4); // covers LogHex (Style 3)
        layer.params.Lattices.cell_scale = parseFloat((Math.random() * 0.11 + 0.05).toFixed(3));
        layer.params.Lattices.rotation = Math.floor(Math.random() * 180);
        layer.params.Lattices.thickness = parseFloat((Math.random() * 1.4 + 0.8).toFixed(1));
        layer.params.Lattices.radius = parseFloat((Math.random() * 0.55 + 0.4).toFixed(2));
        layer.params.Lattices.double_grid = Math.random() < 0.25 ? 1 : 0;
        layer.params.Lattices.boundaries = Math.random() < 0.5 ? 1 : 0;
        layer.params.Lattices.depth_stroke = Math.random() < 0.5 ? 1 : 0;
        
        // Phyllo random
        layer.params.Phyllo.count = Math.floor(Math.random() * 50) * 10 + 100;
        layer.params.Phyllo.div_angle = Math.random() < 0.8 ? parseFloat((137.508 + Math.random() * 0.2 - 0.1).toFixed(3)) : parseFloat((Math.random() * 5 + 135).toFixed(3));
        layer.params.Phyllo.radius = parseFloat((Math.random() * 0.55 + 0.4).toFixed(2));
        layer.params.Phyllo.size = parseFloat((Math.random() * 0.033 + 0.012).toFixed(3));
        layer.params.Phyllo.decay = parseFloat((Math.random() * 0.6 + 0.2).toFixed(2));
        layer.params.Phyllo.shape_type = Math.floor(Math.random() * 5);
    });
    
    target.globalColorShift = parseFloat(Math.random().toFixed(2));
    target.globalLineWidth = parseFloat((Math.random() * 1.4 + 0.6).toFixed(2));
    target.paletteIdx = Math.floor(Math.random() * PALETTES.length);
    
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
            
            rebuildDynamicSliders();
        });
    });
    
    // 2. Layer Type switches
    document.querySelectorAll("#type-tabs button").forEach(btn => {
        btn.addEventListener("click", (e) => {
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
        state.layers[state.currentLayerIdx].active = e.target.checked;
        drawMandalaOnScreen();
    });
    
    // 4. Palette Selectors
    document.getElementById("btn-prev-palette").addEventListener("click", () => {
        state.activePaletteIdx = (state.activePaletteIdx - 1 + PALETTES.length) % PALETTES.length;
        document.getElementById("lbl-palette").textContent = PALETTES[state.activePaletteIdx];
        drawMandalaOnScreen();
    });
    document.getElementById("btn-next-palette").addEventListener("click", () => {
        state.activePaletteIdx = (state.activePaletteIdx + 1) % PALETTES.length;
        document.getElementById("lbl-palette").textContent = PALETTES[state.activePaletteIdx];
        drawMandalaOnScreen();
    });
    
    // 5. Presets Selectors
    document.getElementById("btn-prev-preset").addEventListener("click", () => {
        state.activePresetIdx = (state.activePresetIdx - 1 + PRESETS.length) % PRESETS.length;
        document.getElementById("lbl-preset").textContent = PRESETS[state.activePresetIdx].name;
        loadPreset(PRESETS[state.activePresetIdx]);
    });
    document.getElementById("btn-next-preset").addEventListener("click", () => {
        state.activePresetIdx = (state.activePresetIdx + 1) % PRESETS.length;
        document.getElementById("lbl-preset").textContent = PRESETS[state.activePresetIdx].name;
        loadPreset(PRESETS[state.activePresetIdx]);
    });
    
    // 6. Global Sliders
    document.getElementById("slide-global-scale").addEventListener("input", (e) => {
        state.globalScale = parseFloat(e.target.value);
        document.getElementById("val-global-scale").textContent = state.globalScale.toFixed(2);
        drawMandalaOnScreen();
    });
    document.getElementById("slide-global-thick").addEventListener("input", (e) => {
        state.globalLineWidth = parseFloat(e.target.value);
        document.getElementById("val-global-thick").textContent = state.globalLineWidth.toFixed(2);
        drawMandalaOnScreen();
    });
    document.getElementById("slide-global-shift").addEventListener("input", (e) => {
        state.globalColorShift = parseFloat(e.target.value);
        document.getElementById("val-global-shift").textContent = state.globalColorShift.toFixed(2);
        drawMandalaOnScreen();
    });
    document.getElementById("slide-global-rot").addEventListener("input", (e) => {
        state.globalRotation = parseInt(e.target.value);
        document.getElementById("val-global-rot").textContent = state.globalRotation + "°";
        drawMandalaOnScreen();
    });
    
    // 7. Action Button Commands
    document.getElementById("btn-randomize").addEventListener("click", randomizeDesign);
    document.getElementById("btn-export-trans").addEventListener("click", () => exportDesign(false));
    document.getElementById("btn-export-dark").addEventListener("click", () => exportDesign(true));
    
    // 7.5 Favorites Commands
    document.getElementById("btn-save-favorite").addEventListener("click", handleSaveFavorite);
    document.getElementById("btn-delete-favorite").addEventListener("click", handleDeleteFavorite);
    document.getElementById("select-favorites").addEventListener("change", handleSelectFavoriteChange);
    
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
    
    // Load first preset immediately without animation
    loadPreset(PRESETS[0], false);
}

window.addEventListener("load", init);
