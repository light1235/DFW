import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Center, Text3D } from '@react-three/drei';

// Налаштування тексту статичні — виносимо за межі рендеру, щоб Text3D
// не отримував новий об'єкт властивостей на кожному рендері
const TEXT_OPTIONS = {
     size: 1.2, height: 0.2, curveSegments: 12, lineHeight: 0.7, letterSpacing: 0.05,
};
const TEXT_OPTIONS_SMALL = {
     size: 0.35, height: 0.2, curveSegments: 12, lineHeight: 0.7, letterSpacing: 0.05,
};
const TEXT_OPTIONS_ARROW = {
     font: '/font.json',
     size: 0.2, height: 0.2,
     curveSegments: 12,
     bevelEnabled: true,
     bevelThickness: 0.02,
     bevelSize: 0.01,
     opacity: 0,
};
const TEXT_OPTIONS_TRIGGER = {
     font: '/font.json', size: 0.2, height: 0.2, curveSegments: 12, lineHeight: 0.7, letterSpacing: 0.05,
};
const ARROWS = ['', '>', '>>', '>>>'];

function AnimatedText({ targetOpacity }) {

     const materialRef1 = useRef()
     const materialRef2 = useRef()

     useEffect(() => {
          const timer = setTimeout(() => {
               if (materialRef1.current) materialRef1.current.opacity = targetOpacity ?? 1
               if (materialRef2.current) materialRef2.current.opacity = targetOpacity ?? 1
          }, 2400)

          // Прибираємо таймер при розмонтуванні, щоб не писати в мертві рефи
          return () => clearTimeout(timer)
     }, [targetOpacity])

     // Анімація стрілок вимкнена, тому кадровий цикл тут не потрібен
     const [arrowCount] = useState(0)

     return (
          <>
               <Text3D {...TEXT_OPTIONS_TRIGGER} position={[2.7, -5.2, 0]}>
                    {"SCROLL TO EXPLORE THE PROCESS "}
                    <meshStandardMaterial ref={materialRef1} color="#ffffff"
                         emissive="#ffc280" opacity={0} emissiveIntensity={3} transparent toneMapped={false} roughness={0.2} metalness={0.8} />
               </Text3D>
               <Text3D {...TEXT_OPTIONS_ARROW} position={[9.7, -5.2, 0]}>
                    {ARROWS[arrowCount]}
                    <meshStandardMaterial ref={materialRef2} color="#ffffff"
                         emissive="#ffc280"
                         emissiveIntensity={3} toneMapped={false} opacity={0} transparent roughness={0.1} metalness={0.6} />
               </Text3D>
          </>
     )
}


export default function ContactText() {

     const groupRef = useRef()

     // Один uniform-об'єкт на всі чотири матеріали: він мутується, а не пересоздається
     const uniformsRef = useRef({ uTime: { value: 0 } });

     useFrame((state) => {
          uniformsRef.current.uTime.value = state.clock.getElapsedTime();
     });

     // Стабільна функція: інакше кожен рендер підсовував матеріалам новий onBeforeCompile
     const handleBeforeCompile = useCallback((shader) => {
          shader.uniforms.uTime = uniformsRef.current.uTime;
          shader.vertexShader = `uniform float uTime;\n` + shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace(
               '#include <begin_vertex>',
               `#include <begin_vertex>\ntransformed.z += sin(transformed.x * 0.01 + uTime
* 2.5) * 0.25;`
          );
     }, []);

     return (
          <group ref={groupRef} position={[0, 1.2, 0]}>
               <Center>
                    <Text3D font="/zb.json" {...TEXT_OPTIONS}>
                         Contact
                         <meshStandardMaterial
                              color="#F54927" emissive="#ffc280" emissiveIntensity={3} toneMapped={false} onBeforeCompile={handleBeforeCompile}
                         />
                    </Text3D>

                    {/* Вторая строка — смещена вниз по оси Y */}
                    <Text3D font="/zb.json" position={[0.6, -2.6, 0]} {...TEXT_OPTIONS}>
                         too us.
                         <meshStandardMaterial
                              color="#ffffff" emissive="#ffc280" emissiveIntensity={3} toneMapped={false} onBeforeCompile={handleBeforeCompile}
                         />
                    </Text3D>
                    <Text3D font="/zl.json" position={[0.8, -3.9, 0]}
                         {...TEXT_OPTIONS_SMALL}>Josef Umdasch Platz 1 3300 Amstetten
                         <meshStandardMaterial color="#ffffff"
                              emissive="#ffc280"
                              emissiveIntensity={3} toneMapped={false} onBeforeCompile={handleBeforeCompile} />
                    </Text3D>
                    <Text3D font="/zl.json" position={[0.8, -4.9, 0]}
                         {...TEXT_OPTIONS_SMALL}>T +43 7472 605 -0
                         <meshStandardMaterial color="#ffffff"
                              emissive="#ffc280"
                              emissiveIntensity={3} toneMapped={false} onBeforeCompile={handleBeforeCompile} />
                    </Text3D>
                    {/*<AnimatedText />*/}
               </Center>
          </group>
     );
}
