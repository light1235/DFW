import React from 'react';
import {Bloom, ChromaticAberration, EffectComposer, Noise} from "@react-three/postprocessing";
import {BlendFunction} from "postprocessing";
import {Vector2} from "three";

const ShaderComponent = () => {
     return (
          <>
              <EffectComposer>
                  <Bloom intensity={0.2} luminanceThreshold={0.4}
                         luminanceSmoothing={0.5} mipmapBlur />
                  <Noise
                       opacity={0.60}
                       premultiply
                       // 2. Використовуємо blendFunction замість blendMode
                       blendFunction={BlendFunction.NORMAL}
                  />
                  {/*<DotScreen*/}
                  {/*     blendFunction={BlendFunction.NORMAL} // blend mode*/}
                  {/*     angle={Math.PI * 0.5} // angle of the dot pattern*/}
                  {/*     scale={1.0} // scale of the dot pattern*/}
                  {/*/>*/}
                  {/*<Scanline*/}
                  {/*     blendFunction={BlendFunction.OVERLAY} // blend mode*/}
                  {/*     density={1.25} // scanline density*/}
                  {/*/>*/}
                  <ChromaticAberration
                       offset={new Vector2(0.001, 0.001)} // Сдвиг красного и синего каналов
                  />
              </EffectComposer>
          </>
     );
};

export default ShaderComponent;
