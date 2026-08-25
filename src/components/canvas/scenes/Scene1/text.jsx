import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Center, Text3D } from '@react-three/drei';
import { useIsMobile } from '../../../../hooks/useIsMobile.js';

// -----------------------------------------------------------------------------
// OPT: всё, что не меняется между рендерами, поднято на уровень модуля.
// Раньше эти объекты/массивы создавались заново на каждом рендере.
// -----------------------------------------------------------------------------

const ARROWS = ['', '>', '>>', '>>>'];

// Опции текста. Значения 1:1 как были — геометрия не меняется.
const TEXT_ARROW = {
     font: '/font.json',
     size: 0.2,
     height: 0.2,
     curveSegments: 12,
     bevelEnabled: true,
     bevelThickness: 0.02,
     bevelSize: 0.01,
};

const TEXT_TRIGGER = {
     font: '/font.json',
     size: 0.2,
     height: 0.2,
     curveSegments: 12,
     lineHeight: 0.7,
     letterSpacing: 0.05,
};

const TEXT_BIG = { size: 1.8, height: 0.2, curveSegments: 12, lineHeight: 0.7, letterSpacing: 0.05 };
const TEXT_SMALL = { size: 0.3, height: 0.2, curveSegments: 12, lineHeight: 0.7, letterSpacing: 0.05 };

// -----------------------------------------------------------------------------
// Раскладка под устройство.
// Десктопные значения — ровно те, что были в коде до адаптива, поэтому на
// широких экранах картинка не сдвинулась ни на единицу.
//
// Зачем вообще: блок текста был шириной ~15 юнитов (одна строка
// "SCROLL TO EXPLORE THE PROCESS" + стрелки тянулись до x = 9.7). В портретной
// ориентации телефона горизонтальный охват камеры почти в 4 раза меньше
// десктопного, поэтому текст уезжал далеко за края экрана.
// -----------------------------------------------------------------------------
const DESKTOP_LAYOUT = {
     bigSize: 1.8,
     line2Position: [0.6, -2.6, 0],
     smallSize: 0.3,
     line3Position: [1.4, -3.9, 0],
     triggerSize: 0.2,
     triggerPosition: [2.7, -5.2, 0],
     triggerText: 'SCROLL TO EXPLORE THE PROCESS ',
     arrowSize: 0.2,
     arrowPosition: [9.7, -5.2, 0],
};

const MOBILE_LAYOUT = {
     bigSize: 1.1,
     line2Position: [0.37, -1.59, 0],
     // Мелкий текст не уменьшаем пропорционально (получилось бы 0.18) —
     // на маленьком экране это уже нечитаемо.
     smallSize: 0.2,
     line3Position: [0.86, -2.4, 0],
     triggerSize: 0.18,
     triggerPosition: [1.5, -3.4, 0],
     // Важно: на тач-устройстве нет колеса прокрутки. Просить "SCROLL"
     // там, где физически нужен свайп, — прямая дезинформация.
     // Строка вдвое короче, что и сжимает ширину блока.
     triggerText: 'SWIPE TO EXPLORE ',
     arrowSize: 0.18,
     arrowPosition: [5.1, -3.4, 0],
};

// -----------------------------------------------------------------------------
// OPT: uniform и onBeforeCompile вынесены из компонента.
// Раньше onBeforeCompile был новой функцией на каждом рендере -> R3F
// переприсваивал её трём материалам и дёргал пересборку программы шейдера.
// Исходник шейдера идентичен прежнему.
// -----------------------------------------------------------------------------
const uTime = { value: 0 };

