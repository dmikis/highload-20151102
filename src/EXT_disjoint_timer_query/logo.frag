#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

varying vec3 diffuseColor;
varying vec3 specularColor;
varying vec3 normal;

void main(void) {
    gl_FragColor = vec4(0.5 * (normal + vec3(1, 1, 1)), 1);
    gl_FragColor = vec4(specularColor, 1);
    gl_FragColor = vec4(diffuseColor, 1);
}
