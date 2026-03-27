import React, { useState, useMemo } from 'react';
import { 
    Wind, Settings2, Grid, CircleDot, Wand2, Table2, 
    CheckCircle2, ArrowRight, RotateCcw, Activity, Info
} from 'lucide-react';
import { GlassButton, GlassSlider } from '../../../ui/Shared';
import { useLocalStorage } from '../../../../hooks/useLocalStorage';

interface VelocityState {
    volume: number;
    minSpeed: number;
    maxSpeed: number;
    mode: 'check' | 'wizard';
}

const VelocityCalculator = ({ onBack, onHome }: any) => {
    const [calcState, setCalcState] = useLocalStorage<VelocityState>('hvac-calc-velocity', {
        volume: 1000,
        minSpeed: 2,
        maxSpeed: 5,
        mode: 'check'
    });

    const { volume, minSpeed, maxSpeed, mode } = calcState;

    // Data ranges
    const circularSizes = [100, 125, 160, 200, 250, 315, 355, 400, 450, 500, 630, 710, 800, 1000, 1250];
    const rectSizes = [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000];

    // Helper
    const calculateSpeed = (area: number) => {
        if (!area || area === 0) return 0;
        return volume / (3600 * area);
    };

    // Wizard Logic
    const suggestions = useMemo(() => {
        // Circular
        const round = circularSizes.map(d => {
            const area = Math.PI * Math.pow(d / 1000, 2) / 4;
            const v = calculateSpeed(area);
            return { d, v, area };
        })
        .filter(i => i.v <= maxSpeed && i.v > 0.5)
        .sort((a, b) => b.v - a.v);

        // Rectangular
        const rect = [];
        for (let h of rectSizes) {
            for (let w of rectSizes) {
                if (w < h) continue;
                const area = (w / 1000) * (h / 1000);
                const v = calculateSpeed(area);
                if (v <= maxSpeed && v > 0.5) {
                    rect.push({ w, h, v, area });
                }
            }
        }
        rect.sort((a, b) => b.v - a.v);

        return { round, rect: rect.slice(0, 40) };
    }, [volume, maxSpeed]);

    const handleReset = () => {
        setCalcState({
            volume: 1000,
            minSpeed: 2,
            maxSpeed: 5,
            mode: 'check'
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-20 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20 text-white">
                        <Wind size={24} />
                    </div>
                    Скорость в воздуховодах
                </h1>
                <div className="flex items-center gap-2">
                    <GlassButton secondary onClick={onBack} label="Назад" />
                    <GlassButton secondary onClick={onHome} label="Главная" />
                </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-2xl w-fit">
                <button 
                    onClick={() => setCalcState(prev => ({ ...prev, mode: 'check' }))}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                        mode === 'check' 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                >
                    <Table2 size={14} /> Таблица
                </button>
                <button 
                    onClick={() => setCalcState(prev => ({ ...prev, mode: 'wizard' }))}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                        mode === 'wizard' 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                >
                    <Wand2 size={14} /> Подбор сечения
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Controls Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white/60 dark:bg-[#0a0a0f]/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Settings2 size={16} className="text-emerald-500" /> Параметры
                        </h2>
                        
                        <div className="space-y-8">
                            <GlassSlider 
                                label="Расход воздуха" 
                                val={volume} min={100} max={10000} step={50} 
                                onChange={(v) => setCalcState(prev => ({ ...prev, volume: v }))} 
                                unit=" м³/ч"
                            />

                            {mode === 'check' ? (
                                <>
                                    <GlassSlider 
                                        label="Мин. скорость" 
                                        val={minSpeed} min={0.5} max={5} step={0.1} 
                                        onChange={(v) => setCalcState(prev => ({ ...prev, minSpeed: v }))} 
                                        unit=" м/с"
                                    />
                                    <GlassSlider 
                                        label="Макс. скорость" 
                                        val={maxSpeed} min={2} max={15} step={0.5} 
                                        onChange={(v) => setCalcState(prev => ({ ...prev, maxSpeed: v }))} 
                                        unit=" м/с"
                                    />
                                </>
                            ) : (
                                <GlassSlider 
                                    label="Лимит скорости" 
                                    val={maxSpeed} min={1} max={15} step={0.5} 
                                    onChange={(v) => setCalcState(prev => ({ ...prev, maxSpeed: v }))} 
                                    unit=" м/с"
                                />
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5">
                            <GlassButton secondary icon={<RotateCcw size={16}/>} label="Сбросить" onClick={handleReset} className="w-full" />
                        </div>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 flex gap-3">
                        <Info size={20} className="text-emerald-500 shrink-0" />
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1 uppercase tracking-tighter">Справка:</span>
                            Рекомендуемые скорости: 
                            <br/>• Магистрали: 4-6 м/с
                            <br/>• Ответвления: 2-4 м/с
                            <br/>• Решетки: 1.5-2.5 м/с
                        </p>
                    </div>
                </div>

                {/* Results Card */}
                <div className="lg:col-span-2 space-y-6">
                    {mode === 'check' ? (
                        <div className="bg-white/60 dark:bg-[#0a0a0f]/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <Grid size={16} className="text-emerald-500" /> Матрица скоростей (м/с)
                                </h2>
                            </div>
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-black/5 dark:bg-white/5">
                                            <th className="p-3 text-left text-[10px] font-bold text-slate-500 uppercase border-r border-black/5 dark:border-white/5 sticky left-0 bg-white/90 dark:bg-[#0a0a0f]/90 backdrop-blur-md z-10">A \ B</th>
                                            {rectSizes.map(w => (
                                                <th key={w} className="p-2 text-center text-[10px] font-bold text-slate-400 font-mono min-w-[50px]">{w}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rectSizes.map(h => (
                                            <tr key={h} className="border-t border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                <td className="p-3 text-[10px] font-bold text-slate-400 font-mono border-r border-black/5 dark:border-white/5 sticky left-0 bg-white/90 dark:bg-[#0a0a0f]/90 backdrop-blur-md z-10">{h}</td>
                                                {rectSizes.map(w => {
                                                    const area = (w / 1000) * (h / 1000);
                                                    const speed = calculateSpeed(area);
                                                    const isOptimal = speed >= minSpeed && speed <= maxSpeed;
                                                    return (
                                                        <td key={`${h}x${w}`} className="p-1 text-center">
                                                            <div className={`text-[10px] font-mono py-1 rounded ${isOptimal ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 opacity-40'}`}>
                                                                {speed.toFixed(1)}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Circular Suggestions */}
                            <div className="bg-white/60 dark:bg-[#0a0a0f]/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <CircleDot size={16} className="text-emerald-500" /> Круглые сечения
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {suggestions.round.map((item, i) => (
                                        <div key={item.d} className={`p-4 rounded-2xl border transition-all ${i === 0 ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20' : 'bg-black/5 dark:bg-white/5 border-transparent'}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-mono text-lg font-bold text-slate-800 dark:text-white">Ø{item.d}</span>
                                                {i === 0 && <CheckCircle2 size={14} className="text-emerald-500" />}
                                            </div>
                                            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">{item.v.toFixed(2)} м/с</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Rectangular Suggestions */}
                            <div className="bg-white/60 dark:bg-[#0a0a0f]/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <Grid size={16} className="text-emerald-500" /> Прямоугольные сечения
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {suggestions.rect.map((item, i) => (
                                        <div key={`${item.w}x${item.h}`} className={`p-4 rounded-2xl border transition-all ${i === 0 ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20' : 'bg-black/5 dark:bg-white/5 border-transparent'}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-mono text-sm font-bold text-slate-800 dark:text-white">{item.w}×{item.h}</span>
                                                <ArrowRight size={14} className="text-slate-400" />
                                            </div>
                                            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">{item.v.toFixed(2)} м/с</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VelocityCalculator;
