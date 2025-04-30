import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

let wheelFL, wheelFR, wheelBL, wheelBR;
let wheelFLCube, wheelFRCube, wheelBLCube, wheelBRCube;
let terrain, terrainCollider;

const wheelOffsets = {
  FL: { x: -1.4, y: -0.4, z: -1.9 },
  FR: { x: 1.4, y: -0.4, z: -1.9 },
  BL: { x: -1.4, y: -0.4, z: 1.3 },
  BR: { x: 1.4, y: -0.4, z: 1.3 }
};

const wheelRotationAxis = new THREE.Vector3(1, 0, 0);
let wheelRotationSpeed = 0;
const maxWheelRotationSpeed = 0.2;

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
camera.position.z = 5;
camera.position.y = 15;
camera.rotation.x = 0;
camera.lookAt(0, 11, 0);

/////////////////////////////////////////////////////////////////////////////////
// LIGHT

const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xE1C500 });
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.position.set(-50, 40, -50);
scene.add(sunMesh);

const sunLight = new THREE.DirectionalLight(0xffffff, 2);
sunLight.position.copy(sunMesh.position);
sunLight.target.position.set(0, 0, 0);
scene.add(sunLight.target);
scene.add(sunLight);

sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 4096;
sunLight.shadow.mapSize.height = 4096;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 200;
sunLight.shadow.camera.left = -70;
sunLight.shadow.camera.right = 70;
sunLight.shadow.camera.top = 70;
sunLight.shadow.camera.bottom = -70;
sunLight.shadow.bias = -0.0005

const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

/////////////////////////////////////////////////////////////////////////////////
// TERRAIN 
const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.load('/Profile-Adventure/models/terrain.glb', (gltf) => {
  terrain = gltf.scene;

  terrain.scale.set(35, 10, 35);
  terrain.position.y = -1;

  terrain.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      if (!terrainCollider) {
        terrainCollider = child;
      }
    }
  });

  scene.add(terrain);
  console.log('Terrain loaded successfully');
});

const borderWidth = 2;
const borderHeight = 20;
const edgeMaterial = new THREE.MeshStandardMaterial({
  color: 0xDEDCD8,
  roughness: 0.7
});

const mapWidth = 500;
const mapLength = 500;

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
const car = new THREE.Group();
car.position.set(10, 0, 2);
car.rotation.y = Math.PI;
car.castShadow = true;
scene.add(car);

function createWheelCube(color = 0xff0000) {
  const cubeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  const cubeMaterial = new THREE.MeshBasicMaterial({ color: color });
  return new THREE.Mesh(cubeGeometry, cubeMaterial);
}

wheelFLCube = createWheelCube(0xff0000);
wheelFRCube = createWheelCube(0x00ff00);
wheelBLCube = createWheelCube(0x0000ff);
wheelBRCube = createWheelCube(0xffff00);

car.add(wheelFLCube);
car.add(wheelFRCube);
car.add(wheelBLCube);
car.add(wheelBRCube);

let carSpeed = 0;
const maxSpeed = 0.5;
const acceleration = 0.01;
const deceleration = 0.005;
const turnSpeed = 0.03;

let frontWheelRotation = 0;
let steeringAngle = 0;
const maxSteeringAngle = Math.PI / 50;


const raycaster = new THREE.Raycaster();
const rayDirection = new THREE.Vector3(0, -1, 0);
const carHeight = 1.5;

const mtlLoader = new MTLLoader(loadingManager);
mtlLoader.setPath('/Profile-Adventure/models/');
mtlLoader.load('offroadcar.mtl', (materials) => {
  materials.preload();

  const objLoader = new OBJLoader(loadingManager);
  objLoader.setMaterials(materials);
  objLoader.setPath('/Profile-Adventure/models/');
  objLoader.load('offroadcar.obj', (carModel) => {
    carModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.name === 'wheelfl_Cylinder.030') {
          wheelFL = child;
          console.log('Found front left wheel');

          wheelFLCube.position.copy(child.position.clone().add(new THREE.Vector3(
            wheelOffsets.FL.x, wheelOffsets.FL.y, wheelOffsets.FL.z
          )));
          console.log('Front Left Wheel Position:', child.position);
        } else if (child.name === 'wheelfr_Cylinder.002') {
          wheelFR = child;
          console.log('Found front right wheel');

          wheelFRCube.position.copy(child.position.clone().add(new THREE.Vector3(
            wheelOffsets.FR.x, wheelOffsets.FR.y, wheelOffsets.FR.z
          )));
          console.log('Front Right Wheel Position:', child.position);
        } else if (child.name === 'wheelbl_Cylinder.001') {
          wheelBL = child;
          console.log('Found back left wheel');

          wheelBLCube.position.copy(child.position.clone().add(new THREE.Vector3(
            wheelOffsets.BL.x, wheelOffsets.BL.y, wheelOffsets.BL.z
          )));
          console.log('Back Left Wheel Position:', child.position);
        } else if (child.name === 'wheelbr_Cylinder.003') {
          wheelBR = child;
          console.log('Found back right wheel');

          wheelBRCube.position.copy(child.position.clone().add(new THREE.Vector3(
            wheelOffsets.BR.x, wheelOffsets.BR.y, wheelOffsets.BR.z
          )));
          console.log('Back Right Wheel Position:', child.position);
        }
      }
    });

    carModel.scale.set(1, 1, 1);
    carModel.position.y = 0;
    carModel.rotation.y = Math.PI * 1.5;
    car.add(carModel);

    updateWheelPositions();
  });
});

