import React, { useMemo } from 'react';
import { GitMerge, Wind, Thermometer, RotateCcw, Activity, Snowflake, Flame } from 'lucide-react';
import { GlassButton, GlassSlider } from '../../../ui/Shared';
import { useLocalStorage } from '../../../../hooks/useLocalStorage';

interface MixingState {
    flow1: number;
    temp1: number;
    flow2: number;
    temp2: number;
}

const MixingCalculator = ({ onBack, onHome }: any) => {
    const [calcState, setCalcState] = useLocalStorage<MixingState>('hvac-calc-mixing', {
        flow1: 1000,
        temp1: -20,
        flow2: 3000,
        temp2: 22
    });

    const { flow1, temp1, flow2, temp2 } = calcState;

    const results = useMemo(() => {
        const totalL = flow1 + flow2;
        if (totalL === 0) {
            return { mixedTemp: 0, totalFlow: 0, ratio1: 0, ratio2: 0 };
        }
        const tMix = (flow1 * temp1 + flow2 * temp2) / totalL;
        return {
            mixedTemp: tMix,
            totalFlow: totalL,
            ratio1: (flow1 / totalL) * 100,
            ratio2: (flow2 / totalL) * 100
        };
    }, [flow1, temp1, flow2, temp2]);

    const handleReset = () => {
        setCalcState({
            flow1: 1000,
            temp1: -20,
            flow2: 3000,
            temp2: 22
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-20 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500 shadow-lg shadow-cyan-500/20 text-white">
                        <GitMerge size={24} />
                    </div>
                    Смешение потоков
                </h1>
                <div className="flex items-center gap-2">
                    <GlassButton secondary onClick={onBack} label="Назад" />
                    <GlassButton secondary onClick={onHome} label="Главная" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/60 dark:bg-[#0a0a0f]/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-sm">
                        <div className="space-y-10">
                            {/* Stream 1 */}
                            <div>
                                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <Snowflake size={16} className="text-blue-500" /> Поток 1 (Наружный)
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <GlassSlider 
                                        label="Расход L1 (м³/ч)" 
                                        val={flow1} min={0} max={10000} step={50} 
                                        onChange={(v) => setCalcState(prev => ({ ...prev, flow1: v }))} 
                                    />
                                    <GlassSlider 
                                        label="Температура t1 (°C)" 
                                        val={temp1} min={-50} max={40} step={1} 
                                        onChange={(v) => setCalcState(prev => ({ ...prev, temp1: v }))} 
                                    />
                                </div>
                            </div>

                            {/* Stream 2 */}
                            <div className="pt-4 border-t border-black/5 dark:border-white/5">
                                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6 mt-6 flex items-center gap-2">
                                    <Flame size={16} className="text-orange-500" /> Поток 2 (Рециркуляция)
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <GlassSlider 
                                        label="Расход L2 (м³/ч)" 
                                        val={flow2} min={0} max={10000} step={50} 
                                        onChange={(v) => setCalcState(prev => ({ ...prev, flow2: v }))} 
                                    />
                                    <GlassSlider 
                                        label="Температура t2 (°C)" 
                                        val={temp2} min={15} max={40} step={1} 
                                        onChange={(v) => setCalcState(prev => ({ ...prev, temp2: v }))} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-6 mt-10 border-t border-black/5 dark:border-white/5">
                            <GlassButton secondary icon={<RotateCcw size={16}/>} label="Сбросить" onClick={handleReset} />
                        </div>
                    </div>

                    {/* Results Block */}
                    <div className="bg-white/60 dark:bg-[#0a0a0f]/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Activity size={16} className="text-cyan-500" /> Результаты смешения
                        </h2>
                        
                        <div className="p-8 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 flex flex-col items-center justify-center text-center transition-colors">
                            <span className="text-sm font-bold text-cyan-600/70 dark:text-cyan-400/70 uppercase tracking-wide mb-2">
                                Температура смеси
                            </span>
                            <span className="text-6xl lg:text-8xl font-black font-mono text-cyan-600 dark:text-cyan-400">
                                {results.mixedTemp.toFixed(1)} <span className="text-2xl opacity-50 uppercase">°C</span>
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500"><Wind size={18}/></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Общий расход</span>
                                </div>
                                <span className="text-lg font-black text-slate-800 dark:text-white">{results.totalFlow.toFixed(0)} <span className="text-[10px] text-slate-500 uppercase">м³/ч</span></span>
                            </div>
                            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><GitMerge size={18}/></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Пропорция L1/L2</span>
                                </div>
                                <span className="text-lg font-black text-slate-800 dark:text-white">
                                    {results.ratio1.toFixed(0)}% / {results.ratio2.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white/60 dark:bg-[#0a0a0f]/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Activity size={16} className="text-blue-500" /> Справка
                        </h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-500/5 rounded-2xl border border-slate-500/10">
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Расчет основан на законе сохранения энергии (калориметрическое смешение). 
                                    Предполагается, что плотность и теплоемкость воздуха в обоих потоках одинаковы.
                                </p>
                            </div>
                            <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                                <h3 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 text-center">Формула</h3>
                                <div className="text-center font-mono text-sm font-bold text-slate-800 dark:text-white">
                                    t_mix = (L1·t1 + L2·t2) / (L1 + L2)
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MixingCalculator;
