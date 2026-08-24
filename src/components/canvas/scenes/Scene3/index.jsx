import React, {Suspense, useEffect, useMemo, useRef, useState} from 'react';
import {
     Center,
     Clone, Html,
     OrbitControls,
     OrthographicCamera,
     PerspectiveCamera, ScrollControls,
     Stars, Text3D, useCursor,
     useGLTF,
     useTexture
} from "@react-three/drei";
import * as THREE from "three";
import {useFrame, useThree} from "@react-three/fiber";
import {MathUtils} from "three";
import { gsap } from 'gsap';
import { animate } from 'animejs';
import 'animejs/adapters/three';

import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {ModelFort} from "./model.jsx";

import FlagText from "../Scene1/text.jsx";
import TowerText from "./towerText.jsx";

// Регистрируем плагин ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

function LedLineWithRealLight() {
     return (
          <group position={[200, 202.9, -30]}>
               {/* 1. Визуальная светящаяся полоса (то, что видит камера) */}
               <mesh>
                    <boxGeometry args={[20, 0.2, 0.2]} /> {/* Длина 20 единиц */}
                    <meshBasicMaterial color={[10, 10, 10]} />
               </mesh>

               {/* 2. Настоящий физический свет, который падает вниз на сцену */}
               <rectAreaLight
                    width={20}          // Ширина источника света (должна совпадать с длиной меша)
                    height={0.5}        // Высота источника света
                    intensity={5}       // Яркость света
                    color="#ffffff"
                    position={[0, -0.2, 0]} // Смещаем чуть ниже корпуса ламп
                    rotation={[-Math.PI / 2, 0, 0]} // Разворачиваем свет строго вниз
               />
          </group>
     )
}

function LedLine({ position, rotation }) {
     return (
          <mesh position={position} rotation={rotation}>
               {/* Длинный тонкий цилиндр или вытянутый бокс */}
               <boxGeometry args={[0.4, 0.4, 8]} />

               {/*
        MeshBasicMaterial не требует внешнего света.
        Перемножение цвета в массиве [r, g, b] на число (например, 10)
        заставляет его светиться в HDR для эффекта Bloom.
      */}
               <meshBasicMaterial
                    color={[10, 10, 10]} // Сверхъяркий белый цвет
               />
          </mesh>
     )
}

function ModelHelmet() {
     // Путь указывается от папки public
     const { scene } = useGLTF('model/helmet.glb');

     // Проходим по всем полигонам модели и меняем их материалы
     scene.traverse((child) => {
          if (child.isMesh) {
               const originalTexture = child.material.map;
               child.material = new THREE.MeshBasicMaterial({
                    map: originalTexture,
                    color: child.material.color,
               });
          }
     });

     return (
          <primitive
               object={scene}
               scale={5}
               // Убираем жесткие глобальные координаты отсюда, оставляем только масштаб
               position={[0, 0, 0]}
               rotation={[0, 0, 0]}
          />
     );
}

// position={[183.5, 198.4, 23]} rotation={[0,-.6,0]}
// 202 одетая


