attribute vec3 vertexPosition;
attribute vec3 vertexDiffuseColor;

varying vec3 diffuseColor;

uniform mat4 mvp;

void main(void) {
    gl_Position = mvp * vec4(vertexPosition, 1);
    diffuseColor = vertexDiffuseColor;
}
