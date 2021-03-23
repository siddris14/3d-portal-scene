/*------------------------------
Fireflies GLSL
------------------------------*/
const vertex = `

    attribute float aScale;

    uniform float uSize;
    uniform float uTime;
    uniform float uPixelRatio;

    void main() {

        vec4 modelPosition = modelMatrix * vec4(position, 1.0);

        // Animate
        modelPosition.y += sin(uTime + modelPosition.x * 100.0) * aScale * 0.2;
        modelPosition.z += cos(uTime + modelPosition.z * 100.0) * aScale * 0.2;

        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectionPosition = projectionMatrix * viewPosition;



        gl_Position = projectionPosition;

        // Points size
        gl_PointSize = uSize * aScale * uPixelRatio;

        // Points size attenuation
        gl_PointSize *= (1.0 / -viewPosition.z);

    }

`;

const fragment = `

    void main(){

        float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
        float strength = 0.05 / distanceToCenter - 0.1;

        gl_FragColor = vec4(1.0, 1.0, 1.0, strength);

    }

`;

/*------------------------------
Portal GLSL
------------------------------*/
const portalVertex = `

    varying vec2 vUv;

    void main() {

        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectionPosition = projectionMatrix * viewPosition;

        gl_Position = projectionPosition;

        // To the fragment shader
        vUv = uv;

    }

`;

const portalFragment = `

    uniform float uTime;
    uniform vec3 uColorStart;
    uniform vec3 uColorEnd;

    varying vec2 vUv;

    //  Classic Perlin 3D Noise 
    //  by Stefan Gustavson
    //
    vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
    vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
    vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

    float cnoise(vec3 P)
    {
    vec3 Pi0 = floor(P); // Integer part for indexing
    vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
    Pi0 = mod(Pi0, 289.0);
    Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 / 7.0;
    vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 / 7.0;
    vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 

    return 2.2 * n_xyz;
    }

    void main() {

        // Displace the UV
        vec2 displacedUv = vUv + cnoise(vec3(vUv * 5.0, uTime  * 0.1));

        // Perlin noise
        float strength = cnoise(vec3(displacedUv * 5.0, uTime * 0.2));

        // Outer glow
        float outerGlow = distance(vUv, vec2(0.5)) * 5.0 - 1.4;
        strength += outerGlow;

        // Apply step
        strength += step(-0.2, strength) * 0.8;

        // Portal
        vec3 portalEffect = vec3(strength);

        // With colour
        vec3 portalEffectColor = mix(uColorStart, uColorEnd, portalEffect);

        gl_FragColor = vec4(portalEffectColor, 1.0);

    }

`;

/*------------------------------
GSAP Register Plugins
------------------------------*/
gsap.registerPlugin(CustomEase);
CustomEase.create("myEaseSmooth", "0.33,0,0,1");

/*------------------------------
loaders
------------------------------*/
const textureLoader = new THREE.TextureLoader();
const gltfLoader = new THREE.GLTFLoader();

/*------------------------------
Debug UI
------------------------------*/
const gui = new dat.GUI({ width: 377 });
gui.close();

// Debug Folders
const portal = gui.addFolder("Portal");
const particles = gui.addFolder("Fireflies");
const controlCenter = gui.addFolder("Control Center");
const cam = gui.addFolder("Camera Controls");

// Debug Custom Parameters
const debugParams = {
	clearColor: 0xa1111, // 0x161b1b, // 0x2a3b3e,
	portalColorStart: 0xffe8aa,
	portalColorEnd: 0xffffff,
	fogNear: 8,
	fogFar: 11,
	loadDelay: 13000,
};

/*------------------------------
Main Setup
------------------------------*/
// Canvas
const canvas = document.querySelector(".webgl");

// Scene
const scene = new THREE.Scene();

// Options
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

/*------------------------------
Custom Parameters
------------------------------*/
const myParams = {
	frames: 0,
	frames89: 1.29,
	frames144: 2.24,
	frames233: 3.53,
	easings: null,
	expo: "Expo.easeInOut",
	smooth: "myEaseSmooth",
	rotate180: Math.PI,
	rotate360: Math.PI * 2,
};

