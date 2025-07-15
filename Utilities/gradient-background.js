import { SvgPlus } from "../SvgPlus/4.js";
import { getDeviceInfo } from "./utils.js";


export class MovingBlob {
    constructor(hue, size = 0.5, speed = 0.005) {
        this.hue = hue;
        this._speed = speed;
        this.pos = [Math.random()*2-1, Math.random()*2-1];
        let angle = Math.random() * 2 * Math.PI;
        this.vel = [Math.cos(angle)*speed, Math.sin(angle)*speed];
        this.size = size;
    }
    update() {
        this.vel = this.vel.map(v => v + (Math.random() * this.speed/100 * 2 - this.speed/100));
        this.pos = this.pos.map((p, i) => {
            let nd = p + this.vel[i];
            if (nd > 1) {
                nd = 1;
                this.vel[i] *= -1;
            } else if (nd < -1) {
                nd = -1;
                this.vel[i] *= -1;
            }
            return nd;
        });
    }

    set speed(value) {
        this._speed = value;
        let [dx, dy] = this.vel;
        let dir = Math.sqrt(dx * dx + dy * dy);
        this.vel = this.vel.map(v => v / dir * value);
    }
    get speed() {
        return this._speed;
    }
    

    get position() {
        let [x, y] = this.pos;
        return [x, y];
    }
}


const vertexShader  = `
attribute vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}`

const fragmentShader = `
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_blobPositions[10];
uniform float u_blobSizes[10];
uniform float u_blobHues[10];
uniform int u_blobCount;

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


void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    vec3 color = vec3(0.0);

    float intensity_sum = 0.0;
    for (int i = 0; i < 20; i++) {
        if (i >= u_blobCount) break; 
        vec2 center = u_blobPositions[i];
        float radius = u_blobSizes[i];
        float dist = length(uv - center);
        float intensity = exp(-5.0 * pow(dist, 2.0) / radius);
        intensity_sum += intensity;

        vec3 blobColor = hsl2rgb(mod(u_blobHues[i], 1.0), 1.0, 0.5);
        color = mix(color, blobColor, intensity);
    }


    gl_FragColor = vec4(color, 1.0);
}
`

const SQUARE_MESH = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1,
]);



const MODE = getDeviceInfo().os == "Windows" ? "image" : "webgl"; // Use image mode for Windows to avoid WebGL issues
class GradientBackground extends SvgPlus {
    _speed = 0.0;

    mode = MODE;
    // mode = 

    constructor(el) {
        super(el);
        this.styles = {
            "position": "relative",
            "overflow": "hidden",
        };  
    }

    /**
     * @param {number} value - The speed of the blobs.
     */
    set speed(value) {
        this._speed = value;
        if (this.blobs) this.blobs.forEach(blob => blob.speed = value);
    }

    set colors(colors) {
        let n = colors.length;
        this.blobs = colors.map((color, i) => new MovingBlob(color/360,  2*((n - i)/(n)), this._speed));
        this.updateColors();
    }

    updateColors() {
        if (this.gl) {
            const {gl, blobData: {hues, sizes, count}} = this;
            gl.uniform1fv(this.blobHuesLocation, new Float32Array(hues));
            gl.uniform1i(this.blobCountLocation, count);
            gl.uniform1fv(this.blobSizesLocation, new Float32Array(sizes));
        }
    }

    get blobData() {
        const blobPositions = [];
        const blobSizes = [];
        const blobHues = [];
        this.blobs.forEach(blob => {
            blob.update();
            blobPositions.push(...blob.position);
            blobSizes.push(blob.size);
            blobHues.push(blob.hue);
        });
        return {
            positions: blobPositions,
            sizes: blobSizes,
            hues: blobHues,
            count: this.blobs.length
        };
    }

    resizers = {
        "webgl": () => {
            const {canvas, gl} = this;
            if (this.clientHeight > 0) {
                canvas.width = this.clientWidth;
                canvas.height = this.clientWidth;
                if (gl) {
                    gl.viewport(0, 0, canvas.width, canvas.height);
                    gl.uniform2f(this.resolutionLocation, canvas.width, canvas.height);
                    if (!this.rendering) {
                        this.render();
                    }
                }
            }
        },
        "image": () => {
        }
    }

    initialisers = {
        "webgl": () => {
            
        },
        "image": () => {
            this.createChild("div", {
                class: "gradient-img",
                styles: {
                    "background-image": `url(${this.getAttribute("img-src")})`,
                    "background-size": "cover",
                    "width": "100%",
                    "height": "100%",
                    "position": "absolute",
                    "top": "0",
                    "left": "0",
                    "right": "0",
                    "bottom": "0",
                    "z-index": "-1",
                }
            });
        }
    }

