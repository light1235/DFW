import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Center, Text3D } from '@react-three/drei';
import * as THREE from 'three';
export default function FlagText() {
     const groupRef = useRef();
     const uniformsRef = useRef({ uTime: { value: 0 } });
     useFrame((state) => {
          uniformsRef.current.uTime.value = state.clock.getElapsedTime();
     });
     const handleBeforeCompile = (shader) => {
          shader.uniforms.uTime = uniformsRef.current.uTime;
          shader.vertexShader = `uniform float uTime;\n` + shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace(
               '#include <begin_vertex>',
               `#include <begin_vertex>\ntransformed.z += sin(transformed.x * 0.6 + uTime
* 3.5) * 0.25;`
          );
     };
     const textOptions = { size: 1.8, height: 0.2, curveSegments: 12, lineHeight:
               0.7, letterSpacing: 0.05 };
     const textOptionsSmall = { size: 0.3, height: 0.2, curveSegments: 12, lineHeight:
               0.7, letterSpacing: 0.05 };
     const textOptionsTrigger = { size: 0.2, height: 0.2, curveSegments: 12, lineHeight:
               0.7, letterSpacing: 0.05 };
     return (
          <group ref={groupRef} position={[0,-1.2,0]}>
               <Center>
                    <Text3D font="/zb.json" {...textOptions}>
                         Next level
                         <meshStandardMaterial
                              color="#F54927"  emissive="#ffc280" emissiveIntensity={3} toneMapped={false}  onBeforeCompile={handleBeforeCompile}
                         />
                    </Text3D>

                    {/* Вторая строка — смещена вниз по оси Y */}
                    <Text3D font="/zb.json" position={[0.6, -2.6, 0]} {...textOptions}>
                         building.
                         <meshStandardMaterial
                              color="#ffffff"  emissive="#ffc280" emissiveIntensity={3} toneMapped={false}  onBeforeCompile={handleBeforeCompile}
                         />
                    </Text3D>
                    <Text3D font="/zl.json" position={[1.4, -3.9, 0]}
                            {...textOptionsSmall}>
                         With  a digitalization formwork process.
                         <meshStandardMaterial  color="#ffffff"
                                                emissive="#ffc280"
                                               emissiveIntensity={3} toneMapped={false} onBeforeCompile={handleBeforeCompile} />
                    </Text3D>
                    <Text3D font="/font.json" position={[2.7, -5.2, 0]}
                            {...textOptionsTrigger}>
                         {"SCROLL TO EXPLORE THE PROCESS >>>"}
                         <meshStandardMaterial  color="#ffffff"
                                                emissive="#ffc280"
                                                emissiveIntensity={3} toneMapped={false} onBeforeCompile={handleBeforeCompile} />
                    </Text3D>
               </Center>
          </group>
     );
}
