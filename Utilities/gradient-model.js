import { SvgPlus } from "../SvgPlus/4.js";
import { OBJLoader } from "../Three/Loaders/OBJLoader.js"
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.174.0/+esm";
import { STLLoader } from "../Three/Loaders/STLLoader.js";
import { FBXLoader } from "../Three/Loaders/FBXLoader.js";
import { MovingBlob } from "./gradient-background.js";
const MAX_BLOBS = 20; // Maximum number of blobs

const vertexShader  = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPos;
void main() {
  vUv = uv;
  vPos = position; // Already in object space
  vNormal = normalize(normalMatrix * normal); // transform normal to view space
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const fragmentShader = `
precision highp float;

uniform vec2 u_min;
uniform vec2 u_max;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_blobPositions[${MAX_BLOBS}];
uniform float u_blobSizes[${MAX_BLOBS}];
uniform float u_blobHues[${MAX_BLOBS}];
uniform int u_blobCount;
varying vec2 vUv; // receive UVs from vertex shader
varying vec3 vNormal;
varying vec3 vPos;

float hueToRgb(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
  if (t < 0.5) return q;
  if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
  return p;
}

vec3 hsl2rgb(float h, float s, float l) {
    vec3 rgb;
    h = mod(h, 1.0);
    if (s == 0.0) {
        rgb = vec3(l, l, l); // achromatic
    } else {
     
        float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
        float p = 2.0 * l - q;
        rgb = vec3(hueToRgb(p, q, h + 1.0/3.0), hueToRgb(p, q, h), hueToRgb(p, q, h - 1.0/3.0));
    }
    return rgb;
}

float shadow = 0.05;

void main() {
    // vec2 uv = vUv; // Use vUv for UVs
    vec2 uv = (vPos.xy - u_min) / (u_max - u_min); // Use vPos for UVs
    uv = uv * 2.0 - 1.0;

    vec3 color = vec3(0.0);

    float intensity_sum = 0.0;
    for (int i = 0; i < 20; i++) {
        if (i >= u_blobCount) break; 
        vec2 center = u_blobPositions[i];
        float radius = u_blobSizes[i];
        float dist = length(uv - center);
        float intensity = exp(-3.0 * pow(dist, 2.0) / radius);
        intensity_sum += intensity;
        vec3 blobColor = hsl2rgb(mod(u_blobHues[i], 1.0), 1.0, 0.5);
        color = mix(color, blobColor, intensity);
    }

    float ao = pow(dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0); // fake AO
    color *= (1.0 - shadow + ao * shadow);

    // uv = (uv + 1.0) / 2.0; // Normalize UVs to [0, 1]
    // gl_FragColor = vec4(hsl2rgb(uv.x, 1.0, uv.y), 1.0); // Use intensity_sum to scale color

    gl_FragColor = vec4(color, 1.0);
}
`
const LOADERS = {
    obj: (url, material) => {
        return new Promise((resolve, reject) => {
            const loader = new OBJLoader();
            loader.load(url, (object) => {
                object.traverse((c) => {
                    if (c.isMesh) {
                        c.material = material; // Apply the shader material
                    }
                });
                resolve(object); // Assuming the first child is the mesh
            }, undefined, (error) => {
                reject(error);
            });
        });
    },
    stl: (url, material) => {
        return new Promise((resolve, reject) => {
            const loader = new STLLoader();
            loader.load(url, (geometry) => {
                const mesh = new THREE.Mesh(geometry, material);
                resolve(mesh);
            }, undefined, (error) => {
                reject(error);
            });
        });
    },
    fbx: (url, material) => {
        return new Promise((resolve, reject) => {
            const loader = new FBXLoader();
            loader.load(url, (object) => {
                let g = new THREE.Group();
                
                object.traverse((c) => {
                    if (c.isMesh) {
                        let mesh = new THREE.Mesh(c.geometry, material)
                        mesh.matrixAutoUpdate = false; // Disable automatic updates
                        mesh.matrix.copy(c.matrix); // Copy the world matrix
                        g.add(mesh);
                    }
                });
                
                resolve(g); // Assuming the first child is the mesh
            }, undefined, (error) => {
                reject(error);
            });
        });
    }
}

class GradientModel extends SvgPlus {

    blobSize = 0.7; // Default blob size
    blobSpeed_slow = 0.001; // Default blob speed
    blobSpeed_fast = 0.01; // Default blob speed

    blobs = new Array(MAX_BLOBS).fill(0).map((_,i) => new MovingBlob(
        (360 - (i/MAX_BLOBS) * 100) / 360, 
    this.blobSize, this.blobSpeed_slow));

    constructor(element) {
        super(element);
        this.shader = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                u_min: { value: new THREE.Vector2(-.5, -.5) }, // Placeholder for min bounds
                u_max: { value: new THREE.Vector2(.5, .5) }, //
                u_time: { value: 0 },
                u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                u_blobPositions: { value: new Array(MAX_BLOBS).fill(0).map(() => new THREE.Vector2(0,0)) }, // Placeholder for blob positions
                u_blobSizes: { value: new Float32Array(MAX_BLOBS).fill(this.blobSize) }, // Placeholder for blob sizes
                u_blobHues: { value: new Float32Array(MAX_BLOBS).fill(0.3) }, // Placeholder for blob hues
                u_blobCount: { value: MAX_BLOBS } // Placeholder for blob count

            },
            depthWrite: true,
            depthTest: true,
            blending: THREE.NormalBlending,
        });
    }

    set colors(value) {
        if (typeof value === "string") {
            value = value.split(",").map(c => c.trim());
        }
        if (Array.isArray(value)) { 
            value = value.slice(0, MAX_BLOBS).map((c, i) => {
                let hue = parseFloat(c);
                if (Number.isNaN(hue)) {
                    hue = (360 - (i / MAX_BLOBS) * 100) / 360; // Default hue if not a number
                } else {
                    hue = (hue % 360) / 360; // Normalize to [0, 1]
                }
                return hue;
            });
            this.blobs = value.map(hue => new MovingBlob(hue, this.blobSize, this.blobSpeed_slow));
        }
        this.xRotation = 0; // Reset rotation when colors change
        this.yRotation = 0; // Reset rotation when colors change
    }

    get blobData() {
        let positions = new Array(MAX_BLOBS).fill(0).map(() => new THREE.Vector2(0, 0)); // Placeholder for blob positions
        let sizes = new Float32Array(MAX_BLOBS).fill(0.3); // Default size
        let hues = new Float32Array(MAX_BLOBS).fill(0.3); // Default size
        this.blobs.forEach((blob, i) => {
            blob.update();
            const [x, y] = blob.position;
            positions[i] = new THREE.Vector2(x, y);
            sizes[i] = blob.size;
            hues[i] = blob.hue;
        });
        return {
            positions: positions,
            sizes: sizes,
            hues: hues,
            count: this.blobs.length
        };
    }

    set scale(value) {
        if (typeof value === "string") {
            value = parseFloat(value);
        }
        if (typeof value === "number") {
            this._scale = value;
        } else {
            this._scale = 1; // Default scale
        }
    }

    get scale() {
        return this._scale || 1; // Default scale
    }

    set src(value) {
        this._src = value;
        this._loadObject();
    }

    get src() {
        return this._src;
    }

    set yRotation(value) {
        this._yRotation = value;
    }

    get yRotation() {
        return this._yRotation || 0;
    }

    set xRotation(value) {
        this._xRotation = value;
    }

    get xRotation() {
        return this._xRotation || 0;
    }

    set speed(value) {
        this.blobs.forEach(blob => {
            if (typeof value === "number") {
                blob.speed = value;
            } else if (typeof value === "string") {
                blob.speed = parseFloat(value);
            } else {
                blob.speed = 0.4; // Default speed
            }
        });
    }

    rotationSpeed = 0.00005;

    _initialiseScene() {
        if (!this.scene) {
            this.canvas = this.createChild("canvas");
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
            camera.position.z = 3;

            const renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true  });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setClearColor(0x000000, 0);
            this.renderer = renderer;
            this.scene = scene;
            this.camera = camera;
            this.mainGroup = new THREE.Group();
            this.scene.add(this.mainGroup);
            this.resize();


            if (this.object) {
                this.mainGroup.add(this.object);
            }
            console.log(`Scene initialised with camera at position: ${camera.position.x}, ${camera.position.y}, ${camera.position.z}`);
            
        }
    }

    resize() {
        if (this.renderer) {
            const { clientWidth, clientHeight } = this;
            this.renderer.setSize(clientWidth, clientHeight);
            this.camera.aspect = clientWidth / clientHeight;
            this.camera.updateProjectionMatrix();
            this.shader.uniforms.u_resolution.value.set(clientWidth, clientHeight);
            console.log(`Renderer resized to: ${clientWidth}x${clientHeight}`);

            // this.frameObject(2); // Reframe the object after resize
        }
    }

    /**
     * Repositions the camera to frame an object with some padding.
     * @param {number} padding - Padding factor (e.g., 1.2 = 20% extra space).
     */
    frameObject(padding = 1.8) {
        const { object, camera } = this;
        if (!object || !camera) {
            console.warn("No object or camera to frame.");
            return;
        }
        
        // 1. Compute bounding box
        const box = new THREE.Box3().setFromObject(object);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);



        console.log(this.src, box);
        

        console.log(this.scale);
        
        const scale = this.scale * 2 / size.length(); // Scale based on size and padding
        object.scale.set(scale, scale, scale); // Reset scale to avoid scaling issues

        center.multiplyScalar(-scale); // Adjust center for padding
        object.position.copy(center); // Center the object


        this.shader.uniforms.u_min.value.set(box.min.x, box.min.y);
        this.shader.uniforms.u_max.value.set(box.max.x, box.max.y);
        

        // // 2. Compute largest dimension for padding
        // const maxSize = Math.max(size.x, size.y, size.z);
        // const distance = (maxSize * padding) / (2 * Math.tan((camera.fov * Math.PI) / 360));

        // // 3. Get camera direction and set new position
        // const dir = new THREE.Vector3(0, 0, 1); // assume camera looks toward -Z
        // dir.applyQuaternion(camera.quaternion);
        // const newPos = center.clone().add(dir.multiplyScalar(distance));

        // // 4. Update camera
        // camera.position.copy(newPos);
        // camera.lookAt(center);
        // camera.updateProjectionMatrix();

        // // Optional: adjust near/far for big objects
        // camera.near = distance / 10;
        // camera.far = distance * 10;
        // camera.updateProjectionMatrix();
    }

    async _loadObject() {
        let url = this.src;
        if (typeof url === "string" && url !== this._usedSrc) {
            let ext = url.split('.').pop().toLowerCase();
            let object = null;
            if (ext in LOADERS) {
                try {
                    object = await LOADERS[ext](url, this.shader);
                } catch (e) {
                    console.warn(`Error loading file: ${url}\n${e.message}\n${e.stack}`);
                    this.dispatchEvent(new CustomEvent("error", {
                        detail: `Error loading file: ${e.message}`
                    }));
                    url = null;
                }
            } else {
                console.warn(`Unsupported file type: ${ext}`);
                this.dispatchEvent(new CustomEvent("error", {
                    detail: `Unsupported file type: ${ext}`
                }));
                url = null;
            }
            this.removeObject();
            if (object && this.scene) {
                this.mainGroup.add(object);
                this.object = object;
                this.frameObject(); // Frame the object with some padding
            }
            this.object = object;
            this._usedSrc = url;

            if (this.object) {
                this.dispatchEvent(new CustomEvent("load", {
                    detail: this.object
                }));
            }
        }
    }

    removeObject() {
        if (this.object && this.scene) {
            this.scene.remove(this.object);
        }
        this.object = null;
        this._usedSrc = null;
    }

    onconnect() {
        this._initialiseScene()
        this.animate();
        this.resizeObserver = new ResizeObserver(() => {
            this.resize();
        });
        this.resizeObserver.observe(this);
    }

    ondisconnect() {
        this.stopped = true;
    }

    onrender(t, dt) {
        this.yRotation += dt * this.rotationSpeed;
    }

   
    async animate() {
        let t0 = performance.now();
        while (!this.stopped) {
            let t = performance.now();
            let dt = t - t0;
            t0 = t;
            const { positions, sizes, hues, count } = this.blobData;
            this.shader.uniforms.u_blobPositions.value = positions;
            this.shader.uniforms.u_blobSizes.value = sizes;
            this.shader.uniforms.u_blobHues.value = hues;
            this.shader.uniforms.u_blobCount.value = count;
            this.shader.uniforms.u_time.value = dt * 0.001;
            if (this.onrender instanceof Function) {
                    this.onrender(t, dt);
            }
            if (this.object) {
                this.mainGroup.rotation.y = this.yRotation ;
                this.mainGroup.rotation.x = this.xRotation ;
            }
            if (this.renderer) {
                this.renderer.render(this.scene, this.camera);
            }
            await new Promise(requestAnimationFrame);

        }
    }

    static get observedAttributes() {
        return ["src", "colors", "scale"];
    }
}

SvgPlus.defineHTMLElement(GradientModel)