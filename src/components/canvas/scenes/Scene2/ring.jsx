import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ВНИМАНИЕ: этот файл нигде не импортируется — дубль AnimatedTorus из ./index.jsx.
// Значения здесь ДРУГИЕ (torus 2.5 / tube 0.5, lerp до 4.0), поэтому компонент
// оставлен как есть и не «синхронизирован» с рабочей версией. Если он не нужен —
// файл можно удалить, если нужен — стоит выпилить копию из index.jsx и брать её отсюда.

// -----------------------------------------------------------------------------
// OPT: uniforms поднялись на уровень модуля.
// torus анимируется только от глобального clock и не зависит от пропсов,
// tube — константа. Значит все экземпляры могут делить одни и те же объекты
// uniform: запись одинакового значения из нескольких useFrame идемпотентна.
// -----------------------------------------------------------------------------
const sharedUniforms = {
     torus: { value: 2.5 },
     tube: { value: 0.5 },
};

// OPT: onBeforeCompile больше не пересоздаётся на каждый рендер.
// Раньше useMemo спасал от пересоздания функции, но Three.js всё равно
// вызывает onBeforeCompile.toString() внутри дефолтного customProgramCacheKey()
// при подготовке материала — это аллокация большой строки на каждый кадр.
const handleBeforeCompile = (shader) => {
     shader.uniforms.torus = sharedUniforms.torus;
     shader.uniforms.tube = sharedUniforms.tube;
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

// OPT: константный cache key вместо toString() модифицирующей функции.
// Программа шейдера у всех экземпляров одна и та же, различий нет.
const programCacheKey = () => 'animated-torus-ring';

// OPT: args вынесены из JSX — инлайн-массив заставлял R3F пересобирать
// ToruGeometry (36 * 72 сегментов) на каждом рендере.
const TORUS_ARGS = [2, 1, 36, 72];

export function AnimatedTorus({ scale = 0.5, position = [0, 0, 0], rotation = [0, 0, 0] }) {
     // OPT: убран неиспользуемый meshRef.
     const uniforms = useMemo(() => sharedUniforms, []);

     // Анимация
     useFrame((state) => {
          // Внимание: деление по модулю % 2 создаёт резкий скачок в конце цикла
          const t = (state.clock.getElapsedTime() % 2) / 2;
          uniforms.torus.value = THREE.MathUtils.lerp(2, 4, t);
     });

     return (
          <mesh scale={scale} position={position} rotation={rotation}>
               <torusGeometry args={TORUS_ARGS} />
               <meshLambertMaterial
                    color="lightyellow"
                    onBeforeCompile={handleBeforeCompile}
                    customProgramCacheKey={programCacheKey}
               />
          </mesh>
     );
}

// <AnimatedTorus scale={0.15} position={[0,0,2]} rotation={[2,0,0]} />
