import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


/////////////////////////////////////////////////////////////////////////////////
// LOADING
const loadingOverlay = document.createElement('div');
loadingOverlay.className = "fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50";
document.body.appendChild(loadingOverlay);

const loadingText = document.createElement('h1');
loadingText.textContent = 'Loading...';
loadingText.className = "text-white text-2xl mb-5";
loadingOverlay.appendChild(loadingText);

const progressContainer = document.createElement('div');
progressContainer.className = "w-1/2 h-2.5 bg-gray-700 rounded-md";
loadingOverlay.appendChild(progressContainer);

const progressBar = document.createElement('div');
progressBar.className = "h-full bg-[#5D63E0] rounded-md transition-all duration-300 ease-in-out";
progressBar.style.width = '0%';
progressContainer.appendChild(progressBar);

const loadingManager = new THREE.LoadingManager();
loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
  const progress = itemsLoaded / itemsTotal * 100;
  progressBar.style.width = progress + '%';
  loadingText.textContent = `Loading... ${Math.round(progress)}%`;
};

loadingManager.onLoad = function () {
  loadingOverlay.style.transition = 'opacity 1s ease';
  loadingOverlay.style.opacity = '0';

  setTimeout(() => {
    loadingOverlay.remove();
  }, 1000);

  renderer.setAnimationLoop(animate);
};

/////////////////////////////////////////////////////////////////////////////////
// SCENE 
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// FOR DEBUG
let useOrbitControls = false;
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; 
controls.dampingFactor = 0.05;
controls.target.set(0, 10, 0);
controls.update();

/////////////////////////////////////////////////////////////////////////////////

// CAMERA
let cameraSpeed = 0.2;
camera.position.z = 5;
camera.position.y = 15;
camera.rotation.x = 0;
camera.lookAt(0, 10, 0);

/////////////////////////////////////////////////////////////////////////////////
// LIGHT

/** 
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);
*/
const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xE1C500 });
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.position.set(20, 10, 10);
scene.add(sunMesh);

const sunLight = new THREE.DirectionalLight(0xffffff, 2);
sunLight.position.copy(sunMesh.position);
sunLight.target.position.set(0, 0, 0);
scene.add(sunLight.target);
scene.add(sunLight);

sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 200;

const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

/////////////////////////////////////////////////////////////////////////////////
// FLAT PLANE / MAP
const mapWidth = 100;
const mapLength = 100;

const mapGeometry = new THREE.PlaneGeometry(mapWidth, mapLength);
const mapMaterial = new THREE.MeshStandardMaterial({
  color: 0x01E04C,
  side: THREE.DoubleSide,
  roughness: 0.8
});
const map = new THREE.Mesh(mapGeometry, mapMaterial);
map.rotation.x = Math.PI / 2;
map.position.y = -1;
map.receiveShadow = true;
scene.add(map);

const borderWidth = 2;
const borderHeight = 7;
const edgeMaterial = new THREE.MeshStandardMaterial({
  color: 0xDEDCD8,
  roughness: 0.7
});

const northGeometry = new THREE.BoxGeometry(mapWidth + borderWidth * 2, borderHeight, borderWidth);
const northEdge = new THREE.Mesh(northGeometry, edgeMaterial);
northEdge.position.set(0, -1 + borderHeight / 2, -mapLength / 2 - borderWidth / 2);
northEdge.castShadow = true;
scene.add(northEdge);

const southGeometry = new THREE.BoxGeometry(mapWidth + borderWidth * 2, borderHeight, borderWidth);
const southEdge = new THREE.Mesh(southGeometry, edgeMaterial);
southEdge.position.set(0, -1 + borderHeight / 2, mapLength / 2 + borderWidth / 2);
southEdge.castShadow = true;
scene.add(southEdge);

const eastGeometry = new THREE.BoxGeometry(borderWidth, borderHeight, mapLength);
const eastEdge = new THREE.Mesh(eastGeometry, edgeMaterial);
eastEdge.position.set(mapWidth / 2 + borderWidth / 2, -1 + borderHeight / 2, 0);
eastEdge.castShadow = true;
scene.add(eastEdge);

const westGeometry = new THREE.BoxGeometry(borderWidth, borderHeight, mapLength);
const westEdge = new THREE.Mesh(westGeometry, edgeMaterial);
westEdge.position.set(-mapWidth / 2 - borderWidth / 2, -1 + borderHeight / 2, 0);
westEdge.castShadow = true;
scene.add(westEdge);


/////////////////////////////////////////////////////////////////////////////////
let keys = {};

window.addEventListener('keydown', (event) => {
  keys[event.key] = true;
});

window.addEventListener('keyup', (event) => {
  keys[event.key] = false;
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'q') useOrbitControls = !useOrbitControls;
});
/////////////////////////////////////////////////////////////////////////////////
// CAR
const cubeGeometry = new THREE.BoxGeometry(3, 3, 3);
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x011BE0 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.set(10, 0.5, 2);
cube.castShadow = true;
scene.add(cube);

/////////////////////////////////////////////////////////////////////////////////
// HELPER
const helper = new THREE.CameraHelper(sunLight.shadow.camera);
scene.add(helper);

function createAxisHelper() {
  const axisHelper = new THREE.AxesHelper(10);
  axisHelper.position.set(0, 0, 0);
  scene.add(axisHelper);
  return axisHelper;
}

createAxisHelper();

/////////////////////////////////////////////////////////////////////////////////
// window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  if (!useOrbitControls) {
    if (keys['w'] || keys['ArrowUp']) camera.position.z -= cameraSpeed;
    if (keys['s'] || keys['ArrowDown']) camera.position.z += cameraSpeed;
    if (keys['a'] || keys['ArrowLeft']) camera.position.x -= cameraSpeed;
    if (keys['d'] || keys['ArrowRight']) camera.position.x += cameraSpeed;
  }

  controls.enabled = useOrbitControls;
  if (useOrbitControls) controls.update();

  const boundaryBuffer = 5;
  camera.position.x = Math.max(-mapWidth / 2 + boundaryBuffer, Math.min(mapWidth / 2 - boundaryBuffer, camera.position.x));
  camera.position.z = Math.max(-mapLength / 2 + boundaryBuffer, Math.min(mapLength / 2 - boundaryBuffer, camera.position.z));

  renderer.render(scene, camera);
}

/////////////////////////////////////////////////////////////////////////////////
// LOAD TEXTURE
function loadResources() {
  const textureLoader = new THREE.TextureLoader(loadingManager);
  textureLoader.load(
    '',
    () => console.log('load ')
  );
}

loadResources();
