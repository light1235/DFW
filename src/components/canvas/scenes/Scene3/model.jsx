import {useGLTF, useTexture} from "@react-three/drei";
import React, {useEffect, useRef} from "react";
import * as THREE from "three";
import {useFrame} from "@react-three/fiber";

export function ModelFortress7() {
     // Путь указывается от папки public
     const { scene } = useGLTF('model/scene3/fortress-cell.glb');

     const alphaTexture = useTexture(
          'model/scene3/d2.jpg'
     );
     const materialsRef = useRef([]);
     const opsSpeed = 0.008;

     materialsRef.current = [];
     useEffect(() => {
          if (!scene) return;

          // Очищаємо масив перед повторним рендером (якщо буде)
          materialsRef.current = [];

          scene.traverse((child) => {
               if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // 1. Зберігаємо оригінальну текстуру та колір, які вже були в моделі
                    const originalTexture = child.material.map;
                    const originalColor = child.material.color;

                    // 2. Створюємо індивідуальний MeshBasicMaterial (не потребує світла)
                    const customMaterial = new THREE.MeshBasicMaterial({
                         map: originalTexture,         // Повертаємо рідну текстуру моделі
                         color: originalColor,         // Зберігаємо оригінальний колір
                         side: THREE.DoubleSide,
                         alphaMap: alphaTexture,
                         // transparent: true,
                         alphaTest: 1.0,               // Початкове значення для старту анімації
                    });

                    // 3. Замінюємо матеріал меша на новий
                    child.material = customMaterial;

                    // 4. Додаємо цей матеріал у наш масив для подальшої анімації
                    materialsRef.current.push(customMaterial);
               }
          });
     }, [scene, alphaTexture]);

     useFrame(() => {
          if (materialsRef.current.length > 0) {
               materialsRef.current.forEach((material) => {
                    if (material.alphaTest > 0) {
                         material.alphaTest -= opsSpeed;
                         material.needsUpdate = true; // Оновлюємо кожен матеріал у пам'яті Three.js
                    }
               });
          }
     });

     return <primitive object={scene}  scale={31} position={[215, 201.4, -15]} rotation={[0,5,0]} />;
}
