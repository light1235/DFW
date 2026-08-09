import React, { useMemo } from 'react';
import { useGLTF, Environment } from '@react-three/drei';

const LevelModel = ({
                        // Поворот [X, Y, Z]:
                        // Если модель на боку или вверх ногами, отрегулируйте поворот по X или Y
                        rotation = [0, 0, 0],
                        position = [0, 0, 0],
                        scale = 1,
                        ...props
                    }) => {
    const { scene } = useGLTF('/model/level.glb');

    // Клонируем сцену для безопасного использования
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    return (
         <group position={position} rotation={rotation} scale={scale} {...props}>
             <primitive object={clonedScene} />
         </group>
    );
};

export default LevelModel;

useGLTF.preload('/model/level.glb');
