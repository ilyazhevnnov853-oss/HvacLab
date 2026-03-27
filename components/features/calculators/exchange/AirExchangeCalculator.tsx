import React, { useState, useMemo } from 'react';
import { Users, Box, Wind, Ruler, Activity, RotateCcw } from 'lucide-react';
import { GlassButton, GlassSlider } from '../../../ui/Shared';
import { useLocalStorage } from '../../../../hooks/useLocalStorage';

interface AirExchangeState {
    mode: 'room' | 'people';
    area: number;
    height: number;
    multiplicity: number;
    peopleCount: number;
    normPerPerson: number;
}

const AirExchangeCalculator = ({ onBack, onHome }: any) => {
    const [calcState, setCalcState] = useLocalStorage<AirExchangeState>('hvac-calc-air-exchange', {
        mode: 'room',
        area: 20,
        height: 3.0,
        multiplicity: 1,
        peopleCount: 5,
        normPerPerson: 60
    });

    const { mode, area, height, multiplicity, peopleCount, normPerPerson } = calcState;

    const resultFlow = useMemo(() => {
        if (mode === 'room') {
            return area * height * multiplicity;
        } else {
            return peopleCount * normPerPerson;
        }
    }, [mode, area, height, multiplicity, peopleCount, normPerPerson]);

    const handleReset = () => {
        setCalcState({
            mode: 'room',
            area: 20,
            height: 3.0,
            multiplicity: 1,
            peopleCount: 5,
            normPerPerson: 60
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-20 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                        <Wind size={24} />
                    </div>
                    Воздухообмен
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
                        <div className="flex flex-wrap gap-2 mb-8 p-1 bg-black/5 dark:bg-white/5 rounded-2xl w-fit">
                            <button 
                                onClick={() => setCalcState(prev => ({ ...prev, mode: 'room' }))}
                                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                                    mode === 'room' 
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                                <Box size={14} /> По помещению
                            </button>
                            <button 
                                onClick={() => setCalcState(prev => ({ ...prev, mode: 'people' }))}
                                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                                    mode === 'people' 
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                                <Users size={14} /> По людям
                            </button>
                        </div>

                        {mode === 'room' ? (
                            <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Ruler size={16} className="text-blue-500" /> Параметры помещения
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <GlassSlider 
                                        label="Площадь (м²)" 
                                        val={area} min={1} max={500} step={1} 
                                        onChange={(v) => setCalcState(prev => ({ ...prev, area: v }))} 
                                    />
                                    <GlassSlider 
                                        label="Высота (м)" 
                                        val={height} min={2} max={15} step={0.1} 
                                        onChange={(v) => setCalcState(prev => ({ ...prev, height: v }))} 
                                    />
                                    <GlassSlider 
                                        label="Кратность (раз/ч)" 
                                        val={multiplicity} min={0.5} max={30} step={0.5} 
                                        onChange={(v) => setCalcState(prev => ({ ...prev, multiplicity: v }))} 
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Users size={16} className="text-emerald-500" /> Люди и нормы
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <GlassSlider 
                                        label="Количество людей" 
                                        val={peopleCount} min={1} max={200} step={1} 
                                        onChange={(v) => setCalcState(prev => ({ ...prev, peopleCount: v }))} 
                                    />
                                    <div className="space-y-4">
                                        <GlassSlider 
                                            label="Норма (м³/ч на чел)" 
                                            val={normPerPerson} min={10} max={120} step={5} 
                                            onChange={(v) => setCalcState(prev => ({ ...prev, normPerPerson: v }))} 
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            {[20, 30, 40, 60, 80].map(n => (
                                                <button 
                                                    key={n}
                                                    onClick={() => setCalcState(prev => ({ ...prev, normPerPerson: n }))}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                                        normPerPerson === n 
                                                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                                                            : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                                    }`}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-6 mt-10 border-t border-black/5 dark:border-white/5">
                            <GlassButton secondary icon={<RotateCcw size={16}/>} label="Сбросить" onClick={handleReset} />
                        </div>
                    </div>

                    {/* Results Block */}
                    <div className="bg-white/60 dark:bg-[#0a0a0f]/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Activity size={16} className="text-blue-500" /> Результаты расчета
                        </h2>
                        
                        <div className={`p-8 rounded-2xl flex flex-col items-center justify-center text-center transition-colors ${
                            mode === 'room' ? 'bg-blue-50 dark:bg-blue-500/10' : 'bg-emerald-50 dark:bg-emerald-500/10'
                        }`}>
                            <span className={`text-sm font-bold uppercase tracking-wide mb-2 ${
                                mode === 'room' ? 'text-blue-600/70 dark:text-blue-400/70' : 'text-emerald-600/70 dark:text-emerald-400/70'
                            }`}>
                                Необходимый воздухообмен
                            </span>
                            <span className={`text-6xl lg:text-8xl font-black font-mono ${
                                mode === 'room' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                                {resultFlow.toFixed(0)} <span className="text-2xl opacity-50 uppercase">м³/ч</span>
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            {mode === 'room' ? (
                                <>
                                    <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><Box size={18}/></div>
                                            <span className="text-xs font-bold text-slate-500 uppercase">Объем помещения</span>
                                        </div>
                                        <span className="text-lg font-black text-slate-800 dark:text-white">{(area * height).toFixed(1)} <span className="text-[10px] text-slate-500">м³</span></span>
                                    </div>
                                    <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500"><Activity size={18}/></div>
                                            <span className="text-xs font-bold text-slate-500 uppercase">Кратность</span>
                                        </div>
                                        <span className="text-lg font-black text-slate-800 dark:text-white">{multiplicity} <span className="text-[10px] text-slate-500">раз/ч</span></span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><Users size={18}/></div>
                                            <span className="text-xs font-bold text-slate-500 uppercase">Количество людей</span>
                                        </div>
                                        <span className="text-lg font-black text-slate-800 dark:text-white">{peopleCount} <span className="text-[10px] text-slate-500">чел</span></span>
                                    </div>
                                    <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500"><Wind size={18}/></div>
                                            <span className="text-xs font-bold text-slate-500 uppercase">Норма на чел.</span>
                                        </div>
                                        <span className="text-lg font-black text-slate-800 dark:text-white">{normPerPerson} <span className="text-[10px] text-slate-500">м³/ч</span></span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white/60 dark:bg-[#0a0a0f]/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Activity size={16} className="text-blue-500" /> Справочная информация
                        </h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                                <h3 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Офисные помещения</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Норма: 60 м³/ч на чел. или кратность 1-2.</p>
                            </div>
                            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                <h3 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Жилые комнаты</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Норма: 30 м³/ч на чел. или кратность 0.5-1.</p>
                            </div>
                            <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                                <h3 className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Кухни / Санузлы</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Рекомендуется расчет по кратности (от 5 до 10).</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AirExchangeCalculator;
