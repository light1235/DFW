import React, { useEffect, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { SplineRouteTool } from 'spline-route-tool';

// 1. Создаем компонент-обертку для инструмента
export default function SplineEditor({ controlsRef }) {
    const { scene, camera, gl } = useThree();

    // Мемоизируем класс, чтобы он не пересоздавался при рендерах
    // Передаем controls, чтобы камера не крутилась при перетаскивании точек
    const splineTool = useMemo(() => {
        return new SplineRouteTool(scene, camera, gl, gl.domElement, {
            orbitControls: controlsRef?.current
        });
    }, [scene, camera, gl, controlsRef]);

    // Привязываем UI инструмента и убираем его при демонтировании
    useEffect(() => {
        splineTool.attach();
        return () => splineTool.detach();
    }, [splineTool]);

    // Обновляем логику скролла и полета камеры каждый кадр
    useFrame((state, delta) => {
        splineTool.update(delta);
    });

    return null; // Сам компонент ничего не рендерит в 3D сцену
}
