let scene, camera, renderer;
let player, ground, background;
let frame, gameOver, obstacles, currentLane, score, speed;
let isPaused = false;
let trees = [];
let animationId;
let keyListenerAttached = false;

// === TOGGLE PAUSE ===
function togglePause() {
  if (gameOver || !renderer) return;

  isPaused = !isPaused;

  const pauseBtn = document.getElementById("pauseBtn");
  const pauseOverlay = document.getElementById("pauseOverlay");

  if (isPaused) {
    pauseBtn.style.display = "none";
    pauseOverlay.style.display = "flex";
  } else {
    pauseBtn.style.display = "block";
    pauseOverlay.style.display = "none";
    animate();
  }
}

// === INISIALISASI GAME ===
function initGame() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 8);
  camera.lookAt(0, 0, -10);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(light);

  const textureLoader = new THREE.TextureLoader();
  const bgTexture = textureLoader.load("https://i.imgur.com/FWUh1Ym.png");
  const bgMaterial = new THREE.MeshBasicMaterial({
    map: bgTexture,
    side: THREE.BackSide,
  });
  background = new THREE.Mesh(new THREE.PlaneGeometry(100, 40), bgMaterial);
  background.position.set(0, 20, -80);
  scene.add(background);

  ground = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 100),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = -45;
  scene.add(ground);

  trees = [];
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x006400 });
  for (let i = 0; i < 10; i++) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 1),
      treeMat
    );
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.5), leafMat);
    const group = new THREE.Group();
    trunk.position.y = 0.5;
    leaves.position.y = 1.3;
    group.add(trunk);
    group.add(leaves);
    group.position.z = -10 - i * 10;
    group.position.x = Math.random() > 0.5 ? -4 : 4;
    trees.push(group);
    scene.add(group);
  }

  currentLane = 1;
  frame = 0;
  gameOver = false;
  obstacles = [];
  score = 0;
  speed = 0.5;
  updateScore();

  if (!keyListenerAttached) {
    document.addEventListener("keydown", onKeyDown);
    keyListenerAttached = true;
  }

  // Load 3D PLAYER
  const loader = new THREE.GLTFLoader();
  loader.load(
    "https://raw.githubusercontent.com/Ranfl/buntil-run/main/asset/bush_ball/source/bush-ball.glb",
    (gltf) => {
      player = gltf.scene;
      player.scale.set(1.5, 1.5, 1.5);
      player.position.y = 0.3;
      scene.add(player);
      updatePlayerPosition();
      animate();
    },
    undefined,
    (error) => {
      console.error("❌ Gagal load model player:", error);
    }
  );
}

function updateScore() {
  document.getElementById("scoreDisplay").innerText = `Score: ${score}`;
}

function startGame() {
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("startOverlay").style.display = "none";
  document.getElementById("pauseOverlay").style.display = "none";
  document.getElementById("finalScore").innerText = "";
  document.getElementById("pauseBtn").style.display = "block";
  document.getElementById("pauseBtn").innerText = "⏸ Pause";

  isPaused = false;
  gameOver = false;

  if (renderer) {
    cancelAnimationFrame(animationId);
    renderer.dispose();
    document.body.removeChild(renderer.domElement);
    renderer = null;
  }

  initGame();
}

function updatePlayerPosition() {
  if (!player) return;
  const xPos = [-2.5, 0, 2.5];
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

function createObstacle() {
  const geometry = new THREE.BoxGeometry(1, 1 + Math.random() * 2, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0xff5555 });
  const obstacle = new THREE.Mesh(geometry, material);
  const laneX = [-2.5, 0, 2.5];
  const lane = laneX[Math.floor(Math.random() * 3)];
  obstacle.position.set(lane, geometry.parameters.height / 2, -60);
  scene.add(obstacle);
  obstacles.push(obstacle);
}

function animate() {
  if (gameOver || isPaused || !player) return;

  animationId = requestAnimationFrame(animate);
  frame++;

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.position.z += speed;

    if (
      Math.abs(obs.position.z - player.position.z) < 0.6 &&
      Math.abs(obs.position.x - player.position.x) < 1
    ) {
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
      if (score >= 20) speed += 0.03;
    }
  }

  if (frame % 90 === 0) createObstacle();

  background.position.z += 0.01;
  if (background.position.z > -20) background.position.z = -80;

  trees.forEach((tree) => {
    tree.position.z += speed;
    if (tree.position.z > 10) tree.position.z = -80;
  });

  renderer.render(scene, camera);
}

function goToMainMenu() {
  document.getElementById("startOverlay").style.display = "none";
  document.getElementById("start-screen").style.display = "flex";
  document.getElementById("pauseBtn").style.display = "none";
  document.getElementById("pauseOverlay").style.display = "none";

  if (renderer) {
    cancelAnimationFrame(animationId);
    renderer.dispose();
    document.body.removeChild(renderer.domElement);
    renderer = null;
  }
}

// === EVENT LISTENER ===
document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("pauseBtn").addEventListener("click", togglePause);
document.getElementById("menuBtn").addEventListener("click", goToMainMenu);
document.getElementById("resumeBtn").addEventListener("click", () => {
  if (!gameOver && renderer && isPaused && player) {
    isPaused = false;
    document.getElementById("pauseOverlay").style.display = "none";
    document.getElementById("pauseBtn").style.display = "block";
    document.getElementById("pauseBtn").innerText = "⏸ Pause";
    animate();
  }
});
