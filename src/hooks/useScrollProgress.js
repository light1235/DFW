import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSceneStore } from '../store/useSceneStore.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Связка GSAP ScrollTrigger -> Zustand.
 *
 * Вешается на элемент-проставку (`.scroll-spacer`), высота которого задаёт
 * длину виртуального скролла для WebGL. Прогресс триггера (0..1) кладётся
 * в стор, откуда его императивно читают камера, сцены и постпроцессинг.
 *
 * @param {React.RefObject<HTMLElement>} targetRef ref на элемент-проставку
 */
export function useScrollProgress(targetRef) {
    useEffect(() => {
        const el = targetRef?.current;
        if (!el) return undefined;

        const { setProgress, setScrollHeight, setReady } = useSceneStore.getState();

        const trigger = ScrollTrigger.create({
            trigger: el,
            start: 'top top',
            end: 'bottom bottom',
            // scrub не нужен: onUpdate у обычного триггера и так вызывается на каждый скролл-кадр
            onUpdate: (self) => setProgress(self.progress),
            onRefresh: (self) => {
                setScrollHeight(self.end - self.start);
                setProgress(self.progress);
            },
        });

        setReady(true);

        // Пересчёт после загрузки шрифтов/картинок, иначе end посчитается по старой высоте.
        const refresh = () => ScrollTrigger.refresh();
        window.addEventListener('load', refresh);

        return () => {
            window.removeEventListener('load', refresh);
            trigger.kill();
            setReady(false);
        };
    }, [targetRef]);
}

export default useScrollProgress;
