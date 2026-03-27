export interface DiffuserGeometry {
    bodyDepth: number;
    outletOffset: number;
    horizontalOffset: number;
}

export interface VerticalJetProfile {
    emitter: 'ring' | 'disk';
    radiusFactor: number;
    radiusJitter: number;
    coneMinDeg: number;
    coneJitterDeg: number;
    horizontalFactor: number;
    inwardFactor: number;
    tangentialFactor: number;
    speedFactor: number;
    waveAmp: number;
    waveFreq: number;
    drag: number;
}

const MODEL_GEOMETRY_FACTORS: Record<string, DiffuserGeometry> = {
    'dpu-m': { bodyDepth: 1.1, outletOffset: 0.78, horizontalOffset: 0.16 },
    'dpu-k': { bodyDepth: 0.95, outletOffset: 0.72, horizontalOffset: 0.14 },
    'dpu-v': { bodyDepth: 0.8, outletOffset: 0.5, horizontalOffset: 0.12 },
    'dpu-s': { bodyDepth: 1.2, outletOffset: 1.05, horizontalOffset: 0.18 }
};

const DEFAULT_GEOMETRY: DiffuserGeometry = {
    bodyDepth: 1,
    outletOffset: 0.7,
    horizontalOffset: 0.15
};

export const getDiffuserGeometry = (modelId: string, nominalDepth: number): DiffuserGeometry => {
    const factors = MODEL_GEOMETRY_FACTORS[modelId] || DEFAULT_GEOMETRY;
    return {
        bodyDepth: nominalDepth * factors.bodyDepth,
        outletOffset: nominalDepth * factors.outletOffset,
        horizontalOffset: nominalDepth * factors.horizontalOffset
    };
};

export const getVerticalJetProfile = (modelId: string, flowType: string): VerticalJetProfile | null => {
    // ДПУ-С (Сопловый) - Максимально узкая, быстрая и дальнобойная струя
    if (modelId === 'dpu-s') {
        return {
            emitter: 'disk',
            radiusFactor: 0.25,
            radiusJitter: 0.1,
            coneMinDeg: 1,
            coneJitterDeg: 3,
            horizontalFactor: 0.15,
            inwardFactor: 0,
            tangentialFactor: 0,
            speedFactor: 1.0,  // Бьет сильно вниз
            drag: 0.99,        // Почти не тормозится
            waveAmp: 0.5,      // Почти без волн (прямая струя)
            waveFreq: 2
        };
    }

    // ДПУ-В (Вихревой) - Сильное закручивание, среднее расширение
    if (modelId === 'dpu-v') {
        return {
            emitter: 'disk',
            radiusFactor: 0.35,
            radiusJitter: 0.15,
            coneMinDeg: 18, // Увеличено с 5 до 18 для широкого торнадо
            coneJitterDeg: 10,
            horizontalFactor: 0.4, // Немного поднято для разлета в стороны
            inwardFactor: 0,
            tangentialFactor: 0.6, // Высокая закрутка
            speedFactor: 0.85,     // Часть энергии уходит в закрутку
            drag: 0.96,
            waveAmp: 8.0,          // Сильные пульсации
            waveFreq: 6
        };
    }

    // ДПУ-К (Веерный в режиме компактной струи) - Умеренная конусность
    if (modelId === 'dpu-k') {
        return {
            emitter: 'disk', // Изменено с ring на disk
            radiusFactor: 0.4,
            radiusJitter: 0.1,
            coneMinDeg: 16, // Увеличено с 12 до 16 для широкой струи
            coneJitterDeg: 8,
            horizontalFactor: 0.45,
            inwardFactor: 0.2,
            tangentialFactor: 0,
            speedFactor: 0.95,
            drag: 0.97,
            waveAmp: 2.0,
            waveFreq: 4
        };
    }

    // ДПУ-М (Универсальный в режиме компактной струи) - Стандартная коническая струя
    if (modelId === 'dpu-m') {
        return {
            emitter: 'ring',
            radiusFactor: 0.3,
            radiusJitter: 0.1,
            coneMinDeg: 11, // Уменьшено с 15 до 11 для более сфокусированной струи
            coneJitterDeg: 5,
            horizontalFactor: 0.5,
            inwardFactor: 0.05, // Сведено к минимуму (было 0.3)
            tangentialFactor: 0,
            speedFactor: 1.0,
            drag: 0.96,
            waveAmp: 1.5,
            waveFreq: 4.5
        };
    }

    return null;
};
