// BuntilRunV2 - Upgrade Visual

let scene, camera, renderer;
let player, ground;
let skyLayer, mountainLayer;
let frame, gameOver, obstacles, currentLane, score, speed;
let isPaused = false;
let trees = [];
let animationId;
let keyListenerAttached = false;
const clock = new THREE.Clock();

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
  scene.background = new THREE.Color(0x1a1a1a); // gelap seperti hutan
  scene.fog = new THREE.Fog(0x1a1a1a, 30, 100); // efek kabut jarak jauh
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
    (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 20);
      ground = new THREE.Mesh(
        new THREE.PlaneGeometry(12, 100),
        new THREE.MeshStandardMaterial({ map: texture })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.z = -45;
      scene.add(ground);
    }
  );
}


function initTrees() {
  trees = [];
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x006400 });

  for (let i = 0; i < 10; i++) {
    const trunkHeight = 0.8 + Math.random() * 0.4;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, trunkHeight),
      trunkMat
    );

    const leafSize = 0.4 + Math.random() * 0.3;
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(leafSize), leafMat);

    const group = new THREE.Group();
    trunk.position.y = trunkHeight / 2;
    leaves.position.y = trunkHeight + 0.3;
    group.add(trunk);
    group.add(leaves);
    group.position.z = -10 - i * 10;
    group.position.x = Math.random() > 0.5 ? -7 : 7;
    trees.push(group);
    scene.add(group);
  }
}

function initState() {
  currentLane = 1;
  frame = 0;
  gameOver = false;
  obstacles = [];
  score = 0;
  speed = 0.5;
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
      if (player) {
        scene.remove(player);
      }
      player = gltf.scene;
      player.scale.set(1, 1, 1);
      player.position.y = 0.3;
      player.position.z = 3;
      scene.add(player);
      updatePlayerPosition();
      animate();
    },
    undefined,
    (err) => console.error("❌ Gagal load model player:", err)
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
      if (score % 5 === 0) speed += 0.05;
    }
  }

  if (frame % 90 === 0) createObstacle();

  if (skyLayer) {
    skyLayer.position.z += 0.005;
    if (skyLayer.position.z > -10) skyLayer.position.z = -90;
  }
  if (mountainLayer) {
    mountainLayer.position.z += 0.01;
    if (mountainLayer.position.z > -10) mountainLayer.position.z = -70;
  }

  trees.forEach((tree) => {
    tree.position.z += speed;
    if (tree.position.z > 10) tree.position.z = -80;
  });

  renderer.render(scene, camera);
}

function createObstacle() {
  const geometry = new THREE.BoxGeometry(1, 1 + Math.random() * 2, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0xff5555 });
  const obstacle = new THREE.Mesh(geometry, material);
  const laneX = [-3, 0, 3];
  const lane = laneX[Math.floor(Math.random() * 3)];
  obstacle.position.set(lane, geometry.parameters.height / 2, -60);
  scene.add(obstacle);
  obstacles.push(obstacle);
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

document.getElementById("startBtn")?.addEventListener("click", startGame);
document.getElementById("pauseBtn")?.addEventListener("click", togglePause);
document.getElementById("menuBtn")?.addEventListener("click", goToMainMenu);
document.getElementById("resumeBtn")?.addEventListener("click", () => {
  if (!gameOver && renderer && isPaused && player) {
    isPaused = false;
    document.getElementById("pauseOverlay").style.display = "none";
    document.getElementById("pauseBtn").style.display = "block";
    animate();
  }
});

window.startGame = startGame;
