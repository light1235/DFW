import React, {Suspense, useEffect, useMemo, useRef, useState} from 'react';
import {
     Center,
     Clone,
     OrbitControls,
     OrthographicCamera,
     PerspectiveCamera, ScrollControls,
     Stars, Text3D,
     useGLTF, useScroll,
     useTexture
} from "@react-three/drei";
import * as THREE from "three";
import {useFrame, useThree} from "@react-three/fiber";
import {MathUtils} from "three";
import {ModelFortress7} from "./model.jsx";
import {ModelFort} from "../../../Sun.jsx";
import { gsap } from 'gsap';

import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplineEditor from "../../CameraController.jsx";

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

const text = "Scroll to explore";

function AnimatedText() {
     const lettersRef = useRef([]);
     const fontPath = "/zb.json";

     const animationData = useRef(
          text.split("").map(() => ({ y: -2, opacity: 0 }))
     );

     useEffect(() => {
          const tl = gsap.timeline({ repeat: -1 });

          tl.fromTo(animationData.current,
               {
                    y: -2,
                    opacity: 0
               },
               {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    ease: "power2.out",
                    stagger: 0.05
               }
          )
               .to({}, { duration: 1.5 });

          return () => tl.kill();
     }, []);

     useFrame(() => {
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

     const letters = text.split("");
     const textOptions = {
          size: 0.5,
          height: 0.2,
          curveSegments: 12,
          lineHeight: 0.7,
          letterSpacing: 0
     };

     const rotX = MathUtils.degToRad(0.5);
     const rotY = MathUtils.degToRad(-41.6);
     const rotZ = MathUtils.degToRad(0.4);

     // =========================================================
     // НАСТРОЙКА ОТСТУПОВ МЕЖДУ БУКВАМИ
     // =========================================================
     let currentXOffset = 0;
     const gap = 0.12; // <-- Увеличьте это число (например, до 0.15), чтобы раздвинуть буквы еще сильнее

     return (
          <Center position={[183.0, 202.77, 24.08]} rotation={[rotX, rotY, rotZ]}>
               {letters.map((char, index) => {
                    const posX = currentXOffset;

                    // Базовая ширина самих символов
                    let charWidth = 0.38;

                    if (char === " ") charWidth = 0.25;
                    else if (char === "l" || char === "i" || char === "t") charWidth = 0.16;
                    else if (char === "m" || char === "w") charWidth = 0.55;

                    // Прибавляем ширину буквы И наш кастомный отступ (gap) для следующего символа
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
                              <Text3D
                                   font={fontPath}
                                   {...textOptions}
                                   position={[0, 0, 0]}
                              >
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
     );
}


const curve = new THREE.CatmullRomCurve3([
     new THREE.Vector3( 178.610, 199.770, 29.080 ),
     new THREE.Vector3( 195.557, 200.564, 1.814 ),
     new THREE.Vector3( 217.737, 198.714, -16.704 ) // Конец на 198.714
], false, 'catmullrom', 0.50);

 function HelmetController({ scroll }) {
     const modelRef = useRef();
     const isAnimated = useRef(false);
     const { camera } = useThree();

     const animData = useRef({
          x: 183.5,
          y: 210.4,       // Старт падения
          z: 23,
          rotationY: -.6,
          progress: 0
     });

     useEffect(() => {
          const removeListeners = () => {
               window.removeEventListener('wheel', handleStartAnimation);
               window.removeEventListener('click', handleStartAnimation);
          };

          const handleStartAnimation = () => {
               if (isAnimated.current) return;
               isAnimated.current = true;

               removeListeners();
               animData.current.progress = 0;
               const tl = gsap.timeline();
               // ЭТАП 1: Падение шлема с 210.4 до 198.4
               tl.to(animData.current, {
                    y: 198.4,
                    duration: 1.2,
                    ease: "power2.out",
                    onComplete: ()=> {
                         scroll(false);
                    }
               })
                    // ЭТАП 2: Разворот шлема
                    .to(animData.current, {
                         rotationY: -.6 + Math.PI,
                         duration: 1.1,
                         ease: "power2.inOut"
                    })
                    // ЭТАП 3: Подъем шлема до 202
                    .to(animData.current, {
                         y: 202,
                         duration: 1.0,
                         ease: "back.out(1.2)"
                    })
                    // ЭТАП 4: Синхронное движение по кривой сплайна
                    .to(animData.current, {
                         progress: 1,
                         duration: 3.5,
                         ease: "power1.inOut",
                         onUpdate: () => {
                              const p = animData.current.progress;

                              // Берем точку на кривой для текущего кадра
                              const position = curve.getPointAt(p);

                              // Жестко синхронизируем координаты шлема с кривой!
                              // Больше никакого разрыва по высоте (y: 202 остался на 3 этапе)
                              animData.current.x = position.x;
                              animData.current.y = position.y;
                              animData.current.z = position.z;
                         },
                         onComplete: () => {
                              scroll(true);
                         }
                    });
          };

          window.addEventListener('wheel', handleStartAnimation, { passive: true });
          window.addEventListener('click', handleStartAnimation);

          return () => {
               removeListeners();
               gsap.killTweensOf(animData.current);
          };
     }, [scroll]);


      useFrame(() => {
           if (!modelRef.current) return;

           // 1. Если анимация ещё не началась (этапы 1, 2, 3), шлем на месте
           if (!isAnimated.current || animData.current.progress === 0) {
                modelRef.current.position.x = 183.5;
                modelRef.current.position.z = 23;
                modelRef.current.position.y = animData.current.y;
                modelRef.current.rotation.y = animData.current.rotationY;
           }

           // 2. ЭТАП 4: Движение каски и камеры вдоль кривой сплайна
           if (isAnimated.current && animData.current.progress > 0) {
                const p = animData.current.progress;

                // Камера летит строго по точкам сплайна
                const cameraPos = curve.getPointAt(p);
                camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);

                // Синхронизируем координаты шлема: он летит по той же кривой,
                // но мы вручную поднимаем его на зафиксированную высоту 202 (разница 1.43 относительно старта кривой)
                animData.current.x = cameraPos.x;
                animData.current.y = cameraPos.y + 1.43; // Шлем выше камеры на 1.43 единицы
                animData.current.z = cameraPos.z;

                // Применяем координаты к шлему
                modelRef.current.position.x = animData.current.x;
                modelRef.current.position.y = animData.current.y;
                modelRef.current.position.z = animData.current.z;
                modelRef.current.rotation.y = animData.current.rotationY;

                let lookAtTarget = new THREE.Vector3();

                // Проверяем последние 15% пути для поворота
                if (p > 0.85) {
                     const alpha = (p - 0.85) / 0.15;

                     // Стандартный взгляд вперед по линии (на пару метров впереди камеры)
                     const lineLook = curve.getPointAt(Math.min(p + 0.02, 1));

                     // Поворот взгляда строго направо в финале (смещаем целевую точку вправо по оси X)
                     const rightLook = new THREE.Vector3(
                          camera.position.x + 10,
                          camera.position.y,
                          camera.position.z
                     );

                     // Плавно смешиваем взгляд от линии к направлению направо
                     lookAtTarget.lerpVectors(lineLook, rightLook, alpha);
                } else {
                     // Обычный полет: камера смотрит на пару метров вперед по направлению линии
                     lookAtTarget = curve.getPointAt(Math.min(p + 0.02, 1));
                }

                // Выравниваем высоту точки взгляда под камеру, чтобы не было наклона по вертикали
                lookAtTarget.y = camera.position.y;

                // Поворачиваем камеру к вычисленной цели
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
export function AnimatedHelmet({scroll}) {
     return (
          // Suspense гарантирует, что код анимации не выполнится раньше, чем модель полностью загрузится
          <Suspense fallback={null}>
               <HelmetController scroll={scroll} />
          </Suspense>
     );
}

const ExcavationPitScene = () => {

     const [scrollText, setScrollText] = useState(false);
     const [helmAnimation, setHelmAnimation] = useState(false);
     const [showPortal, setShowPortal] = useState(false);
     const rotX = MathUtils.degToRad(0.5)
     const rotY = MathUtils.degToRad(-41.6)
     const rotZ = MathUtils.degToRad(0.4)


     return (
          <>
               <PerspectiveCamera makeDefault position={[178.61, 199.77, 29.08]} fov={70} far={10000}  rotation={[rotX, rotY, rotZ]} />
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
               {showPortal &&   <mesh
                    name='portal'
                    position={[233.61, 199.77, -20.08]}
                    rotation={[0,3.4+ Math.PI / 2, 0]}
                    scale={[4, 6, 4]} // Увеличивает высоту, превращая круг в овал
               >
                    <circleGeometry args={[1, 32]} />
                    <meshStandardMaterial side={THREE.DoubleSide} color="aquamarine" />
               </mesh> }

               {/*<CameraLogger />*/}
               <ModelBox />
               {/*<ModelFortress />*/}
               {/*<ModelFortress7 />*/}
               <ModelFort scroll={setScrollText} helm={setHelmAnimation} portal={setShowPortal} />

               <ModelIndustrial />
               <ModelStairk />
               <ModelGrate />
               <ModelDamaged />

               {/*<AnimatedText />*/}
               {scrollText && <AnimatedText/>}
               {helmAnimation &&  <AnimatedHelmet scroll={setScrollText} />}

               {/*<ModelHelmet />*/}

               <LedLine position={[241.2, 212, 15]} rotation={[0, 2.6, 0]} />
               <LedLine position={[173, 212, -38]} rotation={[0, 2.6, 0]} />

          </>
     );
};

export default ExcavationPitScene;
// <PerspectiveCamera makeDefault position={[0, 0, 10]} />

