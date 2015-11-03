attribute vec3 vertexPosition;
attribute vec3 instancePosition;
attribute vec3 instanceColor;

uniform mat4 perspective;
uniform mat4 rotation;
uniform mat4 scale;

varying vec3 color;

void main(void) {
    vec4 position = scale * vec4(vertexPosition, 1);
    position.xyz += 0.4 * (rotation * vec4(instancePosition, 1.0)).xyz - vec3(0, 0, 1);
    gl_Position = perspective * position;
    color = instanceColor;
}