function ModelIndustrial() {
     const { scene } = useGLTF('model/scene3/Industrial.glb');
     const alphaTexture = useTexture('model/scene3/d2.jpg');

     const materialsRef = useRef([]);
     const opsSpeed = 0.006;

     // НАСТРОЙКА ЗАДЕРЖКИ: в секундах (например, 2 секунды)
     const delayTime = 3.1;

     // Реф для хранения точного времени, когда модель загрузилась и материалы создались
     const startTimeRef = useRef(null);

     useEffect(() => {
          if (!scene) return;

          materialsRef.current = [];

          scene.traverse((child) => {
               if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    const originalTexture = child.material.map;
                    const originalColor = child.material.color;

                    const customMaterial = new THREE.MeshBasicMaterial({
                         map: originalTexture,
                         color: originalColor,
                         side: THREE.DoubleSide,
                         alphaMap: alphaTexture,
                         alphaTest: 1.0, // Исходное состояние (полностью скрыто/прозрачно)
                    });

                    child.material = customMaterial;
                    materialsRef.current.push(customMaterial);
               }
          });

          startTimeRef.current = null;

     }, [scene, alphaTexture]);

     useFrame((state) => {
          // Если модель еще не загружена или массив пуст — выходим
          if (materialsRef.current.length === 0) return;

          // Инициализируем точку отсчета при первом кадре после загрузки модели
          if (startTimeRef.current === null) {
               startTimeRef.current = state.clock.getElapsedTime();
          }

          // Считаем, сколько секунд прошло КОНКРЕТНО с момента появления модели
          const timePassedSinceLoad = state.clock.getElapsedTime() - startTimeRef.current;

          // Если время ожидания еще не прошло — блокируем выполнение анимации
          if (timePassedSinceLoad < delayTime) return;

          // Анимация проявления
          let hasUpdates = false;
          materialsRef.current.forEach((material) => {
               if (material.alphaTest > 0) {
                    material.alphaTest -= opsSpeed;
                    material.needsUpdate = true;
                    hasUpdates = true;
               }
          });

          // Оптимизация: если все материалы полностью проявились, очищаем массив,
          // чтобы useFrame больше не крутил пустой цикл каждую секунду
          if (!hasUpdates) {
               materialsRef.current = [];
          }
     });

     return <primitive object={scene} scale={10} position={[210, 193.4, 25]} rotation={[0, 1.2, 0]} />;
}

function ModelDamaged() {
     // Путь указывается от папки public
     const { scene } = useGLTF('model/scene3/Damaged- Concrete.glb');

     // Проходим по всем полигонам модели и меняем их материалы
     const alphaTexture = useTexture(
          'model/scene3/d2.jpg'
     );
     const materialsRef = useRef([]);
     const opsSpeed = 0.006;

     const delayTime = 0.1;

     // Реф для хранения точного времени, когда модель загрузилась и материалы создались
     const startTimeRef = useRef(null);

     useEffect(() => {
          if (!scene) return;

          materialsRef.current = [];

          scene.traverse((child) => {
               if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    const originalTexture = child.material.map;
                    const originalColor = child.material.color;

                    const customMaterial = new THREE.MeshBasicMaterial({
                         map: originalTexture,
                         color: originalColor,
                         side: THREE.DoubleSide,
                         alphaMap: alphaTexture,
                         alphaTest: 1.0, // Исходное состояние (полностью скрыто/прозрачно)
                    });

                    child.material = customMaterial;
                    materialsRef.current.push(customMaterial);
               }
          });

          startTimeRef.current = null;

     }, [scene, alphaTexture]);

     useFrame((state) => {
          // Если модель еще не загружена или массив пуст — выходим
          if (materialsRef.current.length === 0) return;

          // Инициализируем точку отсчета при первом кадре после загрузки модели
          if (startTimeRef.current === null) {
               startTimeRef.current = state.clock.getElapsedTime();
          }

          // Считаем, сколько секунд прошло КОНКРЕТНО с момента появления модели
          const timePassedSinceLoad = state.clock.getElapsedTime() - startTimeRef.current;

          // Если время ожидания еще не прошло — блокируем выполнение анимации
          if (timePassedSinceLoad < delayTime) return;

          // Анимация проявления
          let hasUpdates = false;
          materialsRef.current.forEach((material) => {
               if (material.alphaTest > 0) {
                    material.alphaTest -= opsSpeed;
                    material.needsUpdate = true;
                    hasUpdates = true;
               }
          });

          // Оптимизация: если все материалы полностью проявились, очищаем массив,
          // чтобы useFrame больше не крутил пустой цикл каждую секунду
          if (!hasUpdates) {
               materialsRef.current = [];
          }
     });

     return <primitive object={scene}  scale={[15,15,15]} position={[175, 195.4, -10]} rotation={[0,1,0]} />;
}