function updateWheelPositions() {
  if (wheelFL && wheelFLCube) {
    wheelFLCube.position.copy(wheelFL.position.clone().add(new THREE.Vector3(
      wheelOffsets.FL.x, wheelOffsets.FL.y, wheelOffsets.FL.z
    )));
  }

  if (wheelFR && wheelFRCube) {
    wheelFRCube.position.copy(wheelFR.position.clone().add(new THREE.Vector3(
      wheelOffsets.FR.x, wheelOffsets.FR.y, wheelOffsets.FR.z
    )));
  }

  if (wheelBL && wheelBLCube) {
    wheelBLCube.position.copy(wheelBL.position.clone().add(new THREE.Vector3(
      wheelOffsets.BL.x, wheelOffsets.BL.y, wheelOffsets.BL.z
    )));
  }

  if (wheelBR && wheelBRCube) {
    wheelBRCube.position.copy(wheelBR.position.clone().add(new THREE.Vector3(
      wheelOffsets.BR.x, wheelOffsets.BR.y, wheelOffsets.BR.z
    )));
  }
}

/////////////
function rotateWheels() {
  if (!wheelFL || !wheelFR || !wheelBL || !wheelBR) return;

  wheelRotationSpeed = carSpeed * 5;

  if (keys['a'] || keys['ArrowLeft']) {
    steeringAngle = Math.min(steeringAngle + 0.03, maxSteeringAngle);
  } else if (keys['d'] || keys['ArrowRight']) {
    steeringAngle = Math.max(steeringAngle - 0.03, -maxSteeringAngle);
  } else {
    if (steeringAngle > 0) {
      steeringAngle = Math.max(steeringAngle - 0.01, 0);
    } else if (steeringAngle < 0) {
      steeringAngle = Math.min(steeringAngle + 0.01, 0);
    }
  }
  wheelFL.rotation.y = steeringAngle;
  wheelFR.rotation.y = steeringAngle;
}


function adjustCarToTerrain() {
  if (!terrainCollider) return;

  const wheels = [
    { position: new THREE.Vector3(), name: 'FL' },
    { position: new THREE.Vector3(), name: 'FR' },
    { position: new THREE.Vector3(), name: 'BL' },
    { position: new THREE.Vector3(), name: 'BR' }
  ];

  if (wheelFLCube) {
    wheelFLCube.getWorldPosition(wheels[0].position);
  }
  if (wheelFRCube) {
    wheelFRCube.getWorldPosition(wheels[1].position);
  }
  if (wheelBLCube) {
    wheelBLCube.getWorldPosition(wheels[2].position);
  }
  if (wheelBRCube) {
    wheelBRCube.getWorldPosition(wheels[3].position);
  }

  let highestPoint = -Infinity;
  let carTilt = new THREE.Vector3(0, 0, 0);
  let validHits = 0;

  wheels.forEach((wheel) => {
    raycaster.set(
      new THREE.Vector3(wheel.position.x, wheel.position.y + 20, wheel.position.z),
      rayDirection
    );

    const intersects = raycaster.intersectObject(terrainCollider, true);

    if (intersects.length > 0) {
      const heightAtWheel = intersects[0].point.y;

      if (heightAtWheel > highestPoint) {
        highestPoint = heightAtWheel;
      }

      validHits++;
    }
  });

  if (validHits > 0) {
    car.position.y = highestPoint + carHeight;

  }
}

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
// camera for following the car
let cameraOffsetY = 10;
let cameraOffsetZ = 10;
let cameraLerpFactor = 0.1;

/////////////////////////////////////////////////////////////////////////////////
// window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  if (!useOrbitControls) {
    if (keys['w'] || keys['ArrowUp']) {
      carSpeed = Math.min(carSpeed + acceleration, maxSpeed);
    } else if (keys['s'] || keys['ArrowDown']) {
      carSpeed = Math.max(carSpeed - acceleration, -maxSpeed / 1.5);
    } else {
      if (carSpeed > 0) {
        carSpeed = Math.max(carSpeed - deceleration, 0);
      } else if (carSpeed < 0) {
        carSpeed = Math.min(carSpeed + deceleration, 0);
      }
    }

    if (Math.abs(carSpeed) > 0.01) {
      if (keys['a'] || keys['ArrowLeft']) {
        car.rotation.y += turnSpeed * (carSpeed > 0 ? 1 : -1);
      }
      if (keys['d'] || keys['ArrowRight']) {
        car.rotation.y -= turnSpeed * (carSpeed > 0 ? 1 : -1);
      }
    }

    car.position.x -= Math.sin(car.rotation.y) * carSpeed;
    car.position.z -= Math.cos(car.rotation.y) * carSpeed;

    const carHalfSize = 2.5;
    car.position.x = Math.max(-mapWidth / 2 + carHalfSize, Math.min(mapWidth / 2 - carHalfSize, car.position.x));
    car.position.z = Math.max(-mapLength / 2 + carHalfSize, Math.min(mapLength / 2 - carHalfSize, car.position.z));

    adjustCarToTerrain();

    const targetX = car.position.x;
    const targetY = car.position.y + cameraOffsetY;
    const targetZ = car.position.z + cameraOffsetZ * Math.cos(car.rotation.y);
    const targetXOffset = cameraOffsetZ * Math.sin(car.rotation.y);

    camera.position.x = camera.position.x + (targetX + targetXOffset - camera.position.x) * cameraLerpFactor;
    camera.position.y = camera.position.y + (targetY - camera.position.y) * cameraLerpFactor;
    camera.position.z = camera.position.z + (targetZ - camera.position.z) * cameraLerpFactor;

    camera.lookAt(car.position.x, car.position.y + 1, car.position.z);

    rotateWheels();
  }

  controls.enabled = useOrbitControls;
  if (useOrbitControls) controls.update();

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