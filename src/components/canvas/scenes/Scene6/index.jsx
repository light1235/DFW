import React, { useRef, useMemo, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, useGLTF } from "@react-three/drei";
import ContactText from "./contact-text.jsx";
import { MathUtils } from "three";
import { ModelTruck } from "./Truck.jsx";
import { useIsMobile, useIsTouch } from "../../../../hooks/useIsMobile.js";


// Сцены GLTF кешируются глобально, поэтому конвертируем материалы один раз
// и помечаем их флагом: повторный проход ничего не пересоздаёт
const BASIC_MATERIAL_FLAG = '__dfwBasicMaterial';

function toBasicMaterials(scene) {
     scene.traverse((child) => {
          if (!child.isMesh || !child.material || child.material[BASIC_MATERIAL_FLAG]) return;

          const original = child.material;
          // Заменяем материал на базовый (не требующий света)
          const params = { map: original.map ?? null };   // Возвращаем текстуру модели
          if (original.color) params.color = original.color;   // Сохраняем оригинальный цвет

          const basic = new THREE.MeshBasicMaterial(params);
          basic[BASIC_MATERIAL_FLAG] = true;
          child.material = basic;
          original.dispose();
     });
     return scene;
}

// Статичные трансформы камеры считаются один раз, а не на каждом рендере
const CAMERA_POSITION = [-26.11, 13.51, 10.96];
const CAMERA_ROTATION = [
     MathUtils.degToRad(-45.8),
     MathUtils.degToRad(-54.2),
     MathUtils.degToRad(-39.9),
];
const CAMERA_FOV = 50;

// -----------------------------------------------------------------------------
// МОБИЛЬНАЯ РАСКЛАДКА
// В портрете горизонтальный обзор сжимается, и широкая надпись «Contact too us.»
// вместе с грузовиком вылезает за кадр. Угол камеры не трогаем — он подобран под
// свет и тени. Вместо этого расширяем fov и отводим камеру назад ВДОЛЬ ЕЁ ЖЕ
// взгляда: композиция и ракурс сохраняются, просто в кадр влезает вся сцена.
// -----------------------------------------------------------------------------
const MOBILE_CAMERA_FOV = 72;
const MOBILE_CAMERA_BACK_OFFSET = 5.5;

const MOBILE_CAMERA_POSITION = (() => {
     // Направление взгляда камеры: -Z, повёрнутый её собственными углами
     const forward = new THREE.Vector3(0, 0, -1).applyEuler(
          new THREE.Euler(...CAMERA_ROTATION)
     );
     return new THREE.Vector3(...CAMERA_POSITION)
          .addScaledVector(forward, -MOBILE_CAMERA_BACK_OFFSET)
          .toArray();
})();

const TEXT_GROUP_POSITION = [6, 5, 12];
const TEXT_GROUP_ROTATION = [-0.1, 4.9, 0];

// -----------------------------------------------------------------------------
// МОБИЛЬНЫЙ ТЕКСТ
// Мировая позиция текста [6, 5, 12] рассчитана на широкий кадр: в базисе камеры
// это 15.3 единицы вправо при полукадре 23.8 (fov 50, 16:9). В портрете полукадр
// сжимается до ~11.8 — блок целиком уезжает за правый край. Сдвигать его по
// мировым осям бесполезно: у камеры roll -40°, поэтому мировое «вверх» на экране
// идёт по диагонали.
//
// Поэтому на мобильном текст перестаёт быть частью мировой сцены и вешается
// НА КАМЕРУ (children у drei PerspectiveCamera попадают в объект камеры).
// Локальные оси камеры — это оси экрана: X вправо, Y вверх, -Z вперёд. Позиция
// задаётся в долях кадра и не зависит ни от углов камеры, ни от разрешения.
// -----------------------------------------------------------------------------

// Дистанция от камеры. На видимый размер НЕ влияет: кадр расширяется
// пропорционально дистанции, а масштаб ниже считается от этого же кадра.
// Важно одно — текст должен быть перед сценой (грузовик примерно на 37).
const MOBILE_TEXT_DISTANCE = 14;

// Центр блока в долях ПОЛУкадра (0 — центр экрана, 1 — край).
// Свободная полоса в портрете — между логотипом сверху (его низ около 0.69)
// и кабиной грузовика снизу (её верх около 0.20). Ставим блок в середину.
const MOBILE_TEXT_ANCHOR_X = 0;
const MOBILE_TEXT_ANCHOR_Y = -0.7;

