import React, { useEffect, useRef } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';
import {set} from "animejs";

export function ModelFort({ scroll, helm,portal,destroy, ...props }) {
     const { nodes, materials } = useGLTF('/model/scene3/fortress-cell.glb');
     const alphaTexture = useTexture('model/scene3/d2.jpg');

     const groupRef = useRef();
     const customMaterialRef = useRef(
          new THREE.MeshBasicMaterial({
               side: THREE.DoubleSide,
               alphaTest: 1.0,
          })
     );
     const helmTriggeredRef = useRef(false);
     const hasScrolled = useRef(false);

     const delayAnim1 = 4.8;             // ЗАДЕРЖКА для 1-й анимации (в секундах)
     const durationAnim1 = 3.1;
     const timerRef = useRef(0);         // Загальний таймер сцени
     const opsSpeed = 0.008;             // Швидкість зміни alphaTest

     // Параметри для фізики падіння
     const gravity = 9.8;                // Сила тяжіння
     const floorY = 201;                   // Рівень підлоги (світова координата Y, куди все впаде)
     const fallTimerRef = useRef(0);     // Таймер фази падіння

     // 1. Запам'ятовуємо оригінальні позиції та додаємо випадкову затримку
     useEffect(() => {
          if (!groupRef.current) return;

          groupRef.current.children.forEach((mesh) => {
               // Запам'ятовуємо позицію, де шматочок розташований спочатку
               mesh.originalPosition = mesh.position.clone();

               // Випадкова затримка падіння для кожного шматочка від 0 до 0.8 секунд
               mesh.fallDelay = Math.random() * 0.8;
          });
     }, [nodes]);

     // 2. Накладання оригінальних текстур
     useEffect(() => {
          if (materials.material_0 && customMaterialRef.current) {
               const mat = customMaterialRef.current;
               mat.map = materials.material_0.map;
               mat.color = materials.material_0.color;
               mat.alphaMap = alphaTexture;
               mat.needsUpdate = true;
          }
     }, [materials, alphaTexture]);
     // useEffect(() => {
     //      setTimeout(() => {
     //           scroll(true);
     //           portal(true);
     //           setTimeout(() => {
     //                helm(true);
     //           },100)
     //      },4000)
     // }, [scroll]);

     // 3. Головний цикл анімації
     const sceneStartTimeRef = useRef(null);

     useFrame((state, delta) => {
          // 1. Фиксируем время, когда сцена РЕАЛЬНО началась для этой модели
          if (sceneStartTimeRef.current === null) {
               sceneStartTimeRef.current = state.clock.getElapsedTime();
          }

          // 2. Вычисляем «чистое» время жизни этой сцены (начиная с 0)
          const elapsedTime = state.clock.getElapsedTime() - sceneStartTimeRef.current;

          // --- АНИМАЦИЯ №1: Срабатывает ПОСЛЕ задержки ---
          if (elapsedTime >= delayAnim1 && elapsedTime < (delayAnim1 + durationAnim1)) {
               const mat = customMaterialRef.current;

               if (!hasScrolled.current) {
                    // Запоминаем время старта фазы
                    hasScrolled.current = elapsedTime;
               }

               if (hasScrolled.current && typeof hasScrolled.current === 'number') {
                    const timePassedSinceStart = elapsedTime - hasScrolled.current;

                    // Прошло 1.5 секунды -> включаем текст, портал и helm
                    if (timePassedSinceStart >= 1.5) {
                         scroll(true);
                         portal(true);
                         helm(true);

                         hasScrolled.current = true;
                    }
               }

               if (mat && mat.alphaTest > 0) {
                    // Возвращаем вашу исходную пошаговую скорость, но страхуем от лагов вкладок
                    // Ограничиваем максимальный delta, чтобы при выходе из вкладки объект не исчезал мгновенно
                    const safeDelta = Math.min(delta, 0.1);
                    mat.alphaTest = Math.max(0, mat.alphaTest - (opsSpeed * (safeDelta / 0.016)));
                    mat.needsUpdate = true;
               }
          }

          // --- АНИМАЦИЯ №2: Фаза падения ---
          else if (elapsedTime >= (delayAnim1 + durationAnim1)) {
               // Вычисляем, сколько времени прошло с момента старта ВТОРОЙ анимации
               const totalFallTime = elapsedTime - (delayAnim1 + durationAnim1);

               if (groupRef.current) {
                    const groupWorldPos = new THREE.Vector3();
                    groupRef.current.getWorldPosition(groupWorldPos);
                    const localFloorY = floorY - groupWorldPos.y;

                    groupRef.current.children.forEach((mesh) => {
                         if (mesh.originalPosition) {
                              const t = Math.max(0, totalFallTime - mesh.fallDelay);

                              if (t > 0) {
                                   const currentY = mesh.originalPosition.y - (0.5 * (gravity / 15) * t * t);
                                   mesh.position.y = Math.max(localFloorY, currentY);
                              }
                         }
                    });
               }
          }
     });

     return (
          <group {...props} dispose={null} ref={groupRef} scale={31} position={[215, 201.4, -15]} rotation={[0, 5, 0]}>
               <mesh name="texture_mapping_cell" geometry={nodes.texture_mapping_cell.geometry} material={customMaterialRef.current} position={[0.297, -0.002, -0.178]} />
               <mesh name="texture_mapping_cell001" geometry={nodes.texture_mapping_cell001.geometry} material={customMaterialRef.current} position={[0.26, 0.157, 0.152]} />
               <mesh name="texture_mapping_cell002" geometry={nodes.texture_mapping_cell002.geometry} material={customMaterialRef.current} position={[0.138, -0.087, -0.326]} />
               <mesh name="texture_mapping_cell003" geometry={nodes.texture_mapping_cell003.geometry} material={customMaterialRef.current} position={[-0.136, 0, 0.207]} />
               <mesh name="texture_mapping_cell004" geometry={nodes.texture_mapping_cell004.geometry} material={customMaterialRef.current} position={[0.222, -0.309, 0.329]} />
               <mesh name="texture_mapping_cell005" geometry={nodes.texture_mapping_cell005.geometry} material={customMaterialRef.current} position={[0.324, 0.25, -0.202]} />
               <mesh name="texture_mapping_cell006" geometry={nodes.texture_mapping_cell006.geometry} material={customMaterialRef.current} position={[0.329, 0.138, -0.071]} />
               <mesh name="texture_mapping_cell007" geometry={nodes.texture_mapping_cell007.geometry} material={customMaterialRef.current} position={[-0.329, -0.302, -0.357]} />
               <mesh name="texture_mapping_cell008" geometry={nodes.texture_mapping_cell008.geometry} material={customMaterialRef.current} position={[0.115, 0.259, -0.177]} />
               <mesh name="texture_mapping_cell009" geometry={nodes.texture_mapping_cell009.geometry} material={customMaterialRef.current} position={[0.282, 0.217, 0.014]} />
               <mesh name="texture_mapping_cell010" geometry={nodes.texture_mapping_cell010.geometry} material={customMaterialRef.current} position={[0.195, 0.071, 0.255]} />
               <mesh name="texture_mapping_cell011" geometry={nodes.texture_mapping_cell011.geometry} material={customMaterialRef.current} position={[-0.198, 0.208, 0.072]} />
               <mesh name="texture_mapping_cell012" geometry={nodes.texture_mapping_cell012.geometry} material={customMaterialRef.current} position={[0.213, 0.269, -0.312]} />
               <mesh name="texture_mapping_cell013" geometry={nodes.texture_mapping_cell013.geometry} material={customMaterialRef.current} position={[0.374, -0.261, -0.091]} />
               <mesh name="texture_mapping_cell014" geometry={nodes.texture_mapping_cell014.geometry} material={customMaterialRef.current} position={[-0.337, -0.251, -0.07]} />
               <mesh name="texture_mapping_cell015" geometry={nodes.texture_mapping_cell015.geometry} material={customMaterialRef.current} position={[-0.06, 0.194, 0.242]} />
               <mesh name="texture_mapping_cell016" geometry={nodes.texture_mapping_cell016.geometry} material={customMaterialRef.current} position={[0.077, -0.207, 0.278]} />
               <mesh name="texture_mapping_cell017" geometry={nodes.texture_mapping_cell017.geometry} material={customMaterialRef.current} position={[-0.109, -0.157, -0.326]} />
               <mesh name="texture_mapping_cell018" geometry={nodes.texture_mapping_cell018.geometry} material={customMaterialRef.current} position={[0.342, -0.183, 0.105]} />
               <mesh name="texture_mapping_cell019" geometry={nodes.texture_mapping_cell019.geometry} material={customMaterialRef.current} position={[-0.283, -0.31, 0.316]} />
               <mesh name="texture_mapping_cell020" geometry={nodes.texture_mapping_cell020.geometry} material={customMaterialRef.current} position={[0.369, -0.264, 0.192]} />
               <mesh name="texture_mapping_cell021" geometry={nodes.texture_mapping_cell021.geometry} material={customMaterialRef.current} position={[0.204, 0.121, -0.324]} />
               <mesh name="texture_mapping_cell022" geometry={nodes.texture_mapping_cell022.geometry} material={customMaterialRef.current} position={[-0.126, -0.338, 0.168]} />
               <mesh name="texture_mapping_cell023" geometry={nodes.texture_mapping_cell023.geometry} material={customMaterialRef.current} position={[0.301, 0.238, -0.078]} />
               <mesh name="texture_mapping_cell024" geometry={nodes.texture_mapping_cell024.geometry} material={customMaterialRef.current} position={[0.334, -0.262, -0.331]} />
               <mesh name="texture_mapping_cell025" geometry={nodes.texture_mapping_cell025.geometry} material={customMaterialRef.current} position={[0.329, 0.093, -0.118]} />
               <mesh name="texture_mapping_cell026" geometry={nodes.texture_mapping_cell026.geometry} material={customMaterialRef.current} position={[-0.09, 0.219, -0.272]} />
               <mesh name="texture_mapping_cell027" geometry={nodes.texture_mapping_cell027.geometry} material={customMaterialRef.current} position={[0.326, -0.119, 0.026]} />
               <mesh name="texture_mapping_cell028" geometry={nodes.texture_mapping_cell028.geometry} material={customMaterialRef.current} position={[-0.046, 0.24, -0.038]} />
               <mesh name="texture_mapping_cell029" geometry={nodes.texture_mapping_cell029.geometry} material={customMaterialRef.current} position={[0.218, 0.262, -0.125]} />
               <mesh name="texture_mapping_cell030" geometry={nodes.texture_mapping_cell030.geometry} material={customMaterialRef.current} position={[0.38, 0.097, -0.028]} />
               <mesh name="texture_mapping_cell031" geometry={nodes.texture_mapping_cell031.geometry} material={customMaterialRef.current} position={[-0.306, 0.112, -0.168]} />
               <mesh name="texture_mapping_cell033" geometry={nodes.texture_mapping_cell033.geometry} material={customMaterialRef.current} position={[-0.305, 0.108, -0.174]} /><mesh name="texture_mapping_cell034" geometry={nodes.texture_mapping_cell034.geometry} material={customMaterialRef.current} position={[0.061, 0.106, -0.393]} /><mesh name="texture_mapping_cell036" geometry={nodes.texture_mapping_cell036.geometry} material={customMaterialRef.current} position={[-0.205, -0.138, 0.197]} /><mesh name="texture_mapping_cell037" geometry={nodes.texture_mapping_cell037.geometry} material={customMaterialRef.current} position={[-0.304, 0.086, 0.131]} /><mesh name="texture_mapping_cell038" geometry={nodes.texture_mapping_cell038.geometry} material={customMaterialRef.current} position={[0.407, 0.078, -0.028]} />
          </group>
     );
}

useGLTF.preload('/model/scene3/fortress-cell.glb');
