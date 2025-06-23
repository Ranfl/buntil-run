// === Deklarasi variabel global ===
let scene, camera, renderer;
let player, ground, background;
let frame, gameOver, obstacles, currentLane, score, speed;
let isPaused = false;
let trees = [];
let animationId;
let keyListenerAttached = false;

// === Fungsi untuk pause dan resume game ===
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
    animate(); // Lanjutkan animasi saat resume
  }
}

// === Inisialisasi dan setup awal game ===
function initGame() {
  // Buat scene dan kamera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 8);
  camera.lookAt(0, 0, -10);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Pencahayaan
  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(light);

// loader untuk tekstur
  const textureLoader = new THREE.TextureLoader();

  // Background
  const bgTexture = textureLoader.load("https://i.imgur.com/FWUh1Ym.png");
  const bgMaterial = new THREE.MeshBasicMaterial({
    map: bgTexture,
    side: THREE.BackSide,
  });
  background = new THREE.Mesh(new THREE.PlaneGeometry(100, 40), bgMaterial);
  background.position.set(0, 20, -80);
  scene.add(background);

  // Tanah
  const groundTexture = textureLoader.load("tanah.jpg"); // atau "assets/tanah.jpg" kalau di folder
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(1, 20); // bisa disesuaikan

  const groundMaterial = new THREE.MeshStandardMaterial({ map: groundTexture });

  ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 100), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.z = -45;
  scene.add(ground);
  // Pohon di pinggir jalan
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
    group.position.x = Math.random() > 0.5 ? -7 : 7;
    trees.push(group);
    scene.add(group);
  }

  // Reset status game
  currentLane = 1;
  frame = 0;
  gameOver = false;
  obstacles = [];
  score = 0;
  speed = 0.5;
  updateScore();

  // Tambahkan kontrol keyboard hanya sekali
  if (!keyListenerAttached) {
    document.addEventListener("keydown", onKeyDown);
    keyListenerAttached = true;
  }

  // Load model player 3D
  const loader = new THREE.GLTFLoader();
  loader.load(
    "https://raw.githubusercontent.com/Ranfl/buntil-run/main/asset/bush_ball/source/bush-ball.glb",
    (gltf) => {
      player = gltf.scene;
      player.scale.set(1, 1, 1);
      player.position.y = 0.3;
      player.position.z = 3 ;
      scene.add(player);
      updatePlayerPosition();
      animate(); // Mulai game setelah player dimuat
    },
    undefined,
    (error) => {
      console.error("❌ Gagal load model player:", error);
    }
  );
}

// === Update skor ke layar ===
function updateScore() {
  document.getElementById("scoreDisplay").innerText = `Score: ${score}`;
}

// === Fungsi mulai ulang game ===
function startGame() {
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("startOverlay").style.display = "none";
  document.getElementById("pauseOverlay").style.display = "none";
  document.getElementById("finalScore").innerText = "";
  document.getElementById("pauseBtn").style.display = "block";
  document.getElementById("pauseBtn").innerText = "⏸ Pause";

  isPaused = false;
  gameOver = false;

  // Reset dan hapus renderer lama
  if (renderer) {
    cancelAnimationFrame(animationId);
    renderer.dispose();
    document.body.removeChild(renderer.domElement);
    renderer = null;
  }

  initGame(); // Setup ulang game
}

// === Update posisi player sesuai lane ===
function updatePlayerPosition() {
  if (!player) return;
  const xPos = [-3, 0, 3];
  player.position.x = xPos[currentLane];
}

// === Deteksi input keyboard kiri-kanan ===
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

// === Buat obstacle secara acak ===
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

// === Loop animasi utama game ===
function animate() {
  if (gameOver || isPaused || !player) return;

  animationId = requestAnimationFrame(animate);
  frame++;

  // Gerakkan obstacle dan cek tabrakan
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

    // Hapus obstacle jika sudah lewat
    if (obs.position.z > 10) {
      scene.remove(obs);
      obstacles.splice(i, 1);
      score++;
      updateScore();
      if (score % 5 === 0) speed += 0.05;
      if (score >= 20) speed += 0.03;
    }
  }

  // Buat obstacle setiap beberapa frame
  if (frame % 90 === 0) createObstacle();

  // Parallax background
  background.position.z += 0.01;
  if (background.position.z > -20) background.position.z = -80;

  // Gerakkan pohon
  trees.forEach((tree) => {
    tree.position.z += speed;
    if (tree.position.z > 10) tree.position.z = -80;
  });

  renderer.render(scene, camera);
}

// === Kembali ke menu utama ===
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

// === Event listener untuk tombol-tombol ===
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
