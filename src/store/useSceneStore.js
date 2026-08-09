import { create } from 'zustand';

/** Количество полноэкранных сцен в WebGL-макете. */
export const SCENES_COUNT = 4;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Глобальное состояние сцен и прогресса скролла.
 *
 * ВАЖНО про производительность:
 * `progress` обновляется на каждом кадре скролла. Не подписывайтесь на него
 * через селектор внутри 3D-компонентов — это вызовет ре-рендер React на каждый кадр.
 * Внутри `useFrame` читайте значение императивно:
 *
 *   const { progress } = useSceneStore.getState();
 *
 * Подписываться селектором стоит только на дискретные поля (`activeScene`, `isReady`).
 */
export const useSceneStore = create((set, get) => ({
    /** Глобальный прогресс скролла по всему WebGL-блоку: 0..1 */
    progress: 0,
    /** Индекс активной сцены: 0..SCENES_COUNT-1 */
    activeScene: 0,
    /** Прогресс внутри активной сцены: 0..1 */
    sceneProgress: 0,
    /** Высота виртуального скролла (px), измеряется в ScrollProxy */
    scrollHeight: 0,
    /** ScrollTrigger инициализирован */
    isReady: false,

    setProgress: (value) => {
        const progress = clamp01(value);
        const raw = progress * SCENES_COUNT;
        const activeScene = Math.min(Math.floor(raw), SCENES_COUNT - 1);
        const sceneProgress = clamp01(raw - activeScene);

        const prev = get();
        // activeScene пишем только при реальной смене — иначе лишние ре-рендеры подписчиков.
        if (prev.activeScene !== activeScene) {
            set({ progress, sceneProgress, activeScene });
        } else {
            set({ progress, sceneProgress });
        }
    },

    setScrollHeight: (scrollHeight) => set({ scrollHeight }),

    setReady: (isReady) => set({ isReady }),
}));

/** Селекторы (для подписки только на дискретные поля). */
export const selectActiveScene = (state) => state.activeScene;
export const selectIsReady = (state) => state.isReady;
