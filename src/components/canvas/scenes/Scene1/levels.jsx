import React, { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { animate } from 'animejs'; // v4
import 'animejs/adapters/three';

export function Model({ inputRotationZ = -20, ...props }) {
     const { nodes, materials } = useGLTF('/model/lvl.glb');
     const meshRef = useRef();

     // Потрібно для того, щоб React Three Fiber оновлював екран під час нативної анімації
     const { invalidate } = useThree();

     useEffect(() => {
          if (!meshRef.current) return;

          // В Anime.js v4 ми передаємо meshRef.current НАПРЯМУ
          // І використовуємо плоску властивість 'rotationZ' та звичайні ГРАДУСИ!
          const animation = animate(meshRef.current, {
               rotationZ: [0.032, inputRotationZ+0.032], // Нативно анімує з 0 до -20 градусів
               duration: 1500,
               ease: 'outQuad',
               autoplay: true,
               delay:2700,
               onUpdate: invalidate // Змушує R3F перемалювати кадр із новими координатами
          });

          return () => animation.pause();
     }, [inputRotationZ, invalidate]);

     return (
          <group {...props} dispose={null}>
               <mesh
                    name="input"
                    geometry={nodes.input.geometry}
                    material={materials.material_0}
                    position={[-0.056, 0.151, 0.376]}
                    rotation={[Math.PI / 2, 0, 0.032]}
               />
               <mesh
                    ref={meshRef}  // Адаптер v4 буде працювати безпосередньо з цим мешем
                    name="input001"
                    geometry={nodes.input001.geometry}
                    material={materials.material_0}
                    position={[0.001, 0.315, -0.063]}
                    rotation={[Math.PI / 2, 0, 0]}
               />
          </group>
     );
}

useGLTF.preload('/model/lvl.glb');
