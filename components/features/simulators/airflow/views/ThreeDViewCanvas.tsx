
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { CONSTANTS, Particle3D, ThreeDViewCanvasProps, project, spawnParticle, updateParticlePhysics } from '../utils/airflow3DLogic';
import ViewCube from './ViewCube';

const drawRealisticDiffuser3D = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, 
    centerY: number, 
    centerZ: number, 
    radius: number, 
    bodyDepth: number,
    modelId: string, 
    p3d: (x: number, y: number, z: number) => {x: number, y: number, s: number}
) => {
    const drawRing3D = (r: number, yOffset: number = 0, segments: number = 32) => {
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
            const angle = (i * Math.PI * 2) / segments;
            const x = centerX + Math.cos(angle) * r;
            const z = centerZ + Math.sin(angle) * r;
            const p = p3d(x, centerY + yOffset, z);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    };

    const drawFilledRing3D = (r: number, yOffset: number = 0, segments: number = 32) => {
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
            const angle = (i * Math.PI * 2) / segments;
            const x = centerX + Math.cos(angle) * r;
            const z = centerZ + Math.sin(angle) * r;
            const p = p3d(x, centerY + yOffset, z);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.fill();
        ctx.stroke();
    };

    const fillBand3D = (
        topRadius: number,
        topOffset: number,
        bottomRadius: number,
        bottomOffset: number,
        fill: string,
        segments: number = 40
    ) => {
        ctx.fillStyle = fill;
        for (let i = 0; i < segments; i++) {
            const a0 = (i * Math.PI * 2) / segments;
            const a1 = ((i + 1) * Math.PI * 2) / segments;

            const p1 = p3d(centerX + Math.cos(a0) * topRadius, centerY + topOffset, centerZ + Math.sin(a0) * topRadius);
            const p2 = p3d(centerX + Math.cos(a1) * topRadius, centerY + topOffset, centerZ + Math.sin(a1) * topRadius);
            const p3 = p3d(centerX + Math.cos(a1) * bottomRadius, centerY + bottomOffset, centerZ + Math.sin(a1) * bottomRadius);
            const p4 = p3d(centerX + Math.cos(a0) * bottomRadius, centerY + bottomOffset, centerZ + Math.sin(a0) * bottomRadius);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
            ctx.fill();
        }
    };

    const bodyFill = '#d9e1ea';
    const detailFill = '#bcc8d6';
    const accentFill = '#8d9daf';

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#8fa0b2'; 
    ctx.fillStyle = bodyFill;

    // ВАЖНО: h теперь откладывается ВВЕРХ (в запотолочное пространство)
    const top = -Math.max(1.5, bodyDepth * 0.1);
    const h = Math.max(bodyDepth, radius * 0.45); 

    switch (modelId) {
        case 'dpu-m':
            fillBand3D(radius * 0.95, top, radius * 0.72, top - h * 0.72, bodyFill);
            drawFilledRing3D(radius * 0.95, top);
            drawFilledRing3D(radius * 0.72, top - h * 0.72);
            
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI * 2) / 8;
                const x = centerX + Math.cos(angle) * radius * 0.94;
                const z = centerZ + Math.sin(angle) * radius * 0.94;
                const p1 = p3d(x, centerY + top, z);
                const p2 = p3d(centerX + Math.cos(angle) * radius * 0.58, centerY + top - h * 0.72, centerZ + Math.sin(angle) * radius * 0.58);
                ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
            }

            ctx.fillStyle = detailFill;
            drawFilledRing3D(radius * 0.56, top - h * 0.92);
            
            const rodTop = p3d(centerX, centerY + top, centerZ);
            const rodBottom = p3d(centerX, centerY + top - h * 0.98, centerZ);
            ctx.beginPath(); ctx.moveTo(rodTop.x, rodTop.y); ctx.lineTo(rodBottom.x, rodBottom.y); ctx.stroke();
            break;
            
        case 'dpu-k':
            fillBand3D(radius * 0.95, top, radius * 0.72, top - h * 0.68, bodyFill);
            drawFilledRing3D(radius * 0.95, top);
            drawRing3D(radius * 0.72, top - h * 0.68);
            
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI * 2) / 8;
                const x = centerX + Math.cos(angle) * radius * 0.94;
                const z = centerZ + Math.sin(angle) * radius * 0.94;
                const p1 = p3d(x, centerY + top, z);
                const p2 = p3d(centerX + Math.cos(angle) * radius * 0.58, centerY + top - h * 0.68, centerZ + Math.sin(angle) * radius * 0.58);
                ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
            }

            for (let i = 1; i <= 3; i++) {
                const cr = radius * (0.3 + i * 0.17);
                const ch = top - h * (0.22 + i * 0.14);
                drawRing3D(cr, ch);
                
                for (let j = 0; j < 3; j++) {
                    const angle = (j * 120 * Math.PI) / 180 - Math.PI / 2;
                    const x = centerX + Math.cos(angle) * cr;
                    const z = centerZ + Math.sin(angle) * cr;
                    const p1 = p3d(x, centerY + ch, z);
                    const p2 = p3d(centerX, centerY + ch - h * 0.08, centerZ);
                    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                }
            }
            
            const rodTopK = p3d(centerX, centerY + top, centerZ);
            const rodBottomK = p3d(centerX, centerY + top - h * 0.95, centerZ);
            ctx.beginPath(); ctx.moveTo(rodTopK.x, rodTopK.y); ctx.lineTo(rodBottomK.x, rodBottomK.y); ctx.stroke();
            break;
            
        case 'dpu-v':
            fillBand3D(radius * 0.95, top, radius * 0.75, top - h * 0.62, bodyFill);
            drawFilledRing3D(radius * 0.95, top);
            drawFilledRing3D(radius * 0.75, top - h * 0.62);

            ctx.fillStyle = accentFill;
            drawFilledRing3D(radius * 0.62, top - h * 0.32);

            ctx.strokeStyle = '#e9f0f8';
            const numSlots = 10;
            for (let i = 0; i < numSlots; i++) {
                const angle = (i * Math.PI * 2) / numSlots;
                const startR = radius * 0.4;
                const endR = radius * 0.9;
                
                const x1 = centerX + Math.cos(angle) * startR;
                const z1 = centerZ + Math.sin(angle) * startR;
                const x2 = centerX + Math.cos(angle + 0.4) * endR;
                const z2 = centerZ + Math.sin(angle + 0.4) * endR;
                
                const p1 = p3d(x1, centerY + top - h * 0.32, z1);
                const p2 = p3d(x2, centerY + top - h * 0.32, z2);

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
            break;
            
        case 'dpu-s':
            fillBand3D(radius * 0.92, top, radius * 0.4, top - h, bodyFill);
            drawFilledRing3D(radius * 0.92, top);

            ctx.fillStyle = detailFill;
            fillBand3D(radius * 0.72, top, radius * 0.22, top - h * 1.02, detailFill);
            drawFilledRing3D(radius * 0.22, top - h * 1.02);

            ctx.strokeStyle = '#6e8094';
            
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI * 2) / 8;
                const x1 = centerX + Math.cos(angle) * radius * 0.92;
                const z1 = centerZ + Math.sin(angle) * radius * 0.92;
                const x2 = centerX + Math.cos(angle) * (radius * 0.3);
                const z2 = centerZ + Math.sin(angle) * (radius * 0.3);
                const p1 = p3d(x1, centerY + top - h, z1);
                const p2 = p3d(x2, centerY + top - h * 1.08, z2);
                ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
            }
            break;
            
        default:
            ctx.beginPath();
            const corners = [
                {x: centerX - radius, z: centerZ - radius},
                {x: centerX + radius, z: centerZ - radius},
                {x: centerX + radius, z: centerZ + radius},
                {x: centerX - radius, z: centerZ + radius}
            ];
            corners.forEach((c, i) => {
                const p = p3d(c.x, centerY + top, c.z);
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;
    }
};

