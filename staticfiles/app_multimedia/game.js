(() => {
  const canvas = document.getElementById('canvas-3d');
  const startButton = document.getElementById('game-start');
  const status = document.getElementById('game-status');
  const scoreDisplay = document.getElementById('game-score');
  const timeDisplay = document.getElementById('game-time');
  const streakDisplay = document.getElementById('game-streak');
  const difficultyButtons = Array.from(document.querySelectorAll('.difficulty-button'));
  const leftButton = document.getElementById('drive-left');
  const rightButton = document.getElementById('drive-right');

  if (!canvas || !startButton || !status || !scoreDisplay || !timeDisplay || !streakDisplay || !leftButton || !rightButton) {
    return;
  }

  if (!window.THREE) {
    status.textContent = 'No se pudo cargar el escenario 3D. Comprueba tu conexión e inténtalo de nuevo.';
    startButton.disabled = true;
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene.fog = new THREE.Fog(0xa8dcf5, 48, 125);

  scene.add(new THREE.HemisphereLight(0xd5f2ff, 0x405344, 2.1));
  const sunlight = new THREE.DirectionalLight(0xfff0cc, 2.4);
  sunlight.position.set(-4, 9, 7);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  sunlight.shadow.camera.left = -12;
  sunlight.shadow.camera.right = 12;
  sunlight.shadow.camera.top = 12;
  sunlight.shadow.camera.bottom = -8;
  scene.add(sunlight);

  function makeNoiseGrid(width, height) {
    return Array.from({ length: height }, () =>
      Float32Array.from({ length: width }, () => Math.random())
    );
  }

  function sampleNoise(grid, x, y) {
    const height = grid.length;
    const width = grid[0].length;
    const scaledX = x * (width - 1);
    const scaledY = y * (height - 1);
    const x0 = Math.floor(scaledX);
    const y0 = Math.floor(scaledY);
    const x1 = Math.min(width - 1, x0 + 1);
    const y1 = Math.min(height - 1, y0 + 1);
    const blendX = scaledX - x0;
    const blendY = scaledY - y0;
    const top = grid[y0][x0] * (1 - blendX) + grid[y0][x1] * blendX;
    const bottom = grid[y1][x0] * (1 - blendX) + grid[y1][x1] * blendX;
    return top * (1 - blendY) + bottom * blendY;
  }

  function createCloudTexture() {
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 512;
    textureCanvas.height = 256;
    const context = textureCanvas.getContext('2d');
    const image = context.createImageData(textureCanvas.width, textureCanvas.height);
    const noiseLayers = [
      { grid: makeNoiseGrid(8, 4), weight: 0.5 },
      { grid: makeNoiseGrid(16, 8), weight: 0.27 },
      { grid: makeNoiseGrid(32, 16), weight: 0.15 },
      { grid: makeNoiseGrid(64, 32), weight: 0.08 }
    ];

    for (let y = 0; y < textureCanvas.height; y += 1) {
      for (let x = 0; x < textureCanvas.width; x += 1) {
        const u = x / (textureCanvas.width - 1);
        const v = y / (textureCanvas.height - 1);
        const noise = noiseLayers.reduce(
          (sum, layer) => sum + sampleNoise(layer.grid, u, v) * layer.weight,
          0
        );
        const edgeFade = Math.min(1, v * 5, (1 - v) * 5, u * 5, (1 - u) * 5);
        const cloud = THREE.MathUtils.smoothstep(noise, 0.49, 0.68) * edgeFade;
        const pixel = (y * textureCanvas.width + x) * 4;
        image.data[pixel] = 255;
        image.data[pixel + 1] = 255;
        image.data[pixel + 2] = 255;
        image.data[pixel + 3] = Math.round(cloud * 235);
      }
    }

    context.putImageData(image, 0, 0);
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  const cloudTexture = createCloudTexture();
  const cloudMaterial = new THREE.MeshBasicMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  [
    { x: -13, y: 7.5, z: -34, width: 31, height: 12 },
    { x: 12, y: 9, z: -43, width: 35, height: 13 },
    { x: -3, y: 11, z: -61, width: 42, height: 14 }
  ].forEach(({ x, y, z, width, height }) => {
    const cloud = new THREE.Mesh(new THREE.PlaneGeometry(width, height), cloudMaterial);
    cloud.position.set(x, y, z);
    scene.add(cloud);
  });

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 150),
    new THREE.MeshStandardMaterial({ color: 0x344c3b, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -1.17, -45);
  ground.receiveShadow = true;
  scene.add(ground);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(7.5, 150),
    new THREE.MeshStandardMaterial({ color: 0x343b43, roughness: 0.92 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -1.105, -45);
  road.receiveShadow = true;
  scene.add(road);

  const roadPaint = new THREE.MeshStandardMaterial({
    color: 0xffe6a3,
    emissive: 0x543a12,
    roughness: 0.7
  });
  const laneMarkers = [];
  for (let index = 0; index < 18; index += 1) {
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.025, 2.6), roadPaint);
    marker.position.set(0, -1.065, 16 - index * 6.5);
    scene.add(marker);
    laneMarkers.push(marker);
  }

  const roadEdgeMaterial = new THREE.MeshStandardMaterial({ color: 0xf4d9ac, roughness: 0.8 });
  [-3.35, 3.35].forEach((x) => {
    const edgeLine = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.025, 150), roadEdgeMaterial);
    edgeLine.position.set(x, -1.065, -45);
    scene.add(edgeLine);
  });

  const mountainMaterial = new THREE.MeshStandardMaterial({ color: 0x526357, roughness: 1, flatShading: true });
  const mountainFarMaterial = new THREE.MeshStandardMaterial({ color: 0x74535b, roughness: 1, flatShading: true });
  for (let index = 0; index < 11; index += 1) {
    const side = index % 2 ? 1 : -1;
    const mountain = new THREE.Mesh(
      new THREE.ConeGeometry(3 + (index % 3), 5 + ((index * 7) % 5), 5 + (index % 3)),
      index % 3 ? mountainMaterial : mountainFarMaterial
    );
    mountain.position.set(side * (7 + (index % 4) * 2.7), 1.1, -24 - Math.floor(index / 2) * 13);
    mountain.rotation.y = index * 0.72;
    scene.add(mountain);
  }

  const roadsideMarkers = [];
  const postMaterial = new THREE.MeshStandardMaterial({
    color: 0xe9e0ca,
    emissive: 0x30271b,
    roughness: 0.8
  });
  const reflectorMaterial = new THREE.MeshBasicMaterial({ color: 0xffc66d });
  for (let index = 0; index < 14; index += 1) {
    [-1, 1].forEach((side) => {
      const marker = new THREE.Group();
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), postMaterial);
      post.position.y = -0.68;
      const reflector = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.17, 0.035), reflectorMaterial);
      reflector.position.set(0, -0.53, 0.06);
      marker.add(post, reflector);
      marker.position.set(side * 4.25, 0, 13 - index * 8);
      scene.add(marker);
      roadsideMarkers.push(marker);
    });
  }

  const truck = new THREE.Group();
  const truckPaint = new THREE.MeshStandardMaterial({
    color: 0xe84d3d,
    roughness: 0.35,
    metalness: 0.25
  });
  const trailerPaint = new THREE.MeshStandardMaterial({
    color: 0xf4f0e5,
    roughness: 0.5,
    metalness: 0.08
  });
  const darkTrim = new THREE.MeshStandardMaterial({ color: 0x28313b, roughness: 0.7 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x85d4e8,
    emissive: 0x163843,
    roughness: 0.2,
    metalness: 0.25
  });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xb9c5cc, metalness: 0.78, roughness: 0.24 });
  const trimStripe = new THREE.MeshStandardMaterial({ color: 0xc84436, roughness: 0.42 });
  const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x15191e, roughness: 0.88 });
  const hubMaterial = new THREE.MeshStandardMaterial({ color: 0xc3cbd0, metalness: 0.8, roughness: 0.25 });
  const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffedb5 });
  const wheels = [];

  function addTruckBox(size, position, material) {
    const part = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    part.position.set(...position);
    part.castShadow = true;
    part.receiveShadow = true;
    truck.add(part);
    return part;
  }

  // Trailer with raised rails and side detailing to make its depth visible.
  addTruckBox([1.62, 1.28, 2.2], [0, 0.15, -0.92], trailerPaint);
  addTruckBox([1.68, 0.09, 2.25], [0, 0.84, -0.92], darkTrim);
  addTruckBox([1.66, 0.1, 0.12], [0, -0.52, -0.92], darkTrim);
  [-1, 1].forEach((side) => {
    addTruckBox([0.035, 0.09, 2.08], [side * 0.82, 0.73, -0.92], chrome);
    addTruckBox([0.025, 0.11, 1.9], [side * 0.825, -0.24, -0.92], trimStripe);
    [-1.6, -1.25, -0.9, -0.55, -0.2].forEach((z) => {
      addTruckBox([0.025, 0.035, 0.025], [side * 0.84, 0.68, z], chrome);
    });
  });
  addTruckBox([1.35, 0.08, 0.08], [0, 0.78, 0.27], chrome);

  // Cab roof, windshield frame, side windows, steps, and front grille.
  addTruckBox([1.28, 0.92, 0.9], [0, 0.12, 0.72], truckPaint);
  addTruckBox([1.34, 0.12, 0.92], [0, 0.61, 0.69], truckPaint);
  addTruckBox([1.28, 0.36, 0.34], [0, -0.29, 1.27], truckPaint);
  addTruckBox([0.94, 0.42, 0.035], [0, 0.42, 1.19], glass);
  [-1, 1].forEach((side) => {
    const sideWindow = addTruckBox([0.035, 0.36, 0.52], [side * 0.651, 0.32, 0.72], glass);
    sideWindow.rotation.y = side * -0.12;
    addTruckBox([0.035, 0.045, 0.54], [side * 0.66, -0.31, 0.55], chrome);
    addTruckBox([0.045, 0.035, 0.32], [side * 0.67, -0.29, 1.03], chrome);
  });
  addTruckBox([1.12, 0.14, 0.12], [0, -0.52, 1.4], darkTrim);
  addTruckBox([0.46, 0.28, 0.045], [0, -0.2, 1.46], darkTrim);
  for (let index = 0; index < 5; index += 1) {
    addTruckBox([0.055, 0.2, 0.025], [-0.18 + index * 0.09, -0.2, 1.49], chrome);
  }
  addTruckBox([0.15, 0.09, 0.04], [0, 0.02, 1.48], chrome);
  [-0.48, 0.48].forEach((x) => {
    const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.17, 0.06), headlightMaterial);
    headlight.position.set(x, -0.23, 1.47);
    headlight.castShadow = true;
    truck.add(headlight);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.12), darkTrim);
    mirror.position.set(x * 1.42, 0.28, 0.95);
    mirror.castShadow = true;
    truck.add(mirror);
  });

  [-0.7, 0.7].forEach((x) => {
    [-1.7, -0.65, 0.92].forEach((z) => {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.2, 20), tireMaterial);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(x, -0.5, z);
      tire.castShadow = true;
      truck.add(tire);
      wheels.push(tire);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.215, 16), hubMaterial);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(x * 1.02, -0.5, z);
      hub.castShadow = true;
      truck.add(hub);
    });
  });
  const undercarriage = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.16, 3.65),
    darkTrim
  );
  undercarriage.position.set(0, -0.43, -0.28);
  undercarriage.castShadow = true;
  truck.add(undercarriage);
  truck.scale.setScalar(0.86);
  truck.position.set(0, -0.38, 1.4);
  truck.rotation.y = -0.08;
  scene.add(truck);

  camera.position.set(1.25, 2.6, 12);
  camera.lookAt(0, -0.05, 0);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const coinMaterial = new THREE.MeshStandardMaterial({
    color: 0xffc52f,
    emissive: 0x684000,
    emissiveIntensity: 0.45,
    metalness: 0.88,
    roughness: 0.2
  });
  const coinEdgeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffed9b,
    metalness: 0.92,
    roughness: 0.16
  });
  const coinInnerMaterial = new THREE.MeshStandardMaterial({
    color: 0xd98912,
    metalness: 0.84,
    roughness: 0.25
  });
  const coinEmblemCanvas = document.createElement('canvas');
  coinEmblemCanvas.width = 128;
  coinEmblemCanvas.height = 128;
  const emblemContext = coinEmblemCanvas.getContext('2d');
  const emblemGradient = emblemContext.createLinearGradient(0, 0, 128, 128);
  emblemGradient.addColorStop(0, '#fff3b0');
  emblemGradient.addColorStop(0.5, '#e8a51c');
  emblemGradient.addColorStop(1, '#fff0a0');
  emblemContext.fillStyle = emblemGradient;
  emblemContext.beginPath();
  emblemContext.arc(64, 64, 62, 0, Math.PI * 2);
  emblemContext.fill();
  emblemContext.strokeStyle = '#fff7cf';
  emblemContext.lineWidth = 5;
  emblemContext.stroke();
  emblemContext.fillStyle = '#8b5108';
  emblemContext.font = 'bold 76px Georgia, serif';
  emblemContext.textAlign = 'center';
  emblemContext.textBaseline = 'middle';
  emblemContext.fillText('$', 64, 68);
  const coinEmblemTexture = new THREE.CanvasTexture(coinEmblemCanvas);
  coinEmblemTexture.encoding = THREE.sRGBEncoding;
  const coins = [];
  const lanePositions = [-2.15, 0, 2.15];
  for (let index = 0; index < 9; index += 1) {
    const coin = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.12, 40), coinMaterial);
    body.rotation.x = Math.PI / 2;
    const outerRim = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.045, 12, 48), coinEdgeMaterial);
    const innerRim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.018, 8, 48), coinInnerMaterial);
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(0.32, 40),
      new THREE.MeshBasicMaterial({ map: coinEmblemTexture, side: THREE.DoubleSide })
    );
    face.position.z = 0.07;
    const studs = [];
    for (let studIndex = 0; studIndex < 8; studIndex += 1) {
      const angle = (studIndex / 8) * Math.PI * 2;
      const stud = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 8, 8),
        coinEdgeMaterial
      );
      stud.position.set(Math.cos(angle) * 0.36, Math.sin(angle) * 0.36, 0.055);
      studs.push(stud);
    }
    coin.add(body, outerRim, innerRim, face, ...studs);
    coin.position.set(lanePositions[index % lanePositions.length], -0.42, -12 - index * 12);
    scene.add(coin);
    coins.push(coin);
  }

  let score = 0;
  let bestScore = 0;
  let streak = 0;
  let lastHitAt = 0;
  let laneIndex = 1;
  let gameActive = false;
  let gameEndsAt = 0;
  let previousFrameAt = 0;
  let draggingTruck = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let timerInterval = null;
  let animationFrame = null;
  let selectedDifficulty = 'medio';

  const difficultySettings = {
    suave: { speed: 11 },
    medio: { speed: 17 },
    rapido: { speed: 24 }
  };

  function resizeScene() {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) {
      return;
    }
    camera.aspect = bounds.width / bounds.height;
    camera.updateProjectionMatrix();
    renderer.setSize(bounds.width, bounds.height, false);
  }

  function steer(direction) {
    if (!gameActive) {
      return;
    }
    laneIndex = Math.max(0, Math.min(lanePositions.length - 1, laneIndex + direction));
  }

  function isPointerOnTruck(event) {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) {
      return false;
    }
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObject(truck, true).length > 0;
  }

  function finishGame() {
    gameActive = false;
    draggingTruck = false;
    window.clearInterval(timerInterval);
    timerInterval = null;
    startButton.disabled = false;
    difficultyButtons.forEach((button) => {
      button.disabled = false;
    });
    leftButton.disabled = true;
    rightButton.disabled = true;
    startButton.innerHTML = 'Jugar de nuevo <span aria-hidden="true">↻</span>';
    status.textContent = `¡Fin del recorrido! Recogiste ${score} monedas${score > bestScore ? ' — nuevo récord' : ''}. ¿Intentas superar tu marca?`;
    bestScore = Math.max(bestScore, score);
  }

  function updateTimer() {
    const remaining = Math.max(0, gameEndsAt - Date.now());
    const seconds = Math.ceil(remaining / 1000);
    timeDisplay.textContent = `00:${String(seconds).padStart(2, '0')}`;
    if (remaining <= 0) {
      finishGame();
    }
  }

  function startGame() {
    score = 0;
    streak = 0;
    lastHitAt = 0;
    laneIndex = 1;
    gameActive = true;
    gameEndsAt = Date.now() + 30000;
    scoreDisplay.textContent = '0';
    streakDisplay.textContent = 'x0';
    startButton.disabled = true;
    difficultyButtons.forEach((button) => {
      button.disabled = true;
    });
    leftButton.disabled = false;
    rightButton.disabled = false;
    startButton.textContent = '¡A jugar!';
    status.textContent = `¡A conducir! Nivel ${selectedDifficulty}. Usa ← y → para recoger monedas.`;
    truck.position.x = lanePositions[laneIndex];
    coins.forEach((coin, index) => {
      coin.position.x = lanePositions[(index + Math.floor(Math.random() * lanePositions.length)) % lanePositions.length];
      coin.position.z = -12 - index * 12;
      coin.visible = true;
    });
    updateTimer();
    timerInterval = window.setInterval(updateTimer, 100);
  }

  leftButton.addEventListener('click', () => steer(-1));
  rightButton.addEventListener('click', () => steer(1));
  canvas.addEventListener('pointerdown', (event) => {
    if (!isPointerOnTruck(event)) {
      return;
    }
    draggingTruck = true;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
    status.textContent = gameActive
      ? '¡Camión 3D! Arrastra sobre él para girarlo y verlo desde distintos ángulos.'
      : 'Arrastra el camión para girarlo en 3D y verlo desde distintos ángulos.';
    event.preventDefault();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (draggingTruck) {
      const movementX = event.clientX - lastPointerX;
      const movementY = event.clientY - lastPointerY;
      truck.rotation.y += movementX * 0.012;
      truck.rotation.x = THREE.MathUtils.clamp(
        truck.rotation.x + movementY * 0.008,
        -0.22,
        0.22
      );
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      return;
    }
    canvas.style.cursor = isPointerOnTruck(event) ? 'grab' : 'default';
  });
  function releaseTruckPointer(event) {
    draggingTruck = false;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    canvas.style.cursor = isPointerOnTruck(event) ? 'grab' : 'default';
  }
  canvas.addEventListener('pointerup', releaseTruckPointer);
  canvas.addEventListener('pointercancel', releaseTruckPointer);
  window.addEventListener('keydown', (event) => {
    if (!gameActive || event.repeat) {
      return;
    }
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
      event.preventDefault();
      steer(-1);
    } else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
      event.preventDefault();
      steer(1);
    }
  });

  difficultyButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (gameActive) {
        return;
      }
      selectedDifficulty = button.dataset.difficulty;
      difficultyButtons.forEach((option) => {
        const isSelected = option === button;
        option.classList.toggle('is-selected', isSelected);
        option.setAttribute('aria-pressed', String(isSelected));
      });
      status.textContent = `Nivel ${selectedDifficulty} seleccionado. Pulsa «Comenzar partida» cuando estés listo.`;
    });
  });

  startButton.addEventListener('click', startGame);
  window.addEventListener('resize', resizeScene);
  resizeScene();

  function animate() {
    const now = Date.now();
    const frameTime = performance.now();
    const delta = previousFrameAt ? Math.min((frameTime - previousFrameAt) / 1000, 0.05) : 0;
    previousFrameAt = frameTime;
    const time = frameTime * 0.001;
    const elapsed = gameActive ? 30 - Math.max(0, (gameEndsAt - now) / 1000) : 0;
    const roadSpeed = gameActive ? difficultySettings[selectedDifficulty].speed + elapsed * 0.35 : 1.5;
    laneMarkers.forEach((marker) => {
      marker.position.z += delta * roadSpeed;
      if (marker.position.z > 18) {
        marker.position.z -= laneMarkers.length * 6.5;
      }
    });
    roadsideMarkers.forEach((marker) => {
      marker.position.z += delta * roadSpeed;
      if (marker.position.z > 16) {
        marker.position.z -= 14 * 8;
      }
    });
    truck.position.x += (lanePositions[laneIndex] - truck.position.x) * Math.min(1, delta * 8);
    truck.rotation.z = (lanePositions[laneIndex] - truck.position.x) * -0.035 + Math.sin(time * 2) * 0.008;
    wheels.forEach((wheel) => {
      wheel.rotation.x += delta * roadSpeed * 1.8;
    });

    coins.forEach((coin) => {
      if (!gameActive) {
        coin.rotation.y = Math.sin(time * 2 + coin.position.z) * 0.16;
        return;
      }

      const previousZ = coin.position.z;
      coin.position.z += delta * roadSpeed;
      coin.rotation.y += delta * 2.5;
      coin.position.y = -0.42 + Math.sin(time * 3 + coin.position.z) * 0.05;

      const crossedTruck = previousZ < truck.position.z && coin.position.z >= truck.position.z;
      if (crossedTruck) {
        if (Math.abs(coin.position.x - truck.position.x) < 1.05) {
          streak = now - lastHitAt < 2200 ? streak + 1 : 1;
          lastHitAt = now;
          score += 1;
          scoreDisplay.textContent = String(score);
          streakDisplay.textContent = `x${streak}`;
          status.textContent = streak > 1
            ? `¡Moneda recogida! Racha de ${streak} monedas seguidas.`
            : '¡Moneda recogida! Sigue conduciendo para encontrar más.';
        }
        coin.position.z = -105 - Math.random() * 12;
        coin.position.x = lanePositions[Math.floor(Math.random() * lanePositions.length)];
      }
    });

    renderer.render(scene, camera);
    animationFrame = window.requestAnimationFrame(animate);
  }

  animate();
  window.addEventListener('pagehide', () => {
    window.clearInterval(timerInterval);
    window.cancelAnimationFrame(animationFrame);
    renderer.dispose();
    cloudTexture.dispose();
    coinEmblemTexture.dispose();
    laneMarkers.forEach((marker) => {
      marker.geometry.dispose();
    });
    coins.forEach((coin) => {
      coin.traverse((part) => {
        if (part.isMesh) {
          part.geometry.dispose();
        }
      });
    });
  }, { once: true });
})();
