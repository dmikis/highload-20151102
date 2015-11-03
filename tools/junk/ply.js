var fs = require('fs');

var inputFile1 = process.argv[2],
    inputFile2 = process.argv[3],
    outputFile = process.argv[4];

console.assert(inputFile1 && inputFile2 && outputFile);

var plyTokens1 = fs.readFileSync(inputFile1).toString()
    .trim()
    .split('\n')
    .map(function (line) {
        return line.trim().split(/\s+/);
    }),
    plyTokens2 = fs.readFileSync(inputFile2).toString()
    .trim()
    .split('\n')
    .map(function (line) {
        return line.trim().split(/\s+/);
    });

function indexOfFirstPredicate(arr, predicate) {
    for (var i = 0; i < arr.length; ++i) {
        if (predicate(arr[i], i, arr)) return i;
    }
    return -1;
}

function find(arr, predicate) {
    return arr[indexOfFirstPredicate(arr, predicate)];
}

var verticesNum = parseInt(find(plyTokens1, function (line) {
        return line[0] == 'element' && line[1] == 'vertex';
    })[2], 10),
    facesNum = parseInt(find(plyTokens1, function (line) {
        return line[0] == 'element' && line[1] == 'face';
    })[2], 10),
    headerEndIndex = indexOfFirstPredicate(plyTokens1, function (line) {
        return line[0] == 'end_header';
    }) + 1,
    vertexBuffer1 = plyTokens1.slice(headerEndIndex, headerEndIndex + verticesNum)
        .reduce(function (buffer, line) {
            return buffer.concat(line.map(parseFloat));
        }, []),
    vertexBuffer2 = plyTokens2.slice(headerEndIndex, headerEndIndex + verticesNum)
        .reduce(function (buffer, line) {
            return buffer.concat(line.map(parseFloat));
        }, []),
    indexBuffer = plyTokens1.slice(
        headerEndIndex + verticesNum,
        headerEndIndex + verticesNum + facesNum
    )
        .reduce(function (buffer, line) {
            return buffer.concat(line.slice(1).map(function (token) {
                return parseInt(token, 10);
            }));
        }, []),
    out = new Array(verticesNum * 12);

var gCenterX = 0, gCenterY = 0, gCenterZ = 0;

console.log(vertexBuffer1.length);

for (var offset = 0, vbOffset = 0; offset < out.length;) {
    out[offset++] = vertexBuffer1[vbOffset++];
    out[offset++] = vertexBuffer1[vbOffset++];
    out[offset++] = vertexBuffer1[vbOffset++];
    out[offset++] = vertexBuffer1[vbOffset++];
    out[offset++] = vertexBuffer1[vbOffset++];
    out[offset++] = vertexBuffer1[vbOffset++];
    out[offset++] = vertexBuffer1[vbOffset++] / 255;
    out[offset++] = vertexBuffer1[vbOffset++] / 255;
    out[offset++] = vertexBuffer1[vbOffset++] / 255;
    out[offset++] = 1;
    out[offset++] = 1;
    out[offset++] = 1;
}

fs.writeFileSync(
    outputFile,
    JSON.stringify({
        vbuffer: out,
        ibuffer: indexBuffer
    })
);
