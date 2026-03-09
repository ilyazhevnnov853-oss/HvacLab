
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, Power, Info, Menu, Grid as GridIcon, Thermometer, Box, Scan, MousePointer2, MousePointerClick, Ruler, Eye, HelpCircle, Layers, Maximize, Square, GripHorizontal, Download } from 'lucide-react';
import { SimulatorLeftPanel } from './SimulatorLeftPanel';
import { SimulatorRightPanel } from './SimulatorRightPanel';
import DiffuserCanvas from './DiffuserCanvas';
import SimulatorHelpOverlay from './SimulatorHelpOverlay';
import { useScientificSimulation, calculateScientificPerformanceResult, calculateSimulationField, analyzeField } from '../../../../hooks/useSimulation';
import { PlacedDiffuser, Probe, ToolMode } from '../../../../types';
import { GlassButton } from '../../../ui/Shared';
import { DIFFUSER_CATALOG, getDiffuserMode, getDiffuserFlowType, getDiffuserPerformanceFlowType } from '../../../../constants';

const buildPlacedDiffuserPerformance = (
    diffuser: Pick<PlacedDiffuser, 'modelId' | 'modeIdx' | 'diameter' | 'volume' | 'temperature'>,
    roomTemp: number,
    diffuserHeight: number,
    workZoneHeight: number
) => {
    const performanceFlowType = getDiffuserPerformanceFlowType(diffuser.modelId, diffuser.modeIdx ?? 0);
    return calculateScientificPerformanceResult(
        diffuser.modelId,
        performanceFlowType,
        diffuser.diameter,
        diffuser.volume,
        diffuser.temperature,
        roomTemp,
        diffuserHeight,
        workZoneHeight
    );
};

const INITIAL_PARAMS = {
    modelId: 'dpu-m',
    diameter: 200,
    volume: 600,
    temperature: 20,
    roomTemp: 24,
    roomWidth: 6,
    roomLength: 6,
    roomHeight: 3.5,
    diffuserHeight: 3.5,
    workZoneHeight: 1.5,
    modeIdx: 0,
    isCeilingMounted: true
};