// Границы блока в долях ПОЛНОГО кадра. Высота 0.22 как раз укладывается в полосу
// между логотипом и грузовиком: 0.42 ± 0.22 = от 0.20 до 0.64 полукадра.
const MOBILE_TEXT_WIDTH_RATIO = 0.9;
const MOBILE_TEXT_HEIGHT_RATIO = 0.22;

// Конверт-ссылка (mailto). На мобильном это тач-таргет: делаем крупнее и
// отодвигаем от текста, чтобы палец не попадал по надписи
const LETTER_POSITION = [-6, 0.0, 6];
const LETTER_POSITION_MOBILE = [-5.2, 0.0, 7.4];
const LETTER_SCALE = 8;
const LETTER_SCALE_MOBILE = 9.5;






export function CameraParallax({ intensity = 0.5, factor = 0.05, enabled = true }) {
     // Хранилище для исходной позиции камеры
     const initialPosition = useRef(null);

     useFrame((state) => {
          // На тач-устройствах pointer «залипает» в последней точке касания и
          // камера уезжает в сторону без возврата. Параллакс от мыши там не нужен.
          if (!enabled) return;
          const { camera, pointer } = state;

          // Запоминаем начальные координаты камеры при первом кадре
          if (!initialPosition.current) {
               initialPosition.current = camera.position.clone();
          }

          // Рассчитываем целевую позицию: Исходная координата + Смещение от мыши
          const targetX = initialPosition.current.x + pointer.x * intensity;
          const targetY = initialPosition.current.y + pointer.y * intensity;

          // Плавное перемещение (lerp) к новой позиции
          camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, factor);
          camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, factor);
     });

     return null;
}

function SmartRectLight() {
     return (
          <rectAreaLight
               intensity={10}
               width={10}
               height={7}
               color={'white'}
               position={[-12, 10, 10]}
          />
     );
}

export function CameraLogger() {
     const { camera } = useThree();
     const targetRef = useRef(new THREE.Vector3());
     const lookAtRef = useRef(new THREE.Vector3());

     useFrame(() => {
          // 1. Вычисляем точку направления взгляда (LookAt)
          camera.getWorldDirection(targetRef.current);
          // Переиспользуем вектор вместо clone() на каждом кадре
          const lookAtPoint = lookAtRef.current.copy(camera.position).add(targetRef.current);

          // 2. Переводим радианы поворота камеры в градусы
          const rotX = (camera.rotation.x * (180 / Math.PI)).toFixed(1);
          const rotY = (camera.rotation.y * (180 / Math.PI)).toFixed(1);
          const rotZ = (camera.rotation.z * (180 / Math.PI)).toFixed(1);

          // 3. Выводим дебаг-информацию в консоль
          console.log(
               `[Camera] \n` +
               `Position: [${camera.position.toArray().map(n => n.toFixed(2)).join(', ')}] \n` +
               `Rotation (deg): [${rotX}, ${rotY}, ${rotZ}] \n` +
               `LookAt target: [${lookAtPoint.toArray().map(n => n.toFixed(2)).join(', ')}]`
          );
     });

     return null;
}

function Model() {
     // Путь указывается от папки public
     const { scene } = useGLTF('model/Truck.glb');

     // Проходим по всем полигонам модели и меняем их материалы (один раз, а не на каждом рендере)
     useMemo(() => toBasicMaterials(scene), [scene]);

     return <primitive object={scene} scale={15} position={[0, 2.9, 0]} rotation={[0, 1, 0]} />;
}

