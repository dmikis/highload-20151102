ym.modules.define('GpuCpuTimeBar', [
    'MedianFilter',
    'util.defineClass'
], function (provide, MedianFilter, defineClass) {
    function GpuCpuTimeBar (canvas, scale) {
        this._scale = scale;
        this._scaledTime = {gpu: 0, cpu: 0};
        this._filter = {
            gpu: new MedianFilter({windowSize: 25}),
            cpu: new MedianFilter({windowSize: 25})
        };
        this._w = canvas.width >> 1;
        this._h = canvas.height;
        this._ctx = canvas.getContext('2d');
    }

    var GPU_TIME = GpuCpuTimeBar.GPU_TIME = 'gpu',
        CPU_TIME = GpuCpuTimeBar.CPU_TIME = 'cpu';

        COLORS = {gpu: 'blue', cpu: 'green'},

        OFFSET = {cpu: 0, gpu: 30};

    provide(defineClass(GpuCpuTimeBar, {
        setTime: function (time, kind) {
            this._scaledTime[kind] =
                this._h * this._filter[kind].filter(time) / this._scale;
        },

        draw: function () {
            this._ctx.clearRect(0, 0, this._w << 1, this._h);
            this._drawBar(CPU_TIME);
            this._drawBar(GPU_TIME);
        },

        _drawBar: function (kind) {
            var ctx = this._ctx,
                scaledTime = this._scaledTime[kind];

            ctx.fillStyle = COLORS[kind];
            ctx.fillRect(
                OFFSET[kind], this._h - scaledTime,
                this._w, scaledTime
            );
        }
    }));
});