function ModelStairk() {
     // Путь указывается от папки public
     const { scene } = useGLTF('model/scene3/Stairk.glb');

     const alphaTexture = useTexture(
          'model/scene3/d2.jpg'
     );
     const materialsRef = useRef([]);
     const opsSpeed = 0.006;

     const delayTime = 2.0;

     // Реф для хранения точного времени, когда модель загрузилась и материалы создались
     const startTimeRef = useRef(null);

     useEffect(() => {
          if (!scene) return;

          materialsRef.current = [];

          scene.traverse((child) => {
               if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    const originalTexture = child.material.map;
                    const originalColor = child.material.color;

                    const customMaterial = new THREE.MeshBasicMaterial({
                         map: originalTexture,
                         color: originalColor,
                         side: THREE.DoubleSide,
                         alphaMap: alphaTexture,
                         alphaTest: 1.0, // Исходное состояние (полностью скрыто/прозрачно)
                    });

                    child.material = customMaterial;
                    materialsRef.current.push(customMaterial);
               }
          });

          startTimeRef.current = null;

     }, [scene, alphaTexture]);

     useFrame((state) => {
          // Если модель еще не загружена или массив пуст — выходим
          if (materialsRef.current.length === 0) return;

          // Инициализируем точку отсчета при первом кадре после загрузки модели
          if (startTimeRef.current === null) {
               startTimeRef.current = state.clock.getElapsedTime();
          }

          // Считаем, сколько секунд прошло КОНКРЕТНО с момента появления модели
          const timePassedSinceLoad = state.clock.getElapsedTime() - startTimeRef.current;

          // Если время ожидания еще не прошло — блокируем выполнение анимации
          if (timePassedSinceLoad < delayTime) return;

          // Анимация проявления
          let hasUpdates = false;
          materialsRef.current.forEach((material) => {
               if (material.alphaTest > 0) {
                    material.alphaTest -= opsSpeed;
                    material.needsUpdate = true;
                    hasUpdates = true;
               }
          });

          // Оптимизация: если все материалы полностью проявились, очищаем массив,
          // чтобы useFrame больше не крутил пустой цикл каждую секунду
          if (!hasUpdates) {
               materialsRef.current = [];
          }
     });

     return <primitive object={scene}  scale={11} position={[212, 195.7, 12]} rotation={[0,6,0]} />;
}

function ModelGrate() {
     // Путь указывается от папки public
     const { scene } = useGLTF('model/scene3/Grate.glb');
     const alphaTexture = useTexture(
          'model/scene3/d2.jpg'
     );

     const materialsRef = useRef([]);
     const opsSpeed = 0.006;

     const delayTime = 1.0;

     // Реф для хранения точного времени, когда модель загрузилась и материалы создались
     const startTimeRef = useRef(null);

     useEffect(() => {
          if (!scene) return;

          materialsRef.current = [];

          scene.traverse((child) => {
               if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    const originalTexture = child.material.map;
                    const originalColor = child.material.color;

                    const customMaterial = new THREE.MeshBasicMaterial({
                         map: originalTexture,
                         color: originalColor,
                         side: THREE.DoubleSide,
                         alphaMap: alphaTexture,
                         alphaTest: 1.0, // Исходное состояние (полностью скрыто/прозрачно)
                    });

                    child.material = customMaterial;
                    materialsRef.current.push(customMaterial);
               }
          });

          startTimeRef.current = null;

     }, [scene, alphaTexture]);

     useFrame((state) => {
          // Если модель еще не загружена или массив пуст — выходим
          if (materialsRef.current.length === 0) return;

          // Инициализируем точку отсчета при первом кадре после загрузки модели
          if (startTimeRef.current === null) {
               startTimeRef.current = state.clock.getElapsedTime();
          }

          // Считаем, сколько секунд прошло КОНКРЕТНО с момента появления модели
          const timePassedSinceLoad = state.clock.getElapsedTime() - startTimeRef.current;

          // Если время ожидания еще не прошло — блокируем выполнение анимации
          if (timePassedSinceLoad < delayTime) return;

          // Анимация проявления
          let hasUpdates = false;
          materialsRef.current.forEach((material) => {
               if (material.alphaTest > 0) {
                    material.alphaTest -= opsSpeed;
                    material.needsUpdate = true;
                    hasUpdates = true;
               }
          });

          // Оптимизация: если все материалы полностью проявились, очищаем массив,
          // чтобы useFrame больше не крутил пустой цикл каждую секунду
          if (!hasUpdates) {
               materialsRef.current = [];
          }
     });

     return <primitive object={scene}  scale={19} position={[191, 197.4, -15]} rotation={[0,1,0]} />;
}



