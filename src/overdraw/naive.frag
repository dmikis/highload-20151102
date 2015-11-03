#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

const int ITER_NUM = 1000;

varying vec3 diffuseColor;

uniform float alphaStep;

void main(void) {
    vec4 color = vec4(diffuseColor, 0);
    for (int i = 0; i < ITER_NUM; ++i) {
        color = vec4(color.rgb, clamp(color.a + alphaStep, 0.0, 1.0));
    }
    gl_FragColor = color;
}
