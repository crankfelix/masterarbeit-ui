Array.prototype.scaleBetween = function (scaledMin, scaledMax) {
  const max = Math.max(...this);
  const min = Math.min(...this);
  return this.map(num => (scaledMax - scaledMin) * (num - min) / (max - min) + scaledMin);
};

function updateStats(stats) {
  xLossWindow.add(stats.lossx);
  wLossWindow.add(stats.lossw);
  trainAccWindow.add(stats.trainAcc);

  // visualize training status
  const fwdTimeHook = $('#fwdTime');
  const fwdTimeSlider = fwdTimeHook.find('.timeModule-range-slider-inner');
  const fwdTimeCount = fwdTimeHook.find('.timeModule-range-count');
  let fwdTimeText = '';

  const backdropTimeHook = $('#backdropTime');
  const backdropTimeSlider = backdropTimeHook.find('.timeModule-range-slider-inner');
  const backdropTimeCount = backdropTimeHook.find('.timeModule-range-count');
  let backdropTimeText = '';

  const accTimeHook = $('#accTime');
  const accTimeSlider = accTimeHook.find('.timeModule-range-slider-inner');
  const accTimeCount = accTimeHook.find('.timeModule-range-count');
  let accTimeText = '';
  const accTime = parseFloat(cnnutil.f2t(trainAccWindow.get_average())).toFixed(2);

  fwdTimeText += `${stats.fwdTime}<span>ms</span>`;
  backdropTimeText += `${stats.bwdTime}<span>ms</span>`;
  accTimeText += accTime;
  accTimeSlider.css('width', `${cnnutil.f2t(trainAccWindow.get_average()) * 100}%`);
  fwdTimeSlider.css('width', `${stats.fwdTime * 3}%`);
  backdropTimeSlider.css('width', `${stats.bwdTime * 3}%`);

  fwdTimeCount.html(fwdTimeText);
  backdropTimeCount.html(backdropTimeText);
  accTimeCount.html(accTimeText);
}

