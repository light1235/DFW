import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, useGLTF } from "@react-three/drei";
import ContactText from "./contact-text.jsx";
import { MathUtils } from "three";
import { ModelTruck } from "./Truck.jsx";

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






export function CameraParallax({ intensity = 0.5, factor = 0.05 }) {
     // Хранилище для исходной позиции камеры
     const initialPosition = useRef(null);

     useFrame((state) => {
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

function ModelLetter() {
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
          // Якщо навели — ставимо кастомний курсор, якщо прибрали — стандартний
          document.body.style.cursor = hovered ? "url('/cursor-mini.png'), auto" : "auto";

          // Важливо: скидаємо курсор при розмонтуванні компонента
          return () => {
               document.body.style.cursor = "auto";
          };
     }, [hovered]);

     return (
          <primitive
               object={scene}
               scale={8}
               position={[-6, 0.0, 6]}
               rotation={[0, 1, 0]}
               // Події миші
               onPointerOver={handlePointerOver}
               onPointerOut={handlePointerOut}
               onClick={handleModelClick}
          />
     );
}


const ContactScene = () => {
     const materialRef = useRef();

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
               <CameraParallax intensity={1} factor={0.05} />
               <group position={[6, 5, 12]} rotation={[-0.1, 4.9, 0]}>
                    <ContactText />
               </group>
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
               <ModelLetter
               />
               <PerspectiveCamera
                    makeDefault
                    position={CAMERA_POSITION}
                    rotation={CAMERA_ROTATION}
               />
          </>

     );
};

export default ContactScene;


