import React, { useMemo } from 'react';
import { Volume2, Plus, Trash2, RotateCcw, Activity, Waves, Info } from 'lucide-react';
import { GlassSlider, GlassButton } from '../../../ui/Shared';
import { useLocalStorage } from '../../../../hooks/useLocalStorage';

interface AcousticData {
    sources: number[];
}

const AcousticCalculator = ({ onBack, onHome }: any) => {
    const [calcState, setCalcState] = useLocalStorage<AcousticData>('hvac-calc-acoustic', {
        sources: [35, 35]
    });
    
    const { sources } = calcState;

    const totalNoise = useMemo(() => {
        if (sources.length === 0) return 0;
        const sumPower = sources.reduce((acc, val) => acc + Math.pow(10, 0.1 * val), 0);
        return 10 * Math.log10(sumPower);
    }, [sources]);

    const addSource = () => {
        if (sources.length < 10) {
             setCalcState(prev => ({ ...prev, sources: [...prev.sources, 30] }));
        }
    };

    const removeSource = (index: number) => {
        setCalcState(prev => ({
            ...prev,
            sources: prev.sources.filter((_, i) => i !== index)
        }));
    };

    const updateSource = (index: number, value: number) => {
        setCalcState(prev => {
            const next = [...prev.sources];
            next[index] = value;
            return { ...prev, sources: next };
        });
    };

    const handleReset = () => {
        setCalcState({ sources: [35, 35] });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-20 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-rose-500 shadow-lg shadow-rose-500/20 text-white">
                        <Volume2 size={24} />
                    </div>
                    Суммирование шума
                </h1>
                <div className="flex items-center gap-2">
                    <GlassButton secondary onClick={onBack} label="Назад" />
                    <GlassButton secondary onClick={onHome} label="Главная" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Card */}
                <div className="bg-white/60 dark:bg-[#0a0a0f]/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <Waves size={16} className="text-rose-500" /> Источники шума
                        </h2>
                        <GlassButton 
                            onClick={addSource} 
                            disabled={sources.length >= 10}
                            icon={<Plus size={16} />}
                            label="Добавить"
                        />
                    </div>

                    <div className="space-y-6 flex-1">
                        {sources.map((val, idx) => (
                            <div key={idx} className="bg-black/5 dark:bg-white/5 p-5 rounded-2xl border border-black/5 dark:border-white/5 animate-in slide-in-from-left-4 fade-in duration-300">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Источник #{idx + 1}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-bold font-mono text-slate-800 dark:text-white">{val}</span>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">дБ</span>
                                        </div>
                                        {sources.length > 1 && (
                                            <button 
                                                onClick={() => removeSource(idx)} 
                                                className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 hover:bg-rose-500/10 rounded-lg"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <GlassSlider 
                                    val={val} min={0} max={120} step={1} 
                                    onChange={(v: number) => updateSource(idx, v)} 
                                    unit=" дБ"
                                />
                            </div>
                        ))}
                        {sources.length === 0 && (
                            <div className="text-center py-12 text-slate-500 text-sm italic bg-black/5 dark:bg-white/5 rounded-2xl border border-dashed border-black/10 dark:border-white/10">
                                Нет активных источников. Нажмите "Добавить".
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 flex justify-end">
                        <GlassButton secondary icon={<RotateCcw size={16}/>} label="Сбросить" onClick={handleReset} />
                    </div>
                </div>

                {/* Results Card */}
                <div className="space-y-6">
                    <div className="bg-white/60 dark:bg-[#0a0a0f]/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-8 flex items-center gap-2">
                            <Activity size={16} className="text-rose-500" /> Результат
                        </h2>

                        <div className="bg-rose-500/5 border border-rose-500/10 rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all hover:bg-rose-500/10">
                            <span className="text-sm font-bold text-rose-600/70 dark:text-rose-400/70 uppercase tracking-wide mb-2">
                                Суммарный уровень шума
                            </span>
                            <span className="text-6xl lg:text-8xl font-black text-rose-600 dark:text-rose-400 font-mono">
                                {totalNoise.toFixed(1)} <span className="text-2xl opacity-50 uppercase">дБ</span>
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-5 border border-black/5 dark:border-white/5">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Источников</div>
                                <div className="text-3xl font-black text-slate-800 dark:text-white">{sources.length}</div>
                            </div>
                            <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-5 border border-black/5 dark:border-white/5">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Максимум</div>
                                <div className="text-3xl font-black text-slate-800 dark:text-white">
                                    {sources.length > 0 ? Math.max(...sources) : 0} <span className="text-xs text-slate-500 uppercase">дБ</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 flex gap-3">
                        <Info size={20} className="text-amber-500 shrink-0" />
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1 uppercase tracking-tighter">Справка:</span>
                            Уровни звукового давления суммируются логарифмически. 
                            Разница в 3 дБ соответствует удвоению звуковой мощности. 
                            Если один источник тише другого более чем на 10 дБ, его вклад в общую сумму практически незаметен.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcousticCalculator;