function ModelLetter({ isMobile = false, isTouch = false }) {
     // Шлях вказується від папки public
     const { scene } = useGLTF('model/letter.glb');
     // Стан для відстеження наведення
     const [hovered, setHovered] = useState(false);

     // Матеріали конвертуються один раз. Раніше нові MeshBasicMaterial створювались
     // на кожному рендері — тобто на кожному наведенні мишки — і текли в GPU
     useMemo(() => toBasicMaterials(scene), [scene]);

     const handleModelClick = useCallback((e) => {
          e.stopPropagation(); // Запобігаємо кліку на об'єкти позаду моделі
          window.location.href = "mailto:info@doka.com";
     }, []);
     const handlePointerOver = useCallback((e) => {
          e.stopPropagation(); // Зупиняємо проходження променя крізь модель
          setHovered(true);
     }, []);
     const handlePointerOut = useCallback(() => setHovered(false), []);
     // Ефект для зміни курсора миші
     useEffect(() => {
          // На тач-екрані курсора немає: підміна нічого не дає, але залишає
          // «залиплий» hover після тапу. Тому змінюємо курсор лише для мишки.
          if (isTouch) return;

          // Якщо навели — ставимо кастомний курсор, якщо прибрали — стандартний
          document.body.style.cursor = hovered ? "url('/cursor-mini.png'), auto" : "auto";

          // Важливо: скидаємо курсор при розмонтуванні компонента
          return () => {
               document.body.style.cursor = "auto";
          };
     }, [hovered, isTouch]);

     return (
          <primitive
               object={scene}
               scale={isMobile ? LETTER_SCALE_MOBILE : LETTER_SCALE}
               position={isMobile ? LETTER_POSITION_MOBILE : LETTER_POSITION}
               rotation={[0, 1, 0]}
               // Події миші
               onPointerOver={handlePointerOver}
               onPointerOut={handlePointerOut}
               onClick={handleModelClick}
          />
     );
}


function MobileContactText() {
     const { size } = useThree();
     
     // Высота видимой области на дистанции D: 2 * D * tan(fov / 2)
     const fovRad = THREE.MathUtils.degToRad(MOBILE_CAMERA_FOV);
     const height = 2 * MOBILE_TEXT_DISTANCE * Math.tan(fovRad / 2);
     
     // Ширина выводится через aspect ratio
     const aspect = size.width / size.height;
     const width = height * aspect;

     const x = (width / 2) * MOBILE_TEXT_ANCHOR_X;
     const y = (height / 2) * MOBILE_TEXT_ANCHOR_Y;

     return (
          <group position={[x, y, -MOBILE_TEXT_DISTANCE]}>
               <ContactText isMobile={true} />
          </group>
     );
}

