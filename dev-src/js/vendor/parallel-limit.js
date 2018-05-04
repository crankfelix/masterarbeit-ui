const parallel = (tasks, limit, cb) => {
  let results;
  let len;
  let pending;
  let keys;
  let isErrored;
  let isSync = true;

  if (Array.isArray(tasks)) {
    results = [];
    pending = len = tasks.length;
  } else {
    keys = Object.keys(tasks);
    results = {};
    pending = len = keys.length;
  }

  function done(err) {
    function end() {
      if (cb) cb(err, results);
      cb = null;
    }
    if (isSync) process.nextTick(end);
    else end();
  }

  function each(i, err, result) {
    results[i] = result;
    if (err) isErrored = true;
    if (--pending === 0 || err) {
      done(err);
    } else if (!isErrored && next < len) {
      let key;
      if (keys) {
        key = keys[next];
        next += 1;
        tasks[key]((err, result) => { each(key, err, result); });
      } else {
        key = next;
        next += 1;
        tasks[key]((err, result) => { each(key, err, result); });
      }
    }
  }

  let next = limit;
  if (!pending) {
    // empty
    done(null);
  } else if (keys) {
    // object
    keys.some((key, i) => {
      tasks[key]((err, result) => { each(key, err, result); });
      if (i === limit - 1) return true; // early return
    });
  } else {
    // array
    tasks.some((task, i) => {
      task((err, result) => { each(i, err, result); });
      if (i === limit - 1) return true; // early return
    });
  }

  isSync = false;
};
