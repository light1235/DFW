import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Шейдер VHS Glitch
const VHSGlitchShader = {
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

    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      vec2 uv = vUv;
      float p = clamp(u_progress, 0.0, 1.0);
      float vhsTime = u_time * 12.0;

      // Лента VHS и горизонтальный разрыв (джиттер)
      float tapeNoise = (random(vec2(floor(uv.y * 80.0), floor(vhsTime))) - 0.5) * 0.12 * (1.0 - p) * u_intensity;
      float tapeTear = smoothstep(0.48, 0.52, sin(uv.y * 6.0 + u_time * 4.0)) * 0.25 * (1.0 - p) * u_intensity;
      vec2 vhsUv = vec2(uv.x + tapeNoise + tapeTear, uv.y);

      // Цветовой сдвиг RGB (Chromatic Aberration)
      float offset = (0.02 + 0.03 * tapeTear) * (1.0 - p);
      float r = noise(vhsUv * 15.0 + vec2(offset, 0.0));
      float g = noise(vhsUv * 15.0);
      float b = noise(vhsUv * 15.0 - vec2(offset, 0.0));

      vec3 vhsColor = vec3(r * 1.3, g * 0.9, b * 1.4);

      // Трекинг линия
      float trackingLine = smoothstep(0.0, 0.08, abs(uv.y - fract(u_time * 0.2))) < 0.5 ? 0.3 : 0.0;
      vhsColor += vec3(trackingLine * 0.5);

      // CRT сканирующие линии и зернистость
      float scanlines = sin(uv.y * u_resolution.y * 0.7) * 0.15;
      float grain = (random(uv + u_time) - 0.5) * 0.15;

      vhsColor -= scanlines;
      vhsColor += grain;

      vec3 finalColor = mix(vhsColor, vec3(0.01, 0.01, 0.03), p);
      
      // Итоговая прозрачность: анимация загрузки * плавная альфа u_opacity
      float finalAlpha = (1.0 - p) * u_opacity;

      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `
};

/**
 * R3F Компонент VHS Glitch заставки без HTML и без TypeScript.
 *
 * @param {Object} props
 * @param {boolean} [props.active=true] - Если true — показывает заставку, если false — плавно растворяется до 0.
 * @param {number} [props.duration=2.5] - Длительность анимации прокрутки ленты VHS (в секундах).
 * @param {number} [props.fadeDuration=0.7] - Время плавного ухода прозрачности (в секундах) при active={false}.
 * @param {number} [props.intensity=1.0] - Интенсивность эффектов глитча.
 * @param {Function} [props.onFinished] - Вызывается после полного затухания прозрачности до 0.
 */
export function VHSScreenGlitchR3F({
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

     // Анимационный цикл React Three Fiber
     useFrame((state, delta) => {
          if (!materialRef.current) return;

          const u = materialRef.current.uniforms;
          u.u_time.value += delta;
          u.u_intensity.value = intensity;

          // 1. Прогресс ленты
          if (u.u_progress.value < 1.0) {
               u.u_progress.value = Math.min(1.0, u.u_progress.value + delta / duration);
          }

          // 2. Плавный уход прозрачности при active={false} за 0.7 сек
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
                    vertexShader={VHSGlitchShader.vertexShader}
                    fragmentShader={VHSGlitchShader.fragmentShader}
                    uniforms={uniforms}
                    transparent={true}
                    depthTest={false}
                    depthWrite={false}
               />
          </mesh>
     );
}
