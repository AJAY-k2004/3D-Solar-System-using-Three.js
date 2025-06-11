import * as THREE from "https://unpkg.com/three@0.127.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.127.0/examples/jsm/controls/OrbitControls.js";

// Scene setup
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(-50, 80, 180);
const controls = new OrbitControls(camera, renderer.domElement);
const clock = new THREE.Clock();

// Lighting
const light = new THREE.PointLight(0xffffff, 3, 500);
scene.add(light);

// Background
const stars = new THREE.TextureLoader().load('./image/stars.jpg');
scene.background = new THREE.CubeTextureLoader().load([stars, stars, stars, stars, stars, stars]);

// Sun
const sunTex = new THREE.TextureLoader().load('./image/sun.jpg');
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(15, 50, 50),
  new THREE.MeshBasicMaterial({ map: sunTex })
);
scene.add(sun);

// Draw circular orbit
function drawOrbit(radius) {
  const points = [];
  for (let i = 0; i <= 100; i++) {
    const angle = (i / 100) * 2 * Math.PI;
    points.push(radius * Math.cos(angle), 0, radius * Math.sin(angle));
  }
  const geometry = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  const line = new THREE.LineLoop(geometry, new THREE.LineBasicMaterial({ color: 0xffffff }));
  scene.add(line);
}

// Create each planet
function createPlanet(name, size, texturePath, distance, spinSpeed, orbitSpeed) {
  const texture = new THREE.TextureLoader().load(texturePath);
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(size, 32, 32),
    new THREE.MeshStandardMaterial({ map: texture })
  );
  const container = new THREE.Object3D();
  mesh.position.set(distance, 0, 0);
  container.add(mesh);
  scene.add(container);
  drawOrbit(distance);

  const label = document.createElement("div");
  label.className = "planet-label";
  label.textContent = name;
  label.style.position = "absolute";
  label.style.color = "white";
  label.style.background = "rgba(0,0,0,0.7)";
  label.style.padding = "2px 6px";
  label.style.borderRadius = "4px";
  label.style.fontSize = "14px";
  label.style.pointerEvents = "none";
  label.style.display = "none";
  document.body.appendChild(label);

  return { name, mesh, container, spinSpeed, orbitSpeed, label };
}

// Planet data
const planetData = [
  ["Mercury", 3, "./image/mercury.jpg", 28, 0.004, 0.01],
  ["Venus", 5, "./image/venus.jpg", 44, 0.002, 0.008],
  ["Earth", 6, "./image/earth.jpg", 62, 0.02, 0.007],
  ["Mars", 4, "./image/mars.jpg", 78, 0.018, 0.006],
  ["Jupiter", 12, "./image/jupiter.jpg", 100, 0.04, 0.004],
  ["Saturn", 10, "./image/saturn.jpg", 138, 0.038, 0.003],
  ["Uranus", 7, "./image/uranus.jpg", 176, 0.03, 0.002],
  ["Neptune", 7, "./image/neptune.jpg", 200, 0.032, 0.001]
];

const planets = planetData.map(p => createPlanet(...p));

// Planet speed sliders
const controlsPanel = document.getElementById("planetControls");
planets.forEach((planet, index) => {
  const label = document.createElement("label");
  label.innerHTML = `${planet.name}: <input type="range" min="0" max="0.02" step="0.0005" value="${planet.orbitSpeed}" class="planet-slider" id="speed_${index}">`;
  controlsPanel.appendChild(label);
  document.getElementById(`speed_${index}`).addEventListener("input", (e) => {
    planet.orbitSpeed = parseFloat(e.target.value);
  });
});

// Pause/resume
let paused = false;
document.getElementById("pauseBtn").addEventListener("click", () => {
  paused = !paused;
  document.getElementById("pauseBtn").textContent = paused ? "Resume" : "Pause";
});

// Toggle controls (for mobile)
const toggleBtn = document.getElementById("toggleControls");
const controlsDiv = document.getElementById("controls");
toggleBtn.addEventListener("click", () => {
  controlsDiv.style.display = controlsDiv.style.display === "block" ? "none" : "block";
});

// Hover detection using raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredPlanet = null;

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Animate
function animate() {
  requestAnimationFrame(animate);
  if (!paused) {
    const delta = clock.getDelta();

    // Orbit and spin
    planets.forEach(planet => {
      planet.container.rotation.y += planet.orbitSpeed;
      planet.mesh.rotation.y += planet.spinSpeed;
    });

    // Raycast hover
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));
    hoveredPlanet = intersects.length ? planets.find(p => p.mesh === intersects[0].object) : null;

    // Label display
    planets.forEach(planet => {
      if (hoveredPlanet === planet) {
        const worldPos = new THREE.Vector3();
        planet.mesh.getWorldPosition(worldPos);
        const screenPos = worldPos.clone().project(camera);
        planet.label.style.left = `${(screenPos.x * 0.5 + 0.5) * window.innerWidth}px`;
        planet.label.style.top = `${(-screenPos.y * 0.5 + 0.5) * window.innerHeight}px`;
        planet.label.style.display = "block";
      } else {
        planet.label.style.display = "none";
      }
    });
  }

  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