const ContactScene = () => {
     const materialRef = useRef();

     // Раскладка перестраивается на смене брейкпоинта, а не на каждый пиксель ресайза
     const isMobile = useIsMobile();
     const isTouch = useIsTouch();

     // Vertex Shader
     const vertexShader = `
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    uniform float uTime;
    uniform float uDisplacementHeight;
    uniform float uDisplacementSpeed;
    uniform float uNoiseScale;

    float noise(in vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float smoothNoise(in vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(noise(i + vec2(0.0,0.0)), noise(i + vec2(1.0,0.0)), u.x),
        mix(noise(i + vec2(0.0,1.0)), noise(i + vec2(1.0,1.0)), u.x), 
        u.y
      );
    }

    float fbm(in vec2 st) {
      float value = 0.0;
      float amp = 0.5;
      vec2 p = st;
      for (int i = 0; i < 3; i++) {
        value += amp * smoothNoise(p);
        p = p * 2.0 + vec2(1.7, 9.2);
        amp *= 0.5;
      }
      return value;
    }

    void main() {
      vUv = uv;
      vec3 pos = position;

      if (uDisplacementHeight > 0.001) {
        vec2 dispUv = uv * (uNoiseScale * 0.3) + vec2(uTime * uDisplacementSpeed * 0.05);
        float disp = fbm(dispUv);
        pos.z += disp * uDisplacementHeight;
      }

      vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

     const fragmentShader = `
    uniform float uTime;
    uniform vec3 uBgColor;
    uniform vec3 uSmokeColor;
    uniform vec3 uAccentColor;
    uniform float uNoiseScale;
    uniform float uNoiseSpeed;
    uniform int uNoiseOctaves;
    uniform float uFadeStart;
    uniform float uFadeEnd;
    uniform float uSmokeOpacity;
    uniform vec2 uShaderPosition;
    uniform vec2 uVignetteScale; // 👈 1. Добавили параметр масштаба виньетки (X и Z)

    varying vec2 vUv;
    varying vec3 vWorldPosition;

    float noise(in vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float smoothNoise(in vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(noise(i + vec2(0.0,0.0)), noise(i + vec2(1.0,0.0)), u.x),
        mix(noise(i + vec2(0.0,1.0)), noise(i + vec2(1.0,1.0)), u.x), 
        u.y
      );
    }

    float fbm(in vec2 st, int octaves) {
      float value = 0.0;
      float amp = 0.5;
      vec2 p = st;
      for (int i = 0; i < 4; i++) {
        if (i >= octaves) break;
        value += amp * smoothNoise(p);
        p = p * 2.0 + vec2(4.2, 1.8);
        amp *= 0.5;
      }
      return value;
    }

    void main() {
      // 1. Анимация движения тумана
      vec2 cloudUV = vUv * uNoiseScale + vec2(uTime * uNoiseSpeed * 0.8, uTime * uNoiseSpeed * 0.4);
      
      // 2. Многооктавный FBM шум
      float smokePattern = fbm(cloudUV, uNoiseOctaves);

      // 3. 👈 Эллиптическая виньетка: делим X и Z на uVignetteScale
      vec2 localPos = (vWorldPosition.xz - uShaderPosition) / max(uVignetteScale, vec2(0.001));
      float distanceFromCenter = length(localPos);
      
      // 4. Мягкое сглаживание у краев
      float fade = smoothstep(uFadeStart, uFadeEnd, distanceFromCenter);

      // 5. Градиент тумана
      vec3 baseSmoke = mix(uSmokeColor, uAccentColor, smokePattern * 0.25);
      vec3 finalColor = mix(baseSmoke, uBgColor, fade);

      // 6. Прозрачность и гашение
      float finalAlpha = (1.0 - fade) * smokePattern * uSmokeOpacity;
      finalAlpha = clamp(finalAlpha, 0.0, 1.0);

      gl_FragColor = vec4(clamp(finalColor, 0.0, 1.5), finalAlpha);
    }
  `;

     const uniforms = useMemo(
          () => ({
               uTime: { value: 0 },
               uBgColor: { value: new THREE.Color('#090514') },
               uSmokeColor: { value: new THREE.Color('#F9EFC7') },
               // uAccentColor: { value: new THREE.Color('#f43f5e') },
               uNoiseScale: { value: 10.0 },
               uNoiseOctaves: { value: 60 },
               uDisplacementHeight: { value: 0.0 },
               uDisplacementSpeed: { value: 0.0 },
               uNoiseSpeed: { value: 0.12 },
               uFadeStart: { value: 10.0 },                        // Внутренний яркий радиус
               uFadeEnd: { value: 30.0 },                          // Внешний радиус затухания

               // 👈 ТЕПЕРЬ МОЖНО РЕГУЛИРОВАТЬ ШИРИНУ И ДЛИНУ:
               // X = 1.8 (растянуть по ширине), Z = 0.8 (сжать по длине)
               uVignetteScale: { value: new THREE.Vector2(0.8, 0.4) },

               uSmokeOpacity: { value: 0.9 },
               uShaderPosition: { value: new THREE.Vector2(5, 0) },
          }),
          []
     );

     // useFrame((state, delta) => {
     //      if (materialRef.current) {
     //           materialRef.current.uniforms.uTime.value += delta;
     //      }
     //
     // });

     return (
          <>
               <CameraParallax intensity={1} factor={0.05} enabled={!isTouch} />
               {!isMobile && (
                    <group
                         position={TEXT_GROUP_POSITION}
                         rotation={TEXT_GROUP_ROTATION}
                    >
                         <ContactText isMobile={false} />
                    </group>
               )}
               {/*<CameraLogger />*/}
               <mesh rotation={[-Math.PI / 2, 0, 0]} position={[14, 0, 0]}>
                    <planeGeometry args={[60, 60, 64, 64]} />
                    <shaderMaterial wireframe
                         ref={materialRef}
                         vertexShader={vertexShader}
                         fragmentShader={fragmentShader}
                         uniforms={uniforms}
                         transparent={true}
                         depthWrite={false}
                         side={THREE.DoubleSide}
                    />
                    <SmartRectLight />
               </mesh>
               <ModelTruck />
               <ModelLetter isMobile={isMobile} isTouch={isTouch} />
               <PerspectiveCamera
                    makeDefault
                    fov={isMobile ? MOBILE_CAMERA_FOV : CAMERA_FOV}
                    position={isMobile ? MOBILE_CAMERA_POSITION : CAMERA_POSITION}
                    rotation={CAMERA_ROTATION}
               >
                    {isMobile && <MobileContactText />}
               </PerspectiveCamera>
          </>

     );
};

export default ContactScene;


