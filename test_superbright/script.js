var container, runButton, cameraButton;
var camera, movingCamera, movingCamera, scene, renderer;
var curve;
var splineObject;

var mouseDownIndex = 0;
var spherePositions = [];
var shpereGroup = [];
var cameraMoveFlag = false;
var tick = 0;
var parent;
var tubeGeometry;

var binormal = new THREE.Vector3();
var normal = new THREE.Vector3();

const dataSettings = {
    'sphereCount': 3,
    'shpereRadius': 0.05,
    'Shape': 'tube', // line and tube
    'delay': 10000,
    'temp': 2,  //Integer between 0 to 2
}

init();
animate();

function init() {

    container = document.getElementById('container');
    runButton = document.getElementById('runButton');
    runButton.innerText
    cameraButton = document.getElementById('cameraButton');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, 2, 8);
    scene.add(camera);

    parent = new THREE.Object3D();
    scene.add(parent);
    movingCamera = new THREE.PerspectiveCamera(84, window.innerWidth / window.innerHeight, 0.01, 1000);
    parent.add(movingCamera);

    addLights();
    addFloor();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    container.appendChild(renderer.domElement);

    runButton.onclick = function () {

        mouseDownIndex++;

        var sphereX = Math.random() * 14 - 7;
        var sphereY = Math.random() * 3;
        var sphereZ = Math.random() * 6 - 4;

        if (mouseDownIndex <= dataSettings.sphereCount) {
            addSphere(sphereX, sphereY, sphereZ);
            if (mouseDownIndex === dataSettings.sphereCount) {
                this.innerText = "RUN"
            }
        } else {
            addCurve();
        }
    }

    cameraButton.onclick = function () {
        cameraMoveFlag = true;
        tweenCamera();
    }
}

function addLights() {
    scene.add(new THREE.AmbientLight(0xf0f0f0));

    var light = new THREE.SpotLight(0xffffff, 1.5);
    light.position.set(3, 10, 2);
    light.castShadow = true;
    light.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera(70, 1, 0.01, 2000));
    light.shadow.bias = - 0.000222;
    light.shadow.mapSize.width = 2124;
    light.shadow.mapSize.height = 2124;
    scene.add(light);
}

function addFloor() {
    var planeGeometry = new THREE.PlaneBufferGeometry(2000, 2000);
    planeGeometry.rotateX(- Math.PI / 2);
    var planeMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });

    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.y = - 4;
    plane.receiveShadow = true;
    scene.add(plane);
    var helper = new THREE.GridHelper(2000, 1000);
    helper.position.y = - 3;
    helper.material.opacity = 0.25;
    helper.material.transparent = true;
    scene.add(helper);
}

function addSphere(x, y, z) {
    var geometry = new THREE.SphereBufferGeometry(dataSettings.shpereRadius, 32, 32);
    var material = new THREE.MeshPhysicalMaterial({
        color: Math.random() * 0xffffff, metalness: 0.1, roughness: 0.2,
    })
    var sphere = new THREE.Mesh(geometry, material);
    sphere.castShadow = true;
    sphere.position.set(x, y, z);
    spherePositions.push(sphere.position);
    shpereGroup.push(sphere);
    scene.add(sphere);
}

function addCurve() {

    var curvePositionGroup = [];
    for (var i = 0; i < dataSettings.sphereCount; i++) {
        curvePositionGroup.push(shpereGroup[i].position)
    }

    curve = new THREE.CatmullRomCurve3(curvePositionGroup)

    tubeGeometry = new THREE.TubeBufferGeometry(curve, 500, dataSettings.shpereRadius * 0.5, 20, false);
    var material = new THREE.MeshPhysicalMaterial({ color: 0x7e0b9f, metalness: 0.1, roughness: 0.2 });
    var tubeMesh = new THREE.Mesh(tubeGeometry, material);
    tubeMesh.castShadow = true;

    if (dataSettings.Shape == 'line') {
        var geometry = new THREE.Geometry();
        geometry.vertices = this.curve.getPoints(50);
        var material = new THREE.LineBasicMaterial({
            color: 0x7e0b9f
        });

        splineObject = new THREE.Line(geometry, material);
        scene.add(splineObject)
    }
    if (dataSettings.Shape == 'tube') {
        scene.add(tubeMesh);
    }
}

function tweenCamera() {

    let temp = TWEEN.Easing.Sinusoidal.Out;
    switch (dataSettings.temp) {
        case 0:
            temp = TWEEN.Easing.Circular.Out;
            break;
        case 1:
            temp = TWEEN.Easing.Exponential.Out;
            break;
        default:
            temp = TWEEN.Easing.Sinusoidal.InOut;
            break;
    }

    var values = { t: 0 };
    var target = { t: 1 };
    var tween = new TWEEN.Tween(values).to(target, dataSettings.delay);
    tween.easing(temp)
    tween.onUpdate(function () {

        var position = tubeGeometry.parameters.path.getPointAt(values.t);
        position.multiplyScalar(1);

        movingCamera.position.copy(position);
        dataSettings.Shape == 'line' ? movingCamera.position.y += 0.03 : movingCamera.position.y += 0.08;

        var lookAt = tubeGeometry.parameters.path.getPointAt((values.t + 0.3 / tubeGeometry.parameters.path.getLength())).multiplyScalar(1.0);

        movingCamera.matrix.lookAt(movingCamera.position, lookAt, new THREE.Vector3(0, 1, 0));
        movingCamera.quaternion.setFromRotationMatrix(movingCamera.matrix);
    });
    // tween.delay(1000);
    tween.onComplete(function () {

    });
    tween.start();
}

function animate() {
    TWEEN.update();
    requestAnimationFrame(animate);
    render();
}

function render() {
    renderer.render(scene, cameraMoveFlag === true ? movingCamera : camera);
}
