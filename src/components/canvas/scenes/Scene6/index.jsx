import React, {useRef, useMemo, useState, useEffect} from 'react';
import * as THREE from 'three';
import {useFrame, useThree} from '@react-three/fiber';
import SplineEditor from "../../CameraController.jsx";
import {ScrollCameraPath} from "../../ViewportCanvas.jsx";
import {PortalToSceneTwo} from "../Scene2/index.jsx";
import {OrbitControls, PerspectiveCamera, useGLTF} from "@react-three/drei";
import FlagText from "../Scene1/text.jsx";
import ContactText from "./contact-text.jsx";
import {MathUtils} from "three";


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
     const lightRef = useRef();
     return (
          <rectAreaLight
               ref={lightRef}
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

     useFrame(() => {
          // 1. Вычисляем точку направления взгляда (LookAt)
          camera.getWorldDirection(targetRef.current);
          const lookAtPoint = camera.position.clone().add(targetRef.current);

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

     // Проходим по всем полигонам модели и меняем их материалы
     scene.traverse((child) => {
          if (child.isMesh) {
               // Сохраняем старую текстуру, если она была
               const originalTexture = child.material.map;

               // Заменяем материал на базовый (не требующий света)
               child.material = new THREE.MeshBasicMaterial({
                    map: originalTexture,             // Возвращаем текстуру модели
                    color: child.material.color,     // Сохраняем оригинальный цвет
               });
          }
     });

     return <primitive object={scene}  scale={15} position={[0, 2.9, 0]} rotation={[0,1,0]} />;
}

function ModelLetter() {
     // Шлях вказується від папки public
     const { scene } = useGLTF('model/letter.glb');
     // Стан для відстеження наведення
     const [hovered, setHovered] = useState(false);

     // Проходимо по всіх полігонах моделі та змінюємо їхні матеріали
     scene.traverse((child) => {
          if (child.isMesh) {
               // Зберігаємо стару текстуру, якщо вона була
               const originalTexture = child.material.map;

               // Замінюємо матеріал на базовий (який не потребує світла)
               child.material = new THREE.MeshBasicMaterial({
                    map: originalTexture,             // Повертаємо текстуру моделі
                    color: child.material.color,     // Зберігаємо оригінальний колір
               });
          }
     });
     const handleModelClick = (e) => {
          e.stopPropagation(); // Запобігаємо кліку на об'єкти позаду моделі
          window.location.href = "mailto:info@doka.com";
     };
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
               onPointerOver={(e) => {
                    e.stopPropagation(); // Зупиняємо проходження променя крізь модель
                    setHovered(true);
               }}
               onPointerOut={(e) => {
                    setHovered(false);
               }}
               onClick={handleModelClick}
          />
     );
}


const Scene6 = () => {
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

     useFrame((state, delta) => {
          if (materialRef.current) {
               materialRef.current.uniforms.uTime.value += delta;
          }

     });

     const rotX = MathUtils.degToRad(-45.8)
     const rotY = MathUtils.degToRad(-54.2)
     const rotZ = MathUtils.degToRad(-39.9)

     return (
          <> return
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
               {/*<OrbitControls />*/}
               <Model />
               <ModelLetter
               />
               <PerspectiveCamera
                    makeDefault
                    position={[-26.11, 13.51, 10.96]}
                    rotation={[rotX, rotY, rotZ]}
               />
          </>

     );
};

export default Scene6;
