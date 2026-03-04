import React, { useState } from 'react';
import { Target, Trash2, ScanLine, X } from 'lucide-react';
import { InfoRow, AccordionItem } from './SimulatorUI';
import { calculateProbeData } from '../../../../hooks/useSimulation';

export const SimulatorRightPanel = ({ 
    viewMode, physics, params, placedDiffusers, topViewStats, 
    isMobileStatsOpen, setIsMobileStatsOpen,
    isHelpMode,
    probes, onRemoveProbe
}: any) => {

    const [sections, setSections] = useState({
        main: true,
        probes: true
    });

    const toggle = (key: string) => setSections((prev: any) => ({ ...prev, [key]: !prev[key] }));

    // Логика выбора активного диффузора. 
    // Берем последний из списка добавленных. Если в будущем добавится пропс selectedId, 
    // можно будет искать конкретный: placedDiffusers.find(d => d.id === selectedId)
    const hasDiffusers = placedDiffusers && placedDiffusers.length > 0;
    const activeDiffuser = hasDiffusers ? placedDiffusers[placedDiffusers.length - 1] : null;

    const Content = () => (
        <div className="space-y-4 animate-in slide-in-from-right-8 duration-500 relative z-10">
            
            <AccordionItem 
                title="Показатели системы" 
                icon={<ScanLine size={16}/>} 
                isOpen={sections.main} 
                onClick={() => toggle('main')}
            >
                <div className="mt-0 bg-[#13141c] rounded-[24px] p-6 border border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none"></div>
                    
                    <div className="space-y-1 relative z-10">
                        {/* 1. Общие показатели среды и помещения */}
                        <div className="mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Общие данные
                        </div>
                        <InfoRow 
                            label="Т° Помещения" 
                            value={params?.roomTemp || '0'} 
                            unit="°C" 
                        />
                        <InfoRow 
                            label="Общий шум диффузоров" 
                            value={hasDiffusers ? topViewStats?.maxNoise?.toFixed(0) : '-'} 
                            unit={hasDiffusers ? "дБ" : ""} 
                            alert={hasDiffusers && (topViewStats?.maxNoise || 0) > 45} 
                        />
                        
                        <div className="my-5 border-t border-white/5" />

                        {/* 2. Показатели конкретного (последнего/выбранного) диффузора */}
                        <div className="mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between items-center">
                            <span>{hasDiffusers ? 'Текущий диффузор' : 'Диффузоры не добавлены'}</span>
                            {hasDiffusers && (
                                <span className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                                    Активный
                                </span>
                            )}
                        </div>
                        
                        <InfoRow 
                            label="Температура притока" 
                            value={activeDiffuser ? activeDiffuser.temperature : '-'} 
                            unit={activeDiffuser ? "°C" : ""} 
                            highlight={!!activeDiffuser}
                        />
                        <InfoRow 
                            label="Скорость в рабочей зоне" 
                            value={activeDiffuser && activeDiffuser.performance?.workzoneVelocity 
                                ? activeDiffuser.performance.workzoneVelocity.toFixed(2) 
                                : '-'} 
                            unit={activeDiffuser ? "м/с" : ""} 
                        />
                    </div>
                </div>
            </AccordionItem>

            {/* ТОЧКИ ИЗМЕРЕНИЯ (Датчики) */}
            {probes && probes.length > 0 && (
                <AccordionItem 
                    title="Точки измерения" 
                    icon={<Target size={16}/>} 
                    isOpen={sections.probes} 
                    onClick={() => toggle('probes')}
                >
                    <div className="mt-0 space-y-3">
                        {probes.map((probe: any, idx: number) => {
                            const data = calculateProbeData(
                                probe, 
                                placedDiffusers || [], 
                                params?.roomTemp || 20,
                                params?.temperature || 20,
                                params?.roomWidth || 10,
                                params?.roomLength || 10,
                                params?.roomHeight || 3
                            );
                            
                            return (
                                <div key={probe.id} className="bg-black/20 rounded-xl p-3 border border-white/5 hover:bg-white/5 transition-colors group">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                {idx + 1}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">H={probe.z.toFixed(1)}m</span>
                                        </div>
                                        <button onClick={() => onRemoveProbe(probe.id)} className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="text-center bg-white/5 rounded-lg p-1.5">
                                            <div className="text-[9px] text-slate-500 mb-0.5">V (м/с)</div>
                                            <div className="font-mono font-bold text-xs text-white">{data.v.toFixed(2)}</div>
                                        </div>
                                        <div className="text-center bg-white/5 rounded-lg p-1.5">
                                            <div className="text-[9px] text-slate-500 mb-0.5">T (°C)</div>
                                            <div className="font-mono font-bold text-xs text-white">{data.t.toFixed(1)}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </AccordionItem>
            )}
        </div>
    );

    return (
        <>
            {/* Desktop Panel */}
            <div className={`
                hidden lg:flex flex-col w-[360px] h-screen shrink-0 relative p-4 pl-0 transition-all duration-300
                ${isHelpMode ? 'z-[210]' : 'z-20'}
            `}>
                <div className="flex-1 rounded-[32px] bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/5 p-6 flex flex-col gap-6 shadow-2xl overflow-y-auto custom-scrollbar relative">
                    <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none"/>
                    <Content />
                </div>
            </div>

            {/* Mobile Bottom Sheet/Drawer */}
            <div className={`
                fixed inset-x-0 bottom-0 lg:hidden
                bg-[#0a0a0f] border-t border-white/10 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.8)]
                transform transition-transform duration-300 ease-out flex flex-col max-h-[85vh]
                ${isHelpMode ? 'z-[210]' : 'z-[80]'}
                ${isMobileStatsOpen ? 'translate-y-0' : 'translate-y-full'}
            `}>
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                     <div className="w-12 h-1 bg-white/10 rounded-full absolute top-3 left-1/2 -translate-x-1/2"></div>
                     <span className="font-bold text-white uppercase tracking-widest text-xs">Статистика</span>
                     <button onClick={() => setIsMobileStatsOpen(false)} className="p-2 bg-white/10 rounded-full text-slate-400 hover:text-white"><X size={16}/></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar pb-10">
                    <Content />
                </div>
            </div>
            {/* Mobile Backdrop */}
            {isMobileStatsOpen && (
                <div className="fixed inset-0 bg-black/60 z-[70] lg:hidden backdrop-blur-sm" onClick={() => setIsMobileStatsOpen(false)} />
            )}
        </>
    );
};