import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Center, Text3D } from '@react-three/drei';

// OPT: настройки текста статичны — вынесены за пределы рендера. Раньше эти
// объекты создавались заново на каждом рендере, и Text3D считал их новыми
// пропсами, то есть перестраивал геометрию букв.
const TEXT_OPTIONS = {
     size: 1.0, height: 0.2, curveSegments: 12, lineHeight: 0.7, letterSpacing: 0.05,
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

// OPT: компонент не используется в JSX ниже (мёртвый код), но оставлен на случай
// возврата анимации. Исправлено: добавлена очистка таймера, убран пустой
// кадровый цикл, настройки текста вынесены в константы.
function AnimatedText({ targetOpacity, active }) {

     const materialRef1 = useRef()
     const materialRef2 = useRef()

     useEffect(() => {
          const timer = setTimeout(() => {
               if (materialRef1.current) materialRef1.current.opacity = targetOpacity ?? 1
               if (materialRef2.current) materialRef2.current.opacity = targetOpacity ?? 1
               if (active) active(true)
          }, 5700)

          // OPT: раньше таймер не убирался — при размонтировании он всё равно
          // срабатывал и писал в мёртвые рефы.
          return () => clearTimeout(timer)
     }, [targetOpacity, active])

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


export default function TowerText() {

     const groupRef = useRef()

     // OPT: убраны arrowCount/setArrowCount. Таймер в useFrame дёргал setState
     // каждые 0.4 с, а значение нигде не читалось — три тяжёлых Text3D
     // перестраивались дважды в секунду впустую.
     // OPT: убран activeScroll и useEffect БЕЗ массива зависимостей — он
     // запускал новый setTimeout после каждого рендера (то есть каждые 0.4 с
     // из-за setState выше), а состояние тоже никто не использовал.

     // Один uniform-объект на весь компонент: он мутируется, а не пересоздаётся.
     const uniformsRef = useRef({ uTime: { value: 0 } });

     // OPT: было два useFrame — один для покачивания группы, второй для uTime.
     // Теперь одна подписка на render-loop.
     useFrame((state) => {
          const time = state.clock.getElapsedTime();
          uniformsRef.current.uTime.value = time;

          const group = groupRef.current;
          if (group) group.position.y = Math.sin(time * 1.5) * 0.05;
     });

     // OPT: стабильная функция. Новый onBeforeCompile на каждом рендере
     // заставляет three пересобирать шейдерную программу.
     const handleBeforeCompile = useCallback((shader) => {
          shader.uniforms.uTime = uniformsRef.current.uTime;
          shader.vertexShader = `uniform float uTime;\n` + shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace(
               '#include <begin_vertex>',
               `#include <begin_vertex>\ntransformed.z += sin(transformed.x * 0.6 + uTime
* 3.5) * 0.25;`
          );
     }, []);

     return (
          <group ref={groupRef} position={[0, 1.2, 0]}>
               <Center>
                    <Text3D font="/zb.json" {...TEXT_OPTIONS}>
                         Click
                         <meshStandardMaterial
                              color="#F54927" emissive="#ffc280" emissiveIntensity={3} toneMapped={false}
                         />
                    </Text3D>

                    {/* Вторая строка — смещена вниз по оси Y */}
                    <Text3D font="/zb.json" position={[0.6, -1.6, 0]} {...TEXT_OPTIONS}>
                         to Go
                         <meshStandardMaterial
                              color="#fefefe" toneMapped={false}
                         />
                    </Text3D>
                    <Text3D font="/zl.json" position={[3.4, -3.2, 0]}
                         {...TEXT_OPTIONS}>
                         {" >>> "}
                         <meshStandardMaterial color="#ffffff"
                              emissive="#ffc280"
                              emissiveIntensity={3} toneMapped={false} onBeforeCompile={handleBeforeCompile} />
                    </Text3D>
               </Center>
          </group>
     );
}
