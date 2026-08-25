import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * Адаптация угла обзора под пропорции экрана.
 *
 * Проблема: fov в three.js — ВЕРТИКАЛЬНЫЙ. Горизонтальный обзор равен
 * fov * aspect. На десктопе (16:9, aspect ≈ 1.78) при fov 30° по горизонтали
 * влезает ~50°. На телефоне в портрете aspect ≈ 0.46, то есть горизонтальный
 * обзор падает почти в 4 раза — сцена и текст обрезаются по краям.
 *
 * Решение: при узком экране увеличиваем вертикальный fov, чтобы вернуть
 * горизонтальный охват.
 *
 * -----------------------------------------------------------------------------
 * ВАЖНО (регрессия, которая тут была):
 *
 * Первая версия брала fov из пропа baseFov = 30 и присваивала его камере.
 * Но useThree(s => s.camera) возвращает ТЕКУЩУЮ default-камеру, а сцены
 * монтируют свои собственные:
 *
 *   Scene3: <PerspectiveCamera makeDefault fov={70} />
 *   Scene6: <PerspectiveCamera makeDefault ... />
 *   Scene4: camera.fov = 52 (императивно)
 *
 * Когда Scene3 подменяла default-камеру, эффект перезапускался (camera в
 * зависимостях) и затирал её честные 70° на 30°. Обзор сужался больше чем
 * вдвое — визуально сцена «прыгала» вплотную к объектам. Причём на десктопе,
 * где адаптив вообще не должен был ничего делать.
 *
 * Теперь:
 *  1. baseFov не задаётся снаружи — он берётся у самой камеры. Замысел автора
 *     сцены остаётся источником истины.
 *  2. Если fov камеры изменил кто-то другой (как Scene4), мы это замечаем и
 *     принимаем новое значение за базовое, а не воюем за своё.
 *  3. На широких экранах расширять нечего — камера не трогается ВООБЩЕ,
 *     ни одного присваивания.
 * -----------------------------------------------------------------------------
 */

const DEG = 180 / Math.PI;

// Насколько плотно тянемся к десктопному горизонтальному охвату.
// 1.0 — полная компенсация (слишком агрессивно), 1.55 — разумный компромисс.
const HORIZONTAL_FIT = 1.55;

export default function ResponsiveCamera({ maxFov = 50 }) {
    const camera = useThree((s) => s.camera);
    const width = useThree((s) => s.size.width);
    const height = useThree((s) => s.size.height);

    // Помним для каждой камеры её исходный fov и то значение, которое
    // записали мы сами. WeakMap — чтобы не держать размонтированные камеры.
    const seen = useRef(new WeakMap());

    useEffect(() => {
        // Ортографическую камеру трогать нельзя — у неё нет fov.
        if (!camera?.isPerspectiveCamera) return;
        if (!width || !height) return;

        const aspect = width / height;
        if (!Number.isFinite(aspect) || aspect <= 0) return;

        let entry = seen.current.get(camera);

        // Либо камера новая, либо её fov поменяли в обход нас (Scene4 делает
        // это императивно). В обоих случаях текущее значение — это база.
        const changedExternally =
            entry?.applied !== undefined && Math.abs(camera.fov - entry.applied) > 0.01;

        if (!entry || changedExternally) {
            entry = { base: camera.fov, applied: undefined };
            seen.current.set(camera, entry);
        }

        const { base } = entry;

        // Целевой тангенс половины горизонтального угла — от собственного
        // fov этой камеры, а не от глобальной константы.
        const targetTanH = Math.tan((base / 2) / DEG) * HORIZONTAL_FIT;
        const fitFov = 2 * Math.atan(targetTanH / aspect) * DEG;

        // Никогда не сужаем ниже авторского значения и не задираем выше
        // потолка. Если камера изначально шире потолка (Scene3 с 70°) —
        // оставляем её как есть, сужать нельзя.
        const upper = Math.max(maxFov, base);
        const next = Math.min(Math.max(fitFov, base), upper);

        // Широкий экран: расширять нечего. Выходим не записав ничего —
        // именно это гарантирует, что десктоп остаётся нетронутым.
        if (next - base < 0.01) return;

        // Без порога любой ресайз дёргал бы пересчёт матрицы проекции.
        if (Math.abs(camera.fov - next) < 0.01) return;

        camera.fov = next;
        camera.updateProjectionMatrix();
        entry.applied = next;
    }, [camera, width, height, maxFov]);

    return null;
}
