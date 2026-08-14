import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Шейдер Matrix Rain для React Three Fiber
const MatrixRainShader = {
     uniforms: {
          u_time: { value: 0 },
          u_progress: { value: 0 },
          u_opacity: { value: 1.0 },
          u_resolution: { value: new THREE.Vector2(1, 1) },
          u_intensity: { value: 1.0 },
     },
     vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
     fragmentShader: `
    uniform float u_time;
    uniform float u_progress;
    uniform float u_opacity;
    uniform vec2 u_resolution;
    uniform float u_intensity;
    varying vec2 vUv;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    // Генерация псевдо-символов матрицы в ячейке
    float matrixGlyph(vec2 gridUv, float seed) {
      vec2 charGrid = floor(gridUv * 4.0);
      float n = random(charGrid + floor(seed * 10.0));
      return step(0.4, n);
    }

    void main() {
      vec2 uv = vUv;
      float p = clamp(u_progress, 0.0, 1.0);

      // Масштаб сетки символов (столбцы и строки)
      vec2 grid = vec2(60.0, 35.0);
      vec2 st = uv * grid;
      vec2 ipos = floor(st); // индекс колонки/строки
      vec2 fpos = fract(st); // координаты внутри ячейки

      // Скорость падения разная для каждого столбца
      float columnSpeed = (random(vec2(ipos.x, 111.0)) * 0.8 + 0.6) * u_intensity;
      float dropTime = u_time * columnSpeed * 3.0 + random(vec2(ipos.x, 222.0)) * 20.0;

      // Позиция капли в столбце
      float yPos = mod(ipos.y + dropTime, grid.y);
      float trail = yPos / grid.y; // Длина и затухание шлейфа

      // Символ матрицы
      float glyphSeed = ipos.y + floor(dropTime);
      float glyph = matrixGlyph(fpos, glyphSeed);

      // Яркий головной символ (белый свет на переднем крае капли)
      float head = step(grid.y - 1.2, yPos);
      
      // Зеленый цвет матрицы
      vec3 matrixGreen = vec3(0.76, 0.56, 0.37);
      // vec3 matrixGreen = vec3(0.05, 0.9, 0.35);
      vec3 headWhite = vec3(0.8, 1.0, 0.85);

      vec3 color = mix(matrixGreen * glyph * pow(trail, 2.5), headWhite * glyph, head);

      // Цифровой шум фонового глитча
      float bgGlitch = random(uv + floor(u_time * 15.0)) * 0.05;
      color += vec3(0.0, bgGlitch, 0.0);

      // Фоновое затемнение при завершении прогресса
      vec3 finalColor = mix(color, vec3(0.005, 0.02, 0.01), p);

      // Финальная прозрачность кадра
      float finalAlpha = (1.0 - p) * u_opacity;

      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `
};

/**
 * R3F Шейдер Matrix Rain
 *
 * @param {boolean} [props.active=true] - Показывается при true, плавно уходит за fadeDuration при false.
 * @param {number} [props.duration=2.5] - Длительность анимации заставки (в секундах).
 * @param {number} [props.fadeDuration=0.7] - Длительность ухода прозрачности (в секундах) при active={false}.
 * @param {number} [props.intensity=1.0] - Скорость падения зеленых символов.
 * @param {Function} [props.onFinished] - Вызывается когда шейдер полностью исчез.
 */
export function MatrixRainScreenR3F({
                                         active = true,
                                         duration = 2.5,
                                         fadeDuration = 0.7,
                                         intensity = 1.0,
                                         onFinished,
                                    }) {
     const materialRef = useRef();
     const opacityRef = useRef(active ? 1.0 : 0.0);
     const [isVisible, setIsVisible] = useState(active);
     const { size } = useThree();

     const uniforms = useMemo(() => {
          return {
               u_time: { value: 0 },
               u_progress: { value: 0 },
               u_opacity: { value: active ? 1.0 : 0.0 },
               u_resolution: { value: new THREE.Vector2(size.width, size.height) },
               u_intensity: { value: intensity },
          };
     }, []);

     useEffect(() => {
          if (active) {
               setIsVisible(true);
          }
     }, [active]);

     useEffect(() => {
          if (materialRef.current) {
               materialRef.current.uniforms.u_resolution.value.set(size.width, size.height);
          }
     }, [size]);

     useFrame((state, delta) => {
          if (!materialRef.current) return;

          const u = materialRef.current.uniforms;
          u.u_time.value += delta;
          u.u_intensity.value = intensity;

          if (u.u_progress.value < 1.0) {
               u.u_progress.value = Math.min(1.0, u.u_progress.value + delta / duration);
          }

          // Уход прозрачности opacity от 1.0 до 0.0 за fadeDuration (0.7 сек)
          if (active) {
               if (opacityRef.current < 1.0) {
                    opacityRef.current = Math.min(1.0, opacityRef.current + delta / fadeDuration);
               }
          } else {
               if (opacityRef.current > 0.0) {
                    opacityRef.current = Math.max(0.0, opacityRef.current - delta / fadeDuration);
                    if (opacityRef.current <= 0.0) {
                         setIsVisible(false);
                         if (onFinished) onFinished();
                    }
               }
          }

          u.u_opacity.value = opacityRef.current;
     });

     if (!isVisible) return null;

     return (
          <mesh renderOrder={999}>
               <planeGeometry args={[2, 2]} />
               <shaderMaterial
                    ref={materialRef}
                    vertexShader={MatrixRainShader.vertexShader}
                    fragmentShader={MatrixRainShader.fragmentShader}
                    uniforms={uniforms}
                    transparent={true}
                    depthTest={false}
                    depthWrite={false}
               />
          </mesh>
     );
}
