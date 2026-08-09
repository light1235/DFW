import React from 'react';
import {MeshPortalMaterial, OrbitControls} from "@react-three/drei";
import * as THREE from "three";

const SceneTwo = () => {
     return (
          <>
               {/* Свой свет внутри портала */}
               <ambientLight intensity={1.5} />
               <directionalLight position={[5, 5, 5]} intensity={2} />

               {/* Объекты второй сцены */}
               <mesh>
                    <torusKnotGeometry args={[1, 0.3, 100, 16]} />
                    <meshStandardMaterial color="hotpink" roughness={0.1} />
               </mesh>

               {/* Задний фон внутри портала, чтобы не было видно пустоту */}
               <color attach="background" args={['#1a1a2e']} />
          </>
     );
};

export default SceneTwo;

import { useRef } from 'react';
import { PerspectiveCamera } from '@react-three/drei';

export function PortalToSceneTwo() {
     return (
          // Портал стоит на своем месте в первой сцене
          <mesh position={[1.393, 7.104, -10.86]} rotation={[0, -115 * (Math.PI / 180), 0]}>
               <circleGeometry args={[0.26, 64]}  />

               <MeshPortalMaterial
                    blend={0} // На старте края жесткие, чтобы это было четкое окно
                    // makeDefault={false}
               >
                    {/* Внутренняя камера портала НЕ должна быть дефолтной на старте */}
                    {/* <PerspectiveCamera makeDefault={false} position={[0, 0, 5]} />*/}

                    {/* Цвет фона остаётся, но теперь он заперт ВНУТРИ портала */}
                    <color attach="background" args={['#1a1a2e']} />

                    <ambientLight intensity={1.5} />
                    {/*<mesh position={[0, 0, -2]}>*/}
                    {/*     <torusKnotGeometry args={[1, 0.3, 100, 16]} />*/}
                    {/*     <meshStandardMaterial color="hotpink" />*/}
                    {/*</mesh>*/}
                    <SceneTwo />
               </MeshPortalMaterial>
          </mesh>
     );
}
