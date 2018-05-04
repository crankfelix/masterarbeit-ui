self.addEventListener('message', async (e) => {
  switch (e.data.function) {
    case 'train':
      await self.trainer.train();
      self.postMessage({ type: 'done', data: self.trainer.getNetJson() });
      break;
    case 'getVol':
      self.postMessage(helper.imgToVal(e.data));
      break;
    default:
      self.trainer = new Trainer(
        self.postMessage,
        e.data.model,
        e.data.testData,
        e.data.trainData,
      );
  }
}, false);
