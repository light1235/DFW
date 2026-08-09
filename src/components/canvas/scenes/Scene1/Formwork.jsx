import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const FormWork = ({
                       rotation,
                       position,
                       scale = 1,
                       ...props
                  }) => {
     const { scene } = useGLTF('/model/farmax.glb');

     // Клонируем сцену и сразу модифицируем материалы
     const clonedScene = useMemo(() => {
          const clone = scene.clone();

          clone.traverse((child) => {
               if (child.isMesh) {
                    // Создаем базовый материал, игнорирующий свет
                    child.material = new THREE.MeshBasicMaterial({
                         // Если у модели была текстура — сохраняем её, иначе берем родной цвет
                         map: child.material.map,
                         color: child.material.map ? 0xffffff : child.material.color,

                         // Если в модели была настроена прозрачность — переносим её
                         transparent: child.material.transparent,
                         opacity: child.material.opacity,
                    });
               }
          });

          return clone;
     }, [scene]);

     return (
          <group position={position} rotation={rotation} scale={scale} {...props}>
               <primitive object={clonedScene} />
          </group>
     );
};

export default FormWork;

useGLTF.preload('/model/farmax.glb');