function ModelBox() {
     // Путь указывается от папки public
     const { scene } = useGLTF('model/scene3/scene-box.glb');

     // Проходим по всем полигонам модели и меняем их материалы
     scene.traverse((child) => {
          if (child.isMesh) {
               // Сохраняем старую текстуру, если она была
               const originalTexture = child.material.map;
               // MeshStandardMaterial
               // Заменяем материал на базовый (не требующий света)
               child.material = new THREE.MeshStandardMaterial({
                    map: originalTexture,             // Возвращаем текстуру модели
                    color: child.material.color,     // Сохраняем оригинальный цвет
               });
          }
     });

     return <primitive object={scene}  scale={[20,17,30]} position={[200, 202.9, 0]} rotation={[0,1,0]} />;
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
useGLTF.preload('model/scene3/scene-box.glb')


export function AnimatedText({ text = "Scroll to explore    ", visible = false,size, position=[183.0, 202.77, 24.08],rotation = [
     MathUtils.degToRad(0.5),
     MathUtils.degToRad(-41.6),
     MathUtils.degToRad(0.4)
], TextGap = 0.38 } ) {
     const groupRef = useRef();
     const lettersRef = useRef([]);
     const fontPath = "/zb.json";

     const animationData = useRef(
          text.split("").map(() => ({ y: -2, opacity: 0 }))
     );

     useEffect(() => {
          if (!visible) return;

          const ctx = gsap.context(() => {
               gsap.timeline({ repeat: -1 })
                    .fromTo(animationData.current,
                         { y: -2, opacity: 0 },
                         {
                              y: 0,
                              opacity: 1,
                              duration: 1,
                              ease: "power2.out",
                              stagger: 0.05
                         }
                    )
                    .to({}, { duration: 1.5 });
          });

          return () => ctx.revert();
     }, [visible]);

     useFrame(() => {
          if (!visible) return;

          lettersRef.current.forEach((target, index) => {
               if (!target) return;
               const data = animationData.current[index];
               if (!data) return;

               target.position.y = data.y;
               const mesh = target.children[0];
               if (mesh && mesh.material) {
                    mesh.material.opacity = data.opacity;
               }
          });
     });

     const textOptions = {
          size: size,
          height: 0.2,
          curveSegments: 12,
          lineHeight: 0.7,
          letterSpacing: 0
     };

     // const rotX = MathUtils.degToRad(0.5);
     // const rotY = MathUtils.degToRad(-41.6);
     // const rotZ = MathUtils.degToRad(0.4);

     let currentXOffset = 0;
     const gap = 0.12;
     // 183.0, 202.77, 24.08
     return (
          <group ref={groupRef} visible={visible}>
               <Center position={position} rotation={rotation}>
                    {text.split("").map((char, index) => {
                         const posX = currentXOffset;
                         let charWidth = TextGap;

                         if (char === " ") charWidth = 0.25;
                         else if (char === "l" || char === "i" || char === "t") charWidth = 0.16;
                         else if (char === "m" || char === "w") charWidth = 0.55;

                         currentXOffset += charWidth + gap;

                         if (char === " ") {
                              return <group key={index} position={[posX, 0, 0]} />;
                         }

                         return (
                              <group
                                   key={index}
                                   ref={(el) => (lettersRef.current[index] = el)}
                                   position={[posX, 0, 0]}
                              >
                                   <Text3D font={fontPath} {...textOptions} position={[0, 0, 0]} >
                                        {char}
                                        <meshStandardMaterial
                                             color="#ffc280"
                                             roughness={0.3}
                                             metalness={0.1}
                                             transparent
                                             opacity={0}
                                             toneMapped={false}
                                        />
                                   </Text3D>
                              </group>
                         );
                    })}
               </Center>
          </group>
     );
}


export function OpenDoor({
                              initialOpen = false,      // Статус приоткрытости по умолчанию
                              openAngle = 0.45,        // Угол открытия в радианах (~25-30 градусов)
                              position = [0, 0, 0],
                              scale = 1,
     rotation,enter
                         }) {
     const [isOpen, setIsOpen] = useState(initialOpen);
     const [hovered, setHovered] = useState(false);
     const hingeRef = useRef();

     // Меняем курсор при наведении на дверь
     useCursor(hovered);
     const { camera } = useThree();

     // Параметры геометрии
     const doorWidth = 2;
     const doorHeight = 4;
     const doorThickness = 0.1;
     const frameThickness = 0.15;
     const frameDepth = 0.25;

     // Плавный поворот двери на каждом кадре
     useFrame((_, delta) => {
          if (hingeRef.current) {
               const targetAngle = isOpen ? openAngle : 0;
               hingeRef.current.rotation.y = THREE.MathUtils.lerp(
                    hingeRef.current.rotation.y,
                    targetAngle,
                    delta * 6 // Скорость анимации
               );
          }
     });

     return (
          <group position={position} rotation={rotation} scale={scale}>

               {/* 1. ТЕМНО-СИНИЙ ЗАДНИЙ ФОН (Внутри проема двери) */}
               <mesh position={[0, 0, -frameDepth / 2 + 0.01]}>
                    <planeGeometry args={[doorWidth, doorHeight]} />
                    {/* MeshBasicMaterial не зависит от света и дает чистый глубокий цвет */}
                    <meshBasicMaterial color="#020b26" side={THREE.DoubleSide} />
               </mesh>

               {/* Мягкий синий свет из глубины (по желанию для атмосферности) */}
               <pointLight position={[0, 0, -0.5]} color="#1d4ed8" intensity={3} distance={4} />

               {/* 2. ДВЕРНАЯ КОРОБКА (РАМА) */}
               <group>
                    {/* Левая стойка */}
                    <mesh position={[-doorWidth / 2 - frameThickness / 2, 0, 0]}>
                         <boxGeometry args={[frameThickness, doorHeight + frameThickness, frameDepth]} />
                         <meshStandardMaterial color="#1a1412" roughness={0.8} />
                    </mesh>

                    {/* Правая стойка */}
                    <mesh position={[doorWidth / 2 + frameThickness / 2, 0, 0]}>
                         <boxGeometry args={[frameThickness, doorHeight + frameThickness, frameDepth]} />
                         <meshStandardMaterial color="#1a1412" roughness={0.8} />
                    </mesh>

                    {/* Верхняя планка */}
                    <mesh position={[0, doorHeight / 2 + frameThickness / 2, 0]}>
                         <boxGeometry args={[doorWidth + frameThickness * 2, frameThickness, frameDepth]} />
                         <meshStandardMaterial color="#1a1412" roughness={0.8} />
                    </mesh>
               </group>

               {/* 3. ГРУППА-ПЕТЛЯ (Hinge) — Смещена к левому краю двери [-doorWidth / 2] */}
               <group
                    ref={hingeRef}
                    position={[-doorWidth / 2, 0, frameDepth / 2 - doorThickness / 2]}
               >
                    {/* ДВЕРНОЕ ПОЛОТНО (Смещено вправо на half-width относительно петли) */}
                    <mesh
                         position={[doorWidth / 2, 0, 0]}
                         onClick={(e) => {
                              e.stopPropagation();
                              setIsOpen(true);

                              animate(
                                   camera.position,
                                   {
                                        x:[217,224],
                                        z:[-16.70,-18],
                                        duration: 1500,
                                        delay:500,
                                        ease: 'inOutCubic',
                                        onBegin: () => {
                                             setTimeout(() => {
                                                  enter()
                                             },1500)
                                        },
                                   }
                              );
                         }}
                         /*Position: [217.74, 198.71, -16.70]*/
                         onPointerOver={(e) => {
                              e.stopPropagation();
                              setHovered(true);
                         }}
                         onPointerOut={() => setHovered(false)}
                    >
                         <boxGeometry args={[doorWidth, doorHeight, doorThickness]} />
                         <meshStandardMaterial
                              color={hovered ? '#4a3324' : '#362317'}
                              roughness={0.6}
                         />

                         {/* Дверная ручка (планка + ручка) */}
                         <mesh position={[doorWidth / 2 - 0.2, -0.1, doorThickness / 2 + 0.02]}>
                              <boxGeometry args={[0.06, 0.3, 0.02]} />
                              <meshStandardMaterial color="#c5a059" metalness={0.8} roughness={0.2} />
                         </mesh>
                         <mesh position={[doorWidth / 2 - 0.2, -0.05, doorThickness / 2 + 0.07]}>
                              <boxGeometry args={[0.04, 0.04, 0.1]} />
                              <meshStandardMaterial color="#c5a059" metalness={0.8} roughness={0.2} />
                         </mesh>
                    </mesh>
               </group>

          </group>
     );
}

const curve = new THREE.CatmullRomCurve3([
     new THREE.Vector3( 178.610, 199.770, 29.080 ),
     new THREE.Vector3( 195.557, 200.564, 1.814 ),
     new THREE.Vector3( 217.737, 198.714, -16.704 ) // Конец на 198.714
], false, 'catmullrom', 0.50);

function HelmetController({ scroll, destroy, monolith, PitScene, activeText }) {
     const modelRef = useRef();
     const isAnimated = useRef(false);
     const { camera } = useThree();

     const animData = useRef({
          x: 183.5,
          y: 210.4,
          z: 23,
          rotationY: -.6,
          progress: 0,
          isFinished: false // Флаг завершения полета
     });

     useEffect(() => {
          const removeListeners = () => {
               window.removeEventListener('wheel', handleStartAnimation);
          };

          const handleStartAnimation = () => {
               if (isAnimated.current) return;
               isAnimated.current = true;
               removeListeners();
               animData.current.progress = 0;
               animData.current.isFinished = false;

               const tl = gsap.timeline();
               tl.to(animData.current, {
                    y: 198.4,
                    duration: 1.2,
                    ease: "power2.out",
                    onComplete: () => {
                         scroll(false);
                    }
               })
                    .to(animData.current, {
                         rotationY: -.6 + Math.PI,
                         duration: 1.1,
                         ease: "power2.inOut"
                    })
                    .to(animData.current, {
                         y: 202,
                         duration: 1.0,
                         ease: "back.out(1.2)"
                    })
                    .to(animData.current, {
                         progress: 1,
                         duration: 3.5,
                         ease: "power1.inOut",
                         onUpdate: () => {
                              const p = animData.current.progress;
                              const position = curve.getPointAt(p);
                              animData.current.x = position.x;
                              animData.current.y = position.y;
                              animData.current.z = position.z;
                         },
                         onComplete: () => {
                              scroll(true);
                              activeText(true);
                              // Освобождаем камеру для сторонних аниматоров
                              animData.current.isFinished = true;
                         }
                    });
          };

          window.addEventListener('wheel', handleStartAnimation, { passive: true });

          return () => {
               removeListeners();
               gsap.killTweensOf(animData.current);
          };
     }, [scroll]);

     useFrame(() => {
          if (!modelRef.current) return;

          if (!isAnimated.current || animData.current.progress === 0) {
               modelRef.current.position.x = 183.5;
               modelRef.current.position.z = 23;
               modelRef.current.position.y = animData.current.y;
               modelRef.current.rotation.y = animData.current.rotationY;
          }

          // Выполняем управление камерой ТОЛЬКО пока полет не завершен (!isFinished)
          if (isAnimated.current && animData.current.progress > 0 && !animData.current.isFinished) {
               const p = animData.current.progress;

               const cameraPos = curve.getPointAt(p);
               camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);

               animData.current.x = cameraPos.x;
               animData.current.y = cameraPos.y + 1.43;
               animData.current.z = cameraPos.z;

               modelRef.current.position.x = animData.current.x;
               modelRef.current.position.y = animData.current.y;
               modelRef.current.position.z = animData.current.z;
               modelRef.current.rotation.y = animData.current.rotationY;

               let lookAtTarget = new THREE.Vector3();

               if (p > 0.85) {
                    const alpha = (p - 0.85) / 0.15;
                    const lineLook = curve.getPointAt(Math.min(p + 0.02, 1));
                    const rightLook = new THREE.Vector3(
                         camera.position.x + 10,
                         camera.position.y,
                         camera.position.z
                    );
                    lookAtTarget.lerpVectors(lineLook, rightLook, alpha);
               } else {
                    lookAtTarget = curve.getPointAt(Math.min(p + 0.02, 1));
               }

               lookAtTarget.y = camera.position.y;
               camera.lookAt(lookAtTarget);
          }
     });

     return (
          <group ref={modelRef}>
               <ModelHelmet />
          </group>
     );
}

