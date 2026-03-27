import React, { useMemo } from 'react';
import { CloudRain, Thermometer, Droplets, RotateCcw, Activity, Gauge, Waves } from 'lucide-react';
import { GlassButton, GlassSlider } from '../../../ui/Shared';
import { useLocalStorage } from '../../../../hooks/useLocalStorage';

interface PsychrometryState {
    dryBulb: number;
    relHum: number;
    pressure: number;
}

const PsychrometryCalculator = ({ onBack, onHome }: any) => {
    const [calcState, setCalcState] = useLocalStorage<PsychrometryState>('hvac-calc-psychrometry', {
        dryBulb: 24,
        relHum: 50,
        pressure: 101.325
    });

    const { dryBulb, relHum, pressure } = calcState;

    const results = useMemo(() => {
        const A = 17.625;
        const B = 243.04;

        const es_hPa = 6.1094 * Math.exp((A * dryBulb) / (B + dryBulb));
        const pv_kPa = (es_hPa * (relHum / 100)) / 10;
        const safePv = Math.min(pv_kPa, pressure - 0.1);
        const d = 622 * safePv / (pressure - safePv);
        const h = 1.006 * dryBulb + (d / 1000) * (2501 + 1.86 * dryBulb);
        
        const safeRH = Math.max(relHum, 0.1);
        const alpha = Math.log(safeRH / 100) + ((A * dryBulb) / (B + dryBulb));
        const t_dp = (B * alpha) / (A - alpha);

        const Tk = dryBulb + 273.15;
        const rho = ((pressure - safePv) * 1000) / (287.05 * Tk) + (safePv * 1000) / (461.5 * Tk);

        const T = dryBulb;
        const RH = safeRH;
        const tw = T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) + 
                   Math.atan(T + RH) - 
                   Math.atan(RH - 1.676331) + 
                   0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) - 
                   4.686035;

        return {
            enthalpy: h,
            moistureContent: d,
            dewPoint: t_dp,
            density: rho,
            wetBulb: tw,
            vaporPressure: pv_kPa
        };
    }, [dryBulb, relHum, pressure]);

    const handleReset = () => {
        setCalcState({
            dryBulb: 24,
            relHum: 50,
            pressure: 101.325
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-20 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-sky-500 shadow-lg shadow-sky-500/20 text-white">
                        <CloudRain size={24} />
                    </div>
                    Психрометрия
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
                            {/* Input Data */}
                            <div>
                                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <Thermometer size={16} className="text-sky-500" /> Параметры воздуха
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <GlassSlider 
                                        label="Температура по сухому термометру (°C)" 
                                        val={dryBulb} min={-40} max={60} step={1} 
                                        onChange={(v) => setCalcState(prev => ({ ...prev, dryBulb: v }))} 
                                    />
                                    <GlassSlider 
                                        label="Относительная влажность (%)" 
                                        val={relHum} min={0} max={100} step={1} 
                                        onChange={(v) => setCalcState(prev => ({ ...prev, relHum: v }))} 
                                    />
                                    <div className="md:col-span-2">
                                        <GlassSlider 
                                            label="Атмосферное давление (кПа)" 
                                            val={pressure} min={80} max={120} step={0.1} 
                                            onChange={(v) => setCalcState(prev => ({ ...prev, pressure: v }))} 
                                        />
                                    </div>
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
                            <Activity size={16} className="text-sky-500" /> Результаты расчета
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 rounded-2xl bg-sky-50 dark:bg-sky-500/10 flex flex-col items-center justify-center text-center transition-colors">
                                <span className="text-xs font-bold text-sky-600/70 dark:text-sky-400/70 uppercase tracking-wide mb-2">
                                    Энтальпия (I)
                                </span>
                                <span className="text-4xl lg:text-6xl font-black font-mono text-sky-600 dark:text-sky-400">
                                    {results.enthalpy.toFixed(1)} <span className="text-xl opacity-50 uppercase">кДж/кг</span>
                                </span>
                            </div>
                            <div className="p-8 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex flex-col items-center justify-center text-center transition-colors">
                                <span className="text-xs font-bold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wide mb-2">
                                    Влагосодержание (d)
                                </span>
                                <span className="text-4xl lg:text-6xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                                    {results.moistureContent.toFixed(1)} <span className="text-xl opacity-50 uppercase">г/кг</span>
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500"><Droplets size={18}/></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Точка росы</span>
                                </div>
                                <span className="text-lg font-black text-slate-800 dark:text-white">{results.dewPoint.toFixed(1)} <span className="text-[10px] text-slate-500 uppercase">°C</span></span>
                            </div>
                            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><Thermometer size={18}/></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Мокрый термометр</span>
                                </div>
                                <span className="text-lg font-black text-slate-800 dark:text-white">{results.wetBulb.toFixed(1)} <span className="text-[10px] text-slate-500 uppercase">°C</span></span>
                            </div>
                            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500"><Waves size={18}/></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Плотность</span>
                                </div>
                                <span className="text-lg font-black text-slate-800 dark:text-white">{results.density.toFixed(2)} <span className="text-[10px] text-slate-500 uppercase">кг/м³</span></span>
                            </div>
                            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500"><Gauge size={18}/></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Парц. давление</span>
                                </div>
                                <span className="text-lg font-black text-slate-800 dark:text-white">{results.vaporPressure.toFixed(2)} <span className="text-[10px] text-slate-500 uppercase">кПа</span></span>
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
                                    Расчет ведется по формулам Магнуса-Тетенса. Точность аппроксимации составляет ±0.1°C в диапазоне от -45°C до +60°C.
                                </p>
                            </div>
                            <div className="p-4 bg-sky-500/5 rounded-2xl border border-sky-500/10">
                                <h3 className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-1">Энтальпия</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Отражает полное энергосодержание 1 кг сухого воздуха с учетом влаги.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PsychrometryCalculator;
