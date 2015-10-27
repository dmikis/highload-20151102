attribute vec3 vertexPosition;
attribute vec3 vertexNormal;
attribute vec3 vertexDiffuseColor;
attribute vec3 vertexSpecularColor;

varying vec3 diffuseColor;
varying vec3 specularColor;
varying vec3 normal;

uniform mat4 mvp;

void main(void) {
    gl_Position = mvp * vec4(vertexPosition, 1);
    diffuseColor = vertexDiffuseColor;
    specularColor = vertexSpecularColor;
    normal = vertexNormal;
}
