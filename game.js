let scene, camera, renderer;
let player, ground;
let skyLayer, mountainLayer;
let frame, gameOver, obstacles, currentLane, score, speed;
let isPaused = false;
let trees = [];
let animationId;
let keyListenerAttached = false;
const clock = new THREE.Clock();
let obstacleInterval = 90;

function initGame() {
  initScene();
  initCamera();
  initRenderer();
  initLighting();
  initBackground();
  initGround();
  initTrees();
  initState();
  initEventListeners();
  loadPlayerModel();
}

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x3a3a3a);
  scene.fog = new THREE.Fog(0x1a1a1a, 30, 100);
}

function initCamera() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 8);
  camera.lookAt(0, 0, -10);
}

function initRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
}

function initLighting() {
  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(light);
}

function initBackground() {
  const loader = new THREE.TextureLoader();

  loader.load(
    "https://raw.githubusercontent.com/Ranfl/buntil-run/main/asset/background/bg.jpg",
    (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 1);
      skyLayer = new THREE.Mesh(
        new THREE.PlaneGeometry(300, 60),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
      );
      skyLayer.position.set(0, 25, -100);
      scene.add(skyLayer);
    }
  );

  loader.load(
    "https://raw.githubusercontent.com/Ranfl/buntil-run/main/asset/background/bg.jpg",
    (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 1);
      mountainLayer = new THREE.Mesh(
        new THREE.PlaneGeometry(300, 50),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
      );
      mountainLayer.position.set(0, 20, -80);
      scene.add(mountainLayer);
    }
  );
}

function initGround() {
  const loader = new THREE.TextureLoader();

  loader.load(
    "https://raw.githubusercontent.com/Ranfl/buntil-run/main/asset/floor/tekstur_lantai.jpg",
    (roadTexture) => {
      roadTexture.wrapS = THREE.RepeatWrapping;
      roadTexture.wrapT = THREE.RepeatWrapping;
      roadTexture.repeat.set(2, 20);

      ground = new THREE.Mesh(
        new THREE.PlaneGeometry(12, 100),
        new THREE.MeshStandardMaterial({
          map: roadTexture,
          color: 0xbbbbbb,
          metalness: 0.1,
          roughness: 1,
        })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.set(0, 0, -45);
      scene.add(ground);

      loader.load(
        "https://raw.githubusercontent.com/Ranfl/buntil-run/main/asset/background/ground.jpg",
        (sideTexture) => {
          sideTexture.wrapS = THREE.RepeatWrapping;
          sideTexture.wrapT = THREE.RepeatWrapping;
          sideTexture.repeat.set(40, 20);

          const sideMat = new THREE.MeshStandardMaterial({
            map: sideTexture,
            color: 0x99c16e,
            roughness: 1,
            metalness: 0.2,
          });

          const makeSide = (x) => {
            const mesh = new THREE.Mesh(
              new THREE.PlaneGeometry(100, 100),
              sideMat
            );
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(x, 0.01, -45);
            scene.add(mesh);
          };

          makeSide(-56);
          makeSide(56);
        }
      );
    }
  );
}

function initTrees() {
  trees = [];
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x2b1a12,
    roughness: 1,
    metalness: 0.1,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x2e6e3e,
    roughness: 1,
    metalness: 0,
  });

  for (let i = 0; i < 10; i++) {
    const trunkHeight = 4 + Math.random() * 2;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.5, trunkHeight, 10),
      trunkMat
    );
    trunk.position.y = trunkHeight / 2;

    const leafGroup = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const leafSize = 1.2 - j * 0.2;
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(leafSize, 12, 12),
        leafMat
      );
      leaf.position.y = trunkHeight + j * 0.6;
      leafGroup.add(leaf);
    }

    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(leafGroup);
    tree.position.z = -10 - i * 12;
    tree.position.x = Math.random() > 0.5 ? -10 : 10;
    trees.push(tree);
    scene.add(tree);
  }
}

