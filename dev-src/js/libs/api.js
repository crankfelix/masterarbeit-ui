//config.token = JSON.parse(localStorage.getItem('token')).value;
const api = {
  getQueues: async () => new Promise(async (resolve) => {
    resolve(await $.ajax({
      url: `${config.api}/queues`,
      type: 'GET',
//      headers: {
//        Authorization: `Bearer ${config.token}`,
//      },
    }));
  }),
  getModel: async modelId => new Promise(async (resolve) => {
    resolve(await $.ajax({
      url: `${config.api}/models/${modelId}`,
      type: 'GET',
//      headers: {
//        Authorization: `Bearer ${config.token}`,
//      },
    }));
  }),
  getImages: async modelId => new Promise(async (resolve) => {
    resolve(await $.ajax({
      url: `${config.api}/models/${modelId}/files`,
      type: 'GET',
//      headers: {
//        Authorization: `Bearer ${config.token}`,
//      },
    }));
  }),
  updateQueue: async queue => new Promise(async (resolve) => {
    await $.ajax({
      url: `${config.api}/queues/${queue.id}`,
      type: 'PUT',
      data: JSON.stringify(queue),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
//      headers: {
//        Authorization: `Bearer ${config.token}`,
//      },
    });
    resolve();
  }),
  updateModel: async model => new Promise(async (resolve) => {
    await $.ajax({
      url: `${config.api}/models/${model.id}`,
      type: 'PUT',
      data: JSON.stringify(model),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
//      headers: {
//        Authorization: `Bearer ${config.token}`,
//      },
    });
    resolve();
  }),
};
