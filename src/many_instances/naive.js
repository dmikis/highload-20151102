ym.modules.define('many_instances.naive', [
    'Buffer',
    'GpuCpuTimeBar',
    'Program',
    'transform',

    'many_instances.naive.vert',
    'many_instances.naive.frag',
    'many_instances.logo.json'
], function (provide, Buffer, GpuCpuTimeBar, Program, transform, vsSrc, fsSrc, logoGeometry) {
    var gl = document.querySelector('#gl').getContext('webgl'),
        glW = gl.drawingBufferWidth,
        glH = gl.drawingBufferHeight,

        glAspect = glW / glH,

        timerExt = gl.getExtension('EXT_disjoint_timer_query'),
        queries = [],
        timeBar = new GpuCpuTimeBar(
            document.querySelector('#timeBar'),
            2e5 // µs
        );

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
        mvpUniform = program.getUniform('mvp'),
        colorUniform = program.getUniform('color');

    dataBuffer.setData(new Float32Array([
        -1, -1, 0,
        -1,  1, 0,
         1, -1, 0,
         1, -1, 0,
         1,  1, 0,
        -1,  1, 0
    ]), gl.STATIC_DRAW);

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

    var perspectiveMatrix = transform.perspective(0.5 * Math.PI, glAspect, 0.1, 5),
        scaleMatrix = transform.isotropicScale(0.003);

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

        var rotationMatrix = transform.rotateY(3e-3 * t);

        query = timerExt.createQueryEXT();
        timerExt.beginQueryEXT(timerExt.TIME_ELAPSED_EXT, query);
        var cpuTimeStart = performance.now();

        for (var offset = 0; offset < logoGeometry.vbuffer.length; offset += 12) {
            mvpUniform.setMatrix4(transform.multiplyMatrices(
                perspectiveMatrix,
                transform.translate(0, 0, -1),
                rotationMatrix,
                transform.translate(
                    0.4 * logoGeometry.vbuffer[offset],
                    0.4 * logoGeometry.vbuffer[offset + 1],
                    0.4 * logoGeometry.vbuffer[offset + 2]
                ),
                scaleMatrix
            ));
            colorUniform.setFloat3(
                logoGeometry.vbuffer[offset + 6],
                logoGeometry.vbuffer[offset + 7],
                logoGeometry.vbuffer[offset + 8]
            );
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        timeBar.setTime((performance.now() - cpuTimeStart) * 1e3, GpuCpuTimeBar.CPU_TIME);
        timerExt.endQueryEXT(timerExt.TIME_ELAPSED_EXT);

        queries.push(query);

        timeBar.draw();

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    provide();
});
