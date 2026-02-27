import { DIFFUSER_CATALOG } from '../../../../../constants';
import { PerformanceResult, PlacedDiffuser, Probe } from '../../../../../types';

export const CONSTANTS = {
  BASE_TIME_STEP: 1/60, 
  HISTORY_RECORD_INTERVAL: 0.015,
  MAX_PARTICLES: 4000, 
  SPAWN_RATE_BASE: 5,
  SPAWN_RATE_MULTIPLIER: 8
};

export interface Particle3D {
    active: boolean;
    x: number; y: number; z: number;
    vx: number; vy: number; vz: number;
    buoyancy: number; drag: number; age: number; life: number;
    lastHistoryTime: number;
    history: {x: number, y: number, z: number, age: number}[]; 
    color: string; 
    waveFreq: number; wavePhase: number; waveAmp: number; waveAngle: number;
    isHorizontal: boolean; isSuction: boolean;
}

export interface ThreeDViewCanvasProps {
  width: number; 
  height: number;
  physics: PerformanceResult;
  isPowerOn: boolean; 
  isPlaying: boolean;
  temp: number; 
  roomTemp: number;
  flowType: string; 
  modelId: string;
  roomHeight: number; 
  roomWidth: number;
  roomLength: number;
  diffuserHeight: number; 
  workZoneHeight: number;
  placedDiffusers?: PlacedDiffuser[];
  probes?: Probe[];
}

export const project = (x: number, y: number, z: number, width: number, height: number, rotX: number, rotY: number, scale: number, panX: number, panY: number) => {
    // 3D Projection Logic
    // Rotation Y
    const cx = Math.cos(rotY);
    const sx = Math.sin(rotY);
    const x1 = x * cx - z * sx;
    const z1 = x * sx + z * cx;

    // Rotation X
    const cy = Math.cos(rotX);
    const sy = Math.sin(rotX);
    const y2 = y * cy - z1 * sy;
    // const z2 = y * sy + z1 * cy;

    // 2D projection
    const px = x1 * scale + width / 2 + panX;
    const py = y2 * scale + height / 2 + panY;
    
    return { x: px, y: py, s: 1 };
};

const getGlowColor = (t: number) => {
    if (t <= 18) return `64, 224, 255`; 
    if (t >= 28) return `255, 99, 132`; 
    if (t > 18 && t < 28) return `100, 255, 160`; 
    return `255, 255, 255`;
};