function initState() {
  currentLane = 1;
  frame = 0;
  gameOver = false;
  obstacles = [];
  score = 0;
  speed = 0.5;
  obstacleInterval = 90;
  updateScore();
}

function initEventListeners() {
  if (!keyListenerAttached) {
    document.addEventListener("keydown", onKeyDown);
    keyListenerAttached = true;
  }
}

function loadPlayerModel() {
  const loader = new THREE.GLTFLoader();
  loader.load(
    "https://raw.githubusercontent.com/Ranfl/buntil-run/main/asset/bush_ball/source/bush-ball.glb",
    (gltf) => {
      if (player) scene.remove(player);
      player = gltf.scene;
      player.scale.set(1, 1, 1);
      player.position.y = 0.3;
      player.position.z = 3;
      scene.add(player);
      updatePlayerPosition();
      animate();
    }
  );
}

function animate() {
  if (gameOver || isPaused || !player) return;
  animationId = requestAnimationFrame(animate);
  frame++;

  const t = clock.getElapsedTime();
  player.position.y = 0.3 + Math.sin(t * 10) * 0.05;

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.position.z += speed;
    if (
      Math.abs(obs.position.z - player.position.z) < 0.6 &&
      Math.abs(obs.position.x - player.position.x) < 1
    ) {
      cameraShake();
      gameOver = true;

      const bgm = document.getElementById("menuMusic");
      if (bgm) bgm.pause();

      setTimeout(() => {
        document.getElementById(
          "finalScore"
        ).innerText = `Skor Akhir: ${score}`;
        document.getElementById("startOverlay").style.display = "flex";
      }, 100);
    }
    if (obs.position.z > 10) {
      scene.remove(obs);
      obstacles.splice(i, 1);
      score++;
      updateScore();
      if (score >= 10) {
        speed = 0.8;
        obstacleInterval = 60;
      } else if (score % 5 === 0) {
        speed += 0.05;
      }
    }
  }

  if (frame % obstacleInterval === 0) createObstacle();
  if (ground && ground.material && ground.material.map) {
    ground.material.map.offset.y += speed * 0.005;
  }
  trees.forEach((tree) => {
    tree.position.z += speed * 0.5;
    if (tree.position.z > 10) tree.position.z = -100 - Math.random() * 20;
  });
  renderer.render(scene, camera);
}

function createObstacle() {
  const laneX = [-3, 0, 3];
  const lane = laneX[Math.floor(Math.random() * 3)];
  const type = Math.random() < 0.5 ? "log" : "rock";
  let obstacle;

  if (type === "log") {
    const length = 1 + Math.random() * 1.5;
    const radius = 0.3 + Math.random() * 0.2;
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4b2e1f,
      roughness: 1,
      metalness: 0.1,
    });
    obstacle = new THREE.Mesh(geometry, material);
    obstacle.rotation.z = Math.PI / 2;
    obstacle.position.set(lane, radius, -60);
  } else {
    const size = 0.8 + Math.random() * 0.8;
    const geometry = new THREE.DodecahedronGeometry(size, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4d4d4d,
      roughness: 0.9,
      metalness: 0.05,
    });
    obstacle = new THREE.Mesh(geometry, material);
    obstacle.position.set(lane, size / 2, -60);
  }

  scene.add(obstacle);
  obstacles.push(obstacle);

  if (score >= 10 && Math.random() < 0.3) {
    const extraLane = laneX.filter((x) => x !== lane)[
      Math.floor(Math.random() * 2)
    ];
    const extra = obstacle.clone();
    extra.position.set(extraLane, obstacle.position.y, -60);
    scene.add(extra);
    obstacles.push(extra);
  }
}

function updateScore() {
  document.getElementById("scoreDisplay").innerText = `Score: ${score}`;
}

function updatePlayerPosition() {
  if (!player) return;
  const xPos = [-3, 0, 3];
  player.position.x = xPos[currentLane];
}