const Simulator = ({ onBack, onHome }: any) => {
    // --- STATE ---
    const [params, setParams] = useState(INITIAL_PARAMS);

    const [viewMode, setViewMode] = useState<'front' | 'right' | 'top' | '3d'>('front');
    const [isPowerOn, setIsPowerOn] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [showGrid, setShowGrid] = useState(true);
    const [snapToGrid, setSnapToGrid] = useState(true);
    
    // Tools
    const [activeTool, setActiveTool] = useState<ToolMode>('select');
    const [placementMode, setPlacementMode] = useState<'single' | 'multi'>('single');

    // Objects
    const [placedDiffusers, setPlacedDiffusers] = useState<PlacedDiffuser[]>([]);
    const [selectedDiffuserId, setSelectedDiffuserId] = useState<string | null>(null);
    const [probes, setProbes] = useState<Probe[]>([]);
    const [sliceX, setSliceX] = useState(() => INITIAL_PARAMS.roomWidth / 2);
    const [sliceY, setSliceY] = useState(() => INITIAL_PARAMS.roomLength / 2);

    // UI State
    const [openSection, setOpenSection] = useState<string | null>('distributor');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileStatsOpen, setIsMobileStatsOpen] = useState(false);
    const [isHelpMode, setIsHelpMode] = useState(false);
    const [sizeSelected, setSizeSelected] = useState(true);

    const containerRef = useRef<HTMLDivElement>(null);
    const [viewSize, setViewSize] = useState({ w: 800, h: 600 });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateViewSize = () => {
            const rect = container.getBoundingClientRect();
            const nextSize = {
                w: Math.max(1, Math.floor(rect.width)),
                h: Math.max(1, Math.floor(rect.height))
            };

            setViewSize(prev => (prev.w === nextSize.w && prev.h === nextSize.h ? prev : nextSize));
        };

        updateViewSize();

        const observer = new ResizeObserver(updateViewSize);
        observer.observe(container);
        window.addEventListener('resize', updateViewSize);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateViewSize);
        };
    }, []);

    const currentModel = useMemo(
        () => DIFFUSER_CATALOG.find(d => d.id === params.modelId),
        [params.modelId]
    );
    const currentMode = useMemo(
        () => getDiffuserMode(params.modelId, params.modeIdx) || currentModel?.modes[0] || { flowType: 'vertical-conical' },
        [currentModel, params.modelId, params.modeIdx]
    );
    const visualFlowType = useMemo(
        () => getDiffuserFlowType(params.modelId, params.modeIdx),
        [params.modelId, params.modeIdx]
    );
    const performanceFlowType = useMemo(
        () => getDiffuserPerformanceFlowType(params.modelId, params.modeIdx),
        [params.modelId, params.modeIdx]
    );

    const physics = useScientificSimulation(
        params.modelId,
        performanceFlowType,
        params.diameter,
        params.volume,
        params.temperature,
        params.roomTemp,
        params.diffuserHeight,
        params.workZoneHeight
    );


    // 2. Simulation Field (Top View Grid)
    const simulationField = useMemo(() => {
        if (placedDiffusers.length === 0) return [];

        return calculateSimulationField(
            params.roomWidth,
            params.roomLength,
            placedDiffusers,
            params.diffuserHeight,
            params.workZoneHeight,
            0.5,
            params.temperature,
            params.roomTemp,
            params.isCeilingMounted
        );
    }, [
        placedDiffusers,
        params.roomWidth,
        params.roomLength,
        params.diffuserHeight,
        params.workZoneHeight,
        params.temperature,
        params.roomTemp,
        params.isCeilingMounted
    ]);

    // 3. Global Stats
    const topViewStats = useMemo(() => {
        const analysis = analyzeField(simulationField);
        const totalNoisePower = placedDiffusers.reduce((acc, d) => acc + Math.pow(10, d.performance.noise / 10), 0);
        const maxNoise = totalNoisePower > 0 ? 10 * Math.log10(totalNoisePower) : 0;

        let tSum = 0;
        let count = 0;
        simulationField.flat().forEach(pt => {
            if (pt) {
                tSum += pt.t;
                count++;
            }
        });
        const avgTemp = count > 0 ? tSum / count : params.roomTemp;

        return {
            maxNoise,
            calcTemp: avgTemp,
            coverage: analysis.totalCoverage,
            adpi: analysis.adpi,
            avgVelocity: analysis.avgVelocity,
            comfortZones: analysis.comfortZones,
            warningZones: analysis.warningZones,
            draftZones: analysis.draftZones,
            deadZones: analysis.deadZones
        };
    }, [simulationField, placedDiffusers, params.roomTemp]);

    // Initialize one diffuser if empty
    useEffect(() => {
        if (placedDiffusers.length === 0 && physics.v0 > 0 && !physics.error) {
            setPlacedDiffusers([{
                id: 'init-1',
                index: 1,
                x: params.roomWidth / 2,
                y: params.roomLength / 2,
                modelId: params.modelId,
                flowType: visualFlowType,
                modeIdx: params.modeIdx,
                diameter: params.diameter,
                volume: params.volume,
                temperature: params.temperature,
                performance: physics
            }]);
            setSelectedDiffuserId('init-1');
            setSliceX(params.roomWidth / 2);
            setSliceY(params.roomLength / 2);
        }
    }, [params.diameter, params.modeIdx, params.modelId, params.roomLength, params.roomWidth, params.temperature, physics, placedDiffusers.length, visualFlowType]);

    useEffect(() => {
        if (!selectedDiffuserId) return;

        setPlacedDiffusers(prev => prev.map(d => (
            d.id === selectedDiffuserId
                ? {
                    ...d,
                    modelId: params.modelId,
                    flowType: visualFlowType,
                    modeIdx: params.modeIdx,
                    diameter: params.diameter,
                    volume: params.volume,
                    temperature: params.temperature,
                    performance: physics
                }
                : d
        )));
    }, [selectedDiffuserId, params.modelId, params.modeIdx, params.diameter, params.volume, params.temperature, visualFlowType, physics]);

    useEffect(() => {
        setPlacedDiffusers(prev => prev.map(d => {
            if (selectedDiffuserId && d.id === selectedDiffuserId) {
                return d;
            }

            return {
                ...d,
                performance: buildPlacedDiffuserPerformance(
                    d,
                    params.roomTemp,
                    params.diffuserHeight,
                    params.workZoneHeight
                )
            };
        }));
    }, [params.roomTemp, params.diffuserHeight, params.workZoneHeight, selectedDiffuserId]);

    // --- HANDLERS ---

    // Clamp placed objects and section lines to room bounds
    useEffect(() => {
        const margin = 0.5;

        setPlacedDiffusers(prev => prev.map(d => ({
            ...d,
            x: Math.min(Math.max(d.x, margin), params.roomWidth - margin),
            y: Math.min(Math.max(d.y, margin), params.roomLength - margin)
        })));

        setProbes(prev => prev.map(p => ({
            ...p,
            x: Math.min(Math.max(p.x, 0.1), params.roomWidth - 0.1),
            y: Math.min(Math.max(p.y, 0.1), params.roomLength - 0.1)
        })));

        setSliceX(prev => Math.min(Math.max(prev, 0), params.roomWidth));
        setSliceY(prev => Math.min(Math.max(prev, 0), params.roomLength));
    }, [params.roomWidth, params.roomLength]);

    const handleSelectDiffuser = (id: string) => {
        const nextSelectedId = id || null;
        setSelectedDiffuserId(nextSelectedId);

        if (!nextSelectedId) return;

        const diffuser = placedDiffusers.find(item => item.id === nextSelectedId);
        if (!diffuser) return;

        setParams(prev => ({
            ...prev,
            modelId: diffuser.modelId,
            diameter: diffuser.diameter,
            volume: diffuser.volume,
            temperature: diffuser.temperature,
            modeIdx: diffuser.modeIdx ?? 0
        }));
    };

    const handleUpdateSlice = (axis: 'x' | 'y', value: number) => {
        if (axis === 'x') {
            setSliceX(Math.max(0, Math.min(params.roomWidth, value)));
            return;
        }

        setSliceY(Math.max(0, Math.min(params.roomLength, value)));
    };

    const addDiffuserAt = (x: number, y: number) => {
        const id = `diff-${Date.now()}`;
        const newDiffuser: PlacedDiffuser = {
            id,
            index: placedDiffusers.length + 1,
            x,
            y,
            modelId: params.modelId,
            flowType: visualFlowType,
            modeIdx: params.modeIdx,
            diameter: params.diameter,
            volume: params.volume,
            temperature: params.temperature,
            performance: buildPlacedDiffuserPerformance(
                {
                    modelId: params.modelId,
                    modeIdx: params.modeIdx,
                    diameter: params.diameter,
                    volume: params.volume,
                    temperature: params.temperature
                },
                params.roomTemp,
                params.diffuserHeight,
                params.workZoneHeight
            )
        };

        setPlacedDiffusers(prev => [...prev, newDiffuser]);
        setSelectedDiffuserId(id);
    };

    const addDiffuser = () => {
        addDiffuserAt(
            params.roomWidth / 2 + (Math.random() - 0.5),
            params.roomLength / 2 + (Math.random() - 0.5)
        );
        if (viewMode !== 'top') setViewMode('top');
    };

    const updateDiffuserPosition = (id: string, x: number, y: number) => {
        setPlacedDiffusers(prev => prev.map(d => d.id === id ? { ...d, x, y } : d));
    };

    const removeDiffuser = (id: string) => {
        const nextDiffusers = placedDiffusers.filter(d => d.id !== id);
        setPlacedDiffusers(nextDiffusers);

        if (selectedDiffuserId !== id) return;

        const fallbackDiffuser = nextDiffusers[nextDiffusers.length - 1] || null;
        setSelectedDiffuserId(fallbackDiffuser?.id || null);

        if (!fallbackDiffuser) return;

        setParams(prev => ({
            ...prev,
            modelId: fallbackDiffuser.modelId,
            diameter: fallbackDiffuser.diameter,
            volume: fallbackDiffuser.volume,
            temperature: fallbackDiffuser.temperature,
            modeIdx: fallbackDiffuser.modeIdx ?? 0
        }));
    };

    const duplicateDiffuser = (id: string) => {
        const source = placedDiffusers.find(d => d.id === id);
        if (!source) return;

        const newId = `diff-${Date.now()}`;
        const duplicatedDiffuser: PlacedDiffuser = {
            ...source,
            id: newId,
            x: source.x + 0.5,
            y: source.y + 0.5,
            index: placedDiffusers.length + 1,
            performance: buildPlacedDiffuserPerformance(
                source,
                params.roomTemp,
                params.diffuserHeight,
                params.workZoneHeight
            )
        };

        setPlacedDiffusers(prev => [...prev, duplicatedDiffuser]);
        setSelectedDiffuserId(newId);
        setParams(prev => ({
            ...prev,
            modelId: source.modelId,
            diameter: source.diameter,
            volume: source.volume,
            temperature: source.temperature,
            modeIdx: source.modeIdx ?? 0
        }));
    };

    // Probes
    const addProbeAtScreenClick = (clickX: number, clickY: number) => {
        let startX = params.roomWidth / 2;
        let startY = params.roomLength / 2;
        let startZ = params.workZoneHeight; // Default to workzone

        if (viewMode === 'top') {
            startX = clickX;
            startY = clickY;
        } else if (viewMode === 'front') {
            startX = clickX;
            startZ = clickY; 
        } else if (viewMode === 'right') {
            startY = clickX;
            startZ = clickY;
        }

        setProbes([...probes, { id: `p-${Date.now()}`, x: startX, y: startY, z: startZ }]);
        setActiveTool('select');
    };
    
    const updateProbePos = (id: string, pos: {x?: number, y?: number, z?: number}) => {
        setProbes(prev => prev.map(p => p.id === id ? { ...p, ...pos } : p));
    };

    const removeProbe = (id: string) => {
        setProbes(prev => prev.filter(p => p.id !== id));
    };

    // UI Helpers
    const toggleSection = (id: string) => setOpenSection(openSection === id ? null : id);
    
    // Derived current flow type for passing to Canvas
    return (
        <div className="flex w-full min-h-screen bg-[#F5F5F7] dark:bg-[#020205] flex-col lg:flex-row relative font-sans text-slate-900 dark:text-slate-200 overflow-hidden selection:bg-blue-500/30">
            {/* Help Overlay */}
            {isHelpMode && <SimulatorHelpOverlay onClose={() => setIsHelpMode(false)} viewMode={viewMode} isPowerOn={isPowerOn} />}

            {/* Left Panel */}
            <SimulatorLeftPanel 
                openSection={openSection} toggleSection={toggleSection}
                params={params} setParams={setParams}
                physics={physics} currentMode={currentMode}
                isPowerOn={isPowerOn} togglePower={() => setIsPowerOn(!isPowerOn)}
                viewMode={viewMode} isPlaying={isPlaying} setIsPlaying={setIsPlaying}
                sizeSelected={sizeSelected} setSizeSelected={setSizeSelected}
                onHome={onHome} onBack={onBack}
                isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}
                onAddDiffuser={addDiffuser}
                isHelpMode={isHelpMode}
                placementMode={placementMode}
                setPlacementMode={setPlacementMode}
            />

            {/* Center Content */}
            <div className="flex-1 flex flex-col relative h-[100dvh] lg:h-screen overflow-hidden p-0 lg:p-4 lg:pl-0">
                <div ref={containerRef} className="flex-1 lg:rounded-[48px] overflow-hidden relative shadow-2xl bg-white dark:bg-[#030304] border-b lg:border border-black/5 dark:border-white/5 ring-1 ring-black/5 dark:ring-white/5 group transition-colors duration-500">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 dark:from-blue-900/5 to-transparent pointer-events-none"></div>
                    
                    {/* Mobile Header Buttons */}
                    <div className="lg:hidden absolute top-4 left-4 right-4 z-30 flex justify-between items-center pointer-events-none">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="pointer-events-auto p-3 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-transform"><Menu size={20} /></button>
                        <button onClick={() => setIsMobileStatsOpen(true)} className="pointer-events-auto p-3 rounded-full bg-white/10 backdrop-blur-md text-slate-800 dark:text-white border border-white/10 active:scale-95 transition-transform"><Info size={20} /></button>
                    </div>
                    
                    <DiffuserCanvas 
                        width={viewSize.w} 
                        height={viewSize.h} 
                        physics={physics} 
                        isPowerOn={isPowerOn} 
                        isPlaying={isPlaying} 
                        temp={params.temperature} 
                        roomTemp={params.roomTemp} 
                        flowType={visualFlowType} 
                        modelId={params.modelId}
                        showGrid={showGrid} 
                        roomHeight={params.roomHeight} 
                        roomWidth={params.roomWidth} 
                        roomLength={params.roomLength}
                        diffuserHeight={params.diffuserHeight} 
                        workZoneHeight={params.workZoneHeight}
                        viewMode={viewMode} 
                        placedDiffusers={placedDiffusers} 
                        onUpdateDiffuserPos={updateDiffuserPosition} 
                        onSelectDiffuser={handleSelectDiffuser}
                        onRemoveDiffuser={removeDiffuser} 
                        onDuplicateDiffuser={duplicateDiffuser} 
                        selectedDiffuserId={selectedDiffuserId}
                        simulationField={simulationField} 
                        gridStep={0.5}
                        snapToGrid={snapToGrid} 
                        gridSnapSize={0.5}
                        activeTool={activeTool}
                        setActiveTool={setActiveTool}
                        placementMode={placementMode}
                        onAddDiffuserAt={addDiffuserAt}
                        sliceX={sliceX}
                        sliceY={sliceY}
                        onUpdateSlice={handleUpdateSlice}
                        probes={probes}
                        onAddProbe={addProbeAtScreenClick}
                        onRemoveProbe={removeProbe}
                        onUpdateProbePos={updateProbePos}
                    />

                   {/* Desktop Toolbar (AutoCAD-like layout with Native App Style) */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1.5 rounded-2xl bg-white/90 dark:bg-[#0a0a0c]/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] pointer-events-auto transition-all duration-500">
                        
                        {/* Power & Play */}
                        <div className="flex items-center gap-1 pr-2 border-r border-black/10 dark:border-white/10">
                            <button 
                                onClick={() => setIsPowerOn(!isPowerOn)} 
                                className={`w-16 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${isPowerOn ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'text-slate-400 hover:bg-black/5 dark:hover:bg-white/10'}`}
                            >
                                <Power size={18} />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Питание</span>
                            </button>
                            {isPowerOn && (
                                <button 
                                    onClick={() => setIsPlaying(!isPlaying)} 
                                    className={`w-16 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${!isPlaying ? 'text-amber-500 bg-amber-500/10' : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'}`}
                                >
                                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                                    <span className="text-[9px] font-bold uppercase tracking-wider">{isPlaying ? 'Пауза' : 'Пуск'}</span>
                                </button>
                            )}
                        </div>

                        {/* View Modes */}
                        <div className="flex items-center gap-1 px-2">
                            {[
                                { id: 'front', label: 'Спереди', icon: <Layers size={18} strokeWidth={2} /> },
                                { id: 'right', label: 'Справа', icon: <Layers size={18} strokeWidth={2} className="rotate-90" /> },
                                { id: 'top', label: 'План', icon: <Maximize size={18} strokeWidth={2} /> },
                                { id: '3d', label: '3D Вид', icon: <Box size={18} strokeWidth={2} /> },
                            ].map(view => (
                                <button 
                                    key={view.id}
                                    onClick={() => setViewMode(view.id as any)}
                                    className={`w-[68px] h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${viewMode === view.id ? 'bg-[#2563eb] text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                >
                                    {view.icon}
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${viewMode === view.id ? 'text-white' : ''}`}>{view.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Tools */}
                        {isPowerOn && (
                            <div className="flex items-center gap-1 pl-2 border-l border-black/10 dark:border-white/10 overflow-hidden transition-all duration-500">
                                <button 
                                    onClick={() => setActiveTool('select')} 
                                    disabled={viewMode === '3d'}
                                    className={`w-[68px] h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${viewMode === '3d' ? 'opacity-30 cursor-not-allowed' : ''} ${activeTool === 'select' && viewMode !== '3d' ? 'bg-black/10 dark:bg-white/15 text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'}`} 
                                >
                                    <MousePointer2 size={18} />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Выбор</span>
                                </button>
                                <button 
                                    onClick={() => setActiveTool('probe')} 
                                    disabled={viewMode === '3d'}
                                    className={`w-[68px] h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${viewMode === '3d' ? 'opacity-30 cursor-not-allowed' : ''} ${activeTool === 'probe' && viewMode !== '3d' ? 'bg-black/10 dark:bg-white/15 text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'}`} 
                                >
                                    <Thermometer size={18} />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Датчик</span>
                                </button>
                                
                                <div className="w-px h-8 bg-black/10 dark:bg-white/10 mx-1"></div>
                                
                                <button 
                                    onClick={() => setShowGrid(!showGrid)} 
                                    disabled={viewMode === '3d'}
                                    className={`w-[68px] h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${viewMode === '3d' ? 'opacity-30 cursor-not-allowed' : ''} ${showGrid && viewMode !== '3d' ? 'bg-black/10 dark:bg-white/15 text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'}`} 
                                >
                                    <GridIcon size={18} />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Сетка</span>
                                </button>
                                <button 
                                    onClick={() => setSnapToGrid(!snapToGrid)} 
                                    disabled={viewMode !== 'top'}
                                    className={`w-[68px] h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${viewMode !== 'top' ? 'opacity-30 cursor-not-allowed' : ''} ${snapToGrid && viewMode === 'top' ? 'bg-black/10 dark:bg-white/15 text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'}`} 
                                >
                                    <Scan size={18} />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Привязка</span>
                                </button>
                            </div>
                        )}

                        {/* Help Button */}
                        <div className="flex items-center pl-2 border-l border-black/10 dark:border-white/10">
                            <button onClick={() => setIsHelpMode(true)} className="w-16 h-14 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300">
                                <HelpCircle size={18} />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Справка</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel */}
            <SimulatorRightPanel 
                viewMode={viewMode}
                physics={physics}
                params={params}
                placedDiffusers={placedDiffusers}
                topViewStats={topViewStats}
                isMobileStatsOpen={isMobileStatsOpen}
                setIsMobileStatsOpen={setIsMobileStatsOpen}
                isHelpMode={isHelpMode}
                selectedDiffuserId={selectedDiffuserId}
                probes={probes}
                onRemoveProbe={removeProbe}
            />
        </div>
    );
};

export default Simulator;
