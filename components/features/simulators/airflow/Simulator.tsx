
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, Power, Info, Menu, Grid as GridIcon, Thermometer, Box, Scan, MousePointer2, MousePointerClick, Ruler, Eye, HelpCircle, Layers, Maximize, Square, GripHorizontal, Download } from 'lucide-react';
import { SimulatorLeftPanel } from './SimulatorLeftPanel';
import { SimulatorRightPanel } from './SimulatorRightPanel';
import DiffuserCanvas from './DiffuserCanvas';
import SimulatorHelpOverlay from './SimulatorHelpOverlay';
import { useScientificSimulation, calculateSimulationField, analyzeField } from '../../../../hooks/useSimulation';
import { PlacedDiffuser, Probe, Obstacle, ToolMode, VisualizationMode } from '../../../../types';
import { GlassButton } from '../../../ui/Shared';

const Simulator = ({ onBack, onHome }: any) => {
    // --- STATE ---
    const [params, setParams] = useState({
        modelId: 'dpu-m',
        diameter: 200,
        volume: 600,
        temperature: 20,
        roomTemp: 24,
        roomWidth: 6,
        roomLength: 6,
        roomHeight: 3.5,
        diffuserHeight: 3.5,
        workZoneHeight: 1.8,
        modeIdx: 0,
        isCeilingMounted: true
    });

    const [viewMode, setViewMode] = useState<'side' | 'top' | '3d'>('side');
    const [isPowerOn, setIsPowerOn] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [showGrid, setShowGrid] = useState(true);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [heatmapZ, setHeatmapZ] = useState(1.1); // Height slice for heatmap
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('velocity');
    
    // Tools
    const [activeTool, setActiveTool] = useState<ToolMode>('select');
    const [placementMode, setPlacementMode] = useState<'single' | 'multi'>('single');

    // Objects
    const [placedDiffusers, setPlacedDiffusers] = useState<PlacedDiffuser[]>([]);
    const [selectedDiffuserId, setSelectedDiffuserId] = useState<string | null>(null);
    const [probes, setProbes] = useState<Probe[]>([]);
    const [obstacles, setObstacles] = useState<Obstacle[]>([]);

    // UI State
    const [openSection, setOpenSection] = useState<string | null>('distributor');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileStatsOpen, setIsMobileStatsOpen] = useState(false);
    const [isHelpMode, setIsHelpMode] = useState(false);
    const [sizeSelected, setSizeSelected] = useState(true);

    const containerRef = useRef<HTMLDivElement>(null);
    const [viewSize, setViewSize] = useState({ w: 800, h: 600 });

    // --- PHYSICS CALCULATION ---
    // 1. Single Diffuser Physics (Base Performance)
    const physics = useScientificSimulation(
        params.modelId,
        'vertical-conical', // Simplification: we might want to get this from catalog based on modelId
        params.diameter,
        params.volume,
        params.temperature,
        params.roomTemp,
        params.diffuserHeight,
        params.workZoneHeight
    );

    // 2. Simulation Field (Top View Grid)
    // Only calculate if needed to save resources
    const simulationField = useMemo(() => {
        if ((viewMode === 'top' || viewMode === '3d') && placedDiffusers.length > 0) {
            return calculateSimulationField(
                params.roomWidth, 
                params.roomLength, 
                placedDiffusers, 
                params.diffuserHeight, 
                params.workZoneHeight, 
                0.5, // Grid step
                obstacles,
                heatmapZ,
                params.temperature,
                params.roomTemp
            );
        }
        return [];
    }, [viewMode, params.roomWidth, params.roomLength, placedDiffusers, params.diffuserHeight, params.workZoneHeight, obstacles, heatmapZ, params.temperature, params.roomTemp]);

    // 3. Global Stats
    const topViewStats = useMemo(() => {
        const analysis = analyzeField(simulationField);
        // Simple noise summation
        const totalNoisePower = placedDiffusers.reduce((acc, d) => acc + Math.pow(10, d.performance.noise/10), 0);
        const maxNoise = totalNoisePower > 0 ? 10 * Math.log10(totalNoisePower) : 0;
        
        // Avg temp in field
        let tSum = 0, count = 0;
        simulationField.flat().forEach(pt => { if(pt) { tSum += pt.t; count++; } });
        const avgTemp = count > 0 ? tSum/count : params.roomTemp;

        return {
            maxNoise,
            calcTemp: avgTemp,
            coverage: analysis.totalCoverage,
            adpi: analysis.adpi
        };
    }, [simulationField, placedDiffusers, params.roomTemp]);

    // --- HANDLERS ---

    // Resize Observer
    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setViewSize({ w: width, h: height });
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Initialize one diffuser if empty
    useEffect(() => {
        if (placedDiffusers.length === 0 && physics.v0 > 0 && !physics.error) {
            // Only add if valid
            setPlacedDiffusers([{
                id: 'init-1', index: 1, 
                x: params.roomWidth / 2, 
                y: params.roomLength / 2, 
                modelId: params.modelId, 
                diameter: params.diameter, 
                volume: params.volume, 
                temperature: params.temperature,
                performance: physics
            }]);
        }
    }, []);

    // Update diffusers when global params change (if single mode logic is desired)
    // Or just update the one selected? For this simulator, we update ALL to match params for simplicity
    // in a real app, we'd update only selected.
    useEffect(() => {
        if (!physics.error) {
            setPlacedDiffusers(prev => prev.map(d => ({
                ...d,
                modelId: params.modelId,
                diameter: params.diameter,
                volume: params.volume,
                temperature: params.temperature,
                performance: physics
            })));
        }
    }, [params.modelId, params.diameter, params.volume, params.temperature, physics]);

    const addDiffuserAt = (x: number, y: number) => {
        const id = `diff-${Date.now()}`;
        const newD: PlacedDiffuser = {
            id, index: placedDiffusers.length + 1,
            x,
            y,
            modelId: params.modelId,
            diameter: params.diameter,
            volume: params.volume,
            temperature: params.temperature,
            performance: physics
        };
        setPlacedDiffusers([...placedDiffusers, newD]);
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
        setPlacedDiffusers(prev => prev.filter(d => d.id !== id));
        if (selectedDiffuserId === id) setSelectedDiffuserId(null);
    };

    const duplicateDiffuser = (id: string) => {
        const source = placedDiffusers.find(d => d.id === id);
        if (source) {
            const newId = `diff-${Date.now()}`;
            setPlacedDiffusers([...placedDiffusers, {
                ...source,
                id: newId,
                x: source.x + 0.5,
                y: source.y + 0.5,
                index: placedDiffusers.length + 1
            }]);
            setSelectedDiffuserId(newId);
        }
    };

    // Probes
    const addProbe = (x: number, y: number) => {
        const z = params.workZoneHeight; // Default to workzone
        setProbes([...probes, { id: `p-${Date.now()}`, x, y, z }]);
    };
    
    const updateProbePos = (id: string, pos: {x?: number, y?: number, z?: number}) => {
        setProbes(prev => prev.map(p => p.id === id ? { ...p, ...pos } : p));
    };

    const removeProbe = (id: string) => {
        setProbes(prev => prev.filter(p => p.id !== id));
    };

    // Obstacles
    const addObstacle = (x: number, y: number, w: number = 1, l: number = 1, type: 'furniture' | 'wall_block' = 'furniture') => {
        const h = type === 'wall_block' ? params.roomHeight : 1.0;
        setObstacles([...obstacles, {
            id: `obs-${Date.now()}`,
            x, y, width: w, length: l,
            z: 0, height: h, rotation: 0,
            type
        }]);
    };

    const removeObstacle = (id: string) => {
        setObstacles(prev => prev.filter(o => o.id !== id));
    };

    const updateObstacle = (id: string, updates: Partial<Obstacle>) => {
        setObstacles(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    };

    // UI Helpers
    const toggleSection = (id: string) => setOpenSection(openSection === id ? null : id);
    
    // Derived current flow type for passing to Canvas
    const currentMode = { flowType: 'vertical-conical' }; // Placeholder, needs actual logic if modes vary

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
                setObstacles={setObstacles}
                placementMode={placementMode}
                setPlacementMode={setPlacementMode}
                heatmapZ={heatmapZ}
                setHeatmapZ={setHeatmapZ}
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
                        flowType={currentMode.flowType} 
                        modelId={params.modelId}
                        showGrid={showGrid} 
                        showHeatmap={showHeatmap}
                        visualizationMode={visualizationMode}
                        roomHeight={params.roomHeight} 
                        roomWidth={params.roomWidth} 
                        roomLength={params.roomLength}
                        diffuserHeight={params.diffuserHeight} 
                        workZoneHeight={params.workZoneHeight}
                        viewMode={viewMode} 
                        placedDiffusers={placedDiffusers} 
                        onUpdateDiffuserPos={updateDiffuserPosition} 
                        onSelectDiffuser={setSelectedDiffuserId}
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
                        probes={probes}
                        onAddProbe={addProbe}
                        onRemoveProbe={removeProbe}
                        onUpdateProbePos={updateProbePos}
                        obstacles={obstacles}
                        onAddObstacle={addObstacle}
                        onRemoveObstacle={removeObstacle}
                        onUpdateObstacle={updateObstacle}
                    />

                    {/* Desktop Toolbar (Floating iOS 26 Style) */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1.5 rounded-full bg-white/90 dark:bg-[#0a0a0c]/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] pointer-events-auto transition-all duration-500">
                        
                        {/* Power & Play */}
                        <div className="flex items-center gap-1 pr-2 border-r border-black/10 dark:border-white/10">
                            <button onClick={() => setIsPowerOn(!isPowerOn)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isPowerOn ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'text-slate-400 hover:bg-black/5 dark:hover:bg-white/10'}`}>
                                <Power size={18} />
                            </button>
                            {isPowerOn && (
                                <button onClick={() => setIsPlaying(!isPlaying)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${!isPlaying ? 'text-amber-500 bg-amber-500/10' : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'}`}>
                                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                                </button>
                            )}
                        </div>

                        {/* View Modes */}
                        <div className="flex items-center gap-1 px-2">
                            <button 
                                onClick={() => setViewMode('side')}
                                className={`flex items-center gap-2 px-4 h-10 rounded-full text-[11px] font-bold tracking-[0.08em] transition-all duration-300 ${viewMode === 'side' ? 'bg-[#2563eb] text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                                <Layers size={16} strokeWidth={2} />
                                <span>СРЕЗ</span>
                            </button>
                            <button 
                                onClick={() => setViewMode('top')}
                                className={`flex items-center gap-2 px-4 h-10 rounded-full text-[11px] font-bold tracking-[0.08em] transition-all duration-300 ${viewMode === 'top' ? 'bg-[#2563eb] text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                                <Maximize size={16} strokeWidth={2} />
                                <span>ПЛАН</span>
                            </button>
                            <button 
                                onClick={() => setViewMode('3d')}
                                className={`flex items-center gap-2 px-4 h-10 rounded-full text-[11px] font-bold tracking-[0.08em] transition-all duration-300 ${viewMode === '3d' ? 'bg-[#2563eb] text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                                <Box size={16} strokeWidth={2} />
                                <span>3D</span>
                            </button>
                        </div>

                        {/* Tools (Dynamic based on view mode) */}
                        {isPowerOn && (
                            <div className="flex items-center gap-1 pl-2 border-l border-black/10 dark:border-white/10 overflow-hidden transition-all duration-500">
                                <button onClick={() => setActiveTool('select')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${activeTool === 'select' ? 'bg-black/10 dark:bg-white/15 text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'}`} title="Выбор">
                                    <MousePointer2 size={18} />
                                </button>
                                <button onClick={() => setActiveTool('probe')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${activeTool === 'probe' ? 'bg-black/10 dark:bg-white/15 text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'}`} title="Датчик">
                                    <Thermometer size={18} />
                                </button>
                                
                                {viewMode === 'top' && (
                                    <>
                                        <button onClick={() => setActiveTool('obstacle')} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${activeTool === 'obstacle' ? 'bg-black/10 dark:bg-white/15 text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'}`} title="Препятствие">
                                            <Box size={18} />
                                        </button>
                                        <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1"></div>
                                        <button onClick={() => setShowGrid(!showGrid)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${showGrid ? 'bg-black/10 dark:bg-white/15 text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'}`} title="Сетка">
                                            <GridIcon size={18} />
                                        </button>
                                        <button onClick={() => setSnapToGrid(!snapToGrid)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${snapToGrid ? 'bg-black/10 dark:bg-white/15 text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'}`} title="Привязка">
                                            <Scan size={18} />
                                        </button>
                                        <button onClick={() => setShowHeatmap(!showHeatmap)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${showHeatmap ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5'}`} title="Теплокарта">
                                            <Layers size={18} />
                                        </button>
                                        {showHeatmap && (
                                            <button 
                                                onClick={() => setVisualizationMode(prev => prev === 'velocity' ? 'adpi' : 'velocity')} 
                                                className="px-3 h-10 rounded-full flex items-center justify-center text-[10px] font-bold bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors ml-1 text-slate-700 dark:text-slate-300"
                                            >
                                                {visualizationMode === 'velocity' ? 'VEL' : 'ADPI'}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Help Button */}
                        <div className="flex items-center pl-2 border-l border-black/10 dark:border-white/10">
                            <button onClick={() => setIsHelpMode(true)} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300">
                                <HelpCircle size={18} />
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
                probes={probes}
                onRemoveProbe={removeProbe}
                obstacles={obstacles}
            />
        </div>
    );
};

export default Simulator;