function onKeyDown(e) {
  if (gameOver || isPaused) return;
  if (e.key === "ArrowLeft" && currentLane > 0) {
    currentLane--;
    updatePlayerPosition();
  } else if (e.key === "ArrowRight" && currentLane < 2) {
    currentLane++;
    updatePlayerPosition();
  }
}

function cameraShake() {
  const intensity = 0.1;
  const duration = 300;
  const originalX = camera.position.x;
  const start = Date.now();
  const shake = () => {
    const now = Date.now();
    const elapsed = now - start;
    if (elapsed < duration) {
      camera.position.x = originalX + (Math.random() - 0.5) * intensity;
      requestAnimationFrame(shake);
    } else {
      camera.position.x = originalX;
    }
  };
  shake();
}

function startGame() {
  const bgm = document.getElementById("menuMusic");
  if (bgm && !bgm.paused) bgm.pause();
  const startScreen = document.getElementById("start-screen");
  const overlay = document.getElementById("startOverlay");
  const pauseOverlay = document.getElementById("pauseOverlay");
  const pauseBtn = document.getElementById("pauseBtn");
  const finalScore = document.getElementById("finalScore");

  if (startScreen) startScreen.style.display = "none";
  if (overlay) overlay.style.display = "none";
  if (pauseOverlay) pauseOverlay.style.display = "none";
  if (pauseBtn) pauseBtn.style.display = "block";
  if (finalScore) finalScore.innerText = "";

  isPaused = false;
  gameOver = false;

  if (renderer) {
    cancelAnimationFrame(animationId);
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    renderer = null;
  }

  initGame();
}

function togglePause() {
  if (gameOver || !renderer) return;
  isPaused = !isPaused;

  const pauseOverlay = document.getElementById("pauseOverlay");
  const pauseBtn = document.getElementById("pauseBtn");

  if (pauseOverlay) pauseOverlay.style.display = isPaused ? "flex" : "none";
  if (pauseBtn) pauseBtn.style.display = isPaused ? "none" : "block";

  if (!isPaused) animate();
}

function goToMainMenu() {
  const bgm = document.getElementById("menuMusic");
  if (bgm) bgm.pause();
  const startScreen = document.getElementById("start-screen");
  const overlay = document.getElementById("startOverlay");
  const pauseOverlay = document.getElementById("pauseOverlay");
  const pauseBtn = document.getElementById("pauseBtn");

  if (startScreen) startScreen.style.display = "flex";
  if (overlay) overlay.style.display = "none";
  if (pauseOverlay) pauseOverlay.style.display = "none";
  if (pauseBtn) pauseBtn.style.display = "none";

  if (renderer) {
    cancelAnimationFrame(animationId);
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    renderer = null;
  }
}
document.getElementById("scoreDisplay").style.display = "none";
document.getElementById("startBtn")?.addEventListener("click", () => {
  const bgm = document.getElementById("menuMusic");
  if (bgm) {
    bgm.play().catch((e) => {
      console.warn(
        "Autoplay ditolak oleh browser. Menunggu interaksi user.",
        e
      );
    });
  }
});
document.getElementById("pauseBtn")?.addEventListener("click", () => {
  if (gameOver || !renderer) return;
  isPaused = true;

  document.getElementById("pauseOverlay").style.display = "flex";
  document.getElementById("pauseBtn").style.display = "none";

  const bgm = document.getElementById("menuMusic");
  if (bgm) bgm.pause();
});
document.getElementById("menuBtn")?.addEventListener("click", goToMainMenu);
document.getElementById("scoreDisplay").style.display = "block";
document.getElementById("resumeBtn")?.addEventListener("click", () => {
  if (!gameOver && renderer && isPaused && player) {
    isPaused = false;
    document.getElementById("pauseOverlay").style.display = "none";
    document.getElementById("pauseBtn").style.display = "block";

    const bgm = document.getElementById("menuMusic");
    if (bgm) {
      bgm.play().catch((e) => {
        console.warn("Gagal memutar ulang musik saat resume:", e);
      });
    }

    animate();
  }
});

window.startGame = startGame;
