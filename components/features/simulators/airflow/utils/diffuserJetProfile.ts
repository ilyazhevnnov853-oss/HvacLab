export interface DiffuserGeometry {
    bodyDepth: number;
    outletOffset: number;
    horizontalOffset: number;
}

export interface HorizontalJetProfile {
    anchor: 'horizontal' | 'outlet';
    offsetFactor: number;
    emitter: 'center' | 'rim';
    radiusFactor: number;
    speedFactor: number;
    dropFactor: number;
    tangentialFactor: number;
    waveAmp: number;
    waveFreq: number;
    drag: number;
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

const HORIZONTAL_PROFILES: Record<string, HorizontalJetProfile> = {
    'dpu-m:horizontal-fan': {
        anchor: 'horizontal',
        offsetFactor: 1,
        emitter: 'rim',
        radiusFactor: 0.48,
        speedFactor: 1.06,
        dropFactor: 0.004,
        tangentialFactor: 0,
        waveAmp: 0.8,
        waveFreq: 5.0,
        drag: 0.978
    },
    'dpu-k:horizontal-fan': {
        anchor: 'outlet',
        offsetFactor: 0.82,
        emitter: 'center',
        radiusFactor: 0.06,
        speedFactor: 0.98,
        dropFactor: 0.18,
        tangentialFactor: 0,
        waveAmp: 0.9,
        waveFreq: 5.8,
        drag: 0.975
    },
    'dpu-v:horizontal-swirl': {
        anchor: 'horizontal',
        offsetFactor: 0.95,
        emitter: 'rim',
        radiusFactor: 0.42,
        speedFactor: 0.78,
        dropFactor: 0.02,
        tangentialFactor: 0.22,
        waveAmp: 9.0,
        waveFreq: 8.2,
        drag: 0.971
    }
};

const VERTICAL_PROFILES: Record<string, VerticalJetProfile> = {
    'dpu-m:vertical-conical': {
        emitter: 'ring',
        radiusFactor: 0.3,
        radiusJitter: 0.05,
        coneMinDeg: 18,
        coneJitterDeg: 4,
        horizontalFactor: 0.72,
        inwardFactor: 1,
        tangentialFactor: 0,
        speedFactor: 1.0,
        waveAmp: 1.4,
        waveFreq: 4.6,
        drag: 0.956
    },
    'dpu-k:vertical-conical': {
        emitter: 'disk',
        radiusFactor: 0.08,
        radiusJitter: 0.06,
        coneMinDeg: 10,
        coneJitterDeg: 8,
        horizontalFactor: 0.28,
        inwardFactor: 0,
        tangentialFactor: 0,
        speedFactor: 1,
        waveAmp: 2.0,
        waveFreq: 4.8,
        drag: 0.968
    },
    'dpu-v:vertical-swirl': {
        emitter: 'disk',
        radiusFactor: 0.24,
        radiusJitter: 0.04,
        coneMinDeg: 4,
        coneJitterDeg: 6,
        horizontalFactor: 0.1,
        inwardFactor: 0,
        tangentialFactor: 0.34,
        speedFactor: 0.96,
        waveAmp: 15,
        waveFreq: 6.9,
        drag: 0.954
    },
    'dpu-s:vertical-compact': {
        emitter: 'disk',
        radiusFactor: 0.05,
        radiusJitter: 0.01,
        coneMinDeg: 1,
        coneJitterDeg: 2,
        horizontalFactor: 0.09,
        inwardFactor: 0,
        tangentialFactor: 0,
        speedFactor: 1.07,
        waveAmp: 0.6,
        waveFreq: 4.4,
        drag: 0.99
    }
};

const GENERIC_VERTICAL_PROFILES: Record<string, VerticalJetProfile> = {
    'vertical-conical': {
        emitter: 'disk',
        radiusFactor: 0.22,
        radiusJitter: 0.04,
        coneMinDeg: 8,
        coneJitterDeg: 8,
        horizontalFactor: 0.28,
        inwardFactor: 0,
        tangentialFactor: 0,
        speedFactor: 1,
        waveAmp: 2,
        waveFreq: 4.8,
        drag: 0.96
    },
    'vertical-swirl': {
        emitter: 'ring',
        radiusFactor: 0.22,
        radiusJitter: 0.04,
        coneMinDeg: 8,
        coneJitterDeg: 14,
        horizontalFactor: 0.25,
        inwardFactor: 0,
        tangentialFactor: 0.15,
        speedFactor: 1,
        waveAmp: 10,
        waveFreq: 6.5,
        drag: 0.95
    },
    'vertical-compact': {
        emitter: 'disk',
        radiusFactor: 0.2,
        radiusJitter: 0.03,
        coneMinDeg: 3,
        coneJitterDeg: 6,
        horizontalFactor: 0.22,
        inwardFactor: 0,
        tangentialFactor: 0,
        speedFactor: 1.15,
        waveAmp: 1,
        waveFreq: 4.5,
        drag: 0.985
    }
};

export const getDiffuserGeometry = (modelId: string, nominalDepth: number): DiffuserGeometry => {
    const factors = MODEL_GEOMETRY_FACTORS[modelId] || DEFAULT_GEOMETRY;
    return {
        bodyDepth: nominalDepth * factors.bodyDepth,
        outletOffset: nominalDepth * factors.outletOffset,
        horizontalOffset: nominalDepth * factors.horizontalOffset
    };
};

export const isHorizontalFlowType = (flowType: string) =>
    flowType.includes('horizontal') || flowType === '4-way';

export const getHorizontalJetProfile = (modelId: string, flowType: string) =>
    HORIZONTAL_PROFILES[`${modelId}:${flowType}`] || null;

export const getVerticalJetProfile = (modelId: string, flowType: string) =>
    VERTICAL_PROFILES[`${modelId}:${flowType}`] || GENERIC_VERTICAL_PROFILES[flowType] || null;

export const resolveHorizontalStartOffset = (
    geometry: DiffuserGeometry,
    profile: HorizontalJetProfile
) => {
    const baseOffset = profile.anchor === 'outlet' ? geometry.outletOffset : geometry.horizontalOffset;
    return baseOffset * profile.offsetFactor;
};
