import React, { useRef, useMemo } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';



export function AnimatedTorus({ scale = 0.5, position = [0, 0, 0], rotation = [0, 0, 0] }) {

     const meshRef = useRef();



// Стабильные униформы

     const uniforms = useMemo(() => ({

          torus: { value: 2.5 },

          tube: { value: 0.5 }

     }), []);



// Модификация шейдера

     const handleBeforeCompile = useMemo(() => {

          return (shader) => {

               shader.uniforms.torus = uniforms.torus;

               shader.uniforms.tube = uniforms.tube;

               shader.vertexShader = `

uniform float torus;

uniform float tube;

${shader.vertexShader}

`.replace(

                    `#include <begin_vertex>`,

                    `#include <begin_vertex>

vec2 normalizedRadius = normalize(position.xy);

vec3 nominalCenter = vec3(normalizedRadius * 2., 0.);

vec3 dirFromNominalCenter = normalize(position - nominalCenter);

vec3 tubeCenter = vec3(normalizedRadius * torus, 0.);

vec3 tubeRadius = dirFromNominalCenter * tube;

transformed = tubeCenter + tubeRadius;`

               );

          };

     }, [uniforms]);



// Анимация

     useFrame((state) => {

// Внимание: деление по модулю % 2 создает резкий скачок в конце цикла

          const t = (state.clock.getElapsedTime() % 2) / 2;

          uniforms.torus.value = THREE.MathUtils.lerp(2, 4, t);

     });



     return (

// Исправлено: scale использует проп, postion заменено на position

          <mesh ref={meshRef} scale={scale} position={position} rotation={rotation}>

               <torusGeometry args={[2, 1, 36, 72]} />

               <meshLambertMaterial color="lightyellow" onBeforeCompile={handleBeforeCompile} />

          </mesh>

     );

}



// <AnimatedTorus scale={0.15} position={[0,0,2]} rotation={[2,0,0]} />

