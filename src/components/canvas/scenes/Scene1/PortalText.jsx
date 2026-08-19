import {useEffect, useRef, useState} from "react";
import {useFrame} from "@react-three/fiber";
import {Center, Text3D} from "@react-three/drei";
import {animate} from "animejs";
import 'animejs/adapters/three';


export default function PortalText() {

     const groupRef = useRef()

     useEffect(() => {
          animate(groupRef.current, {
               opacity:[0,1],
               duration: 1500,
               ease: 'outQuad',
               autoplay: true,
               delay:4000,
          });

     })



     // const textOptions = { size: 0.04, height: 0.1, curveSegments: 12, lineHeight:
     //           0.4, letterSpacing: 0.05 };
     const textOptions = {
          size: 0.02,           // Ваш фиксированный маленький размер
          height: 0.003,        // Уменьшили толщину в 30 раз, чтобы буквы не сливались
          curveSegments: 8,     // Для мелкого текста 8 сегментов достаточно (сэкономит полигоны)
          lineHeight: 1.2,      // Важно: увеличили с 0.4, чтобы строки не наезжали друг на друга
          letterSpacing: 0.01   // Чуть уменьшили отступ для микро-размера
     };
     return (
          <group ref={groupRef} position={[0,1.2,3]}>
               <Center>
                    <Text3D font="/zb.json" {...textOptions}>
                         «Click to enter»
                         <meshStandardMaterial
                              color="#ffc280"   toneMapped={false}
                         />
                    </Text3D>
               </Center>
          </group>
     );
}
