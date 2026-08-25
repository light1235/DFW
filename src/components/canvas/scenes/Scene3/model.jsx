import { useEffect, useMemo, useRef } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// OPT: позиции 37 осколков — статичные данные. Раньше это были 37 почти
// одинаковых строк JSX; логика та же, но список стало видно целиком.
const CELLS = [
     ['texture_mapping_cell', [0.297, -0.002, -0.178]],
     ['texture_mapping_cell001', [0.26, 0.157, 0.152]],
     ['texture_mapping_cell002', [0.138, -0.087, -0.326]],
     ['texture_mapping_cell003', [-0.136, 0, 0.207]],
     ['texture_mapping_cell004', [0.222, -0.309, 0.329]],
     ['texture_mapping_cell005', [0.324, 0.25, -0.202]],
     ['texture_mapping_cell006', [0.329, 0.138, -0.071]],
     ['texture_mapping_cell007', [-0.329, -0.302, -0.357]],
     ['texture_mapping_cell008', [0.115, 0.259, -0.177]],
     ['texture_mapping_cell009', [0.282, 0.217, 0.014]],
     ['texture_mapping_cell010', [0.195, 0.071, 0.255]],
     ['texture_mapping_cell011', [-0.198, 0.208, 0.072]],
     ['texture_mapping_cell012', [0.213, 0.269, -0.312]],
     ['texture_mapping_cell013', [0.374, -0.261, -0.091]],
     ['texture_mapping_cell014', [-0.337, -0.251, -0.07]],
     ['texture_mapping_cell015', [-0.06, 0.194, 0.242]],
     ['texture_mapping_cell016', [0.077, -0.207, 0.278]],
     ['texture_mapping_cell017', [-0.109, -0.157, -0.326]],
     ['texture_mapping_cell018', [0.342, -0.183, 0.105]],
     ['texture_mapping_cell019', [-0.283, -0.31, 0.316]],
     ['texture_mapping_cell020', [0.369, -0.264, 0.192]],
     ['texture_mapping_cell021', [0.204, 0.121, -0.324]],
     ['texture_mapping_cell022', [-0.126, -0.338, 0.168]],
     ['texture_mapping_cell023', [0.301, 0.238, -0.078]],
     ['texture_mapping_cell024', [0.334, -0.262, -0.331]],
     ['texture_mapping_cell025', [0.329, 0.093, -0.118]],
     ['texture_mapping_cell026', [-0.09, 0.219, -0.272]],
     ['texture_mapping_cell027', [0.326, -0.119, 0.026]],
     ['texture_mapping_cell028', [-0.046, 0.24, -0.038]],
     ['texture_mapping_cell029', [0.218, 0.262, -0.125]],
     ['texture_mapping_cell030', [0.38, 0.097, -0.028]],
     ['texture_mapping_cell031', [-0.306, 0.112, -0.168]],
     ['texture_mapping_cell033', [-0.305, 0.108, -0.174]],
     ['texture_mapping_cell034', [0.061, 0.106, -0.393]],
     ['texture_mapping_cell036', [-0.205, -0.138, 0.197]],
     ['texture_mapping_cell037', [-0.304, 0.086, 0.131]],
     ['texture_mapping_cell038', [0.407, 0.078, -0.028]],
];

// Параметры анимации — константы модуля, а не переменные в теле компонента
const DELAY_ANIM_1 = 4.8;      // задержка первой анимации, сек
const DURATION_ANIM_1 = 3.1;
const OPS_SPEED = 0.008;       // скорость изменения alphaTest
const GRAVITY = 9.8;
const FLOOR_Y = 201;           // мировая координата пола

