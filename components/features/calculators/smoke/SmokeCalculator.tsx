import React, { useState, useMemo } from 'react';
import { 
    Flame, DoorOpen, Fan, Thermometer, Wind, Building2, AlertTriangle, ArrowUpFromLine,
    RotateCcw, Activity, ChevronRight, ChevronLeft
} from 'lucide-react';
import { GlassButton, GlassSlider } from '../../../ui/Shared';
import { FIRE_LOADS } from './constants_fire';
import { useLocalStorage } from '../../../../hooks/useLocalStorage';

interface SmokeData {
    systemType: 'Extraction' | 'Pressurization';
    roomArea: number;
    roomHeight: number;
    fireLoadMass: number;
    material: keyof typeof FIRE_LOADS;
    corridorWidth: number;
    corridorLength: number;
    doorWidth: number;
    doorHeight: number;
    isSingleDoor: boolean;
    floors: number;
    ductLength: number;
}

const SmokeCalculator = ({ onBack, onHome }: any) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [data, setData] = useLocalStorage<SmokeData>('hvac-calc-smoke', {
        systemType: 'Extraction',
        roomArea: 25, roomHeight: 3.0, fireLoadMass: 400, material: 'Office_Furniture',
        corridorWidth: 2.0, corridorLength: 15.0, doorWidth: 0.9, doorHeight: 2.1, isSingleDoor: true,
        floors: 5, ductLength: 15
    });

    const results = useMemo(() => {
        if (data.systemType === 'Pressurization') return null;

        const mat = FIRE_LOADS[data.material];
        const fireLoadDensity = data.fireLoadMass / data.roomArea;
        
        let T_room_max = 20 + 900 * (1 - Math.exp(-0.05 * fireLoadDensity));
        if (T_room_max > 1100) T_room_max = 1100;

        const alpha = 0.55;
        const T_smoke_corridor = 20 + (T_room_max - 20) * alpha;
        const rho_smoke = 353 / (273 + T_smoke_corridor);

        const A_door = data.doorWidth * data.doorHeight;
        const k_flow = data.isSingleDoor ? 1.0 : 1.2; 
        const G_sm = 0.05 * k_flow * A_door * Math.pow(data.doorHeight, 0.5) * Math.pow(T_room_max, 0.25);

        const leakage_factor = 1 + (0.015 * data.floors);
        const L_sm = (G_sm / rho_smoke) * 3600 * leakage_factor;

        return { 
            T_room_max, 
            T_smoke_corridor, 
            G_sm, 
            L_sm, 
            rho_smoke,
            fireLoadDensity
        };
    }, [data]);

    const handleReset = () => {
        setData({
            systemType: 'Extraction',
            roomArea: 25, roomHeight: 3.0, fireLoadMass: 400, material: 'Office_Furniture',
            corridorWidth: 2.0, corridorLength: 15.0, doorWidth: 0.9, doorHeight: 2.1, isSingleDoor: true,
            floors: 5, ductLength: 15
        });
        setCurrentStep(0);
    };

    const STEPS = [
        { id: 0, title: 'Очаг пожара', icon: <Flame size={18}/> },
        { id: 1, title: 'Эвакуация', icon: <DoorOpen size={18}/> },
        { id: 2, title: 'Результат', icon: <Fan size={18}/> }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-20 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-500 shadow-lg shadow-orange-500/20 text-white">
                        <Flame size={24} />
                    </div>
                    Противодымная защита
                </h1>
                <div className="flex items-center gap-2">
                    <GlassButton secondary onClick={onBack} label="Назад" />
                    <GlassButton secondary onClick={onHome} label="Главная" />
                </div>
            </div>

            {/* System Type Switcher */}
            <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-2xl w-fit">
                <button 
                    onClick={() => setData(prev => ({ ...prev, systemType: 'Extraction' }))}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                        data.systemType === 'Extraction' 
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                >
                    <Wind size={14} /> Дымоудаление
                </button>
                <button 
                    onClick={() => setData(prev => ({ ...prev, systemType: 'Pressurization' }))}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                        data.systemType === 'Pressurization' 
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                >
                    <ArrowUpFromLine size={14} /> Подпор воздуха
                </button>
            </div>

            {data.systemType === 'Pressurization' ? (
                <div className="bg-white/60 dark:bg-[#0a0a0f]/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl p-12 text-center">
                    <div className="inline-flex p-4 rounded-full bg-slate-500/10 text-slate-400 mb-4">
                        <ArrowUpFromLine size={48} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">В разработке</h2>
                    <p className="text-slate-500 max-w-md mx-auto italic">Модуль расчета систем подпора воздуха (лестничные клетки, лифтовые шахты) будет доступен в ближайших обновлениях.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar Steps */}
                    <div className="lg:col-span-1 space-y-3">
                        {STEPS.map((step, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setCurrentStep(idx)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border text-left relative overflow-hidden ${
                                    currentStep === idx 
                                        ? 'bg-orange-500/10 border-orange-500 text-slate-800 dark:text-white' 
                                        : 'bg-white/40 dark:bg-white/5 border-transparent text-slate-400 hover:bg-white/60 dark:hover:bg-white/10'
                                }`}
                            >
                                <div className={`p-2 rounded-xl ${currentStep === idx ? 'bg-orange-500 text-white' : 'bg-black/5 dark:bg-white/5'}`}>
                                    {step.icon}
                                </div>
                                <div className="font-bold text-xs uppercase tracking-wider">{step.title}</div>
                                {currentStep === idx && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>}
                            </button>
                        ))}
                    </div>

                    {/* Main Content Card */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-white/60 dark:bg-[#0a0a0f]/60 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-sm min-h-[400px] flex flex-col">
                            
                            {currentStep === 0 && (
                                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                            <Flame size={16} className="text-orange-500" /> Параметры очага
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Материал горения</label>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {Object.keys(FIRE_LOADS).slice(0, 3).map((k) => (
                                                        <button 
                                                            key={k} 
                                                            onClick={() => setData(prev => ({ ...prev, material: k as any }))}
                                                            className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                                                                data.material === k 
                                                                    ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' 
                                                                    : 'bg-black/5 dark:bg-white/5 border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                                            }`}
                                                        >
                                                            {FIRE_LOADS[k as keyof typeof FIRE_LOADS].name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-8">
                                                <GlassSlider 
                                                    label="Масса нагрузки (кг)" 
                                                    val={data.fireLoadMass} min={100} max={5000} step={50} 
                                                    onChange={(v) => setData(prev => ({ ...prev, fireLoadMass: v }))} 
                                                />
                                                <GlassSlider 
                                                    label="Площадь помещения (м²)" 
                                                    val={data.roomArea} min={10} max={200} step={1} 
                                                    onChange={(v) => setData(prev => ({ ...prev, roomArea: v }))} 
                                                />
                                                <GlassSlider 
                                                    label="Высота помещения (м)" 
                                                    val={data.roomHeight} min={2.5} max={10} step={0.1} 
                                                    onChange={(v) => setData(prev => ({ ...prev, roomHeight: v }))} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 1 && (
                                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                            <DoorOpen size={16} className="text-blue-500" /> Геометрия проемов
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <GlassSlider 
                                                label="Ширина двери (м)" 
                                                val={data.doorWidth} min={0.6} max={2.0} step={0.1} 
                                                onChange={(v) => setData(prev => ({ ...prev, doorWidth: v }))} 
                                            />
                                            <GlassSlider 
                                                label="Высота двери (м)" 
                                                val={data.doorHeight} min={1.8} max={3.0} step={0.1} 
                                                onChange={(v) => setData(prev => ({ ...prev, doorHeight: v }))} 
                                            />
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Конфигурация</label>
                                                <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl w-fit">
                                                    <button 
                                                        onClick={() => setData(prev => ({ ...prev, isSingleDoor: true }))}
                                                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${data.isSingleDoor ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500'}`}
                                                    >
                                                        Одинарная
                                                    </button>
                                                    <button 
                                                        onClick={() => setData(prev => ({ ...prev, isSingleDoor: false }))}
                                                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${!data.isSingleDoor ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500'}`}
                                                    >
                                                        Двойная
                                                    </button>
                                                </div>
                                            </div>
                                            <GlassSlider 
                                                label="Этажность здания" 
                                                val={data.floors} min={1} max={50} step={1} 
                                                onChange={(v) => setData(prev => ({ ...prev, floors: v }))} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && results && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="p-8 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex flex-col items-center justify-center text-center transition-colors">
                                        <span className="text-sm font-bold text-orange-600/70 dark:text-orange-400/70 uppercase tracking-wide mb-2">
                                            Объемный расход дыма
                                        </span>
                                        <span className="text-6xl lg:text-8xl font-black font-mono text-orange-600 dark:text-orange-400">
                                            {results.L_sm.toFixed(0)} <span className="text-2xl opacity-50 uppercase">м³/ч</span>
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500"><Wind size={18}/></div>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Массовый расход</span>
                                            </div>
                                            <span className="text-lg font-black text-slate-800 dark:text-white">{results.G_sm.toFixed(2)} <span className="text-[10px] text-slate-500 uppercase">кг/с</span></span>
                                        </div>
                                        <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-4 border border-black/5 dark:border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500"><Thermometer size={18}/></div>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">T дыма в коридоре</span>
                                            </div>
                                            <span className="text-lg font-black text-slate-800 dark:text-white">{results.T_smoke_corridor.toFixed(0)} <span className="text-[10px] text-slate-500 uppercase">°C</span></span>
                                        </div>
                                    </div>

                                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
                                        <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                            <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1 uppercase tracking-tighter">Рекомендация:</span>
                                            Выбирайте вентилятор ДУ ({results.T_smoke_corridor > 400 ? '600°C' : '400°C'} / 2ч). 
                                            Расчет предварительный, требуется проверка по МР ВНИИПО.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto flex items-center justify-between gap-3 pt-6 border-t border-black/5 dark:border-white/5">
                                <GlassButton secondary icon={<RotateCcw size={16}/>} label="Сбросить" onClick={handleReset} />
                                <div className="flex gap-2">
                                    {currentStep > 0 && (
                                        <GlassButton secondary icon={<ChevronLeft size={16}/>} label="Назад" onClick={() => setCurrentStep(prev => prev - 1)} />
                                    )}
                                    {currentStep < 2 && (
                                        <GlassButton icon={<ChevronRight size={16}/>} label="Далее" onClick={() => setCurrentStep(prev => prev + 1)} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmokeCalculator;