/*------------------------------
Materials
------------------------------*/
const bakedTexture = textureLoader.load(
	"https://uploads-ssl.webflow.com/6059671e8f8a2903adbeb1e2/6059674a56c00b2c45c97c51_portalTexture_2_low.jpg"
);
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });

bakedTexture.flipY = false;
bakedTexture.encoding = THREE.sRGBEncoding;

const lampLightsMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 });

/*------------------------------
Portal Lights Material
------------------------------*/
const portalLightsMaterial = new THREE.ShaderMaterial({
	uniforms: {
		uTime: { value: 0 },
		uColorStart: { value: new THREE.Color(debugParams.portalColorStart) },
		uColorEnd: { value: new THREE.Color(debugParams.portalColorEnd) },
	},

	vertexShader: portalVertex,
	fragmentShader: portalFragment,
});

// Debug portal color
portal
	.addColor(debugParams, "portalColorStart")
	.onChange(() => {
		portalLightsMaterial.uniforms.uColorStart.value.set(debugParams.portalColorStart);
	})
	.name("Inner Colour");

portal
	.addColor(debugParams, "portalColorEnd")
	.onChange(() => {
		portalLightsMaterial.uniforms.uColorEnd.value.set(debugParams.portalColorEnd);
	})
	.name("Outer Colour");

/*------------------------------
Models
------------------------------*/
gltfLoader.load(
	"https://raw.githubusercontent.com/siddris14/3d-portal-scene/main/models/portal-scene9.glb",

	(gltf) => {
		/*------------------------------
		Traversing Scene
		------------------------------*/
		gltf.scene.traverse((_child) => {
			_child.material = bakedMaterial;
		});

		/*------------------------------
		Get scene objects
		------------------------------*/
		const mainPortalScene = gltf.scene.children.find((_child) => _child.name === "PortalScene");
		const lampLightMeshA = gltf.scene.children.find((_child) => _child.name === "LampLight_1");
		const lampLightMeshB = gltf.scene.children.find((_child) => _child.name === "LampLight_2");
		const portalLightMesh = gltf.scene.children.find((_child) => _child.name === "PortalLights");

		/*------------------------------
		Apply material
		------------------------------*/

		// mainPortalScene.material = bakedTexture;
		lampLightMeshA.material = lampLightsMaterial;
		lampLightMeshB.material = lampLightsMaterial;
		portalLightMesh.material = portalLightsMaterial;

		/*------------------------------
		Add odels to scene
		------------------------------*/
		scene.add(gltf.scene);
		const portal3DScene = gltf.scene;

		/*------------------------------
		Animate on page load
		------------------------------*/
		const timeline = new gsap.timeline({ defaults: { duration: myParams.frames144, ease: myParams.smooth } });

		const animation = () => {
			timeline.from(portal3DScene.scale, { x: 0, y: 0, z: 0 });
			timeline.from(portal3DScene.rotation, { y: Math.PI * 2 }, "<");
		};

		setTimeout(animation, debugParams.loadDelay);
	}
);

/*------------------------------
Fireflies Geometry
------------------------------*/
// Geometry
const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 34;

const positionArray = new Float32Array(firefliesCount * 3);
const scaleArray = new Float32Array(firefliesCount);

for (let i = 0; i < firefliesCount; i++) {
	positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4; // x
	positionArray[i * 3 + 1] = Math.random() * 1.5; // y
	positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4; // z

	scaleArray[i] = Math.random();
}

// Buffer Attribute
firefliesGeometry.setAttribute("position", new THREE.BufferAttribute(positionArray, 3));
firefliesGeometry.setAttribute("aScale", new THREE.BufferAttribute(scaleArray, 1));