export const spawnParticle = (p: Particle3D, state: ThreeDViewCanvasProps, ppm: number) => {
    // Determine Source
    let activeDiffuser: {
        x: number, 
        y: number, // Z in 3D logic
        performance: PerformanceResult,
        modelId: string
    };

    if (state.placedDiffusers && state.placedDiffusers.length > 0) {
        const idx = Math.floor(Math.random() * state.placedDiffusers.length);
        const d = state.placedDiffusers[idx];
        
        activeDiffuser = {
            x: (d.x - state.roomWidth / 2) * ppm,
            y: (d.y - state.roomLength / 2) * ppm, // This corresponds to Z in 3D
            performance: d.performance,
            modelId: d.modelId
        };
    } else {
        // Default single center
        activeDiffuser = {
            x: 0,
            y: 0,
            performance: state.physics,
            modelId: state.modelId
        };
    }

    const { performance: physics, modelId, x: centerX, y: centerZ } = activeDiffuser;
    const { temp, diffuserHeight } = state;
    
    if (physics.error) return;
    const spec = physics.spec;
    if (!spec || !spec.A) return;

    const catalogItem = DIFFUSER_CATALOG.find(c => c.id === modelId);
    const flowType = (catalogItem ? catalogItem.modes[0].flowType : state.flowType) || 'vertical';

    const scale = ppm / 1000;
    const nozzleW = (spec.A / 1000) * ppm;
    
    // In 3D logic: Y is UP. Diffuser is at Y = diffuserHeight * ppm.
    const startY = diffuserHeight * ppm;

    const pxSpeed = (physics.v0 || 0) * ppm * 0.8;

    let pX = centerX;
    let pY = startY - (spec.D || 0) * scale; // Emit slightly below ceiling
    let pZ = centerZ;

    let vx = 0, vy = 0, vz = 0;
    let drag = 0.96;
    let waveAmp = 5;
    let waveFreq = 4 + Math.random() * 4;
    let isHorizontal = false;
    let isSuction = false;

    const physicsAr = physics.Ar || 0; 
    const visualGain = 150.0; 
    const buoyancy = physicsAr * (physics.v0 * physics.v0) * ppm * visualGain;

    if (flowType === 'suction') {
        isSuction = true;
        drag = 1.0; waveAmp = 0;
        p.life = 3.0; 
        p.color = '150, 150, 150';
    } else {
        if (flowType.includes('horizontal')) {
            isHorizontal = true;
            const angle = Math.random() * Math.PI * 2;
            const spread = 0.2; 
            
            pX += Math.cos(angle) * nozzleW * 0.5;
            pZ += Math.sin(angle) * nozzleW * 0.5;
            
            vx = Math.cos(angle) * pxSpeed * 1.2;
            vz = Math.sin(angle) * pxSpeed * 1.2;
            vy = -Math.abs(pxSpeed * 0.1); // Slightly down initially
            
            if (flowType.includes('swirl')) { waveAmp = 15; waveFreq = 8; } else { waveAmp = 3; }
        } else if (flowType === '4-way') {
            isHorizontal = true;
            const dir = Math.floor(Math.random() * 4);
            const angle = dir * (Math.PI/2) + (Math.random()-0.5)*0.5;
            
            pX += Math.cos(angle) * nozzleW * 0.5;
            pZ += Math.sin(angle) * nozzleW * 0.5;
            
            vx = Math.cos(angle) * pxSpeed;
            vz = Math.sin(angle) * pxSpeed;
            vy = -Math.abs(pxSpeed * 0.1);
        } else {
            // Vertical
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * nozzleW * 0.5;
            pX += Math.cos(angle) * radius;
            pZ += Math.sin(angle) * radius;
            
            const spread = 0.2 + (Math.random()-0.5)*0.1;
            vx = Math.cos(angle) * pxSpeed * spread;
            vz = Math.sin(angle) * pxSpeed * spread;
            vy = -pxSpeed; // Down
            
            waveAmp = 5; drag = 0.95;
        }

        p.life = 2.0 + Math.random() * 1.5;
        p.color = getGlowColor(temp);
    }

    p.x = pX; p.y = pY; p.z = pZ;
    p.vx = vx; p.vy = vy; p.vz = vz;
    p.buoyancy = buoyancy; p.drag = drag; p.age = 0; 
    p.waveFreq = waveFreq; p.wavePhase = Math.random() * Math.PI * 2; p.waveAmp = waveAmp; p.waveAngle = Math.random() * Math.PI * 2;
    p.isHorizontal = isHorizontal; p.isSuction = isSuction;
    p.active = true;
    p.lastHistoryTime = 0;
    p.history.length = 0; 
};

export const updateParticlePhysics = (p: Particle3D, dt: number, state: ThreeDViewCanvasProps, ppm: number) => {
    // Floor collision: y = 0
    if (p.y < 0) {
        p.y = 0;
        p.vy *= -0.5; // Bounce/Slide
        p.vx *= 0.8;
        p.vz *= 0.8;
    }

    if (p.isSuction) {
        // ...
    } else {
        if (p.isHorizontal) {
            p.vy += p.buoyancy * dt; 
        } else {
            p.vy += p.buoyancy * dt;
        }
        
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vz *= p.drag;
        
        p.x += p.vx * dt; 
        p.y += p.vy * dt; 
        p.z += p.vz * dt;
    }
};
