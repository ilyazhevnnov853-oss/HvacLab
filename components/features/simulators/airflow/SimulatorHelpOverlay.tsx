import React from 'react';
import { X, Settings2, BarChart3, AppWindow, Info } from 'lucide-react';

interface SimulatorHelpOverlayProps {
    onClose: () => void;
    viewMode: 'front' | 'right' | 'top' | '3d';
    isPowerOn: boolean;
}

const HelpHotspot = ({ title, description, className, icon, align = 'left', delay = '0ms' }: any) => (
    <div 
        className={`absolute ${className} flex flex-col gap-3 max-w-[320px] z-[220]`}
        style={{ animation: `fadeInScale 0.5s ${delay} forwards`, opacity: 0 }}
    >
        <div className={`flex items-center gap-3 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                {icon}
            </div>
            <div className={`h-px w-16 bg-gradient-to-r from-blue-500 to-transparent ${align === 'right' ? 'rotate-180' : ''}`}></div>
        </div>
        <div className={`
            p-6 rounded-3xl bg-[#0a0a0c]/95 backdrop-blur-2xl border border-white/10 
            shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-slate-200
            ${align === 'right' ? 'text-right' : 'text-left'}
        `}>
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">{title}</h3>
            <p className="text-xs leading-relaxed text-slate-400 font-medium">
                {description}
            </p>
        </div>
    </div>
);

const ButtonPointer = ({ title, description, height = 80, delay = '0ms' }: any) => (
    <div 
        className="relative flex justify-center pointer-events-none w-full h-full"
        style={{ animation: `fadeInUp 0.5s ${delay} forwards`, opacity: 0 }}
    >
        <div className="absolute bottom-full flex flex-col items-center pb-2">
            <div className="mb-2 p-3 rounded-xl bg-[#0a0a0c]/95 backdrop-blur-xl border border-blue-500/30 shadow-[0_10px_30px_rgba(59,130,246,0.2)] w-40 text-center relative">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">{title}</h3>
                <p className="text-[9px] text-slate-300 leading-snug">{description}</p>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0a0a0c] rotate-45 border-b border-r border-blue-500/30"></div>
            </div>
            <div className="w-px bg-gradient-to-b from-blue-500/50 to-blue-500" style={{ height: `${height}px` }}></div>
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_15px_#3b82f6] animate-pulse"></div>
        </div>
    </div>
);

const SimulatorHelpOverlay: React.FC<SimulatorHelpOverlayProps> = ({ onClose, viewMode, isPowerOn }) => {
    return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden">
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>

            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-[#020205]/80 backdrop-blur-md transition-opacity duration-500"
                onClick={onClose}
            />

            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute top-8 right-8 z-[230] group flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-xl transition-all hover:scale-105 active:scale-95"
            >
                <span className="text-xs font-bold text-white uppercase tracking-widest">Закрыть справку</span>
                <div className="p-1 rounded-full bg-white text-black group-hover:rotate-90 transition-transform duration-300">
                    <X size={16} />
                </div>
            </button>

            {/* Content Container */}
            <div className="relative z-[220] pointer-events-none w-full h-full max-w-[1920px] mx-auto">
                
                {/* Central Welcome Info */}
                <div 
                    className="absolute top-1/4 left-1/2 -translate-x-1/2 flex flex-col items-center text-center max-w-md"
                    style={{ animation: `fadeInScale 0.5s 0ms forwards`, opacity: 0 }}
                >
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)] text-blue-400">
                        <Info size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-4">Режим Справки</h2>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Добро пожаловать в симулятор воздухораспределения. Здесь вы можете проектировать, анализировать и визуализировать потоки воздуха в реальном времени.
                    </p>
                </div>

                {/* Left Panel Hotspot */}
                <HelpHotspot 
                    className="top-1/2 -translate-y-1/2 left-8 lg:left-16"
                    icon={<Settings2 size={24} />}
                    title="Настройка параметров"
                    description="Выберите модель диффузора, задайте размеры помещения, температуру и расход воздуха. Нажмите «Добавить», чтобы разместить устройство на плане."
                    delay="100ms"
                />

                {/* Right Panel Hotspot */}
                <HelpHotspot 
                    className="top-1/2 -translate-y-1/2 right-8 lg:right-16"
                    align="right"
                    icon={<BarChart3 size={24} />}
                    title="Анализ и результаты"
                    description="Здесь отображаются расчетные данные: скорость струи, дальнобойность, уровень шума и риск сваливания холодного воздуха."
                    delay="200ms"
                />

                {/* Dummy Toolbar for perfect pointer alignment */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 pointer-events-none">
                    
                    {/* Power & Play */}
                    <div className="flex items-center gap-1 pr-2 border-r border-transparent">
                        <div className="w-16 h-14 relative">
                            <ButtonPointer title="Питание" description="Запуск симуляции" height={120} delay="300ms" />
                        </div>
                        {isPowerOn && (
                            <div className="w-16 h-14 relative">
                                <ButtonPointer title="Пауза" description="Остановка частиц" height={60} delay="350ms" />
                            </div>
                        )}
                    </div>

                    {/* View Modes */}
                    <div className="flex items-center gap-1 px-2">
                        <div className="w-[68px] h-14 relative">
                            <ButtonPointer title="Спереди" description="Профиль струи" height={160} delay="400ms" />
                        </div>
                        <div className="w-[68px] h-14 relative">
                            <ButtonPointer title="Справа" description="Боковой профиль" height={100} delay="450ms" />
                        </div>
                        <div className="w-[68px] h-14 relative">
                            <ButtonPointer title="План" description="Вид сверху" height={160} delay="500ms" />
                        </div>
                        <div className="w-[68px] h-14 relative">
                            <ButtonPointer title="3D Вид" description="Изометрия" height={100} delay="550ms" />
                        </div>
                    </div>

                    {/* Tools */}
                    {isPowerOn && (
                        <div className="flex items-center gap-1 pl-2 border-l border-transparent">
                            <div className="w-[68px] h-14 relative">
                                <ButtonPointer title="Выбор" description="Перемещение" height={160} delay="600ms" />
                            </div>
                            <div className="w-[68px] h-14 relative">
                                <ButtonPointer title="Датчик" description="Измерение в точке" height={100} delay="650ms" />
                            </div>
                            <div className="w-px h-8 mx-1"></div>
                            <div className="w-[68px] h-14 relative">
                                <ButtonPointer title="Сетка" description="Отображение сетки" height={160} delay="700ms" />
                            </div>
                            <div className="w-[68px] h-14 relative">
                                <ButtonPointer title="Привязка" description="Магнит к сетке" height={100} delay="750ms" />
                            </div>
                        </div>
                    )}

                    {/* Help Button Space */}
                    <div className="flex items-center pl-2 border-l border-transparent">
                        <div className="w-16 h-14 relative"></div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SimulatorHelpOverlay;
