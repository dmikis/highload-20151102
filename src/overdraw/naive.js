ym.modules.define('overdraw.naive', [
    'Buffer',
    'GpuCpuTimeBar',
    'Program',
    'transform',

    'EXT_disjoint_timer_query.logo.json',
    'overdraw.naive.vert',
    'overdraw.naive.frag'
], function (provide, Buffer, GpuCpuTimeBar, Program, transform, logoGeometry, vsSrc, fsSrc) {
    var gl = document.querySelector('#gl').getContext('webgl'),
        glW = gl.drawingBufferWidth,
        glH = gl.drawingBufferHeight,
        glAspect = glW / glH,

        timerExt = gl.getExtension('EXT_disjoint_timer_query'),
        queries = [],
        timeBar = new GpuCpuTimeBar(
            document.querySelector('#timeBar'),
            6000 // µs
        );

    if (!timerExt) {
        throw new Error('This demo relies upon EXT_disjoint_timer_query and can\'t run w/o it')
    }

    gl.clearColor(1, 1, 1, 1);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFuncSeparate(
        gl.SRC_ALPHA,
        gl.ONE_MINUS_SRC_ALPHA,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA
    );

    gl.viewport(0, 0, glW, glH);

    var vertexBuffer = new Buffer(gl, gl.ARRAY_BUFFER),
        indexBuffer = new Buffer(gl, gl.ELEMENT_ARRAY_BUFFER),
        program = new Program(gl, vsSrc, fsSrc),
        vertexPositionAttr = program.getAttributeIdx('vertexPosition'),
        vertexDiffuseColorAttr = program.getAttributeIdx('vertexDiffuseColor'),
        mvpUniform = program.getUniform('mvp'),
        alphaStepUniform = program.getUniform('alphaStep');

    var QUAD_DATA = new Float32Array([
            -1, -1, -0.5,
            -1,  1, -0.5,
             1, -1, -0.5,
             1, -1, -0.5,
             1,  1, -0.5,
            -1,  1, -0.5
        ]),
        QUAD_DATA_BYTE_LENGTH = QUAD_DATA.buffer.byteLength;

    vertexBuffer.resize(
        QUAD_DATA_BYTE_LENGTH + 4 * logoGeometry.vbuffer.length,
        gl.STATIC_DRAW
    );
    vertexBuffer.setSubData(0, QUAD_DATA);
    vertexBuffer.setSubData(QUAD_DATA_BYTE_LENGTH, new Float32Array(logoGeometry.vbuffer));

    indexBuffer.setData(new Uint16Array(logoGeometry.ibuffer), gl.STATIC_DRAW);

    var VERTEX_SIZE = 48;

    program.use();

    gl.enableVertexAttribArray(vertexPositionAttr);

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

        mvpUniform.setMatrix4(transform.multiplyMatrices(
            transform.perspective(0.5 * Math.PI, glAspect, 0.1, 2),
            transform.translate(0, 0, -1),
            transform.rotateY(3e-3 * t),
            transform.isotropicScale(0.35)
        ));
        alphaStepUniform.setFloat(0.001);

        gl.vertexAttribPointer(
            vertexPositionAttr,
            3,
            gl.FLOAT,
            false,
            VERTEX_SIZE,
            QUAD_DATA_BYTE_LENGTH
        );

        gl.enableVertexAttribArray(vertexDiffuseColorAttr);
        gl.vertexAttribPointer(
            vertexDiffuseColorAttr,
            3,
            gl.FLOAT,
            false,
            VERTEX_SIZE,
            QUAD_DATA_BYTE_LENGTH + 24
        );

        query = timerExt.createQueryEXT();
        timerExt.beginQueryEXT(timerExt.TIME_ELAPSED_EXT, query);
        var cpuTimeStart = performance.now();
        gl.drawElements(
            gl.TRIANGLES,
            logoGeometry.ibuffer.length,
            gl.UNSIGNED_SHORT,
            0
        );
        timeBar.setTime((performance.now() - cpuTimeStart) * 1e3, GpuCpuTimeBar.CPU_TIME);
        timerExt.endQueryEXT(timerExt.TIME_ELAPSED_EXT);

        queries.push(query);

        gl.vertexAttribPointer(
            vertexPositionAttr,
            3,
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.disableVertexAttribArray(vertexDiffuseColorAttr);
        gl.vertexAttrib3f(vertexDiffuseColorAttr, 0, 1, 0);

        mvpUniform.setMatrix4(transform.isotropicScale(0.5));
        alphaStepUniform.setFloat(0.0005);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        timeBar.draw();

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    provide();
});