/*------------------------------
Fireflies Material
------------------------------*/
const firefliesMaterial = new THREE.ShaderMaterial({
	uniforms: {
		uSize: { value: 100 },
		uTime: { value: 0 },
		uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
	},

	vertexShader: vertex,
	fragmentShader: fragment,

	transparent: true,
	depthTest: false,
	depthWrite: false,
	blending: THREE.AdditiveBlending,
});

// Debug Material
particles.add(firefliesMaterial.uniforms.uSize, "value").min(0).max(500).step(0.001).name("Flies Size");

/*------------------------------
Animate Fireflies
------------------------------*/
window.addEventListener("load", () => {
	const uSizeStart = () => {
		const uSize = firefliesMaterial.uniforms.uSize;
		gsap.from(uSize, { value: 0, duration: myParams.frames144, ease: myParams.smooth, delay: 1 });
	};

	setTimeout(uSizeStart, debugParams.loadDelay);
});

/*------------------------------
Fireflies Mesh
------------------------------*/
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
scene.add(fireflies);

/*------------------------------
Debug Controllers
------------------------------*/
gui.addColor(debugParams, "clearColor")
	.onChange(() => {
		renderer.setClearColor(debugParams.clearColor);
	})
	.name("Background Colour");

/*------------------------------
Camera – Perspective
------------------------------*/
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);

camera.position.x = 4.8;
camera.position.y = 2.9;
camera.position.z = 5.8;

camera.lookAt(new THREE.Vector3());
scene.add(camera);

// Debug Camera
cam.add(camera.position, "x").min(-34).max(34).step(0.001).name("Position X");
cam.add(camera.position, "y").min(-34).max(34).step(0.001).name("Position Y");
cam.add(camera.position, "z").min(-34).max(34).step(0.001).name("Position Z");

/*------------------------------
Cursor Control
------------------------------*/
const cursor = {
	x: 0,
	y: 0,
};

window.addEventListener("mousemove", (event) => {
	cursor.x = event.clientX / sizes.width - 0.5;
	cursor.y = -(event.clientY / sizes.height - 0.5);
});

/*------------------------------
Orbit Controls
------------------------------*/
const controls = new THREE.OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Debug
controlCenter.add(controls, "enabled").name("Enable Orbit Control");

/*------------------------------
Handle Resize
------------------------------*/
window.addEventListener("resize", () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

	// Update fireflies
	firefliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
});

/*------------------------------
Handle Fullscreen All Browsers
------------------------------*/
window.addEventListener("dblclick", () => {
	const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;

	if (!fullscreenElement) {
		// Element for fullscreen
		if (canvas.requestFullscreen) {
			canvas.requestFullscreen();
		} else if (canvas.webkitRequestFullscreen) {
			canvas.webkitRequestFullscreen();
		}
	} else {
		// Leave fullscreen
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
	}
});

/*------------------------------
Add Fog
------------------------------*/
const fog = new THREE.Fog(debugParams.clearColor, debugParams.fogNear, debugParams.fogFar);
// scene.fog = fog;

/*------------------------------
Renderer
------------------------------*/
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setClearColor(debugParams.clearColor);

/*------------------------------
Clock
------------------------------*/
const clock = new THREE.Clock();

/*------------------------------
Animations
------------------------------*/
const tick = () => {
	/*------------------------------
	Time
	------------------------------*/
	const elapsedTime = clock.getElapsedTime();

	/*------------------------------
	Update uniform time
	------------------------------*/
	firefliesMaterial.uniforms.uTime.value = elapsedTime;
	portalLightsMaterial.uniforms.uTime.value = elapsedTime;

	/*------------------------------
	Update camera
	------------------------------*/
	// gsap.to(camera.position, { x: cursor.x * Math.PI * 2 * 2, y: cursor.y * 10 });
	// camera.lookAt(new THREE.Vector3());

	/*------------------------------
	Update orbit controls
	------------------------------*/
	controls.update();

	/*------------------------------
	Render and rAF
	------------------------------*/
	renderer.render(scene, camera);
	window.requestAnimationFrame(tick);
};

tick();