const ThreeDViewCanvas: React.FC<ThreeDViewCanvasProps> = (props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    const simulationRef = useRef(props);
    const particlesRef = useRef<Particle3D[]>([]);
    
    // Camera State
    const [camera, setCamera] = useState({ 
        rotX: 0.3, 
        rotY: -0.6, 
        panX: 0, 
        panY: 0, 
        zoom: 1.0 
    });
    
    const isDragging = useRef(false);
    const isPanning = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (particlesRef.current.length === 0) {
            for (let i = 0; i < CONSTANTS.MAX_PARTICLES; i++) {
                particlesRef.current.push({
                    active: false,
                    x: 0, y: 0, z: 0,
                    vx: 0, vy: 0, vz: 0,
                    buoyancy: 0, drag: 0, age: 0, life: 0,
                    lastHistoryTime: 0,
                    history: [], 
                    color: '255,255,255',
                    waveFreq: 0, wavePhase: 0, waveAmp: 0, waveAngle: 0,
                    isHorizontal: false, isSuction: false
                });
            }
        }
    }, []);

    useEffect(() => {
        if (simulationRef.current.viewMode !== props.viewMode) {
             particlesRef.current.forEach(p => p.active = false);
             const canvas = canvasRef.current;
             if (canvas) {
                 const ctx = canvas.getContext('2d');
                 if (ctx) {
                     ctx.clearRect(0, 0, props.width, props.height);
                     ctx.fillStyle = '#030304';
                     ctx.fillRect(0, 0, props.width, props.height);
                 }
             }
        }
        simulationRef.current = props;
    }, [props]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = -Math.sign(e.deltaY) * 0.1;
        setCamera(prev => ({ ...prev, zoom: Math.max(0.1, Math.min(5, prev.zoom + delta)) }));
    }, []);

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
            isDragging.current = true;
        } else {
            clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY;
            if ((e as React.MouseEvent).button === 1 || (e as React.MouseEvent).shiftKey) isPanning.current = true;
            else isDragging.current = true;
        }
        lastMouse.current = { x: clientX, y: clientY };
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging.current && !isPanning.current) return;
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY;
        }
        const dx = clientX - lastMouse.current.x;
        const dy = clientY - lastMouse.current.y;
        
        if (isDragging.current) {
            setCamera(prev => ({
                ...prev,
                rotY: prev.rotY + dx * 0.005,
                rotX: Math.max(-1.5, Math.min(1.5, prev.rotX + dy * 0.005))
            }));
        } else if (isPanning.current) {
            setCamera(prev => ({
                ...prev,
                panX: prev.panX + dx,
                panY: prev.panY + dy
            }));
        }
        lastMouse.current = { x: clientX, y: clientY };
    };

    const handleEnd = () => { isDragging.current = false; isPanning.current = false; };

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const state = simulationRef.current;
        const { width, height, isPowerOn, isPlaying, roomHeight, roomWidth, roomLength, workZoneHeight, placedDiffusers, probes } = state;

        if (!isPowerOn) {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#030304';
            ctx.fillRect(0, 0, width, height);
        } else {
            ctx.fillStyle = 'rgba(3, 3, 4, 0.3)';
            ctx.fillRect(0, 0, width, height);
        }

        const PPM = (height / roomHeight) || 50; 
        
        const rw = roomWidth * PPM;
        const rl = roomLength * PPM;
        const rh = roomHeight * PPM;

        const maxDim = Math.max(rw, rl, rh);
        const fitScale = (Math.min(width, height) / maxDim) * 0.65;
        const finalScale = fitScale * camera.zoom;
        const yOffset = -rh / 2;

        const p3d = (x: number, y: number, z: number) => 
            project(x, -(y + yOffset), z, width, height, camera.rotX, camera.rotY, finalScale, camera.panX, camera.panY);

        // --- DRAW ROOM ---
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        const corners = [
            {x: -rw/2, y: 0, z: -rl/2}, {x: rw/2, y: 0, z: -rl/2}, {x: rw/2, y: 0, z: rl/2}, {x: -rw/2, y: 0, z: rl/2},
            {x: -rw/2, y: rh, z: -rl/2}, {x: rw/2, y: rh, z: -rl/2}, {x: rw/2, y: rh, z: rl/2}, {x: -rw/2, y: rh, z: rl/2}
        ].map(v => p3d(v.x, v.y, v.z));

        ctx.beginPath();
        [0,4].forEach(start => {
            ctx.moveTo(corners[start].x, corners[start].y);
            ctx.lineTo(corners[start+1].x, corners[start+1].y);
            ctx.lineTo(corners[start+2].x, corners[start+2].y);
            ctx.lineTo(corners[start+3].x, corners[start+3].y);
            ctx.closePath();
        });
        [0,1,2,3].forEach(i => {
            ctx.moveTo(corners[i].x, corners[i].y);
            ctx.lineTo(corners[i+4].x, corners[i+4].y);
        });
        ctx.stroke();

        // Draw Workzone
        if (workZoneHeight > 0) {
            const wy = workZoneHeight * PPM;
            const wc = [
                {x: -rw/2, y: wy, z: -rl/2}, {x: rw/2, y: wy, z: -rl/2},
                {x: rw/2, y: wy, z: rl/2}, {x: -rw/2, y: wy, z: rl/2}
            ].map(v => p3d(v.x, v.y, v.z));
            
            ctx.fillStyle = 'rgba(255, 200, 0, 0.05)';
            ctx.strokeStyle = 'rgba(255, 200, 0, 0.3)';
            ctx.beginPath();
            ctx.moveTo(wc[0].x, wc[0].y); ctx.lineTo(wc[1].x, wc[1].y); ctx.lineTo(wc[2].x, wc[2].y); ctx.lineTo(wc[3].x, wc[3].y);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        }

        // Draw Probes
        if (probes) {
            probes.forEach(p => {
                const cx = (p.x - roomWidth/2) * PPM;
                const cz = (p.y - roomLength/2) * PPM;
                const cy = p.z * PPM;
                
                const pt = p3d(cx, cy, cz);
                if (pt.s > 0) {
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
                    ctx.fillStyle = '#34d399';
                    ctx.fill();
                    
                    // Text Label
                    ctx.fillStyle = '#fff';
                    ctx.font = '10px Inter';
                    ctx.fillText(`P: ${p.z.toFixed(1)}m`, pt.x + 8, pt.y);
                }
            });
        }

        // Draw Diffuser Bodies in 3D
        const mountY = Math.max(0, Math.min(state.diffuserHeight, state.roomHeight)) * PPM;
        const sources = (placedDiffusers && placedDiffusers.length > 0) ? placedDiffusers : [{
            x: state.roomWidth / 2,
            y: state.roomLength / 2,
            performance: state.physics,
            modelId: state.modelId,
            flowType: state.flowType
        }];

        sources.forEach(d => {
            const cx = (d.x - state.roomWidth / 2) * PPM;
            const cz = (d.y - state.roomLength / 2) * PPM;
            const p = p3d(cx, mountY, cz);
            
            if (p.s > 0) {
                const r = ((d.performance.spec.A || 150) / 2000) * PPM;
                const nominalDepth = Math.max(16 * (PPM / 1000), ((d.performance.spec.D || 55) * PPM) / 1000);
                drawRealisticDiffuser3D(ctx, cx, mountY, cz, Math.max(2, r), nominalDepth, d.modelId, p3d);
            }
        });

        if (!isPowerOn) {
            requestRef.current = requestAnimationFrame(animate);
            return;
        }

        const pool = particlesRef.current;
        const dt = CONSTANTS.BASE_TIME_STEP;

        // Logic to determine spawn rate based on MAX velocity of all diffusers
        const maxV0 = state.placedDiffusers?.length 
            ? Math.max(...state.placedDiffusers.map(d => d.performance.v0 || 0))
            : (state.physics.v0 || 0);

        if (isPowerOn && isPlaying && maxV0 > 0) {
            // Scale spawn rate by number of diffusers to maintain density per device
            const diffusersCount = state.placedDiffusers?.length || 1;
            const baseRate = CONSTANTS.SPAWN_RATE_BASE + maxV0 / 2 * CONSTANTS.SPAWN_RATE_MULTIPLIER;
            const spawnRate = Math.ceil(baseRate * diffusersCount);
            
            let spawnedCount = 0;
            for (let i = 0; i < pool.length; i++) {
                if (!pool[i].active) {
                    spawnParticle(pool[i], state, PPM);
                    spawnedCount++;
                    if (spawnedCount >= spawnRate) break;
                }
            }
        }

        const batches: Record<string, Particle3D[]> = {};
        const QUANTIZE = 10;

        for (let i = 0; i < pool.length; i++) {
            const p = pool[i];
            if (!p.active) continue;

            if (isPowerOn && isPlaying) {
                p.age += dt;
                updateParticlePhysics(p, dt, state, PPM);
                
                if (p.age > p.life) {
                    p.active = false;
                }

                if (p.age - p.lastHistoryTime >= CONSTANTS.HISTORY_RECORD_INTERVAL) {
                    if (p.history.length > 20) p.history.shift();
                    p.history.push({ x: p.x, y: p.y, z: p.z, age: p.age });
                    p.lastHistoryTime = p.age;
                }
            }

            if (p.history.length > 1) {
                const rawAlpha = (1 - p.age/p.life) * 0.5;
                const alpha = Math.ceil(rawAlpha * QUANTIZE) / QUANTIZE;
                if (alpha <= 0) continue;
                const key = `${p.color}|${alpha}`;
                if (!batches[key]) batches[key] = [];
                batches[key].push(p);
            }
        }

        ctx.globalCompositeOperation = 'screen';
        ctx.lineCap = 'round';

        for (const key in batches) {
            const [color, alphaStr] = key.split('|');
            ctx.strokeStyle = `rgba(${color}, ${alphaStr})`;
            ctx.lineWidth = 1; 
            ctx.beginPath();

            const group = batches[key];
            for (let k = 0; k < group.length; k++) {
                const p = group[k];
                const waveVal = (Math.sin(p.age * p.waveFreq + p.wavePhase) * p.waveAmp * Math.min(p.age, 1.0)) / finalScale;
                
                let wx = 0, wy = 0, wz = 0;
                if (p.isHorizontal && !p.isSuction) {
                    wy = waveVal;
                } else if (!p.isSuction) {
                    wx = waveVal * Math.cos(p.waveAngle); 
                    wz = waveVal * Math.sin(p.waveAngle);
                }

                const cur = p3d(p.x + wx, p.y + wy, p.z + wz);
                if (cur.s <= 0) continue;

                ctx.moveTo(cur.x, cur.y);

                for (let j = p.history.length - 1; j >= 0; j--) {
                    const h = p.history[j];
                    const hWave = (Math.sin(h.age * p.waveFreq + p.wavePhase) * p.waveAmp * Math.min(h.age, 1.0)) / finalScale;
                    let hwx = 0, hwy = 0, hwz = 0;
                    if (p.isHorizontal && !p.isSuction) {
                        hwy = hWave;
                    } else if (!p.isSuction) {
                        hwx = hWave * Math.cos(p.waveAngle);
                        hwz = hWave * Math.sin(p.waveAngle);
                    }

                    const prev = p3d(h.x + hwx, h.y + hwy, h.z + hwz);
                    ctx.lineTo(prev.x, prev.y);
                }
            }
            ctx.stroke();
        }

        ctx.globalCompositeOperation = 'source-over';
        
        requestRef.current = requestAnimationFrame(animate);
    }, [camera]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [animate]);

    return (
        <div 
            className="relative w-full h-full cursor-move"
            onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
            onWheel={handleWheel} onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
        >
            <ViewCube rotX={camera.rotX} rotY={camera.rotY} setCamera={setCamera} />
            <canvas ref={canvasRef} width={props.width} height={props.height} className="block w-full h-full pointer-events-none" />
        </div>
    );
};

const MemoizedThreeDViewCanvas = React.memo(ThreeDViewCanvas);
export default MemoizedThreeDViewCanvas;
