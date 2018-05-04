let xLossWindow = new cnnutil.Window(100);
let wLossWindow = new cnnutil.Window(100);
let trainAccWindow = new cnnutil.Window(100);

$(document).ready(() => {
  const introVideo = $('#introVideo > video').get(0);
  const introVideoWrapper = $('#introVideo');

  const clean = () => {
    $('#systemInfo_processing').hide();
    $('#testset_vis > .testdiv').remove();

    $('.main').fadeOut(() => {
      introVideoWrapper.fadeIn();
    });

    xLossWindow = new cnnutil.Window(100);
    wLossWindow = new cnnutil.Window(100);
    trainAccWindow = new cnnutil.Window(100);
    run();
  };

  const run = async () => {
    const queues = await api.getQueues();
    if (queues.length > 0) {
      const queue = queues[0];
      queue.status = 'PROCESSING';
      await api.updateQueue(queue);
      // Get Model
      const model = await api.getModel(queue.data.modelId);

      // Get images for Model
      const images = await api.getImages(model.id);
      const downloadImgs = [];
      images.forEach((img, index) => {
        const path = `${config.api}/models/${model.id}/files/${img.label}/${img.id}`;
        downloadImgs.push(helper.downloadImg(path, img.label, index, images.length));
      });

      // Download image and create convnet vol
      $('#systemInfo_processing').show();
      parallel(downloadImgs, 5, async (err, data) => {
        const testData = [];
        const trainData = [];
        data.forEach((obj, index) => {
          if (index % 8 === 0) {
            testData.push(obj);
          } else {
            trainData.push(obj);
          }
        });

        // Create Trainer
        const worker = new Worker('js/worker.js');
        worker.postMessage({
          function: 'init',
          model,
          testData,
          trainData,
        });

        // Train the model
        introVideoWrapper.fadeOut(() => {
          updateCredits();
          fpsinit();
          pagetimer();
          heartMonitor();
          $('.main').css('display', 'flex').hide().fadeIn();
        });

        worker.postMessage({ function: 'train' });
        worker.addEventListener('message', (e) => {
          switch (e.data.type) {
            case 'train':
              // Show train steps
              const stats = e.data.data;
              updateStats(stats);

              if (stats.current % 20 === 0) {
                updateHeart();
              }
              break;
            case 'clean':
              const testDivs = $('#testset_vis > .testdiv');
              if (testDivs.length > 3) {
                testDivs.remove();
              }
              break;
            case 'test':
              const sample = e.data.data;
              const div = document.createElement('div');
              div.className = 'testdiv';

              helper.drawActivations(div, sample.x, 2);
              const probsdiv = document.createElement('div');
              const normalized = sample.normalized.scaleBetween(10, 100);

              let t = '';
              for (let k = 0; k < 3; k += 1) {
                const col = sample.preds[k].k === sample.y ? 'pp_blue' : 'pp_red';
                t += `<div class="probsdiv-item"><div class="probsdiv-percentWrapper"><div class="pp ${col}" style="width:${normalized[k]}%;"></div></div><span>${sample.labels[sample.preds[k].k]}</span></div>`;
              }

              probsdiv.innerHTML = t;
              probsdiv.className = 'probsdiv';
              div.appendChild(probsdiv);
              $(div).prependTo($('#testset_vis')).addClass('testdiv_fadeIn').toggleClass('testdiv_trans');
              break;
            case 'done':
              queue.status = 'DONE';
              api.updateQueue(queue).then(() => {
                model.data = e.data.data;
                api.updateModel(model).then(() => {
                  setTimeout(() => {
                    clean();
                  }, 3000);
                });
              });
              break;
          }
        });
      });
    } else {
      setTimeout(() => {
        run();
      }, 2000);
    }
  };

  $('#systemInfo_processing').hide();
  run();
});
