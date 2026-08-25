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

// -----------------------------------------------------------------------------
// МОБІЛЬНА ТИПОГРАФІКА
// На вузькому екрані ламається саме рядок адреси: «Josef Umdasch Platz 1 3300
// Amstetten» в один рядок ширший за заголовок і вилазить за кадр. Тому на
// мобільному він розбивається на два рядки, а кегль трохи зменшується.
// curveSegments теж нижче: дрібний текст на телефоні різниці не покаже,
// а трикутників у геометрії стане менше.
// -----------------------------------------------------------------------------
const TEXT_OPTIONS_MOBILE = {
     size: 0.665, height: 0.11, curveSegments: 8, lineHeight: 0.7, letterSpacing: 0.04,
};
const TEXT_OPTIONS_SMALL_MOBILE = {
     size: 0.21, height: 0.11, curveSegments: 8, lineHeight: 0.7, letterSpacing: 0.04,
};

const DESKTOP_LAYOUT = {
     big: TEXT_OPTIONS,
     small: TEXT_OPTIONS_SMALL,
     subtitle: [0.6, -2.6, 0],
     // Адреса вміщується в один рядок — розбивати нічого не потрібно
     lines: ['Josef Umdasch Platz 1 3300 Amstetten', 'T +43 7472 605 -0'],
     linesStart: [0.8, -3.9, 0],
     lineStep: 1.0,
};

const MOBILE_LAYOUT = {
     big: TEXT_OPTIONS_MOBILE,
     small: TEXT_OPTIONS_SMALL_MOBILE,
     // Заголовок нижчий, тому другий рядок піднімається слідом за ним
     subtitle: [0.35, -1.435, 0],
     lines: ['Josef Umdasch Platz 1', '3300 Amstetten', 'T +43 7472 605 -0'],
     linesStart: [0.42, -2.135, 0],
     lineStep: 0.434,
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


export default function ContactText({ isMobile = false }) {

     const groupRef = useRef()

     // Один об'єкт розкладки на брейкпоінт замість десятка тернарників у JSX
     const layout = isMobile ? MOBILE_LAYOUT : DESKTOP_LAYOUT

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
                    <Text3D font="/zb.json" {...layout.big}>
                         Contact
                         <meshStandardMaterial
                              color="#F54927" emissive="#ffc280" emissiveIntensity={3} toneMapped={false} onBeforeCompile={handleBeforeCompile}
                         />
                    </Text3D>

                    {/* Вторая строка — смещена вниз по оси Y */}
                    <Text3D font="/zb.json" position={layout.subtitle} {...layout.big}>
                         too us.
                         <meshStandardMaterial
                              color="#ffffff" emissive="#ffc280" emissiveIntensity={3} toneMapped={false} onBeforeCompile={handleBeforeCompile}
                         />
                    </Text3D>

                    {/* Адреса й телефон: кількість рядків залежить від брейкпоінта,
                        тому рендеримо їх списком, а не окремими блоками */}
                    {layout.lines.map((line, i) => (
                         <Text3D
                              key={line}
                              font="/zl.json"
                              position={[
                                   layout.linesStart[0],
                                   layout.linesStart[1] - i * layout.lineStep,
                                   layout.linesStart[2],
                              ]}
                              {...layout.small}
                         >
                              {line}
                              <meshStandardMaterial color="#ffffff"
                                   emissive="#ffc280"
                                   emissiveIntensity={3} toneMapped={false} onBeforeCompile={handleBeforeCompile} />
                         </Text3D>
                    ))}
                    {/*<AnimatedText />*/}
               </Center>
          </group>
     );
}
