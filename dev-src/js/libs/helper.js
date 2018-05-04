const helper = {
  downloadImg: (url, label, current, total) => (cb) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const base64String = btoa(String.fromCharCode(...new Uint8Array(xhr.response)));
          //debugger;
        if (url.indexOf('.png') !== -1) {
          base64Img = `data:image/png;base64,${base64String}`;
        } else {
          base64Img = `data:image/jpeg;base64,${base64String}`;
        }

        $('#systemInfo_processing_text').html(`${current} / ${total}`);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const image = new Image();
        image.onload = () => {
          canvas.width = image.width;
          canvas.height = image.height;
          ctx.drawImage(image, 0, 0);
          const worker = new Worker('js/worker.js');
          worker.postMessage({
            function: 'getVol',
            data: ctx.getImageData(0, 0, canvas.width, canvas.height).data,
            width: image.width,
            height: image.height,
          });
          worker.addEventListener('message', (e) => {
            worker.terminate();
            cb(null, {
              x: e.data,
              label,
            });
          });
        };
        image.src = base64Img;
      }
    });
    xhr.send();
  },
  imgToVal: (img) => {
    //debugger;
    const p = img.data;
    const pv = [];
    for (let i = 0; i < p.length; i += 1) {
      pv.push((p[i] / 255.0) - 0.5);
    }
    const x = new convnetjs.Vol(img.width, img.height, 4, 0.0);
    x.w = pv;
    return x;
  },
  drawActivations: (elt, x) => {
    const A = new convnetjs.Vol();
    A.fromJSON(x);

    const s = 2;
    const drawGrads = false;

    const w = drawGrads ? A.dw : A.w;
    const mm = cnnutil.maxmin(w);

    const canv = document.createElement('canvas');
    canv.className = 'actmap';
    const W = A.sx * s;
    const H = A.sy * s;
    canv.width = W;
    canv.height = H;
    const ctx = canv.getContext('2d');
    const g = ctx.createImageData(W, H);
    for (let d = 0; d < 3; d += 1) {
      for (let x = 0; x < A.sx; x += 1) {
        for (let y = 0; y < A.sy; y += 1) {
          if (drawGrads) {
            var dval = Math.floor((A.get_grad(x, y, d) - mm.minv) / mm.dv * 255);
          } else {
            var dval = Math.floor((A.get(x, y, d) - mm.minv) / mm.dv * 255);
          }
          for (let dx = 0; dx < s; dx += 1) {
            for (let dy = 0; dy < s; dy += 1) {
              const pp = ((W * (y * s + dy)) + (dx + x * s)) * 4;
              g.data[pp + d] = dval;
              if (d === 0) g.data[pp + 3] = 255;
            }
          }
        }
      }
    }
    ctx.putImageData(g, 0, 0);
    elt.appendChild(canv);
  },
  getLayers: (size, count) => {
    const layer = [];
    layer.push({
      type: 'input',
      out_sx: size,
      out_sy: size,
      out_depth: 3,
    });
    layer.push({
      type: 'conv',
      sx: 5,
      filters: 16,
      stride: 1,
      pad: 2,
      activation: 'relu',
    });
    layer.push({
      type: 'pool',
      sx: 2,
      stride: 2,
    });
    layer.push({
      type: 'conv',
      sx: 5,
      filters: 20,
      stride: 1,
      pad: 2,
      activation: 'relu',
    });
    layer.push({
      type: 'pool',
      sx: 2,
      stride: 2,
    });
    layer.push({
      type: 'conv',
      sx: 5,
      filters: 20,
      stride: 1,
      pad: 2,
      activation: 'relu',
    });
    layer.push({
      type: 'pool',
      sx: 2,
      stride: 2,
    });
    layer.push({
      type: 'softmax',
      num_classes: count,
    });

    return layer;
  },
};
