import { onCleanup, onMount } from "solid-js";
import * as CANNON from "cannon-es";
import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { PHYSICS_ENVIRONMENT, PHYSICS_TEXTURES } from "../lib/homePreload";

const rfs = THREE.MathUtils.randFloatSpread;
const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
const pointer = new THREE.Vector3(0, 0, 0);
const baubleVec = new THREE.Vector3();

function prepareTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export default function PhysicsScene(props) {
  let host;
  let frame = 0;
  let renderer;
  let resizeObserver;
  const disposables = [];

  onMount(async () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      35,
      Math.max(1, host.clientWidth) / Math.max(1, host.clientHeight),
      1,
      60,
    );

    camera.position.set(0, 0, window.innerWidth < 768 ? 35 : 20);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    const spot = new THREE.SpotLight(0xffffff, 1, 0, 0.2, 1);
    spot.position.set(30, 30, 30);
    scene.add(ambient, spot);

    const textureLoader = new THREE.TextureLoader();
    const rgbeLoader = new RGBELoader();

    try {
      const [textures, environment] = await Promise.all([
        Promise.all(PHYSICS_TEXTURES.map((src) => textureLoader.loadAsync(src).then(prepareTexture))),
        rgbeLoader.loadAsync(PHYSICS_ENVIRONMENT),
      ]);

      textures.forEach((texture) => {
        texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
        texture.needsUpdate = true;
        disposables.push(texture);
      });

      environment.mapping = THREE.EquirectangularReflectionMapping;
      disposables.push(environment);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const environmentMap = pmrem.fromEquirectangular(environment).texture;
      disposables.push(environmentMap);
      pmrem.dispose();

      scene.environment = environmentMap;

      const world = new CANNON.World({
        gravity: new CANNON.Vec3(0, 2, 0),
      });
      world.solver.iterations = 5;
      world.allowSleep = false;

      const sphereShape = new CANNON.Sphere(1);
      const pointerShape = new CANNON.Sphere(3);
      const pointerBody = new CANNON.Body({
        type: CANNON.Body.KINEMATIC,
        shape: pointerShape,
        position: new CANNON.Vec3(0, 0, 0),
      });
      world.addBody(pointerBody);

      const baubles = Array.from({ length: 40 }, (_, index) => {
        const material = new THREE.MeshStandardMaterial({
          color: "white",
          roughness: 0,
          envMap: environmentMap,
          envMapIntensity: 1,
          map: textures[index % textures.length],
          transparent: true,
        });
        disposables.push(material);

        const mesh = new THREE.Mesh(sphereGeometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const body = new CANNON.Body({
          mass: 1,
          shape: sphereShape,
          angularDamping: 0.1,
          linearDamping: 0.65,
          position: new CANNON.Vec3(rfs(20), rfs(20), rfs(20)),
        });
        world.addBody(body);
        mesh.position.copy(body.position);
        scene.add(mesh);

        return { body, mesh };
      });

      const resize = () => {
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.position.z = window.innerWidth < 768 ? 35 : 20;
        camera.updateProjectionMatrix();
      };

      const handlePointerMove = (event) => {
        const rect = host.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
        pointer.y = -((event.clientY - rect.top) / rect.height - 0.5) * 12;
      };

      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      resize();

      let hasReported = false;
      let lastTime;
      let isVisible = true;
      let isRunning = false;

      const animate = (time) => {
        if (!isRunning) return;

        const delta = lastTime ? Math.min((time - lastTime) / 1000, 1 / 30) : 1 / 60;
        lastTime = time;

        pointerBody.position.set(pointer.x, pointer.y, 0);

        baubles.forEach(({ body }) => {
          baubleVec.set(body.position.x, body.position.y, body.position.z).normalize().multiplyScalar(-40);
          body.applyForce(new CANNON.Vec3(baubleVec.x, baubleVec.y, baubleVec.z), body.position);
        });

        world.step(1 / 60, delta, 3);

        baubles.forEach(({ body, mesh }) => {
          mesh.position.set(body.position.x, body.position.y, body.position.z);
          mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
        });

        renderer.render(scene, camera);

        if (!hasReported) {
          hasReported = true;
          props.onLoaded?.();
        }

        frame = requestAnimationFrame(animate);
      };

      const startLoop = () => {
        if (isRunning) return;
        isRunning = true;
        lastTime = performance.now();
        frame = requestAnimationFrame(animate);
      };

      const stopLoop = () => {
        isRunning = false;
        if (frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      };

      const intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            startLoop();
          } else {
            stopLoop();
          }
        },
        { rootMargin: "200px" },
      );

      intersectionObserver.observe(host);
      startLoop();

      onCleanup(() => {
        stopLoop();
        intersectionObserver.disconnect();
        window.removeEventListener("pointermove", handlePointerMove);
        world.removeBody(pointerBody);
        baubles.forEach(({ body, mesh }) => {
          world.removeBody(body);
          scene.remove(mesh);
        });
      });
    } catch {
      props.onLoaded?.();
    }
  });

  onCleanup(() => {
    if (frame) cancelAnimationFrame(frame);
    resizeObserver?.disconnect();
    if (renderer?.domElement?.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    renderer?.dispose();
    disposables.forEach((asset) => asset.dispose?.());
  });

  return <div ref={host} class="h-full w-full" />;
}
