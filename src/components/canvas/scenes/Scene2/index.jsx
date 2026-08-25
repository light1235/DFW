import React, { useRef, useMemo, useState, useLayoutEffect, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import {
     Html,
     MeshPortalMaterial,
     OrbitControls,
     PerspectiveCamera,
     Stars, useFont,
     useGLTF,
     useMatcapTexture
} from "@react-three/drei";
import * as THREE from "three";
import { animate } from 'animejs';
import 'animejs/adapters/three';
import { AnimatedText } from "../Scene3/index.jsx";
import { useIsMobile, useIsTouch } from "../../../../hooks/useIsMobile.js";
// OPT: убраны неиспользуемые импорты Suspense и useThree.


// -----------------------------------------------------------------------------
// OPT: uniforms тора подняты на уровень модуля.
// torus анимируется только от глобального clock (не зависит от пропсов),
// tube — константа. Все экземпляры могут делить одни и те же uniform-объекты:
// запись одинакового значения из нескольких useFrame идемпотентна.
// -----------------------------------------------------------------------------
const torusUniforms = {
     torus: { value: 2.0 },
     tube: { value: 0.2 },
};

// OPT: onBeforeCompile больше не пересоздаётся.
// useMemo раньше спасал от пересоздания функции, но Three.js всё равно вызывает
// onBeforeCompile.toString() внутри дефолтного customProgramCacheKey() при
// подготовке материала — это аллокация большой строки на каждый кадр.
const handleTorusBeforeCompile = (shader) => {
     shader.uniforms.torus = torusUniforms.torus;
     shader.uniforms.tube = torusUniforms.tube;
     shader.vertexShader = `
        uniform float torus;
        uniform float tube;
        ${shader.vertexShader}
      `.replace(
          `#include <begin_vertex>`,
          `#include <begin_vertex>
        vec2 normalizedRadius = normalize(position.xy);
        vec3 nominalCenter = vec3(normalizedRadius * 2., 0.);
        vec3 dirFromNominalCenter = normalize(position - nominalCenter);
        vec3 tubeCenter = vec3(normalizedRadius * torus, 0.);
        vec3 tubeRadius = dirFromNominalCenter * tube;
        transformed = tubeCenter + tubeRadius;`
     );
};

// OPT: константный cache key вместо toString() модифицирующей функции.
const torusProgramCacheKey = () => 'animated-torus-scene2';

// OPT: args вынесены из JSX — инлайн-массив заставлял R3F пересобирать
// TorusGeometry (36 * 72 сегментов) на каждом рендере.
const TORUS_ARGS = [2, 1, 36, 72];

export function AnimatedTorus({ scale = 0.5, position = [0, 0, 0], rotation = [0, 0, 0] }) {
     // OPT: убран неиспользуемый meshRef.
     useFrame((state) => {
          const t = (state.clock.getElapsedTime() % 2) / 2;
          torusUniforms.torus.value = THREE.MathUtils.lerp(2, 3.3, t);
     });

     return (
          <mesh scale={scale} position={position} rotation={rotation}>
               <torusGeometry args={TORUS_ARGS} />
               <meshLambertMaterial
                    color="lightyellow"
                    onBeforeCompile={handleTorusBeforeCompile}
                    customProgramCacheKey={torusProgramCacheKey}
               />
          </mesh>
     );
}

const MODELS_DATA = [
     {
          id: 0,
          url: '/model/scene2/Prop.glb',
          position: [-2.4, -1.2, 5.2],
          rotation: [1 + Math.PI / 2, 0, 1 + Math.PI / 2],
          scale: 1.5,
          annotation: {
               title: 'Doka Eurex',
               material: 'High-strength steel. The entire structure is hot-dip galvanized.',
               construction: 'Telescopic tubular structure with through-hole adjustment (jack stand)',
               load: 'Increased load-bearing capacity (load-bearing class EN 1065). The Eurex 20 series posts are guaranteed to withstand a load of at least 20 kN.'
          }
     },
     {
          id: 1,
          url: '/model/scene2/Impossible.glb',
          position: [3, -1, 4.5],
          rotation: [6.4 + Math.PI / 20, 5 + Math.PI / 24, 4.8 + Math.PI / 2],
          scale: 1.5,
          annotation: {
               title: 'Doka Dokaflex',
               material: 'Galvanized high-strength steel (Doka Eurex telescopic props and tripods) combined with glued-laminated timber',
               construction: 'A modular beam-and-column structure with variable geometry.',
               load: 'The pressure of fresh concrete and the weight of the rebar create a force ranging from 25 to 50 kN/m², depending on the thickness of the stair’s load-bearing slab (“flight”)'
          }
     },
     {
          id: 2,
          url: '/model/scene2/Concrete.glb',
          position: [2, 1, 4.5],
          rotation: [5.2 + Math.PI / 2, 5.2 + Math.PI / 2, 5 + Math.PI / 2],
          scale: 1.5,
          annotation: {
               title: 'Doka Coffer Forms',
               material: 'High-strength, heat-resistant ABS plastic or polypropylene',
               construction: ' A modular, collapsible system with void formers.',
               load: 'on average, from 30 to 60 kN/m² in the area of the load-bearing beams (ribs)'
          }
     },
     {
          id: 3,
          url: '/model/scene2/Wall.glb',
          position: [-2.8, 0.9, 5.5],
          rotation: [0.4, 4.2, 0],
          scale: 1.2,
          annotation: {
               title: 'Alu-Framax Xlife',
               material: 'Heavy-gauge, high-strength steel, galvanized inside and out, with a powder-coated finish',
               construction: 'Modular large-panel frame formwork',
               load: 'Designed to withstand the total hydrostatic pressure of fresh concrete mix over the entire height of the formwork—up to 80 kN/m²'
          }
     },
     {
          id: 4,
          url: '/model/scene2/Column.glb',
          position: [-1.5, 1, 4.5],
          rotation: [0.5, 1 + Math.PI / 2, 0.2],
          scale: 1.5,
          annotation: {
               title: 'DokaXlight',
               material: 'High-strength, lightweight aluminum alloy with a protective powder coating.',
               construction: ' Small-panel, frame-type modular formwork for manual assembly (Handset Formwork)',
               load: 'The maximum allowable pressure for fresh concrete mix is up to 50 kN/m² for vertical structures (walls and columns)'
          }
     }
];

// -----------------------------------------------------------------------------
// МОБИЛЬНАЯ РАСКЛАДКА
//
// Десктопная расстановка развёрнута ПО ГОРИЗОНТАЛИ: x от -2.8 до 3.
// Это работает только при широком экране, потому что fov в three.js —
// вертикальный, а горизонтальный обзор равен fov * aspect.
//
// Считаем, что реально видно на телефоне (390x844, aspect ≈ 0.46).
// Камера портала стоит на z = 10, модели на z ≈ 4.5..5.5, то есть до них
// примерно 5 единиц. При fov 50:
//     полувысота = tan(25°) * 5   ≈ 2.33
//     полуширина = 2.33 * 0.46    ≈ 1.07
// То есть по горизонтали в кадр влезает полоса шириной ~2.1 единицы,
// а модели расставлены на 5.8. В портрете за кадром оказываются ВСЕ ПЯТЬ.
//
// Расширить fov до нужных ~120° нельзя — это карикатурная перспектива.
// Зато в портрете есть то, чего нет на десктопе: запас по вертикали
// (полувысота 2.33 против полуширины 1.07, то есть более чем вдвое).
// Поэтому раскладка переворачивается: вместо горизонтального ряда —
// вертикальный зигзаг в две узкие колонки.
//
// Проверка на итоговых мобильных параметрах (fov 64, камера z = 13,
// модели z = 5, то есть расстояние 8):
//     полувысота = tan(32°) * 8        ≈ 5.00
//     полуширина = 5.00 * 0.46         ≈ 2.31
// Крайние модели: |x| 0.9 + радиус ~0.8 = 1.7 < 2.31   ✓
//                 |y| 3.2 + радиус ~0.8 = 4.0 < 5.00   ✓
// Ближайшие соседи разнесены на sqrt(1.8² + 1.6²) ≈ 2.41 при нужных
// 1.6 (два радиуса) — не перекрываются.
// -----------------------------------------------------------------------------
const MOBILE_LAYOUT = {
     0: [-0.9, -3.2, 5.0],
     1: [0.9, -1.6, 5.0],
     2: [-0.9, 0.0, 5.0],
     3: [0.9, 1.6, 5.0],
     4: [-0.9, 3.2, 5.0],
};

// Аннотации и модели те же — меняются только координаты.
const MODELS_DATA_MOBILE = MODELS_DATA.map((m) => ({
     ...m,
     position: MOBILE_LAYOUT[m.id] ?? m.position,
}));

// ПРИМЕЧАНИЕ: сознательно НЕ делаем useGLTF.preload на уровне модуля.
// Этот файл импортируется на старте приложения, а видна первой Scene1 —
// предзагрузка 5 GLB отняла бы трафик у ассетов первого экрана.
// Если нужен прогрев, его стоит запускать по факту показа портала.

// OPT: React.memo — раньше каждое изменение activeId в LabScene ре-рендерило
// ВСЕ 5 моделей (включая те, у которых isActive не менялся).
export const InteractiveModel = React.memo(function InteractiveModel({ config, isActive, onClick }) {
     const { scene } = useGLTF(config.url);
     const [matcapTexture] = useMatcapTexture('9B9994_E1E0DB_474643_544C4C', 1024);

     const floatGroupRef = useRef();
     const spinGroupRef = useRef();
     const scaleGroupRef = useRef();
     const currentOffsetY = useRef(0);

     // 1. Изоляция сцены для предотвращения конфликтов GLTF-кэша
     const clonedScene = useMemo(() => scene.clone(true), [scene]);

     const matcapMaterial = useMemo(() => {
          return new THREE.MeshMatcapMaterial({ matcap: matcapTexture });
     }, [matcapTexture]);

     // OPT: материал создаётся через new, значит его нужно освобождать вручную.
     // Геометрии остаются общими с закешированным оригиналом GLTF (clone их
     // переиспользует), поэтому их трогать нельзя — только материал.
     useEffect(() => {
          return () => matcapMaterial.dispose();
     }, [matcapMaterial]);

     // 2. Применение материала через useLayoutEffect
     useLayoutEffect(() => {
          clonedScene.traverse((child) => {
               if (child.isMesh) {
                    child.material = matcapMaterial;
               }
          });
     }, [clonedScene, matcapMaterial]);

     const floatParams = useMemo(() => ({
          speed: 1.1 + (config.id * 0.37) % 0.8,
          phase: config.id * 2.15,
          amplitude: 0.12 + (config.id * 0.07) % 0.15
     }), [config.id]);

     useFrame((state, delta) => {
          const safeDelta = Math.min(delta, 0.1);
          const t = state.clock.getElapsedTime();

          // Остановка плавания при активном состоянии
          const targetOffsetY = isActive
               ? 0
               : Math.sin(t * floatParams.speed + floatParams.phase) * floatParams.amplitude;

          currentOffsetY.current = THREE.MathUtils.lerp(currentOffsetY.current, targetOffsetY, safeDelta * 4);

          if (floatGroupRef.current) {
               floatGroupRef.current.position.y = currentOffsetY.current;
          }

          // Анимация вращения вокруг своей оси при активности
          if (spinGroupRef.current && isActive) {
               spinGroupRef.current.rotation.y += safeDelta * 0.6;
          }

          // Плавное масштабирование активного объекта
          if (scaleGroupRef.current) {
               const targetScale = isActive ? config.scale * 1.15 : config.scale;
               const currentScale = scaleGroupRef.current.scale.x;
               const lerpedScale = THREE.MathUtils.lerp(currentScale, targetScale, safeDelta * 6);
               scaleGroupRef.current.scale.setScalar(lerpedScale);
          }
     });

     // OPT: обработчик клика стабилизирован, чтобы memo выше не сбрасывался.
     const handleClick = useCallback((e) => {
          e.stopPropagation();
          onClick(config.id);
     }, [onClick, config.id]);

     // OPT: удалены handlePointerOver / handlePointerOut — они объявлялись,
     // но ни к одному элементу не подключались (мёртвый код).

     return (
          // Базовая статическая позиция из конфига
          <group position={config.position} >
               {/* Группа для плавного плавания по Y */}
               <group ref={floatGroupRef}>
                    {/* Группа для поворота и масштабирования */}
                    <group rotation={config.rotation}>
                         <group ref={scaleGroupRef}>
                              <group ref={spinGroupRef} onClick={handleClick}>
                                   <primitive object={clonedScene} />
                              </group>
                         </group>
                    </group>
               </group>
          </group>
     );
});

// -----------------------------------------------------------------------------
// OPT: цели камеры считаются один раз на уровне модуля.
// Раньше в useFrame был MODELS_DATA.find(...) — линейный поиск с созданием
// замыкания каждый кадр. Математика та же: target = позиция модели,
// позиция камеры = та же точка со смещением z + 3.
// -----------------------------------------------------------------------------
const buildCameraTargets = (models, zOffset) =>
     new Map(
          models.map((m) => [
               m.id,
               {
                    target: new THREE.Vector3(m.position[0], m.position[1], m.position[2]),
                    camPos: new THREE.Vector3(m.position[0], m.position[1], m.position[2] + zOffset),
               },
          ])
     );

const MODEL_CAMERA_TARGETS = buildCameraTargets(MODELS_DATA, 3);

// На мобильном камера подходит к модели не на 3, а на 4.5 единицы.
// Причина та же — узкая полуширина кадра. При fov 64 и расстоянии 3
// полуширина = tan(32°) * 3 * 0.46 ≈ 0.87, а радиус модели ~0.8:
// объект впритык упирался бы в боковые края. На 4.5 полуширина ≈ 1.30,
// и модель занимает ~60% ширины — остаётся воздух и место для панели.
const MODEL_CAMERA_TARGETS_MOBILE = buildCameraTargets(MODELS_DATA_MOBILE, 4.5);

const DEFAULT_CAM_POS = new THREE.Vector3(0, 0, 10);
// Обзорная точка отодвинута: вертикальная колонка выше, чем был ряд.
const DEFAULT_CAM_POS_MOBILE = new THREE.Vector3(0, 0, 13);
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

function CameraRig({ activeId, controlsRef, isMobile }) {
     useFrame((state, delta) => {
          if (!controlsRef.current) return;

          // OPT: вместо двух dummy-векторов и find() — прямой доступ к
          // заранее посчитанным целям.
          const targets = isMobile ? MODEL_CAMERA_TARGETS_MOBILE : MODEL_CAMERA_TARGETS;
          const entry = activeId !== null ? targets.get(activeId) : null;
          const targetVec = entry ? entry.target : DEFAULT_TARGET;
          const camVec = entry ? entry.camPos : (isMobile ? DEFAULT_CAM_POS_MOBILE : DEFAULT_CAM_POS);

          state.camera.position.lerp(camVec, delta * 4);
          controlsRef.current.target.lerp(targetVec, delta * 4);
          controlsRef.current.update();
     });

     return null;
}

// OPT: константы конвейера подняты из тела компонента.
const BELT_WIDTH = 1.8;
const BELT_LENGTH = 24;
const BELT_SEGMENTS_Y = 120;
const BELT_ROTATION = [-Math.PI / 2.2, 0, 0];
const BELT_POSITION = [0, 0, 0];
const BELT_IMG_SOURCES = ['/draw/1.jpg', '/draw/2.jpg', '/draw/3.jpg', '/draw/4.jpg', '/draw/5.jpg'];

export function ConveyorBelt() {
     const materialRef = useRef();

     const canvasTexture = useMemo(() => {
          const canvas = document.createElement('canvas');
          const imageHeight = 1024;

          canvas.width = 1024;
          canvas.height = imageHeight * BELT_IMG_SOURCES.length;
          const ctx = canvas.getContext('2d');

          const texture = new THREE.CanvasTexture(canvas);
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;

          BELT_IMG_SOURCES.forEach((src, index) => {
               const img = new Image();
               img.onload = () => {
                    ctx.drawImage(img, 0, index * imageHeight, 1024, imageHeight);
                    texture.needsUpdate = true;
               };
               // OPT: src присваивается после onload — иначе для картинки из
               // кеша событие могло сработать до навешивания обработчика.
               img.src = src;
          });

          return texture;
     }, []);

     const geometry = useMemo(() => {
          const geo = new THREE.PlaneGeometry(BELT_WIDTH, BELT_LENGTH, 1, BELT_SEGMENTS_Y);
          const position = geo.attributes.position;
          const radius = 1.5;
          const halfLength = BELT_LENGTH / 2;
          const straightLength = halfLength - radius;

          for (let i = 0; i < position.count; i++) {
               let y = position.getY(i);
               let z = position.getZ(i);

               if (y > straightLength) {
                    const angle = ((y - straightLength) / radius) * (Math.PI / 1.2);
                    position.setY(i, straightLength + Math.sin(angle) * radius);
                    position.setZ(i, z - (radius - Math.cos(angle) * radius));
               } else if (y < -straightLength) {
                    const angle = ((-y - straightLength) / radius) * (Math.PI / 1.2);
                    position.setY(i, -(straightLength + Math.sin(angle) * radius));
                    position.setZ(i, z - (radius - Math.cos(angle) * radius));
               }
          }

          geo.computeVertexNormals();
          return geo;
     }, []);

     // OPT: геометрия и текстура создаются вручную (new), значит R3F их
     // автоматически не освобождает — при закрытии портала утекала бы GPU-память.
     useEffect(() => {
          return () => {
               geometry.dispose();
               canvasTexture.dispose();
          };
     }, [geometry, canvasTexture]);

     useFrame((_, delta) => {
          if (materialRef.current && materialRef.current.map) {
               materialRef.current.map.offset.y += delta * 0.04;
          }
     });

     return (
          <mesh geometry={geometry} rotation={BELT_ROTATION} position={BELT_POSITION}>
               <meshStandardMaterial ref={materialRef} map={canvasTexture} side={THREE.DoubleSide} roughness={0.2} />
          </mesh>
     );
}

// -----------------------------------------------------------------------------
// OPT: стили HTML-аннотации подняты на уровень модуля.
// Раньше это были три новых объекта на каждый рендер LabScene, из-за чего
// React каждый раз считал inline-стили изменившимися.
// -----------------------------------------------------------------------------
const PANEL_STYLE = {
     position: 'relative',
     background: 'white',
     backdropFilter: 'blur(8px)',
     border: '1px solid #A1A1A4',
     borderRadius: '8px',
     padding: '10px 12px 10px 28px',
     color: '#A1A1A4',
     width: '240px',
     fontFamily: 'Space Grotesk',
     fontSize: '7.7px',
     lineHeight: '1.4',
     pointerEvents: 'auto',
     boxShadow: '12px 8px 32px rgba(0,0,0,0.5)'
};

const BACK_BUTTON_STYLE = {
     position: 'absolute',
     left: '8px',
     top: '8px',
     background: 'none',
     border: 'none',
     cursor: 'pointer',
     padding: 0,
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'center'
};

const PANEL_TITLE_STYLE = { fontWeight: 'bold', marginBottom: '5px', color: '#0088cc', fontSize: '8.4px' };
const PANEL_P_STYLE = { margin: '0 0 5px 0' };
const PANEL_P_LAST_STYLE = { margin: '0' };

// -----------------------------------------------------------------------------
// Мобильные стили панели.
//
// Html с distanceFactor масштабирует DOM так (drei, objectScale):
//     scale = distanceFactor / (2 * tan(fov/2) * dist)
//
// На мобильном фокусе fov = 64, камера отстоит от модели на 4.5, панель
// смещена на 2.2 вниз, то есть dist = sqrt(4.5² + 2.2²) ≈ 5.01.
// Делитель = 2 * tan(32°) * 5.01 ≈ 6.26.
//
// Полная ширина панели с мобильными отступами = 240 + 12 + 36 = 288px.
//     distanceFactor 10 → scale 1.60 → 460px. Шире любого телефона.
//     distanceFactor 8  → scale 1.28 → 369px. Всё ещё не влезает в 360px.
//     distanceFactor 7  → scale 1.12 → 322px. Влезает и в 360px.
// Поэтому 7. Кегль при этом 9.5 * 1.12 ≈ 10.6px — на грани, но читаемо;
// поднимать больше нельзя, панель тут же перестанет влезать по ширине.
// -----------------------------------------------------------------------------
const PANEL_DISTANCE_FACTOR_MOBILE = 7;

const PANEL_STYLE_MOBILE = {
     ...PANEL_STYLE,
     fontSize: '9.5px',
     borderRadius: '10px',
     // Слева освобождено место под увеличенную кнопку «назад».
     padding: '12px 12px 12px 36px',
};

// Иконка 12x12 без padding — это зона нажатия ~20px после масштабирования,
// вдвое меньше минимальных 44px для пальца. Здесь она доводится до нормы.
const BACK_BUTTON_STYLE_MOBILE = {
     ...BACK_BUTTON_STYLE,
     left: '4px',
     top: '4px',
     padding: '6px',
     minWidth: '28px',
     minHeight: '28px',
     touchAction: 'manipulation',
};

const PANEL_TITLE_STYLE_MOBILE = { ...PANEL_TITLE_STYLE, fontSize: '10.4px', marginBottom: '6px' };

// OPT: трансформы и args декоративных мешей подняты из JSX.
const TORUS_SCALE = [0.15, 0.15, 0.03];
const TORUS_ROTATION = [Math.PI / 2, 0, 0];
const GLOW_POSITION = [0, -0.5, -45];
const GLOW_ARGS = [18, 32];
const RING_POSITION = [0, -0.5, -44];
const RING_ARGS = [10, 10.3, 32];
const FOG_ARGS = ['#031427', 10, 55];
const BG_ARGS = ['#1a1a2e'];
const DIR_LIGHT_POSITION = [5, 5, 5];
const TEXT_POSITION = [-0.3, 5.9, -6.1];
const TEXT_ROTATION = [0, 0, 0];

// Подсказка выхода. Текст лежит на z = -6.1, камера на z = 13, то есть до
// него ~19 единиц. Полуширина кадра там = tan(32°) * 19.1 * 0.46 ≈ 5.5.
// «Scroll to next » при TextGap 0.48 — это ~7.2 единицы, и в портрете
// фраза не влезает по ширине. Плюс сама формулировка неверна: колеса на
// телефоне нет. Короткое «Swipe up» — 8 знаков, ~3.8 единицы, влезает
// с запасом при любой трактовке выравнивания.
const HINT_TEXT_DESKTOP = 'Scroll to next ';
const HINT_TEXT_MOBILE = 'Swipe up';

// Порог свайпа в пикселях. 70px — заметно больше случайного дрожания
// пальца при тапе (обычно < 10px), но меньше половины экрана, чтобы
// жест не требовал протяжки через весь телефон.
const SWIPE_THRESHOLD = 70;


const LabScene = ({ orbit, animated, portalCamera, orbitChange, transition, blend, camera }) => {
     const [activeId, setActiveId] = useState(2);
     const [cameraFocusId, setCameraFocusId] = useState(null);
     const controlsRef = useRef();

     const isMobile = useIsMobile();
     const isTouch = useIsTouch();

     const models = isMobile ? MODELS_DATA_MOBILE : MODELS_DATA;

     // OPT: useCallback — иначе новая функция на каждый рендер сбрасывала
     // React.memo у всех InteractiveModel.
     const handleModelClick = useCallback((id) => {
          setActiveId((prev) => (prev === id ? null : id));
          setCameraFocusId((prev) => (prev === id ? null : id));
     }, []);

     const handleBack = useCallback((e) => {
          e.stopPropagation();
          setActiveId(null);
          setCameraFocusId(null);
     }, []);

     const activeModelData = useMemo(() => {
          return models.find((m) => m.id === activeId);
     }, [models, activeId]);

     // OPT: позиции, зависящие от активной модели, мемоизированы —
     // раньше это были новые массивы на каждый рендер.
     const torusPosition = useMemo(() => {
          if (!activeModelData) return null;
          return [
               activeModelData.position[0],
               activeModelData.position[1] - 1.0,
               activeModelData.position[2]
          ];
     }, [activeModelData]);

     // Панель сбоку (+1.2 по x) на телефоне уезжает за кадр: полуширина
     // кадра в фокусе ≈ 1.30, а сама панель ≈ 1.1 в мировых единицах —
     // сдвинутая вправо, она обрезается. Поэтому в мобильной раскладке
     // панель уходит ПОД модель, где есть вертикальный запас.
     //
     // Смещение -2.2 подобрано под соседей по вертикали. Тор-подсветка
     // висит на -1.0 и при scale 0.15 от радиуса 3 достаёт до -1.45.
     // Панель высотой ~146px при scale 1.118 занимает ~163px, а 1 единица
     // мира на этой дистанции ≈ 150px, значит её полувысота ≈ 0.54:
     // от -1.66 до -2.74. Сверху зазор 0.21 до тора, снизу 0.39 до края
     // кадра (полувысота tan(32°) * 5.01 ≈ 3.13). Обе величины проверены
     // расчётом, а не на глаз.
     const htmlPosition = useMemo(() => {
          if (!activeModelData) return null;
          if (isMobile) {
               return [
                    activeModelData.position[0],
                    activeModelData.position[1] - 2.2,
                    activeModelData.position[2]
               ];
          }
          return [
               activeModelData.position[0] + 1.2,
               activeModelData.position[1] + 0.5,
               activeModelData.position[2]
          ];
     }, [activeModelData, isMobile]);

     // -------------------------------------------------------------------------
     // OPT / BUGFIX: раньше window.addEventListener('wheel', ...) вызывался
     // прямо в теле рендера. Это добавляло НОВЫЙ слушатель на каждый рендер
     // (функция каждый раз новая, поэтому дедупликация браузера не работала)
     // и ни один из них не снимался при анмаунте.
     // На первом же скролле срабатывали ВСЕ накопленные слушатели сразу:
     // animate() запускался несколько раз на одном и том же объекте, а
     // transition() вызывался столько же раз. Теперь эффект с очисткой
     // плюс защита от повторного запуска — анимация стартует ровно один раз.
     //
     // ГЛАВНАЯ МОБИЛЬНАЯ ПОЧИНКА: выход из сцены висел ТОЛЬКО на 'wheel'.
     // Тач-устройства это событие не генерируют вообще — палец на экране
     // даёт touchstart/touchmove/touchend. То есть на телефоне сцена была
     // ловушкой: попав внутрь портала, уйти дальше было невозможно, весь
     // остальной сайт становился недостижим. Теперь тот же самый переход
     // запускает вертикальный свайп — жестовый аналог прокрутки колесом.
     // -------------------------------------------------------------------------
     const hasStartedRef = useRef(false);
     const transitionTimeoutRef = useRef(null);

     useEffect(() => {
          if (!animated) return;

          // Стартовая точка анимации должна совпадать с фактическим
          // положением камеры, иначе кадр «прыгает». На мобильном обзорная
          // точка отодвинута до z = 13, поэтому и здесь она же.
          const startZ = isMobile ? DEFAULT_CAM_POS_MOBILE.z : DEFAULT_CAM_POS.z;

          const handleStartAnimation = () => {
               if (hasStartedRef.current) return;
               hasStartedRef.current = true;

               orbitChange(false);
               animate(portalCamera.current.position, {
                    z: [startZ, -3],
                    y: [0, 1.5],
                    duration: 3000,
                    alternate: true,
                    ease: 'inExpo',
                    onBegin: () => {
                         transitionTimeoutRef.current = setTimeout(() => {
                              blend(0);
                              camera(false);
                              orbitChange(false);
                              transition();
                         }, 2700);
                    },
               });
          };

          window.addEventListener('wheel', handleStartAnimation, { passive: true, once: true });

          // Свайп отслеживается вручную: у touch нет события «прокрутки»,
          // а сама страница не скроллится (канвас на весь экран).
          let startY = null;
          let startX = null;

          const onTouchStart = (e) => {
               const t = e.touches[0];
               if (!t) return;
               startY = t.clientY;
               startX = t.clientX;
          };

          const onTouchMove = (e) => {
               if (startY === null) return;
               const t = e.touches[0];
               if (!t) return;

               const dy = startY - t.clientY;
               const dx = Math.abs(t.clientX - startX);

               // Требуем именно вертикальный жест: горизонтальные протяжки
               // остаются за интерфейсом и не выкидывают из сцены случайно.
               if (dy > SWIPE_THRESHOLD && dy > dx) {
                    startY = null;
                    handleStartAnimation();
               }
          };

          const onTouchEnd = () => {
               startY = null;
               startX = null;
          };

          window.addEventListener('touchstart', onTouchStart, { passive: true });
          window.addEventListener('touchmove', onTouchMove, { passive: true });
          window.addEventListener('touchend', onTouchEnd, { passive: true });
          window.addEventListener('touchcancel', onTouchEnd, { passive: true });

          return () => {
               window.removeEventListener('wheel', handleStartAnimation);
               window.removeEventListener('touchstart', onTouchStart);
               window.removeEventListener('touchmove', onTouchMove);
               window.removeEventListener('touchend', onTouchEnd);
               window.removeEventListener('touchcancel', onTouchEnd);
          };
     }, [animated, orbitChange, portalCamera, blend, camera, transition, isMobile]);

     // OPT: таймер снимается при анмаунте, чтобы не дёргать колбэки
     // уже размонтированной сцены.
     useEffect(() => {
          return () => {
               if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
          };
     }, []);

     return (
          <>
               <ambientLight intensity={1.5} />
               <directionalLight position={DIR_LIGHT_POSITION} intensity={2} />
               <color attach="background" args={BG_ARGS} />

               {models.map((config) => (
                    <InteractiveModel
                         key={config.id}
                         config={config}
                         isActive={activeId === config.id}
                         onClick={handleModelClick}
                    />
               ))}

               {activeModelData && (
                    <>
                         <AnimatedTorus
                              scale={TORUS_SCALE}
                              position={torusPosition}
                              rotation={TORUS_ROTATION}
                         />

                         {orbit && (
                              <Html
                                   position={htmlPosition}
                                   center
                                   distanceFactor={isMobile ? PANEL_DISTANCE_FACTOR_MOBILE : 10}
                              >
                                   <div style={isMobile ? PANEL_STYLE_MOBILE : PANEL_STYLE}>
                                        <button
                                             onClick={handleBack}
                                             style={isMobile ? BACK_BUTTON_STYLE_MOBILE : BACK_BUTTON_STYLE}
                                             title="Back"
                                        >
                                             <svg width={isMobile ? '16' : '12'} height={isMobile ? '16' : '12'} viewBox="0 0 24 24" fill="none" stroke="#0088cc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                  <path d="M19 12H5" />
                                                  <path d="M12 19l-7-7 7-7" />
                                             </svg>
                                        </button>
                                        <div style={isMobile ? PANEL_TITLE_STYLE_MOBILE : PANEL_TITLE_STYLE}>
                                             {activeModelData.annotation.title}
                                        </div>
                                        <p style={PANEL_P_STYLE}>
                                             <strong>Material:</strong> {activeModelData.annotation.material}
                                        </p>
                                        <p style={PANEL_P_STYLE}>
                                             <strong>Construction type:</strong> {activeModelData.annotation.construction}
                                        </p>
                                        <p style={PANEL_P_LAST_STYLE}>
                                             <strong>Load:</strong> {activeModelData.annotation.load}
                                        </p>
                                   </div>
                              </Html>
                         )}
                    </>
               )}

               <Stars radius={100} depth={50} count={5000} factor={4} saturation={2} fade speed={3} />
               <CameraRig activeId={cameraFocusId} controlsRef={controlsRef} isMobile={isMobile} />
               {orbit && (
                    <OrbitControls
                         ref={controlsRef}
                         /* Панорамирование на телефоне — способ потерять сцену:
                            вернуть камеру обратно нечем, а вся раскладка
                            построена вокруг центра. Вращение и пинч остаются. */
                         enablePan={!isTouch}
                         /* Палец проходит больше пикселей, чем мышь, поэтому
                            при той же чувствительности сцена «улетает». */
                         rotateSpeed={isTouch ? 0.6 : 1}
                    />
               )}
               <ConveyorBelt />

               <mesh position={GLOW_POSITION}>
                    <circleGeometry args={GLOW_ARGS} />
                    <meshBasicMaterial
                         color="#0088cc"
                         transparent={true}
                         opacity={0.35}
                         blending={THREE.AdditiveBlending}
                         depthWrite={false}
                    />
               </mesh>

               <mesh position={RING_POSITION}>
                    <ringGeometry args={RING_ARGS} />
                    <meshBasicMaterial color={'black'} transparent opacity={0.4} />
               </mesh>
               <AnimatedText visible={animated} size={0.6} position={TEXT_POSITION} text={isTouch ? HINT_TEXT_MOBILE : HINT_TEXT_DESKTOP} rotation={TEXT_ROTATION} TextGap={0.48} />

               <fog attach="fog" args={FOG_ARGS} />
          </>
     );
};
export default LabScene;
useFont.preload('/zb.json');

// OPT: трансформы портала подняты из JSX.
const PORTAL_MESH_POSITION = [1.393, 7.104, -10.86];
const PORTAL_MESH_ROTATION = [0, -115 * (Math.PI / 180), 0];
const PORTAL_CIRCLE_ARGS = [0.26, 64];
const PORTAL_CAMERA_POSITION = [0, 0, 10];

// Внутренняя камера портала. Мобильные значения:
//
// fov 64 вместо 50 — потому что горизонтальный обзор равен fov * aspect,
// и в портрете (aspect ≈ 0.46) он схлопывается. При 50° видимая полуширина
// на дистанции 8 составляет tan(25°) * 8 * 0.46 ≈ 1.72, при 64° — уже 2.31.
// Выше не берём: за 70° начинается заметная дисторсия по краям.
//
// z 13 вместо 10 — вертикальный зигзаг занимает по высоте 6.4 единицы
// против 2.2 у горизонтального ряда, обзорную точку нужно отодвинуть.
const PORTAL_CAMERA_POSITION_MOBILE = [0, 0, 13];
const PORTAL_CAMERA_FOV_DESKTOP = 50;
const PORTAL_CAMERA_FOV_MOBILE = 64;

// Зона нажатия на сам портал.
//
// Диск радиусом 0.26 стоит на z = -10.86, внешняя камера — на z = 45
// с fov 30, то есть до портала ~56 единиц. Полувысота кадра там
// tan(15°) * 56 ≈ 15.0, а половина экрана телефона — 422px, значит
// 1 единица мира ≈ 28px. Портал выходит диаметром ~15px.
//
// 15px — это меньше трети рекомендованных 44px для пальца. Вход в сцену
// физически невозможно надёжно нажать: попадание становится лотереей.
// Поэтому на тач-устройствах поверх портала лежит невидимый диск
// радиусом 0.8 (≈ 45px в диаметре) — геометрия и вид портала при этом
// не меняются ни на пиксель.
const PORTAL_HIT_ARGS = [0.8, 32];

export function PortalToSceneTwo({ onTransitionComplete }) {
     const [blend, setBlend] = useState(0);
     const [cameraDefault, setCameraDefault] = useState(false);
     const [orbit, setOrbit] = useState(false);
     const meshRef = useRef(null);
     const cameraRef = useRef();
     const [animateText, setAnimateText] = useState(false);

     const isAnimating = useRef(false);
     const textTimeoutRef = useRef(null);

     const isMobile = useIsMobile();
     const isTouch = useIsTouch();

     // OPT: таймер снимается при анмаунте — иначе setAnimateText мог
     // сработать уже после удаления компонента.
     useEffect(() => {
          return () => {
               if (textTimeoutRef.current) clearTimeout(textTimeoutRef.current);
          };
     }, []);

     const goToScene = useCallback(() => {
          if (isAnimating.current) return;
          isAnimating.current = true;

          document.body.style.cursor = 'auto';
          animate(meshRef.current, {
               scale: [1, 3],
               duration: 2000,
               ease: 'inOutExpo',
               onComplete: () => {
                    setBlend(1);
                    setCameraDefault(true);
                    setOrbit(true);
                    isAnimating.current = false;

                    textTimeoutRef.current = setTimeout(() => {
                         setAnimateText(true);
                    }, 6000);
               },
          });
     }, []);

     return (
          <group position={PORTAL_MESH_POSITION} rotation={PORTAL_MESH_ROTATION}>
               {/* Увеличенная зона нажатия — только для пальца и только до
                   входа в сцену. После открытия портала диск убирается,
                   чтобы не перехватывать клики по моделям внутри. */}
               {isTouch && !orbit && (
                    <mesh onClick={goToScene} visible={false}>
                         <circleGeometry args={PORTAL_HIT_ARGS} />
                         <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>
               )}

               <mesh ref={meshRef} onClick={goToScene} >
                    <circleGeometry args={PORTAL_CIRCLE_ARGS} />
                    <MeshPortalMaterial blend={blend}>
                         <PerspectiveCamera
                              ref={cameraRef}
                              makeDefault={cameraDefault}
                              position={isMobile ? PORTAL_CAMERA_POSITION_MOBILE : PORTAL_CAMERA_POSITION}
                              /* fov задан явно, а не оставлен на дефолте: так
                                 ResponsiveCamera видит base = 64 и ничего не
                                 переписывает (next === base), вместо того чтобы
                                 воевать с этой камерой за угол обзора. */
                              fov={isMobile ? PORTAL_CAMERA_FOV_MOBILE : PORTAL_CAMERA_FOV_DESKTOP}
                         />
                         <LabScene transition={onTransitionComplete} portalCamera={cameraRef} orbit={orbit} orbitChange={setOrbit} blend={setBlend} camera={setCameraDefault} animated={animateText} />
                    </MeshPortalMaterial>
               </mesh>
          </group>
     );
}