    onConnecters = {
        "webgl": () => {
            if (!this.gl) {
                this.canvas = this.createChild("canvas", {
                    styles: {
                        top: "0",
                        left: "0",
                        right: "0",
                        bottom: "0",
                        width: "100%",
                        height: "100%",
                        position: "absolute",
                        "z-index": -1,
                    }
                });
                this.canvas.width = 0;
                this.canvas.height = 0;

                // Get the WebGL context
                this.gl = this.canvas.getContext("webgl2", { powerPreference: "high-performance" }) || canvas.getContext("webgl", { powerPreference: "high-performance" });
                const {gl} = this;
    
                // Create shaders and program
                const program = this.createProgram(vertexShader, fragmentShader);
    
                // Get attribute and uniform locations
                this.positionLocation = gl.getAttribLocation(program, "a_position");
                this.resolutionLocation = gl.getUniformLocation(program, "u_resolution");
                this.blobHuesLocation = gl.getUniformLocation(program, "u_blobHues");
                this.blobSizesLocation = gl.getUniformLocation(program, "u_blobSizes");
                this.blobPositionsLocation = gl.getUniformLocation(program, "u_blobPositions");
                this.blobCountLocation = gl.getUniformLocation(program, "u_blobCount");
    
                // Create position buffer for the square mesh
                this.positionBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, SQUARE_MESH, gl.STATIC_DRAW);
                gl.enableVertexAttribArray(this.positionLocation);
                gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
    
                gl.useProgram(program);

                this.updateColors();

            }
        },
        "image": () => {
        }
    }

    onDisconnecters = {
        "webgl": () => {
            const {gl} = this;
            if (gl) {
                gl.deleteBuffer(this.positionBuffer);
                gl.deleteProgram(this.program);
                gl.deleteShader(this.vertexShader);
                gl.deleteShader(this.fragmentShader);
                const ext = gl.getExtension("WEBGL_lose_context");
                if (ext) ext.loseContext();
                this.canvas.remove();
                this.canvas = null;
                this.positionLocation = null;
                this.timeLocation = null;
                this.resolutionLocation = null;
                this.blobHuesLocation = null;
                this.blobSizesLocation = null;
                this.blobPositionsLocation = null;
                this.blobCountLocation = null
                this.gl = null;
                this.positionBuffer = null;
                this.program = null;
                this.vertexShader = null;
                this.fragmentShader = null;
            }
        },
        "image": () => {
        }
    }

    renderers = {
        "webgl": (time) => {
            if (this.gl) {
                const {gl, blobPositionsLocation } = this;
                const {positions} = this.blobData;
                gl.uniform2fv(blobPositionsLocation, new Float32Array(positions));
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                if (this.canvas.width > 0 && this.canvas.height > 0 && this._speed == 0) {
                    this.stopped = true; // Stop rendering if speed is 0
                }
            }
        },
        "image": () => {
            this.stopped = true; // Stop rendering for image mode
        }
    }

    resize() {
        this.resizers[this.mode]();
    }

    initialise() {
        this.initialisers[this.mode]();
    }

    onconnect() {
        if (!this.initialised) {
            this.initialised = true;

            this.initialisers[this.mode]();

            this.resizeObserver = new ResizeObserver(() => this.resize());
            
            let defaultColors = [ 0, 10, 20, 30, 40, 50, 360, 350, 340, 330];
            let att = this.getAttribute("colors");
            if (att) {
                defaultColors = att.split(",").map(c => parseFloat(c.trim()));
            }
            this.colors = defaultColors;
        }

        this.onConnecters[this.mode]();

        this.resizeObserver.observe(this);

        this.render();
    }

    ondisconnect() {
        if (this.resizeObserver) this.resizeObserver.disconnect();

        this.onDisconnecters[this.mode]();

        this.stopped = true;
    }

    createShader(type, source) {
        const {gl} = this;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            let logs = gl.getShaderInfoLog(shader);
            if (logs) {
                let line = logs.match(/ERROR: 0:(\d+):/);
                if (line) {
                    line = parseInt(line[1], 10);
                    const lines = source.split('\n');
                    const errorLine = lines[line - 1] || '';
                    console.error(`Shader compilation error on ${line}:\n${errorLine}\n${logs}`);
                } else {
                    console.error(`Shader compilation error: ${logs}`);
                }
            } else {
                console.error("Shader compilation error: No logs available", logs);
            }           
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    createProgram(vsSource, fsSource) {
        const {gl} = this;
        const vs = this.createShader(gl.VERTEX_SHADER, vsSource);
        const fs = this.createShader(gl.FRAGMENT_SHADER, fsSource);
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            return null;
        }
        this.program = program;
        this.vertexShader = vs;
        this.fragmentShader = fs;
        return program;
    }

    async render() {
        if (this.rendering && this.stopped) {
            this.stopped = false;
        } else if (!this.rendering) {
            this.rendering = true;
            this.stopped = false;
            let next = () => {
                if (!this.stopped) {
                    const time = performance.now();
                    this.renderers[this.mode](time);
                    requestAnimationFrame(next);
                } else {
                    this.rendering = false;
                }
            }
            requestAnimationFrame(next);
        }
    }

    static get observedAttributes() {
        return ["speed"];
    }
}
SvgPlus.defineHTMLElement(GradientBackground)