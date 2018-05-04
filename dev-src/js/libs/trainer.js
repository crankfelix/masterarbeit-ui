class Trainer {
  constructor(message, model, testData, trainData) {
    this.model = model;
    this.net = new convnetjs.Net();
    this.message = message;
    this.trainer = null;
    this.testData = testData;
    this.trainData = trainData;
    this.result = [];

    this.net.makeLayers(helper.getLayers(model.size, model.labels.length));
    this.trainer = new convnetjs.SGDTrainer(this.net, {
      method: 'adadelta',
      batch_size: 4,
      l2_decay: 0.0001,
    });
  }

  train() {
    return new Promise((resolve) => {
      const trainDataParallel = [];
      this.trainData.forEach((elm, index) => {
        const obj = this.trainData[Math.floor(Math.random() * this.trainData.length)];
        const labelKey = this.model.labels.indexOf(obj.label);
        this.imgToVolAndTrain(this.message, obj.x, labelKey, index);
      });
      resolve();
    });
  }

  test(message) {
    Array.prototype.scaleBetween = (scaledMin, scaledMax) => {
      const max = Math.max(...this);
      const min = Math.min(...this);
      return this.map(num => (scaledMax - scaledMin) * (num - min) / (max - min) + scaledMin);
    };

    const classes = this.net.layers[this.net.layers.length - 1].out_depth;
    const sample = this.testData[Math.floor(Math.random() * this.testData.length)];

    const aavg = new convnetjs.Vol(1, 1, classes, 0.0);
    const y = this.model.labels.indexOf(sample.label);

    aavg.addFrom(this.net.forward(sample.x));
    const preds = [];
    for (let k = 0; k < aavg.w.length; k += 1) {
      preds.push({ k, p: aavg.w[k] });
    }
    preds.sort((a, b) => (a.p < b.p ? 1 : -1));

    const toNormalize = [];
    for (let k = 0; k < 3; k += 1) {
      toNormalize.push(Math.floor((preds[k].p / 1) * 100));
    }

    message({
      type: 'test',
      data: {
        x: sample.x,
        labels: this.model.labels,
        normalized: toNormalize,
        preds,
        y,
      },
    });
  }

  imgToVolAndTrain(message, x, label, current) {
    const stats = this.trainer.train(x, label);
    const lossx = stats.cost_loss;
    const lossw = stats.l2_decay_loss;

    const yhat = this.net.getPrediction();
    const trainAcc = yhat === label ? 1.0 : 0.0;

    message({
      type: 'train',
      data: {
        lossx,
        lossw,
        trainAcc,
        fwdTime: stats.fwd_time,
        bwdTime: stats.bwd_time,
        current,
      },
    });

    if ((current % 20 === 0 && current > 0) || current === 20) {
      message({ type: 'clean' });
      for (let num = 0; num < 4; num += 1) {
        this.test(message);
      }
    }
  }

  getNetJson() {
    return this.net.toJSON();
  }
}