function wavyOnBeforeCompile(shader) {
     shader.uniforms.uTime = uTime;
     shader.vertexShader = `uniform float uTime;\n` + shader.vertexShader;
     shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>\ntransformed.z += sin(transformed.x * 0.6 + uTime
* 3.5) * 0.25;`
     );
}

// Все три "волнистых" материала компилируются в одну и ту же программу,
// различаются только uniform'ом color -> отдаём общий cache key.
const wavyCacheKey = () => 'wavyText';

// -----------------------------------------------------------------------------
// OPT: мигающие стрелки вынесены в отдельный лист-компонент.
// Раньше setArrowCount жил в AnimatedText/FlagText и каждые 0.4с
// ре-рендерил ВСЁ дерево (5 Text3D). Теперь ре-рендерится только этот узел.
// Важно: остаётся ровно один Text3D со сменой текста — если рендерить
// 4 меша и прятать лишние, drei <Center> посчитает их в bounding box
// и сдвинет весь блок. Позиции обязаны остаться прежними.
// -----------------------------------------------------------------------------
function ArrowTicker({ opacity, layout }) {
     const [arrowCount, setArrowCount] = useState(0);
     const timerRef = useRef(0);

     useFrame((_, delta) => {
          timerRef.current += delta;
          if (timerRef.current > 0.4) {
               timerRef.current = 0;
               setArrowCount((prev) => (prev + 1) % 4);
          }
     });

     return (
          <Text3D {...TEXT_ARROW} size={layout.arrowSize} position={layout.arrowPosition}>
               {ARROWS[arrowCount]}
               <meshStandardMaterial
                    color="#ffffff"
                    emissive="#ffc280"
                    emissiveIntensity={3}
                    toneMapped={false}
                    opacity={opacity}
                    transparent
                    roughness={0.1}
                    metalness={0.6}
               />
          </Text3D>
     );
}

function AnimatedText({ targetOpacity = 1, active, layout }) {
     // OPT: было императивное присваивание material.opacity через два ref.
     // Теперь один state -> ровно один ре-рендер на 5700мс, поведение то же.
     const [opacity, setOpacity] = useState(0);

     // OPT: колбэк держим в ref, чтобы таймер не перезапускался при смене
     // ссылки на active у родителя.
     const activeRef = useRef(active);
     activeRef.current = active;

     useEffect(() => {
          // OPT: добавлен clearTimeout — раньше таймер не отменялся при
          // размонтировании и дёргал setState/active у мёртвого компонента.
          const id = setTimeout(() => {
               setOpacity(targetOpacity ?? 1);
               activeRef.current?.(true);
          }, 5700);

          return () => clearTimeout(id);
     }, [targetOpacity]);

     return (
          <>
               <Text3D {...TEXT_TRIGGER} size={layout.triggerSize} position={layout.triggerPosition}>
                    {layout.triggerText}
                    <meshStandardMaterial
                         color="#ffffff"
                         emissive="#ffc280"
                         opacity={opacity}
                         emissiveIntensity={3}
                         transparent
                         toneMapped={false}
                         roughness={0.2}
                         metalness={0.8}
                    />
               </Text3D>

               <ArrowTicker opacity={opacity} layout={layout} />
          </>
     );
}

export default function FlagText({ active }) {
     const groupRef = useRef();

     // Пересборка геометрии Text3D происходит только при реальной смене
     // брейкпоинта, а не на каждый пиксель ресайза.
     const isMobile = useIsMobile();
     const layout = isMobile ? MOBILE_LAYOUT : DESKTOP_LAYOUT;

     // OPT: было три отдельных useFrame (два из них — дубли с мёртвым
     // groupRef в AnimatedText). Теперь одна подписка на render-loop.
     useFrame((state) => {
          const time = state.clock.getElapsedTime();
          uTime.value = time;
          if (groupRef.current) {
               groupRef.current.position.y = Math.sin(time * 1.5) * 0.05;
          }
     });

     return (
          <group ref={groupRef} position={[0, 1.2, 0]}>
               <Center>
                    <Text3D font="/zb.json" {...TEXT_BIG} size={layout.bigSize}>
                         Next level
                         <meshStandardMaterial
                              color="#F54927"
                              emissive="#ffc280"
                              emissiveIntensity={3}
                              toneMapped={false}
                              onBeforeCompile={wavyOnBeforeCompile}
                              customProgramCacheKey={wavyCacheKey}
                         />
                    </Text3D>

                    {/* Вторая строка — смещена вниз по оси Y */}
                    <Text3D font="/zb.json" position={layout.line2Position} {...TEXT_BIG} size={layout.bigSize}>
                         building.
                         <meshStandardMaterial
                              color="#ffffff"
                              emissive="#ffc280"
                              emissiveIntensity={3}
                              toneMapped={false}
                              onBeforeCompile={wavyOnBeforeCompile}
                              customProgramCacheKey={wavyCacheKey}
                         />
                    </Text3D>

                    <Text3D font="/zl.json" position={layout.line3Position} {...TEXT_SMALL} size={layout.smallSize}>
                         With  a digitalization formwork process.
                         <meshStandardMaterial
                              color="#ffffff"
                              emissive="#ffc280"
                              emissiveIntensity={3}
                              toneMapped={false}
                              onBeforeCompile={wavyOnBeforeCompile}
                              customProgramCacheKey={wavyCacheKey}
                         />
                    </Text3D>

                    <AnimatedText active={active} layout={layout} />
               </Center>
          </group>
     );
}