export function ModelFort({ scroll, helm, portal, ...props }) {
     const { nodes, materials } = useGLTF('/model/scene3/fortress-cell.glb');
     const alphaTexture = useTexture('model/scene3/d2.jpg');

     const groupRef = useRef();

     // OPT / БЫЛА УТЕЧКА: раньше материал создавался так —
     //   useRef(new THREE.MeshBasicMaterial({...}))
     // Аргумент useRef вычисляется на КАЖДОМ рендере, даже когда результат
     // отбрасывается. То есть каждый рендер рождал новый MeshBasicMaterial,
     // который никто не диспозил. useMemo создаёт материал ровно один раз.
     const customMaterial = useMemo(() => new THREE.MeshBasicMaterial({
          side: THREE.DoubleSide,
          alphaTest: 1.0,
     }), []);

     // Освобождаем материал при размонтировании сцены
     useEffect(() => () => customMaterial.dispose(), [customMaterial]);

     const hasScrolled = useRef(false);
     const alphaSettled = useRef(false);

     // OPT: плоский список осколков вместо обхода children.forEach каждый кадр.
     // Храним ссылку на меш, стартовый Y (число, не Vector3) и задержку падения.
     const shardsRef = useRef([]);
     const floorLocalRef = useRef(null);

     useEffect(() => {
          const group = groupRef.current;
          if (!group) return;

          shardsRef.current = group.children.map((mesh) => ({
               mesh,
               originalY: mesh.position.y,
               // Случайная задержка падения для каждого осколка: 0…0.8 с
               fallDelay: Math.random() * 0.8,
          }));

          // OPT: группа статична, поэтому мировую позицию (и уровень пола в
          // локальных координатах) считаем один раз, а не каждый кадр.
          const worldPos = new THREE.Vector3();
          group.getWorldPosition(worldPos);
          floorLocalRef.current = FLOOR_Y - worldPos.y;
     }, [nodes]);

     // Накладываем оригинальную текстуру из модели на общий материал
     useEffect(() => {
          const source = materials.material_0;
          if (!source) return;

          customMaterial.map = source.map;
          if (source.color) customMaterial.color.copy(source.color);
          customMaterial.alphaMap = alphaTexture;
          customMaterial.needsUpdate = true;
     }, [materials, alphaTexture, customMaterial]);

     const sceneStartTimeRef = useRef(null);

     useFrame((state, delta) => {
          // Фиксируем момент, когда сцена реально началась для этой модели
          if (sceneStartTimeRef.current === null) {
               sceneStartTimeRef.current = state.clock.getElapsedTime();
          }

          const elapsedTime = state.clock.getElapsedTime() - sceneStartTimeRef.current;

          // --- АНИМАЦИЯ №1: проявление, срабатывает после задержки ---
          if (elapsedTime >= DELAY_ANIM_1 && elapsedTime < (DELAY_ANIM_1 + DURATION_ANIM_1)) {
               if (!hasScrolled.current) {
                    // Запоминаем время старта фазы
                    hasScrolled.current = elapsedTime;
               }

               if (typeof hasScrolled.current === 'number') {
                    const timePassedSinceStart = elapsedTime - hasScrolled.current;

                    // Прошло 1.5 секунды -> включаем текст, портал и helm
                    if (timePassedSinceStart >= 1.5) {
                         scroll(true);
                         portal(true);
                         helm(true);

                         hasScrolled.current = true;
                    }
               }

               if (customMaterial.alphaTest > 0) {
                    // Исходная пошаговая скорость, но со страховкой от лагов вкладки:
                    // ограничиваем delta, чтобы при возврате во вкладку объект
                    // не проявлялся мгновенно
                    const safeDelta = Math.min(delta, 0.1);
                    customMaterial.alphaTest = Math.max(0, customMaterial.alphaTest - (OPS_SPEED * (safeDelta / 0.016)));

                    // OPT: раньше здесь стоял needsUpdate = true на каждом кадре.
                    // Для материала это флаг «пересобрать шейдерную программу» —
                    // то есть ~190 перекомпиляций за 3 секунды анимации.
                    // Само значение alphaTest — uniform, оно уходит на GPU и без
                    // флага. Пересборка нужна лишь один раз, когда alphaTest
                    // становится нулём и меняется define ALPHATEST.
                    if (customMaterial.alphaTest === 0 && !alphaSettled.current) {
                         alphaSettled.current = true;
                         customMaterial.needsUpdate = true;
                    }
               }
          }

          // --- АНИМАЦИЯ №2: фаза падения ---
          else if (elapsedTime >= (DELAY_ANIM_1 + DURATION_ANIM_1)) {
               const totalFallTime = elapsedTime - (DELAY_ANIM_1 + DURATION_ANIM_1);

               const localFloorY = floorLocalRef.current;
               if (localFloorY === null) return;

               // OPT: было new THREE.Vector3() + getWorldPosition() + forEach с
               // замыканием на каждом кадре. Теперь простой цикл по плоскому
               // массиву, без аллокаций — GC в этой фазе не просыпается.
               const shards = shardsRef.current;
               const fallFactor = 0.5 * (GRAVITY / 15);

               for (let i = 0; i < shards.length; i++) {
                    const shard = shards[i];
                    const t = totalFallTime - shard.fallDelay;

                    if (t > 0) {
                         const currentY = shard.originalY - (fallFactor * t * t);
                         shard.mesh.position.y = Math.max(localFloorY, currentY);
                    }
               }
          }
     });

     return (
          <group {...props} dispose={null} ref={groupRef} scale={31} position={[215, 201.4, -15]} rotation={[0, 5, 0]}>
               {CELLS.map(([name, position]) => (
                    <mesh
                         key={name}
                         name={name}
                         geometry={nodes[name].geometry}
                         material={customMaterial}
                         position={position}
                    />
               ))}
          </group>
     );
}

useGLTF.preload('/model/scene3/fortress-cell.glb');
