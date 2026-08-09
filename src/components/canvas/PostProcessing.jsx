import { forwardRef, useMemo } from 'react';
import { Uniform } from 'three';
import { Effect, BlendFunction, ToneMappingMode } from 'postprocessing';
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';
import { useFrame } from '@react-three/fiber';
import fisheyeFragment from '../../shaders/fisheye/fragment.glsl';
import fisheyeVertex from '../../shaders/fisheye/vertex.glsl';
import { useSceneStore } from '../../store/useSceneStore.js';

/**
 * Обёртка кастомного шейдера искажения в Effect из библиотеки postprocessing.
 * Uniform-ы держим в Map — так их требует базовый класс Effect.
 */
class FisheyeEffectImpl extends Effect {
    constructor({ strength = 0.22, zoom = 1.06, vignette = 0.35 } = {}) {
        super('FisheyeEffect', fisheyeFragment, {
            vertexShader: fisheyeVertex,
            blendFunction: BlendFunction.NORMAL,
            uniforms: new Map([
                ['strength', new Uniform(strength)],
                ['zoom', new Uniform(zoom)],
                ['vignette', new Uniform(vignette)],
            ]),
        });
    }

    get strength() {
        return this.uniforms.get('strength').value;
    }

    set strength(value) {
        this.uniforms.get('strength').value = value;
    }
}

/**
 * Fisheye как React-компонент.
 *
 * Сила искажения дышит от прогресса скролла: в середине каждой сцены линза
 * почти плоская, на стыках сцен — выгибается. Стор читаем императивно
 * через getState(), чтобы не ре-рендерить дерево на каждом кадре.
 */
const Fisheye = forwardRef(function Fisheye(
    { strength = 0.22, zoom = 1.06, vignette = 0.35, reactive = true },
    ref,
) {
    const effect = useMemo(
        () => new FisheyeEffectImpl({ strength, zoom, vignette }),
        // Инстанс создаётся один раз: дальше меняем только uniform-ы.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    useFrame(() => {
        if (!reactive) return;
        const { sceneProgress } = useSceneStore.getState();
        // 0 в центре сцены -> 1 на границах сцен
        const edge = Math.abs(sceneProgress - 0.5) * 2;
        effect.strength = strength * (0.45 + edge * 0.55);
    });

    return <primitive ref={ref} object={effect} dispose={null} />;
});

/**
 * Стек постобработки: Fisheye -> Bloom -> ToneMapping.
 *
 * Порядок важен. Fisheye правит UV кадра, поэтому стоит первым — иначе он
 * исказит уже свечение блума и картинка «поплывёт» по-другому.
 */
export default function PostProcessing({
    fisheyeStrength = 0.22,
    bloomIntensity = 0.6,
    enabled = true,
}) {
    if (!enabled) return null;

    return (
        <EffectComposer disableNormalPass multisampling={0}>
            <Fisheye strength={fisheyeStrength} />
            <Bloom
                intensity={bloomIntensity}
                luminanceThreshold={0.75}
                luminanceSmoothing={0.25}
                mipmapBlur
            />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
    );
}

export { Fisheye, FisheyeEffectImpl };
