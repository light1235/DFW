import {useEffect, useRef} from "react";
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
               delay:2100,
          });

     })

     const textOptions = {
          size: 0.02,
          height: 0.003,
          curveSegments: 8,
          lineHeight: 1.2,
          letterSpacing: 0.01
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
