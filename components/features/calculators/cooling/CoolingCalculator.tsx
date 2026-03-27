import React, { useState, useMemo } from 'react';
import { 
    Home, ChevronLeft, ChevronRight, Lock, CheckCircle2, 
    Sun, Users, Wind, BarChart3, Box, Thermometer, Compass, Globe, RotateCcw
} from 'lucide-react';
import { GlassButton, GlassSlider, GlassSelect } from '../../../ui/Shared';
import { SOLAR_GAINS, WALL_TRANSMISSION, INTERNAL_LOADS } from '../../../../constants';
import { useLocalStorage } from '../../../../hooks/useLocalStorage';

interface CalcData {
    width: number;
    length: number;
    height: number;
    wallType: keyof typeof WALL_TRANSMISSION;
    azimuth: number;
    glassArea: number;
    isSkylight: boolean;
    glassType: 'Glass_Single' | 'Glass_Double';
    climateCoef: number;
    people: number;
    computers: number;
    lighting: boolean;
    ventilationOn: boolean;
    airFlow: number;
}

const CoolingCalculator = ({ onBack, onHome }: any) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [maxStepReached, setMaxStepReached] = useState(0);
    
    const [data, setData] = useLocalStorage<CalcData>('hvac-calc-cooling', {
        width: 10, length: 15, height: 3.0, wallType: 'Modern', azimuth: 180,
        glassArea: 5, isSkylight: false, glassType: 'Glass_Double', climateCoef: 1.0,
        people: 5, computers: 5, lighting: true,
        ventilationOn: false, airFlow: 0
    });

    const results = useMemo(() => {
        let orientationKey: keyof typeof SOLAR_GAINS = 'North';
        if (data.isSkylight) {
            orientationKey = 'Horizontal';
        } else {
            const deg = data.azimuth;
            if (deg >= 45 && deg < 135) orientationKey = 'East';
            else if (deg >= 135 && deg < 225) orientationKey = 'South';
            else if (deg >= 225 && deg < 315) orientationKey = 'West';
            else orientationKey = 'North';
        }

        const perimeter = (data.width + data.length) * 2;
        const wallArea = Math.max(0, perimeter * data.height - data.glassArea);
        const dt = 10;
        const q_walls = wallArea * WALL_TRANSMISSION[data.wallType] * dt;

        const q_sun = data.glassArea * SOLAR_GAINS[orientationKey] * data.climateCoef;
        const q_glass_trans = data.glassArea * WALL_TRANSMISSION[data.glassType] * dt;
        const q_total_windows = q_sun + q_glass_trans;

        const q_people = data.people * INTERNAL_LOADS.Person_Office;
        const q_equip = data.computers * INTERNAL_LOADS.Computer;
        const floorArea = data.width * data.length;
        const q_light = data.lighting ? floorArea * INTERNAL_LOADS.Lighting_LED : 0;
        const q_internal = q_people + q_equip + q_light;

        const q_vent = data.ventilationOn ? 0.336 * data.airFlow * dt : 0;

        const totalWatts = q_walls + q_total_windows + q_internal + q_vent;
        const btu = totalWatts * 3.412;

        return { q_walls, q_total_windows, q_internal, q_vent, totalWatts, btu, floorArea, orientationKey };
    }, [data]);

    const getCardinalLabel = (deg: number) => {
        if (deg >= 45 && deg < 135) return 'Восток';
        if (deg >= 135 && deg < 225) return 'Юг';
        if (deg >= 225 && deg < 315) return 'Запад';
        return 'Север';
    };

    const STEPS = [
        { id: 0, title: 'Помещение', icon: <Box size={18}/>, isValid: data.width > 0 && data.length > 0 },
        { id: 1, title: 'Окна', icon: <Sun size={18}/>, isValid: true }, 
        { id: 2, title: 'Нагрузки', icon: <Users size={18}/>, isValid: true },
        { id: 3, title: 'Результат', icon: <BarChart3 size={18}/>, isValid: true }
    ];

    const handleNext = () => {
        if (STEPS[currentStep].isValid) {
            const next = currentStep + 1;
            setCurrentStep(next);
            if (next > maxStepReached) setMaxStepReached(next);
        }
    };

    const handleReset = () => {
        setData({
            width: 10, length: 15, height: 3.0, wallType: 'Modern', azimuth: 180,
            glassArea: 5, isSkylight: false, glassType: 'Glass_Double', climateCoef: 1.0,
            people: 5, computers: 5, lighting: true,
            ventilationOn: false, airFlow: 0
        });
        setCurrentStep(0);
        setMaxStepReached(0);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-20 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
                        <Thermometer size={24} />
                    </div>
                    Теплопритоки (Охлаждение)
                </h1>
                <div className="flex items-center gap-2">
                    <GlassButton secondary onClick={onBack} label="Назад" />
                    <GlassButton secondary onClick={onHome} label="Главная" />
                </div>
            </div>

            {/* Step Progress */}
            <div className="grid grid-cols-4 gap-2 md:gap-4">
                {STEPS.map((step, idx) => {
                    const isActive = currentStep === idx;
                    const isCompleted = idx < currentStep || (idx === 3 && currentStep === 3);
                    const isLocked = idx > maxStepReached && idx !== 3;

                    return (
                        <button
                            key={idx}
                            disabled={isLocked}
                            onClick={() => setCurrentStep(idx)}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                                isActive 
                                    ? 'bg-cyan-500 text-white border-cyan-400 shadow-lg shadow-cyan-500/20' 
                                    : isCompleted 
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                                        : 'bg-white/60 dark:bg-white/5 border-black/5 dark:border-white/5 text-slate-400'
                            } ${isLocked ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                        >
                            <div className="mb-1">{isCompleted && !isActive ? <CheckCircle2 size={16}/> : step.icon}</div>
                            <span className="text-[10px] font-bold uppercase tracking-tighter hidden md:block">{step.title}</span>
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Card */}
                <div className="lg:col-span-2 bg-white/60 dark:bg-[#0a0a0f]/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-sm">
                    {currentStep === 0 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Box size={16} className="text-cyan-500" /> Геометрия и Стены
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <GlassSlider label="Ширина (м)" val={data.width} min={1} max={50} step={0.5} onChange={(v) => setData({...data, width: v})} />
                                <GlassSlider label="Длина (м)" val={data.length} min={1} max={100} step={0.5} onChange={(v) => setData({...data, length: v})} />
                                <GlassSlider label="Высота (м)" val={data.height} min={2} max={15} step={0.1} onChange={(v) => setData({...data, height: v})} />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Тип ограждений</label>
                                    <GlassSelect 
                                        value={data.wallType}
                                        onChange={(v) => setData({...data, wallType: v as any})}
                                        options={[
                                            { value: 'Modern', label: 'Современные (Утепленные)' },
                                            { value: 'Brick_Old', label: 'Кирпич (Средние)' },
                                            { value: 'Concrete', label: 'Бетон (Холодные)' }
                                        ]}
                                    />
                                </div>
                            </div>
                            <div className="pt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Compass size={14} /> Ориентация фасада: <span className="text-cyan-500">{getCardinalLabel(data.azimuth)}</span>
                                    </span>
                                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-white">{data.azimuth}°</span>
                                </div>
                                <GlassSlider label="" val={data.azimuth} min={0} max={360} step={15} onChange={(v) => setData({...data, azimuth: v})} />
                            </div>
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Sun size={16} className="text-amber-500" /> Остекление
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <GlassSlider label="Площадь окон (м²)" val={data.glassArea} min={0} max={100} step={0.5} onChange={(v) => setData({...data, glassArea: v})} />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Тип стеклопакета</label>
                                    <GlassSelect 
                                        value={data.glassType}
                                        onChange={(v) => setData({...data, glassType: v as any})}
                                        options={[
                                            { value: 'Glass_Double', label: 'Двухкамерный' },
                                            { value: 'Glass_Single', label: 'Одинарный' }
                                        ]}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${data.isSkylight ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                        <Sun size={18} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-800 dark:text-white">Мансардное окно</div>
                                        <div className="text-[10px] text-slate-500 uppercase">Горизонтальное остекление</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setData({...data, isSkylight: !data.isSkylight})}
                                    className={`w-12 h-6 rounded-full transition-all relative ${data.isSkylight ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${data.isSkylight ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>
                            <GlassSlider label="Климатический коэфф. (СП 131)" val={data.climateCoef} min={0.8} max={1.5} step={0.05} onChange={(v) => setData({...data, climateCoef: v})} />
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Users size={16} className="text-blue-500" /> Внутренние нагрузки
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <GlassSlider label="Количество людей" val={data.people} min={0} max={100} step={1} onChange={(v) => setData({...data, people: v})} />
                                <GlassSlider label="Компьютеры / Оргтехника" val={data.computers} min={0} max={100} step={1} onChange={(v) => setData({...data, computers: v})} />
                            </div>
                            <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${data.ventilationOn ? 'bg-cyan-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                                            <Wind size={18} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-800 dark:text-white">Вентиляция</div>
                                            <div className="text-[10px] text-slate-500 uppercase">Учет приточного воздуха</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setData({...data, ventilationOn: !data.ventilationOn})}
                                        className={`w-12 h-6 rounded-full transition-all relative ${data.ventilationOn ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${data.ventilationOn ? 'translate-x-6' : ''}`} />
                                    </button>
                                </div>
                                {data.ventilationOn && (
                                    <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                                        <GlassSlider label="Расход притока (м³/ч)" val={data.airFlow} min={0} max={2000} step={50} onChange={(v) => setData({...data, airFlow: v})} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-500">
                            <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <BarChart3 size={16} className="text-emerald-500" /> Итоговый отчет
                            </h2>
                            
                            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                                <span className="text-sm font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wide mb-2">
                                    Общая тепловая нагрузка
                                </span>
                                <span className="text-5xl lg:text-7xl font-black text-blue-600 dark:text-blue-400 font-mono">
                                    {(results.totalWatts / 1000).toFixed(2)} <span className="text-2xl text-blue-500/50 uppercase">кВт</span>
                                </span>
                                <div className="mt-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    ≈ {(results.btu / 1000).toFixed(1)} kBTU/h
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 border border-black/5 dark:border-white/5">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-center">Стены и кровля</div>
                                    <div className="text-xl font-black text-slate-800 dark:text-white text-center">{(results.q_walls / 1000).toFixed(2)} <span className="text-[10px] text-slate-500">кВт</span></div>
                                </div>
                                <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 border border-black/5 dark:border-white/5">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-center">Окна и Солнце</div>
                                    <div className="text-xl font-black text-slate-800 dark:text-white text-center">{(results.q_total_windows / 1000).toFixed(2)} <span className="text-[10px] text-slate-500">кВт</span></div>
                                </div>
                                <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 border border-black/5 dark:border-white/5">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-center">Люди и техника</div>
                                    <div className="text-xl font-black text-slate-800 dark:text-white text-center">{(results.q_internal / 1000).toFixed(2)} <span className="text-[10px] text-slate-500">кВт</span></div>
                                </div>
                                <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 border border-black/5 dark:border-white/5">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-center">Вентиляция</div>
                                    <div className="text-xl font-black text-slate-800 dark:text-white text-center">{(results.q_vent / 1000).toFixed(2)} <span className="text-[10px] text-slate-500">кВт</span></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-6 mt-6 border-t border-black/5 dark:border-white/5">
                        <GlassButton secondary icon={<RotateCcw size={16}/>} label="Сбросить" onClick={handleReset} />
                        {currentStep < 3 && (
                            <GlassButton 
                                onClick={handleNext} 
                                label="Далее" 
                                icon={<ChevronRight size={18}/>} 
                                disabled={!STEPS[currentStep].isValid}
                            />
                        )}
                    </div>
                </div>

                {/* Info / Summary Card */}
                <div className="space-y-6">
                    <div className="bg-white/60 dark:bg-[#0a0a0f]/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Globe size={16} className="text-cyan-500" /> Параметры объекта
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                                <span className="text-xs text-slate-500 font-medium">Площадь пола</span>
                                <span className="text-sm font-bold text-slate-800 dark:text-white">{results.floorArea.toFixed(1)} м²</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                                <span className="text-xs text-slate-500 font-medium">Объем помещения</span>
                                <span className="text-sm font-bold text-slate-800 dark:text-white">{(results.floorArea * data.height).toFixed(1)} м³</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                                <span className="text-xs text-slate-500 font-medium">Уд. теплопритоки</span>
                                <span className="text-sm font-bold text-slate-800 dark:text-white">{(results.totalWatts / results.floorArea).toFixed(0)} Вт/м²</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-2xl p-6">
                        <h3 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-2">Методика</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            Расчет производится по упрощенной методике теплового баланса. 
                            Учитываются трансмиссионные потери через стены и окна, солнечная радиация, тепловыделения от людей, освещения и техники.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoolingCalculator;
