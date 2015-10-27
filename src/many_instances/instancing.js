ym.modules.define('many_instances.instancing', [
    'Buffer',
    'GpuCpuTimeBar',
    'Program',
    'transform',

    'many_instances.instancing.vert',
    'many_instances.instancing.frag',
    'many_instances.logo.json'
], function (provide, Buffer, GpuCpuTimeBar, Program, transform, vsSrc, fsSrc, logoGeometry) {
    console.log(logoGeometry);
    var gl = document.querySelector('#gl').getContext('webgl'),
        glW = gl.drawingBufferWidth,
        glH = gl.drawingBufferHeight,

        glAspect = glW / glH,

        instancingExt = gl.getExtension('ANGLE_instanced_arrays'),
        timerExt = gl.getExtension('EXT_disjoint_timer_query'),
        queries = [],
        timeBar = new GpuCpuTimeBar(
            document.querySelector('#timeBar'),
            5000, // µs
            GpuCpuTimeBar.GPU_CPU_ORDER
        );

    if (!instancingExt) {
        throw new Error('This demo relies upon ANGLE_instanced_arrays and can\'t run w/o it')
    }

    if (!timerExt) {
        throw new Error('This demo relies upon EXT_disjoint_timer_query and can\'t run w/o it')
    }

    gl.clearColor(1, 1, 1, 1);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    gl.viewport(0, 0, glW, glH);

    var dataBuffer = new Buffer(gl, gl.ARRAY_BUFFER),
        program = new Program(gl, vsSrc, fsSrc),
        vertexPositionAttr = program.getAttributeIdx('vertexPosition'),
        instancePositionAttr = program.getAttributeIdx('instancePosition'),
        instanceColorAttr = program.getAttributeIdx('instanceColor'),
        perspectiveUniform = program.getUniform('perspective'),
        rotationUniform = program.getUniform('rotation'),
        scaleUniform = program.getUniform('scale');

    var QUAD_DATA = new Float32Array([
            -1, -1, 0,
            -1,  1, 0,
             1, -1, 0,
             1, -1, 0,
             1,  1, 0,
            -1,  1, 0
        ]),
        QUAD_DATA_BYTE_LENGTH = QUAD_DATA.buffer.byteLength;

    dataBuffer.resize(
        QUAD_DATA_BYTE_LENGTH + 4 * logoGeometry.vbuffer.length,
        gl.STATIC_DRAW
    );
    dataBuffer.setSubData(0, QUAD_DATA);
    dataBuffer.setSubData(QUAD_DATA_BYTE_LENGTH, new Float32Array(logoGeometry.vbuffer));

    var INSTANCE_SIZE = 48,
        INSTANCE_POSITION_OFFSET = QUAD_DATA_BYTE_LENGTH,
        INSTANCE_COLOR_OFFSET = QUAD_DATA_BYTE_LENGTH + 24;

    gl.enableVertexAttribArray(instancePositionAttr);
    gl.vertexAttribPointer(
        instancePositionAttr,
        3,
        gl.FLOAT,
        false,
        INSTANCE_SIZE,
        INSTANCE_POSITION_OFFSET
    );
    instancingExt.vertexAttribDivisorANGLE(
        instancePositionAttr,
        1
    );

    gl.enableVertexAttribArray(instanceColorAttr);
    gl.vertexAttribPointer(
        instanceColorAttr,
        3,
        gl.FLOAT,
        false,
        INSTANCE_SIZE,
        INSTANCE_COLOR_OFFSET
    );
    instancingExt.vertexAttribDivisorANGLE(
        instanceColorAttr,
        1
    );

    gl.enableVertexAttribArray(vertexPositionAttr);
    gl.vertexAttribPointer(
        vertexPositionAttr,
        3,
        gl.FLOAT,
        false,
        0,
        0
    );

    program.use();

    perspectiveUniform.setMatrix4(
        transform.perspective(0.5 * Math.PI, glAspect, 0.1, 5)
    );
    scaleUniform.setMatrix4(
        transform.isotropicScale(0.003)
    );

    function render (t) {
        var query;

        if (!gl.getParameter(timerExt.GPU_DISJOINT_EXT)) {
            if (
                queries.length &&
                timerExt.getQueryObjectEXT(
                    queries[0],
                    timerExt.QUERY_RESULT_AVAILABLE_EXT
                )
            ) {
                query = queries.shift();
                timeBar.setTime(
                    timerExt.getQueryObjectEXT(
                        query,
                        timerExt.QUERY_RESULT_EXT
                    ) * 1e-3,
                    GpuCpuTimeBar.GPU_TIME
                );
                timerExt.deleteQueryEXT(query);
            }
        } else {
            while ((query = queries.shift())) {
                timerExt.deleteQueryEXT(query);
            }
        }

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        query = timerExt.createQueryEXT();
        timerExt.beginQueryEXT(timerExt.TIME_ELAPSED_EXT, query);
        var cpuTimeStart = performance.now();

        rotationUniform.setMatrix4(transform.rotateY(3e-3 * t));

        instancingExt.drawArraysInstancedANGLE(
            gl.TRIANGLES,
            0,
            6,
            logoGeometry.vbuffer.length / 12
        );

        timeBar.setTime((performance.now() - cpuTimeStart) * 1e3, GpuCpuTimeBar.CPU_TIME);
        timerExt.endQueryEXT(timerExt.TIME_ELAPSED_EXT);

        queries.push(query);

        timeBar.draw();

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    provide();
});
