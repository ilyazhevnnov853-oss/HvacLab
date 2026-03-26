
import React from 'react';
import { Fan, ScanLine, Wind, Thermometer, Home, AlertTriangle, Power, PlusCircle, X, ChevronLeft, CheckCircle2, Shapes, Layers } from 'lucide-react';
import { SPECS, DIFFUSER_CATALOG, getDiffuserMode, getDiffuserPerformanceFlowType } from '../../../../constants';
import { calculatePerformance } from '../../../../hooks/useSimulation';
import { GlassButton, GlassSlider } from '../../../ui/Shared';
import { AccordionItem } from './SimulatorUI';

export const SimulatorLeftPanel = ({ 
    openSection, toggleSection, 
    defaultParams, setDefaultParams, 
    selectedIds,
    placedDiffusers, setPlacedDiffusers,
    physics, currentMode,
    isPowerOn, togglePower, 
    viewMode, isPlaying, setIsPlaying, 
    sizeSelected, setSizeSelected,
    onHome, onBack, isMobileMenuOpen, setIsMobileMenuOpen,
    onAddDiffuser,
    isHelpMode,
    placementMode,
    setPlacementMode
}: any) => {

    const [arrayRows, setArrayRows] = React.useState(2);
    const [arrayCols, setArrayCols] = React.useState(2);

    const isMulti = selectedIds.length > 1;
    const isSingle = selectedIds.length === 1;
    const isNone = selectedIds.length === 0;

    const selectedDiffusers = placedDiffusers.filter((d: any) => selectedIds.includes(d.id));

    // Helper to get value to display
    const getDisplayValue = (key: string) => {
        if (isNone) return defaultParams[key];
        if (isSingle) return selectedDiffusers[0][key];
        
        // Multi-select: check if all have same value
        const firstVal = selectedDiffusers[0][key];
        const allSame = selectedDiffusers.every((d: any) => d[key] === firstVal);
        return allSame ? firstVal : '';
    };

    const displayModelId = getDisplayValue('modelId') || defaultParams.modelId;
    const displayModeIdx = getDisplayValue('modeIdx') !== '' ? getDisplayValue('modeIdx') : defaultParams.modeIdx;
    const displayDiameter = getDisplayValue('diameter');
    const displayVolume = getDisplayValue('volume') || defaultParams.volume;
    const displayTemperature = getDisplayValue('temperature') || defaultParams.temperature;

    const handleParamChange = (key: string, val: any) => {
        if (isNone) {
            setDefaultParams((p: any) => ({ ...p, [key]: val }));
        } else {
            setPlacedDiffusers((prev: any) => prev.map((d: any) => {
                if (selectedIds.includes(d.id)) {
                    return { ...d, [key]: val };
                }
                return d;
            }));
        }
    };

    const handleModelChange = (id: string) => {
        const mode = getDiffuserMode(id, 0);
        if (!mode) return;
        
        const currentDiameterValid = calculatePerformance(id, getDiffuserPerformanceFlowType(id, 0, mode.performanceFlowType), displayDiameter, displayVolume) !== null;
        
        let newDiameter = displayDiameter;
        if (!currentDiameterValid || newDiameter === '') {
            const validDiameter = Object.keys(SPECS).find(d => {
                const val = !isNaN(Number(d)) ? Number(d) : d;
                const testVol = SPECS[d].min || 100;
                return calculatePerformance(id, getDiffuserPerformanceFlowType(id, 0, mode.performanceFlowType), val, testVol) !== null;
            });
            newDiameter = validDiameter ? (!isNaN(Number(validDiameter)) ? Number(validDiameter) : validDiameter) : displayDiameter;
        }
        
        let newVol = displayVolume;
        if (newDiameter && SPECS[newDiameter]) {
             const { min, max } = SPECS[newDiameter];
             if (newVol < min) newVol = min;
             if (newVol > max) newVol = max;
        }

        if (isNone) {
            setDefaultParams((p: any) => ({ ...p, modelId: id, modeIdx: 0, diameter: newDiameter, volume: newVol }));
        } else {
            setPlacedDiffusers((prev: any) => prev.map((d: any) => {
                if (selectedIds.includes(d.id)) {
                    return { ...d, modelId: id, modeIdx: 0, diameter: newDiameter, volume: newVol };
                }
                return d;
            }));
        }
        setSizeSelected(!!newDiameter);
    };

    const handleModeChange = (nextModeIdx: number) => {
        const currentDiameterValid = calculatePerformance(displayModelId, getDiffuserPerformanceFlowType(displayModelId, nextModeIdx), displayDiameter, displayVolume) !== null;
        
        let newDiameter = displayDiameter;
        if (!currentDiameterValid || newDiameter === '') {
            const validDiameter = Object.keys(SPECS).find(d => {
                const val = !isNaN(Number(d)) ? Number(d) : d;
                const testVol = SPECS[d].min || 100;
                return calculatePerformance(displayModelId, getDiffuserPerformanceFlowType(displayModelId, nextModeIdx), val, testVol) !== null;
            });
            newDiameter = validDiameter ? (!isNaN(Number(validDiameter)) ? Number(validDiameter) : validDiameter) : displayDiameter;
        }
        
        let newVol = displayVolume;
        if (newDiameter && SPECS[newDiameter]) {
             const { min, max } = SPECS[newDiameter];
             if (newVol < min) newVol = min;
             if (newVol > max) newVol = max;
        }
        
        if (isNone) {
            setDefaultParams((p: any) => ({ ...p, modeIdx: nextModeIdx, diameter: newDiameter, volume: newVol }));
        } else {
            setPlacedDiffusers((prev: any) => prev.map((d: any) => {
                if (selectedIds.includes(d.id)) {
                    return { ...d, modeIdx: nextModeIdx, diameter: newDiameter, volume: newVol };
                }
                return d;
            }));
        }
        setSizeSelected(!!newDiameter);
    };

    const handleSizeSelect = (d: string | number) => {
        let newVol = displayVolume;
        if (d && SPECS[d]) {
             const { min, max } = SPECS[d];
             if (newVol < min) newVol = min;
             if (newVol > max) newVol = max;
        }
        
        if (isNone) {
            setDefaultParams((p: any) => ({ ...p, diameter: d, volume: newVol }));
        } else {
            setPlacedDiffusers((prev: any) => prev.map((diff: any) => {
                if (selectedIds.includes(diff.id)) {
                    return { ...diff, diameter: d, volume: newVol };
                }
                return diff;
            }));
        }
        setSizeSelected(true);
    };

    const getMinRoomHeight = (workZoneHeight: number) => Number((workZoneHeight + 0.1).toFixed(1));

    const handleGenerateArray = () => {
        const stepX = defaultParams.roomWidth / (arrayCols + 1);
        const stepY = defaultParams.roomLength / (arrayRows + 1);
        const newArray = [];
        for (let r = 0; r < arrayRows; r++) {
            for (let c = 0; c < arrayCols; c++) {
                newArray.push({
                    id: `diff-arr-${Date.now()}-${r}-${c}`,
                    index: placedDiffusers.length + newArray.length + 1,
                    x: stepX * (c + 1),
                    y: stepY * (r + 1),
                    modelId: defaultParams.modelId,
                    flowType: getDiffuserFlowType(defaultParams.modelId, defaultParams.modeIdx),
                    modeIdx: defaultParams.modeIdx,
                    diameter: defaultParams.diameter,
                    volume: defaultParams.volume,
                    temperature: defaultParams.temperature,
                    performance: physics // We'll let Simulator.tsx recalculate it in useEffect
                });
            }
        }
        setPlacedDiffusers((prev: any) => [...prev, ...newArray]);
    };

    return (
        <>
            {/* Mobile Overlay Backdrop */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/80 z-[60] lg:hidden backdrop-blur-sm transition-opacity" 
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
            
            <div className={`
                fixed inset-y-0 left-0 bg-white lg:bg-transparent lg:static w-[85vw] md:w-[420px] lg:w-[420px] h-[100dvh] lg:h-screen shrink-0 transition-transform duration-300 ease-out dark:bg-[#0a0a0f]
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${isHelpMode ? 'z-[210]' : 'z-[70]'}
                p-0 lg:p-4 lg:pl-4 border-r border-black/5 dark:border-white/10 lg:border-none shadow-2xl lg:shadow-none
            `}>
                <div className="flex-1 flex flex-col h-full lg:rounded-[32px] bg-white lg:bg-white/80 dark:bg-[#0a0a0f] lg:dark:bg-[#0a0a0f]/80 backdrop-blur-2xl lg:border border-black/5 dark:border-white/5 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                    {/* Header */}
                    <div className="p-5 lg:p-6 border-b border-black/5 dark:border-white/5 bg-gradient-to-b from-black/5 dark:from-white/5 to-transparent relative pt-safe-top">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex gap-2">
                                     <button onClick={onHome} className="p-3 lg:p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-black/5 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white group">
                                        <Home size={18} />
                                     </button>
                                     {onBack && (
                                         <button onClick={onBack} className="p-3 lg:p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors border border-black/5 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white group">
                                            <ChevronLeft size={18} />
                                         </button>
                                     )}
                                </div>

                                <div className="h-8 w-px bg-black/10 dark:bg-white/10 hidden lg:block"></div>

                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20 text-white">
                                        <Wind size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900 dark:text-white leading-none tracking-tight">HVACLAB</h2>
                                        <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5">Инженерный комплекс</p>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Close Button */}
                            <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 bg-black/5 dark:bg-white/10 rounded-lg text-slate-500 dark:text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-5 space-y-2 pb-24 lg:pb-5">
                        
                        <AccordionItem title="Воздухораспределитель" icon={<Fan size={18}/>} isOpen={openSection === 'distributor'} onClick={() => toggleSection('distributor')}>
                            <div className="mb-4 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                                {isNone && (
                                    <div>
                                        <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Для новых диффузоров</div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white">Настройки по умолчанию</div>
                                    </div>
                                )}
                                {isSingle && (
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Редактирование</div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white">Диффузор {selectedDiffusers[0].modelId}</div>
                                    </div>
                                )}
                                {isMulti && (
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Мультивыделение</div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white">Выделено: {selectedIds.length} объектов</div>
                                    </div>
                                )}
                            </div>

                            <div className="mb-5">
                                <div className="grid grid-cols-2 gap-2.5">
                                    {DIFFUSER_CATALOG.map(d => (
                                        <button 
                                            key={d.id} 
                                            onClick={() => handleModelChange(d.id)} 
                                            className={`p-3.5 rounded-2xl border text-left transition-all group relative overflow-hidden ${displayModelId === d.id ? 'bg-blue-600 border-blue-500/50 text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)]' : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-500 hover:bg-black/10 dark:hover:bg-white/10'}`}
                                        >
                                            <div className="text-xs font-bold relative z-10">{d.series}</div>
                                            <div className={`text-[10px] truncate relative z-10 mt-0.5 ${displayModelId === d.id ? 'text-blue-100' : 'opacity-50'}`}>{d.name}</div>
                                            {displayModelId === d.id && <div className="absolute right-0 top-0 p-2 opacity-20"><CheckCircle2 size={32}/></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-6 p-4 rounded-2xl bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5">
                                <div className="flex justify-between items-baseline mb-3">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Mode</label>
                                    <span className="text-[9px] text-slate-400 font-bold">{currentMode?.b_text}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {(DIFFUSER_CATALOG.find(m => m.id === displayModelId)?.modes || []).map((mode, idx) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => handleModeChange(idx)}
                                            className={`px-3 py-2.5 rounded-xl border text-left transition-all ${displayModeIdx === idx ? 'bg-blue-600 text-white border-blue-500/50 shadow-[0_8px_20px_rgba(37,99,235,0.25)]' : 'bg-white/70 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/10'}`}
                                        >
                                            <div className="text-[10px] font-bold">{mode.name} / {mode.subtitle}</div>
                                            <div className={`text-[9px] mt-1 ${displayModeIdx === idx ? 'text-blue-100' : 'text-slate-400'}`}>{mode.b_text}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-6 p-4 rounded-2xl bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5">
                                <div className="flex justify-between items-baseline mb-3">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Типоразмер</label>
                                    {!sizeSelected && <span className="text-[9px] text-amber-500 font-bold animate-pulse flex items-center gap-1"><AlertTriangle size={10}/> Выберите размер</span>}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {Object.keys(SPECS).map(d => {
                                        const val = !isNaN(Number(d)) ? Number(d) : d;
                                        const testVol = SPECS[d].min || 100;
                                        if (calculatePerformance(displayModelId, getDiffuserPerformanceFlowType(displayModelId, displayModeIdx), val, testVol) === null) return null;
                                        return <button key={d} onClick={() => handleSizeSelect(val)} className={`px-4 py-2.5 rounded-xl text-[10px] font-bold font-mono transition-all border ${displayDiameter === val ? 'bg-slate-900 dark:bg-white text-white dark:text-black border-transparent shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-105' : 'bg-white dark:bg-white/5 text-slate-500 border-black/5 dark:border-transparent hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'}`}>{d}</button>;
                                    })}
                                </div>
                            </div>
                            <div className="space-y-6">
                                <GlassSlider label="Расход воздуха" icon={<Wind size={14}/>} val={displayVolume} min={physics.spec.min || 50} max={(physics.spec.max || 1000) * 1.5} step={10} unit=" м³/ч" onChange={(v: number) => handleParamChange('volume', v)}/>
                                <GlassSlider label="Т° Притока" icon={<Thermometer size={14}/>} val={displayTemperature} min={15} max={35} step={1} unit="°C" onChange={(v: number) => handleParamChange('temperature', v)} color="temp"/>
                            </div>
                        </AccordionItem>

                        <AccordionItem title="Помещение" icon={<ScanLine size={18}/>} isOpen={openSection === 'room'} onClick={() => toggleSection('room')}>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {['roomWidth', 'roomLength', 'roomHeight'].map(key => (
                                    <div key={key} className="bg-black/5 dark:bg-black/20 p-3 rounded-2xl border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/20 transition-colors focus-within:border-blue-500/50 group">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1.5 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
                                            {key === 'roomWidth' && 'Ширина'}
                                            {key === 'roomLength' && 'Длина'}
                                            {key === 'roomHeight' && 'Высота'} (м)
                                        </label>
                                        <input 
                                            type="number" 
                                            step="0.5" 
                                            min={key === 'roomHeight' ? getMinRoomHeight(defaultParams.workZoneHeight) : 1}
                                            max={key === 'roomHeight' ? 4 : 10}
                                            value={(defaultParams as any)[key]} 
                                            onChange={(e) => {
                                                let val = Number(e.target.value);
                                                if (key === 'roomHeight' && val > 4) val = 4;
                                                if ((key === 'roomWidth' || key === 'roomLength') && val > 10) val = 10;
                                                setDefaultParams((p: any) => ({
                                                    ...p, 
                                                    [key]: val,
                                                    // Ensure diffuser is always at ceiling height
                                                    ...(key === 'roomHeight' ? { diffuserHeight: val } : {})
                                                }));
                                            }} 
                                            onBlur={(e) => {
                                                let val = Number(e.target.value);
                                                if (key === 'roomHeight') {
                                                    const minH = getMinRoomHeight(defaultParams.workZoneHeight);
                                                    if (val < minH) val = minH;
                                                    if (val > 4) val = 4;
                                                    setDefaultParams((p: any) => ({
                                                        ...p, 
                                                        [key]: val,
                                                        ...(key === 'roomHeight' ? { diffuserHeight: val } : {})
                                                    }));
                                                } else if (key === 'roomWidth' || key === 'roomLength') {
                                                    if (val < 1) val = 1;
                                                    if (val > 10) val = 10;
                                                    setDefaultParams((p: any) => ({
                                                        ...p, 
                                                        [key]: val
                                                    }));
                                                }
                                            }}
                                            className="bg-transparent w-full text-sm font-bold font-mono text-slate-900 dark:text-white outline-none" 
                                        />
                                    </div>
                                ))}
                                
                                <div className="bg-black/5 dark:bg-black/20 p-3 rounded-2xl border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/20 transition-colors">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1.5">Раб. Зона (м)</label>
                                    <div className="flex bg-white/40 dark:bg-black/40 rounded-lg p-1 gap-1 h-[26px]">
                                        {[1.5, 2.0].map(val => (
                                            <button
                                                key={val}
                                                onClick={() => {
                                                    const minH = getMinRoomHeight(val);
                                                    setDefaultParams((p: any) => ({ 
                                                        ...p, 
                                                        workZoneHeight: val,
                                                        ...(p.roomHeight < minH ? { roomHeight: minH, diffuserHeight: minH } : {})
                                                    }));
                                                }}
                                                className={`flex-1 rounded-md text-[10px] font-bold font-mono transition-all ${defaultParams.workZoneHeight === val ? 'bg-white dark:bg-slate-600 text-black dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                            >
                                                {val.toFixed(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <GlassSlider label="Т° Помещения" icon={<Home size={14}/>} val={defaultParams.roomTemp} min={15} max={35} step={1} unit="°C" onChange={(v: number) => setDefaultParams((p: any) => ({...p, roomTemp: v}))} color="temp"/>
                        </AccordionItem>

                        <AccordionItem title="Заполнить сеткой" icon={<GridIcon size={18}/>} isOpen={openSection === 'array'} onClick={() => toggleSection('array')}>
                            <div className="p-4 rounded-2xl bg-black/5 dark:bg-black/20 border border-black/5 dark:border-white/5 mb-4">
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div>
                                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1.5">Ряды (Y)</label>
                                        <input type="number" min="1" max="10" value={arrayRows} onChange={e => setArrayRows(Number(e.target.value))} className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg p-2 text-sm font-mono outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1.5">Колонки (X)</label>
                                        <input type="number" min="1" max="10" value={arrayCols} onChange={e => setArrayCols(Number(e.target.value))} className="w-full bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg p-2 text-sm font-mono outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                                <GlassButton onClick={handleGenerateArray} label="Сгенерировать" customClass="w-full bg-blue-600 text-white hover:bg-blue-700" />
                            </div>
                        </AccordionItem>
                    </div>

                    {/* Footer Controls */}
                    <div className="p-5 bg-white/60 dark:bg-[#050508]/60 border-t border-black/5 dark:border-white/5 backdrop-blur-xl absolute bottom-0 left-0 right-0 lg:relative">
                            <div className="grid grid-cols-1 gap-3">
                                <GlassButton onClick={() => { onAddDiffuser(); }} icon={<PlusCircle size={18} />} label="Добавить (Штамп)" secondary={true} disabled={!sizeSelected || !!physics.error} customClass="w-full bg-white/50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-white/10" />
                            </div>
                    </div>
                </div>
            </div>
        </>
    );
};
