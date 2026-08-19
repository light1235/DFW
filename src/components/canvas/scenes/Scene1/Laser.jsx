import React, {forwardRef, useEffect, useRef} from 'react';
import {extend, useFrame, useThree} from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { animate } from 'animejs'; // v4
import 'animejs/adapters/three';

// -----------------------------------------------------------------------------
// Шейдерный материал, адаптированный под 3D-конус
// -----------------------------------------------------------------------------
const RainbowLaserMaterial = shaderMaterial(
     {
          time: 0,
          speed: 1.0,
          fade: 0.15,
          emissiveIntensity: 3.0,
          ratio: 1.0,
          uProgress: 0.0, // Новый параметр для плавной проявки луча
     },
     /* Vertex Shader */ `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * viewMatrix * modelPosition;
    }
  `,
     /* Fragment Shader */ `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float fade;
    uniform float speed;
    uniform float emissiveIntensity;
    uniform float time;
    uniform float ratio;
    uniform float uProgress; // Получаем прогресс анимации

    vec3 physhue2rgb(float hue, float ratio_val) {
      return smoothstep(vec3(0.0), vec3(1.0), abs(mod(hue + vec3(0.0, 1.0, 2.0) * ratio_val, 1.0) * 2.0 - 1.0));
    }

    vec3 iridescence (float angle, float thickness) {      
      float NxV = cos(angle);     
      float lum = 0.05064;      
      float luma = 0.01070;      
      vec3 tint = vec3(0.49639, 0.78252, 0.8723);      
      float interf0 = 2.4;      
      float phase0 = 1.0 / 2.8;      
      float interf1 = interf0 * 4.0 / 3.0;      
      float phase1 = phase0;      
      float f = (1.0 - NxV) * (1.0 - NxV);
      float interf = mix(interf0, interf1, f);
      float phase = mix(phase0, phase1, f);
      float dp = (NxV - 1.0) * 0.5;            
      vec3 hue = mix(physhue2rgb(thickness * interf0 + dp, thickness * phase0), physhue2rgb(thickness * interf1 + 0.1 + dp, thickness * phase1), f);      
      vec3 film = hue * lum + vec3(0.9639, 0.78252, 0.18723) * luma;      
      return vec3((film * 3.0 + pow(f, 12.0))) * tint;
    }

    float _saturate (float x) {
      return min(1.0, max(0.0, x));
    }

    vec3 _saturate (vec3 x) {
      return min(vec3(1., 1., 1.), max(vec3(0., 0., 0.), x));
    }

    vec3 bump3y(vec3 x, vec3 yoffset) {
      vec3 y = vec3(1., 1., 1.) - x * x;
      y = _saturate(y - yoffset);
      return y;
    }

    vec3 spectral_zucconi6(float w, float t) {    
      float x = _saturate((w - 400.0) / 300.0);
      const vec3 c1 = vec3(3.54585104, 2.93225262, 2.41593945);
      const vec3 x1 = vec3(0.69549072, 0.49228336, 0.27699880);
      const vec3 y1 = vec3(0.02312639, 0.15225084, 0.52607955);
      const vec3 c2 = vec3(3.90307140, 3.21182957, 3.96587128);
      const vec3 x2 = vec3(0.11748627, 0.86755042, 0.66077860);
      const vec3 y2 = vec3(0.84897130, 0.88445281, 0.73949448);
      return bump3y(c1 * (x - x1), y1) + bump3y(c2 * (x - x2), y2);
    }

    void main() {
      float rainbowProgress = vUv.y + (vUv.x * 0.2); 
      float w = mod((rainbowProgress - time * 0.1) * 300.0, 300.0) + 400.0; 

      vec3 c = spectral_zucconi6(w, time);
      vec3 iri = iridescence(vUv.x * 3.14159, 1.0 - vUv.y + time * 0.1);
      vec3 finalColor = c / max(vec3(0.1), iri) * 1.8;

      float edgeFade = smoothstep(0.0, fade, vUv.y) * smoothstep(1.0, 1.0 - fade, vUv.y);
      float sideFade = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
      
      // ЭФФЕКТ РОСТА: отсекаем альфу по координате vUv.y (длина конуса от 0 до 1)
      // vUv.y идет снизу вверх, поэтому инвертируем или оставляем в зависимости от направления конуса
      float growthAlpha = smoothstep((1.0 - vUv.y) - 0.05, (1.0 - vUv.y), uProgress);

      float alpha = edgeFade * sideFade * growthAlpha;

      gl_FragColor = vec4(finalColor * alpha * emissiveIntensity, alpha);
      if (gl_FragColor.a < 0.01) discard;

      #include <colorspace_fragment>
    }
  `
);

extend({ RainbowLaserMaterial });

export const ConeLaser = forwardRef((props, ref) => {
     const {
          radius = 0.3,
          height = 5.0,
          thetaLength = 6.6,
          radialSegments = 32,
          heightSegments = 1,
          speed = 1.0,
          fade = 0.15,
          emissiveIntensity = 3.0,
          ratio = 1.0,
          active = false,
          ...restProps
     } = props;

     const materialRef = useRef();
     const { invalidate } = useThree();

     useEffect(() => {
          if (!materialRef.current) return;

          // Теперь Anime.js v4 плавно анимирует свойство uProgress внутри ШЕЙДЕРА
          // Объект вообще не двигается физически, поэтому позиция не слетит!
          const animation = animate(materialRef.current, {
               uProgress: active ? 1 : 0,
               duration: 1300,
               ease: 'outQuad',
               autoplay: true,
               delay:1300,
               onUpdate: invalidate
          });

          return () => animation.pause();
     }, [active, invalidate]);

     useFrame((_, delta) => {
          if (materialRef.current) {
               materialRef.current.time -= delta * materialRef.current.speed;
          }
     });

     return (
          <mesh ref={ref} {...restProps}>
               <coneGeometry
                    args={[radius, height, radialSegments, heightSegments, false, 0, thetaLength]}
                    // МЫ УБРАЛИ self.translate(), позиция вернется в норму!
               />
               <rainbowLaserMaterial
                    ref={materialRef}
                    key={RainbowLaserMaterial.key}
                    fade={fade}
                    speed={speed}
                    ratio={ratio}
                    emissiveIntensity={emissiveIntensity}
                    toneMapped={false}
                    transparent={true}
                    side={THREE.DoubleSide}
               />
          </mesh>
     );
});

ConeLaser.displayName = 'ConeLaser';
export default ConeLaser;
