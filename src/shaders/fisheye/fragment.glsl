// Кастомный шейдер искажения "рыбий глаз" (barrel distortion) + виньетка.
//
// Формат postprocessing Effect:
//   mainUv(inout vec2 uv)  — правит координаты ДО выборки кадра
//   mainImage(...)         — правит цвет ПОСЛЕ выборки
//
// Доступны без объявления: vUv, aspect, resolution, texelSize, time, cameraNear/Far.

uniform float strength;   // сила искажения (0 — плоско, 0.5 — заметный шар)
uniform float zoom;       // компенсация "ухода" краёв, обычно 1.0..1.2
uniform float vignette;   // 0..1, глубина затемнения по краям

varying vec2 vFisheyeUv;

void mainUv(inout vec2 uv) {
     vec2 centered = vFisheyeUv;

     // Корректируем на соотношение сторон, чтобы искажение было круглым, а не овальным.
     centered.x *= aspect;

     float r2 = dot(centered, centered);
     centered *= 1.0 + strength * r2;
     centered /= max(zoom, 0.0001);

     centered.x /= aspect;
     uv = centered + 0.5;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
     vec2 centered = uv - 0.5;
     centered.x *= aspect;

     float r = length(centered);
     float falloff = smoothstep(0.95, 0.35, r);

     // Гасим артефакты растяжения за пределами кадра.
     float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);

     float shade = mix(1.0, falloff, clamp(vignette, 0.0, 1.0));
     outputColor = vec4(inputColor.rgb * shade * inside, inputColor.a);
}