let chart = 0;
// Chart
function heartMonitor() {
  const ctx = document.getElementById('myChart').getContext('2d');
  const gradientStroke = ctx.createLinearGradient(500, 0, 100, 0);
  gradientStroke.addColorStop(0, '#00f2fe');
  gradientStroke.addColorStop(1, '#4facfe');


  const gradientFill = ctx.createLinearGradient(500, 0, 100, 0);
  gradientFill.addColorStop(0, 'rgba(0, 242, 254, 0.21)');
  gradientFill.addColorStop(1, 'rgba(33, 47, 62, 0.21)');

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['0k', '0.1k', '0.2k', '0.3k', '0.4k', '0.5k', '0.6k'],
      datasets: [{
        backgroundColor: gradientFill,
        borderColor: gradientStroke,
        pointBorderColor: gradientStroke,
        pointBackgroundColor: gradientStroke,
        pointHoverBackgroundColor: gradientStroke,
        pointHoverBorderColor: gradientStroke,
        data: [],
        lineTension: false,
      }],
    },
    options: {
      legend: {
        display: false,
      },
      elements: {
        point: {
          radius: 0,
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

function updateHeart() {
  const xa = xLossWindow.get_average();
  const xw = wLossWindow.get_average();
  if (xa >= 0 && xw >= 0) {
    addData(chart, '', (xa + xw));
    if (chart.data.datasets['0'].data.length > 25) {
      removeData(chart);
    }
  }
}

function addData(chart, label, data) {
  chart.data.labels.push(label);
  chart.data.datasets.forEach((dataset) => {
    dataset.data.push(data);
  });
  chart.update();
}

function removeData(chart) {
  chart.data.labels.shift();
  chart.data.datasets.forEach((dataset) => {
    dataset.data.shift();
  });
  chart.update();
}

// FPS
const times = [];
let fps;
let fps_counter;
let mb_counter;

function fpsinit() {
  if (times.length === 0) {
    fps_counter = $('#systemInfo_fps');
    refreshLoop();
  }
}

let credits = 25;
function updateCredits() {
  setTimeout(() => {
    credits += 1;
    $('#credits-text').html(credits);
    updateCredits();
  }, 30000);
}

function refreshLoop() {
  window.requestAnimationFrame(() => {
    const now = performance.now();
    while (times.length > 0 && times[0] <= now - 1000) {
      times.shift();
    }
    times.push(now);
    fps = times.length;
    refreshLoop();
  });
  const update_fps = debounce(() => {
    fps_counter.html(fps);
  }, 1000);

  update_fps();
}

function debounce(func, wait, immediate) {
  let timeout;
  return () => {
    const context = this;
    const args = arguments;

    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

// Timer
let sw_seconds;
let sw_minutes;
let sw_hours;

function pagetimer() {
  hoursLabel = document.getElementById('hours');
  minutesLabel = document.getElementById('minutes');
  secondsLabel = document.getElementById('seconds');
  sw_seconds = 0;
  sw_minutes = 0;
  sw_hours = 0;

  userLevelLabel = $('#userInfo-lvl-count');
  setInterval(setTime, 1000);
}

function setTime() {
  ++sw_seconds;

  if (sw_seconds >= 60) {
    sw_seconds = 0;
    ++sw_minutes;
  }

  if (sw_minutes >= 60) {
    sw_minutes = 0;
    ++sw_hours;
  }

  secondsLabel.innerHTML = pad(sw_seconds % 60);
  minutesLabel.innerHTML = pad(sw_minutes);
  hoursLabel.innerHTML = pad(sw_hours);

  userLevelLabel.html(pad(parseInt(sw_seconds / 3600) + 1));
}

function pad(val) {
  const valString = `${val}`;
  if (valString.length < 2) {
    return `0${valString}`;
  }
  return valString;
}


window.addEventListener('load', windowLoadHandler, false);
// for debug messages
const Debugger = function () { };
Debugger.log = function (message) {
  try {
    console.log(message);
  } catch (exception) {

  }
};

function windowLoadHandler() {
  canvasApp();
}

function canvasSupport() {
  return Modernizr.canvas;
}

function canvasApp() {
  if (!canvasSupport()) {
    return;
  }

  const theCanvas = document.getElementById('canvasOne');
  const context = theCanvas.getContext('2d');

  let displayWidth;
  let displayHeight;
  let timer;
  let wait;
  let count;
  let numToAddEachFrame;
  let particleList;
  let recycleBin;
  let particleAlpha;
  let r,
    g,
    b;
  let fLen;
  let m;
  let projCenterX;
  let projCenterY;
  let zMax;
  let turnAngle;
  let turnSpeed;
  let sphereRad,
    sphereCenterX,
    sphereCenterY,
    sphereCenterZ;
  let particleRad;
  let zeroAlphaDepth;
  let randAccelX,
    randAccelY,
    randAccelZ;
  let gravity;
  let rgbString;
  // we are defining a lot of variables used in the screen update functions globally so that they don't have to be redefined every frame.
  let p;
  let outsideTest;
  let nextParticle;
  let sinAngle;
  let cosAngle;
  let rotX,
    rotZ;
  let depthAlphaFactor;
  let i;
  let theta,
    phi;
  let x0,
    y0,
    z0;

  init();

  function init() {
    wait = 1;
    count = wait - 1;
    numToAddEachFrame = 4;

    // particle color
    r = 67;
    g = 205;
    b = 255;

    rgbString = `rgba(${r},${g},${b},`; // partial string for color which will be completed by appending alpha value.
    particleAlpha = 1; // maximum alpha

    displayWidth = theCanvas.width;
    displayHeight = theCanvas.height;

    fLen = 320; // represents the distance from the viewer to z=0 depth.

    // projection center coordinates sets location of origin
    projCenterX = displayWidth / 2;
    projCenterY = displayHeight / 2;

    // we will not draw coordinates if they have too large of a z-coordinate (which means they are very close to the observer).
    zMax = fLen - 2;

    particleList = {};
    recycleBin = {};

    // random acceleration factors - causes some random motion
    randAccelX = 0.1;
    randAccelY = 0.1;
    randAccelZ = 0.1;

    gravity = 0; // try changing to a positive number (not too large, for example 0.3), or negative for floating upwards.

    particleRad = 1.5;
    sphereRad = 120;
    sphereCenterX = 0;
    sphereCenterY = 0;
    sphereCenterZ = -3 - sphereRad;

    // alpha values will lessen as particles move further back, causing depth-based darkening:
    zeroAlphaDepth = -750;

    turnSpeed = 2 * Math.PI / 1600; // the sphere will rotate at this speed (one complete rotation every 1600 frames).
    turnAngle = 0; // initial angle

    timer = setInterval(onTimer, 1000 / 24);
  }

  function onTimer() {
    // if enough time has elapsed, we will add new particles.
    count++;
    if (count >= wait) {
      count = 0;
      for (i = 0; i < numToAddEachFrame; i++) {
        theta = Math.random() * 2 * Math.PI;
        phi = Math.acos(Math.random() * 2 - 1);
        x0 = sphereRad * Math.sin(phi) * Math.cos(theta);
        y0 = sphereRad * Math.sin(phi) * Math.sin(theta);
        z0 = sphereRad * Math.cos(phi);

        // We use the addParticle function to add a new particle. The parameters set the position and velocity components.
        // Note that the velocity parameters will cause the particle to initially fly outwards away from the sphere center (after
        // it becomes unstuck).
        var p = addParticle(x0, sphereCenterY + y0, sphereCenterZ + z0, 0.002 * x0, 0.002 * y0, 0.002 * z0);

        // we set some "envelope" parameters which will control the evolving alpha of the particles.
        p.attack = 50;
        p.hold = 50;
        p.decay = 160;
        p.initValue = 0;
        p.holdValue = particleAlpha;
        p.lastValue = 0;

        // the particle will be stuck in one place until this time has elapsed:
        p.stuckTime = 80 + Math.random() * 20;

        p.accelX = 0;
        p.accelY = gravity;
        p.accelZ = 0;
      }
    }

    // update viewing angle
    turnAngle = (turnAngle + turnSpeed) % (2 * Math.PI);
    sinAngle = Math.sin(turnAngle);
    cosAngle = Math.cos(turnAngle);

    // background fill
    context.clearRect(0, 0, displayWidth, displayHeight);

    // update and draw particles
    p = particleList.first;
    while (p != null) {
      // before list is altered record next particle
      nextParticle = p.next;

      // update age
      p.age++;

      // if the particle is past its "stuck" time, it will begin to move.
      if (p.age > p.stuckTime) {
        p.velX += p.accelX + randAccelX * (Math.random() * 2 - 1);
        p.velY += p.accelY + randAccelY * (Math.random() * 2 - 1);
        p.velZ += p.accelZ + randAccelZ * (Math.random() * 2 - 1);

        p.x += p.velX;
        p.y += p.velY;
        p.z += p.velZ;
      }

      /*
			We are doing two things here to calculate display coordinates.
			The whole display is being rotated around a vertical axis, so we first calculate rotated coordinates for
			x and z (but the y coordinate will not change).
			Then, we take the new coordinates (rotX, y, rotZ), and project these onto the 2D view plane.
			*/
      rotX = cosAngle * p.x + sinAngle * (p.z - sphereCenterZ);
      rotZ = -sinAngle * p.x + cosAngle * (p.z - sphereCenterZ) + sphereCenterZ;
      m = fLen / (fLen - rotZ);
      p.projX = rotX * m + projCenterX;
      p.projY = p.y * m + projCenterY;

      // update alpha according to envelope parameters.
      if (p.age < p.attack + p.hold + p.decay) {
        if (p.age < p.attack) {
          p.alpha = (p.holdValue - p.initValue) / p.attack * p.age + p.initValue;
        } else if (p.age < p.attack + p.hold) {
          p.alpha = p.holdValue;
        } else if (p.age < p.attack + p.hold + p.decay) {
          p.alpha = (p.lastValue - p.holdValue) / p.decay * (p.age - p.attack - p.hold) + p.holdValue;
        }
      } else {
        p.dead = true;
      }

      // see if the particle is still within the viewable range.
      if ((p.projX > displayWidth) || (p.projX < 0) || (p.projY < 0) || (p.projY > displayHeight) || (rotZ > zMax)) {
        outsideTest = true;
      } else {
        outsideTest = false;
      }

      if (outsideTest || p.dead) {
        recycle(p);
      } else {
        // depth-dependent darkening
        depthAlphaFactor = (1 - rotZ / zeroAlphaDepth);
        depthAlphaFactor = (depthAlphaFactor > 1) ? 1 : ((depthAlphaFactor < 0) ? 0 : depthAlphaFactor);
        context.fillStyle = `${rgbString + depthAlphaFactor * p.alpha})`;

        // draw
        context.beginPath();
        context.arc(p.projX, p.projY, m * particleRad, 0, 2 * Math.PI, false);
        context.closePath();
        context.fill();
      }

      p = nextParticle;
    }
  }

  function addParticle(x0, y0, z0, vx0, vy0, vz0) {
    let newParticle;
    let color;

    // check recycle bin for available drop:
    if (recycleBin.first != null) {
      newParticle = recycleBin.first;
      // remove from bin
      if (newParticle.next != null) {
        recycleBin.first = newParticle.next;
        newParticle.next.prev = null;
      } else {
        recycleBin.first = null;
      }
    }
    // if the recycle bin is empty, create a new particle (a new ampty object):
    else {
      newParticle = {};
    }

    // add to beginning of particle list
    if (particleList.first == null) {
      particleList.first = newParticle;
      newParticle.prev = null;
      newParticle.next = null;
    } else {
      newParticle.next = particleList.first;
      particleList.first.prev = newParticle;
      particleList.first = newParticle;
      newParticle.prev = null;
    }

    // initialize
    newParticle.x = x0;
    newParticle.y = y0;
    newParticle.z = z0;
    newParticle.velX = vx0;
    newParticle.velY = vy0;
    newParticle.velZ = vz0;
    newParticle.age = 0;
    newParticle.dead = false;
    if (Math.random() < 0.5) {
      newParticle.right = true;
    } else {
      newParticle.right = false;
    }
    return newParticle;
  }

  function recycle(p) {
    // remove from particleList
    if (particleList.first == p) {
      if (p.next != null) {
        p.next.prev = null;
        particleList.first = p.next;
      } else {
        particleList.first = null;
      }
    } else if (p.next == null) {
      p.prev.next = null;
    } else {
      p.prev.next = p.next;
      p.next.prev = p.prev;
    }
    // add to recycle bin
    if (recycleBin.first == null) {
      recycleBin.first = p;
      p.prev = null;
      p.next = null;
    } else {
      p.next = recycleBin.first;
      recycleBin.first.prev = p;
      recycleBin.first = p;
      p.prev = null;
    }
  }
}
