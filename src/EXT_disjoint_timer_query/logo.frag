#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

varying vec3 diffuseColor;

void main(void) {
    gl_FragColor = vec4(diffuseColor, 1);
}
