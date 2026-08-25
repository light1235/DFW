import { useEffect, useState } from 'react';

/**
 * Инфраструктура определения устройства.
 *
 * Важно: до этого в проекте не было НИ ОДНОГО механизма адаптива —
 * ни хуков, ни media-запросов в JS. Все сцены были рассчитаны только
 * на десктоп с мышью и колесом прокрутки.
 */

const MOBILE_QUERY = '(max-width: 768px)';
const COARSE_QUERY = '(pointer: coarse)';
const PORTRAIT_QUERY = '(orientation: portrait)';

const canUseDOM = typeof window !== 'undefined' && typeof window.matchMedia === 'function';

/**
 * Подписка на media-запрос с корректной отпиской.
 * Использует addEventListener, с фолбэком на addListener для старых WebKit (iOS < 14).
 */
export function useMediaQuery(query) {
    const [matches, setMatches] = useState(() => (canUseDOM ? window.matchMedia(query).matches : false));

    useEffect(() => {
        if (!canUseDOM) return;

        const mql = window.matchMedia(query);
        const onChange = (e) => setMatches(e.matches);

        // Синхронизируем состояние: между первым рендером и эффектом
        // размер окна мог измениться (например, поворот экрана).
        setMatches(mql.matches);

        if (typeof mql.addEventListener === 'function') {
            mql.addEventListener('change', onChange);
            return () => mql.removeEventListener('change', onChange);
        }

        mql.addListener(onChange);
        return () => mql.removeListener(onChange);
    }, [query]);

    return matches;
}

/** Узкий экран — основной триггер для перестройки раскладки. */
export function useIsMobile() {
    return useMediaQuery(MOBILE_QUERY);
}

/**
 * Тач-устройство (палец вместо мыши).
 * Отделено от useIsMobile осознанно: планшет — это coarse pointer,
 * но широкий экран. Для ввода важен именно тип указателя, а не ширина.
 */
export function useIsTouch() {
    return useMediaQuery(COARSE_QUERY);
}

/** Портретная ориентация — именно тут раскладка ломается сильнее всего. */
export function useIsPortrait() {
    return useMediaQuery(PORTRAIT_QUERY);
}