// Главный экспорт компонента шлема
export function AnimatedHelmet({scroll,destroy,monolith,PitScene,activeText}) {
     return (

          <Suspense fallback={null}>
               <HelmetController activeText={activeText} PitScene={PitScene} scroll={scroll} destroy={destroy} monolith={monolith} />
          </Suspense>
     );
}

const ExcavationPitScene = ({monolith, PitScene}) => {

     const [scrollText, setScrollText] = useState(false);
     const [helmAnimation, setHelmAnimation] = useState(false);
     const [showPortal, setShowPortal] = useState(false);
     const [destroy, setDestroy] = useState(false);
     const rotX = MathUtils.degToRad(0.5)
     const rotY = MathUtils.degToRad(-41.6)
     const rotZ = MathUtils.degToRad(0.4)


     const enterToPortal = () => {
          monolith()
          PitScene(false)
     };
     // const [isHovered, setIsHovered] = useState(false);
     const [activePortalText, setActivePortalText] = useState(false);

     // const handlePointerOver = (event) => {
     //      event.stopPropagation(); // Зупиняє проходження променя (raycast) далі
     //      setIsHovered(true);
     //      document.body.style.cursor = 'pointer';
     // };
     //
     // const handlePointerOut = () => {
     //      setIsHovered(false);
     //      document.body.style.cursor = 'auto';
     // };


     return (
          <>
               <PerspectiveCamera makeDefault={true} position={[178.61, 199.77, 29.08]} fov={70} far={10000}  rotation={[rotX, rotY, rotZ]} />
               {/*<OrthographicCamera makeDefault position={[0, 0, 100]} zoom={1} />*/}
               <ambientLight intensity={2.6} />
               <directionalLight
                    position={[200, 350, 25]}
                    intensity={0.5}
               />
               <hemisphereLight
                    skyColor={"#ffffff"}
                    groundColor={"#444444"}
                    intensity={3.5}
               />
               <color attach="background" args={['#1a1a2e']} />
               {/*<OrbitControls target={[200, 200, 5]} />*/}
               {/*{showPortal &&   <mesh*/}
               {/*     onClick={enterToPortal}*/}
               {/*     onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}*/}
               {/*     name='portal'*/}
               {/*     position={[233.61, 199.77, -20.08]}*/}
               {/*     rotation={[0,3.4+ Math.PI / 2, 0]}*/}
               {/*     scale={[4, 6, 4]} // Увеличивает высоту, превращая круг в овал*/}
               {/*>*/}
               {/*     <circleGeometry args={[1, 32]} />*/}
               {/*     <meshStandardMaterial side={THREE.DoubleSide}*/}
               {/*                           color="#aaaaaa"*/}
               {/*                           // emissive="#00ffff"*/}
               {/*                           // emissiveIntensity={0.4}*/}
               {/*                           roughness={1.0}*/}
               {/*                           metalness={0.1}*/}
               {/*                           // opacity={0.1}*/}

               {/*     />*/}
               {/*</mesh> }*/}

               <ModelBox />
               <ModelFort scroll={setScrollText} helm={setHelmAnimation} destroy={destroy} portal={setShowPortal} />

               <ModelIndustrial />
               <ModelStairk />
               <ModelGrate />
               <ModelDamaged />

               <AnimatedText visible={scrollText}  size={0.5} />
               {helmAnimation &&  <AnimatedHelmet activeText={setActivePortalText} PitScene={PitScene} monolith={monolith} scroll={setScrollText} destroy={setDestroy} />}

               <group visible={activePortalText}  position={[228.61, 198.77, -22.08]} rotation={[0, 3.4 + Math.PI / 2, 0]}>
                     <TowerText active={true} />
               </group>
               <OpenDoor enter={enterToPortal}  position={[238.61, 194.77, -20.08]}
                          rotation={[0,3.4+ Math.PI / 2, 0]} openAngle={0.6} scale={2.6} />
               <LedLine position={[241.2, 212, 15]} rotation={[0, 2.6, 0]} />
               <LedLine position={[173, 212, -38]} rotation={[0, 2.6, 0]} />
               {/*<CameraLogger />*/}
               {/*631index.jsx:454 [Camera]*/}
               {/*Position: [217.74, 198.71, -16.70]*/}
               {/*Rotation (deg): [0.0, -90.0, 0.0]*/}

          </>
     );
};

export default ExcavationPitScene;


