// Вершинная часть Fisheye-эффекта (postprocessing Effect).
//
// postprocessing сам генерирует main() и уже объявляет varying vec2 vUv,
// uniform float aspect / time / resolution и т.д.
// Наша задача — только определить mainSupport() и свои varying.
// Повторно объявлять vUv/aspect НЕЛЬЗЯ — будет ошибка компиляции.

varying vec2 vFisheyeUv;

void mainSupport(const in vec2 uv) {
     // Центрируем UV один раз на вершине: (0,0) — центр экрана.
     vFisheyeUv = uv - 0.5;
}
