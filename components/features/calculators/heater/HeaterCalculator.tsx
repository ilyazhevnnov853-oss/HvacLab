import React, { useMemo } from 'react';
import { Thermometer, Wind, Zap, Droplets, ChevronRight, Flame, Snowflake, RotateCcw, Activity } from 'lucide-react';
import { GlassButton, GlassSlider } from '../../../ui/Shared';
import { useLocalStorage } from '../../../../hooks/useLocalStorage';

interface HeaterState {
    airflow: number;
    tempIn: number;
    tempOut: number;
    mode: 'heating' | 'cooling';
}

const HeaterCalculator = ({ onBack, onHome }: any) => {
    const [calcState, setCalcState] = useLocalStorage<HeaterState>('hvac-calc-heater', {
        airflow: 1000,
        tempIn: -26,
        tempOut: 22,
        mode: 'heating'
    });
    
    const { airflow, tempIn, tempOut, mode } = calcState;

    // Constants
    const AIR_DENSITY = 1.2; // kg/m3
    const AIR_HEAT_CAPACITY = 1.006; // kJ/(kg*C)

    const results = useMemo(() => {
        const dt = Math.abs(tempOut - tempIn);
        const pKW = (airflow * AIR_DENSITY * AIR_HEAT_CAPACITY * dt) / 3600;
        
        const dtWater = mode === 'heating' ? 20 : 5;
        const wFlow = (pKW * 3600) / (4.187 * dtWater);
        
        const amps = (pKW * 1000) / (1.732 * 400);

        return {
            powerKW: pKW,
            waterFlow: wFlow,
            electricCurrent: amps,
            deltaT: dt,
            massFlow: airflow * AIR_DENSITY
        };
    }, [airflow, tempIn, tempOut, mode]);

    const handleReset = () => {
        setCalcState({
            airflow: 1000,
            tempIn: -26,
            tempOut: 22,
            mode: 'heating'
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-20 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <div className={`p-2 rounded-xl text-white shadow-lg ${mode === 'heating' ? 'bg-orange-500 shadow-orange-500/20' : 'bg-cyan-500 shadow-cyan-500/20'}`}>
                        <Zap size={24} />
                    </div>
                    Нагреватели и Охладители
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
                                onClick={() => setCalcState(prev => ({ ...prev, mode: 'heating' }))}
                                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                                    mode === 'heating' 
                                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                                <Flame size={14} /> Нагрев
                            </button>
                            <button 
                                onClick={() => setCalcState(prev => ({ ...prev, mode: 'cooling' }))}
                                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                                    mode === 'cooling' 
                                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' 
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                                <Snowflake size={14} /> Охлаждение
                            </button>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <Wind size={16} className={mode === 'heating' ? 'text-orange-500' : 'text-cyan-500'} /> Параметры воздуха
                                </h2>
                                <GlassSlider 
                                    label="Расход воздуха (м³/ч)" 
                                    val={airflow} min={0} max={20000} step={100} 
                                    onChange={(v) => setCalcState(prev => ({ ...prev, airflow: v }))} 
                                />
                            </div>

                            <div className="pt-4">
                                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <Thermometer size={16} className={mode === 'heating' ? 'text-orange-500' : 'text-cyan-500'} /> Температуры
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <GlassSlider 
                                        label="Вход (Улица) (°C)" 
                                        val={tempIn} min={-40} max={40} step={1} 
                                        onChange={(v) => setCalcState(prev => ({ ...prev, tempIn: v }))} 
                                    />
                                    <GlassSlider 
                                        label="Выход (Канал) (°C)" 
                                        val={tempOut} min={5} max={50} step={1} 
                                        onChange={(v) => setCalcState(prev => ({ ...prev, tempOut: v }))} 
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
                            <Activity size={16} className={mode === 'heating' ? 'text-orange-500' : 'text-cyan-500'} /> Результаты расчета
                        </h2>
                        
                        <div className={`p-8 rounded-2xl flex flex-col items-center justify-center text-center transition-colors ${
                            mode === 'heating' ? 'bg-orange-50 dark:bg-orange-500/10' : 'bg-cyan-50 dark:bg-cyan-500/10'
                        }`}>
                            <span className={`text-sm font-bold uppercase tracking-wide mb-2 ${
                                mode === 'heating' ? 'text-orange-600/70 dark:text-orange-400/70' : 'text-cyan-600/70 dark:text-cyan-400/70'
                            }`}>
                                Расчетная мощность
                            </span>
                            <span className={`text-6xl lg:text-8xl font-black font-mono ${
                                mode === 'heating' ? 'text-orange-600 dark:text-orange-400' : 'text-cyan-600 dark:text-cyan-400'
                            }`}>
                                {results.powerKW.toFixed(2)} <span className="text-2xl opacity-50 uppercase">кВт</span>
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><Droplets size={18}/></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Расход воды (Δt {mode === 'heating' ? '20' : '5'}°C)</span>
                                </div>
                                <span className="text-lg font-black text-slate-800 dark:text-white">{results.waterFlow.toFixed(0)} <span className="text-[10px] text-slate-500 uppercase">л/ч</span></span>
                            </div>
                            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500"><Zap size={18}/></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Ток (3 фазы 380В)</span>
                                </div>
                                <span className="text-lg font-black text-slate-800 dark:text-white">{results.electricCurrent.toFixed(1)} <span className="text-[10px] text-slate-500 uppercase">А</span></span>
                            </div>
                            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-slate-500/10 text-slate-500"><Thermometer size={18}/></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Перепад ΔT</span>
                                </div>
                                <span className="text-lg font-black text-slate-800 dark:text-white">{results.deltaT.toFixed(0)} <span className="text-[10px] text-slate-500 uppercase">°C</span></span>
                            </div>
                            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-slate-500/10 text-slate-500"><Wind size={18}/></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Массовый расход</span>
                                </div>
                                <span className="text-lg font-black text-slate-800 dark:text-white">{results.massFlow.toFixed(0)} <span className="text-[10px] text-slate-500 uppercase">кг/ч</span></span>
                            </div>
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
                            <div className="p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                                <h3 className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1">Нагрев</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Для водяных калориферов стандартный график 80/60°C или 90/70°C (Δt=20°C).</p>
                            </div>
                            <div className="p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/10">
                                <h3 className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-1">Охлаждение</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Для водяных охладителей стандартный график 7/12°C (Δt=5°C).</p>
                            </div>
                            <div className="p-4 bg-slate-500/5 rounded-2xl border border-slate-500/10 text-xs text-slate-600 dark:text-slate-400 italic">
                                Расчет ведется по явной теплоте без учета конденсации влаги.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeaterCalculator;
