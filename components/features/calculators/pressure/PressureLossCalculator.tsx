import React, { useMemo } from 'react';
import { Gauge, Wind, Ruler, RotateCcw, Activity, Box, CircleDot } from 'lucide-react';
import { GlassButton, GlassSlider } from '../../../ui/Shared';
import { useLocalStorage } from '../../../../hooks/useLocalStorage';

interface PressureLossState {
    airflow: number;
    shape: 'round' | 'rect';
    diameter: number;
    width: number;
    height: number;
    length: number;
    zeta: number;
}

const PressureLossCalculator = ({ onBack, onHome }: any) => {
    const [calcState, setCalcState] = useLocalStorage<PressureLossState>('hvac-calc-pressure-loss', {
        airflow: 1000,
        shape: 'round',
        diameter: 200,
        width: 300,
        height: 200,
        length: 20,
        zeta: 2
    });
    
    const { airflow, shape, diameter, width, height, length, zeta } = calcState;

    const results = useMemo(() => {
        const rho = 1.2; // kg/m3
        const nu = 15.11e-6; // m2/s
        const roughness = 0.1; // mm
        
        let d_calc = 0;
        let area = 0;

        if (shape === 'round') {
            d_calc = diameter / 1000;
            area = Math.PI * Math.pow(d_calc, 2) / 4;
        } else {
            const a = width / 1000;
            const b = height / 1000;
            area = a * b;
            d_calc = (2 * a * b) / (a + b);
        }

        if (area <= 0 || d_calc <= 0) {
            return { totalLoss: 0, frictionLoss: 0, localLoss: 0, velocity: 0, dynamicPressure: 0 };
        }

        const v = airflow / 3600 / area;
        const Re = (v * d_calc) / nu;
        const k = roughness / 1000;
        
        let lambda = 0.02; 
        if (Re > 0) {
            lambda = 0.11 * Math.pow((k/d_calc) + (68/Re), 0.25);
        }

        const dynPress = (rho * Math.pow(v, 2)) / 2;
        const dP_f = lambda * (length / d_calc) * dynPress;
        const dP_l = zeta * dynPress;

        return {
            totalLoss: dP_f + dP_l,
            frictionLoss: dP_f,
            localLoss: dP_l,
            velocity: v,
            dynamicPressure: dynPress
        };
    }, [airflow, shape, diameter, width, height, length, zeta]);

    const handleReset = () => {
        setCalcState({
            airflow: 1000,
            shape: 'round',
            diameter: 200,
            width: 300,
            height: 200,
            length: 20,
            zeta: 2
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-20 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500 shadow-lg shadow-purple-500/20 text-white">
                        <Gauge size={24} />
                    </div>
                    Потери давления
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
                                onClick={() => setCalcState(prev => ({ ...prev, shape: 'round' }))}
                                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                                    shape === 'round' 
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                                <CircleDot size={14} /> Круглый
                            </button>
                            <button 
                                onClick={() => setCalcState(prev => ({ ...prev, shape: 'rect' }))}
                                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                                    shape === 'rect' 
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                            >
                                <Box size={14} /> Прямоугольный
                            </button>
                        </div>

                        <div className="space-y-10">
                            {/* Input Data */}
                            <div>
                                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <Wind size={16} className="text-purple-500" /> Расход и геометрия
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="md:col-span-2">
                                        <GlassSlider 
                                            label="Расход воздуха (м³/ч)" 
                                            val={airflow} min={0} max={10000} step={50} 
                                            onChange={(v) => setCalcState(prev => ({ ...prev, airflow: v }))} 
                                        />
                                    </div>
                                    {shape === 'round' ? (
                                        <div className="md:col-span-2">
                                            <GlassSlider 
                                                label="Диаметр (мм)" 
                                                val={diameter} min={100} max={1250} step={5} 
                                                onChange={(v) => setCalcState(prev => ({ ...prev, diameter: v }))} 
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <GlassSlider 
                                                label="Ширина (мм)" 
                                                val={width} min={100} max={2000} step={50} 
                                                onChange={(v) => setCalcState(prev => ({ ...prev, width: v }))} 
                                            />
                                            <GlassSlider 
                                                label="Высота (мм)" 
                                                val={height} min={100} max={2000} step={50} 
                                                onChange={(v) => setCalcState(prev => ({ ...prev, height: v }))} 
                                            />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Network Params */}
                            <div className="pt-4 border-t border-black/5 dark:border-white/5">
                                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6 mt-6 flex items-center gap-2">
                                    <Ruler size={16} className="text-purple-500" /> Параметры сети
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <GlassSlider 
                                        label="Длина участка (м)" 
                                        val={length} min={1} max={200} step={1} 
                                        onChange={(v) => setCalcState(prev => ({ ...prev, length: v }))} 
                                    />
                                    <GlassSlider 
                                        label="Сумма КМС (Σζ)" 
                                        val={zeta} min={0} max={20} step={0.1} 
                                        onChange={(v) => setCalcState(prev => ({ ...prev, zeta: v }))} 
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
                            <Activity size={16} className="text-purple-500" /> Результаты расчета
                        </h2>
                        
                        <div className="p-8 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex flex-col items-center justify-center text-center transition-colors">
                            <span className="text-sm font-bold text-purple-600/70 dark:text-purple-400/70 uppercase tracking-wide mb-2">
                                Полные потери давления
                            </span>
                            <span className="text-6xl lg:text-8xl font-black font-mono text-purple-600 dark:text-purple-400">
                                {results.totalLoss.toFixed(0)} <span className="text-2xl opacity-50 uppercase">Па</span>
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500"><Ruler size={18}/></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Потери на трение</span>
                                </div>
                                <span className="text-lg font-black text-slate-800 dark:text-white">{results.frictionLoss.toFixed(0)} <span className="text-[10px] text-slate-500 uppercase">Па</span></span>
                            </div>
                            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500"><Activity size={18}/></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Местные потери</span>
                                </div>
                                <span className="text-lg font-black text-slate-800 dark:text-white">{results.localLoss.toFixed(0)} <span className="text-[10px] text-slate-500 uppercase">Па</span></span>
                            </div>
                            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><Wind size={18}/></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Скорость потока</span>
                                </div>
                                <span className="text-lg font-black text-slate-800 dark:text-white">{results.velocity.toFixed(1)} <span className="text-[10px] text-slate-500 uppercase">м/с</span></span>
                            </div>
                            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500"><Gauge size={18}/></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Дин. давление</span>
                                </div>
                                <span className="text-lg font-black text-slate-800 dark:text-white">{results.dynamicPressure.toFixed(0)} <span className="text-[10px] text-slate-500 uppercase">Па</span></span>
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
                                    Расчет потерь на трение ведется по формуле Дарси-Вейсбаха. Коэффициент лямбда рассчитывается по аппроксимации Альтшуля.
                                </p>
                            </div>
                            <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                                <h3 className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Шероховатость</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Принята k = 0.1 мм (оцинкованная сталь).</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PressureLossCalculator;
