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

    scene.add(new THREE.AmbientLight(0xf0f0f0));

    addLights();
    // addFloor();

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
    var light = new THREE.SpotLight(0xffffff, 1.5);
    light.position.set(0, 15, 2);

    scene.add(light);
}

function addFloor() {
    var planeGeometry = new THREE.PlaneBufferGeometry(2000, 2000);
    planeGeometry.rotateX(- Math.PI / 2);
    var planeMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });

    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.y = - 200;
    scene.add(plane);
    var helper = new THREE.GridHelper(2000, 100);
    helper.position.y = - 199;
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
    var target = { t: 0.98};
    var tween = new TWEEN.Tween(values).to(target, dataSettings.delay);
    tween.easing(temp)
    tween.onUpdate(function () {

        var position = tubeGeometry.parameters.path.getPointAt(values.t);
        position.multiplyScalar(1);

        // interpolation

        var segments = tubeGeometry.tangents.length;

        var pickt = values.t * segments;
        var pick = Math.floor(pickt);
        var pickNext = (pick + 1) % segments;

        if (pick < segments - 1) {
            binormal.subVectors(tubeGeometry.binormals[pickNext], tubeGeometry.binormals[pick]);
            binormal.multiplyScalar(pickt - pick).add(tubeGeometry.binormals[pick]);
        }

        var dir = tubeGeometry.parameters.path.getTangentAt(values.t);

        var offset;
        dataSettings.Shape == 'line' ? offset = 0.01 : offset = 0.05;

        normal.copy(binormal).cross(dir);

        position.add(normal.clone().multiplyScalar(offset));

        movingCamera.position.copy(position);

        var lookAtValue = (values.t + 0.1 / tubeGeometry.parameters.path.getLength()) % 1;
        var lookAt = tubeGeometry.parameters.path.getPointAt(lookAtValue).multiplyScalar(1);

        movingCamera.matrix.lookAt(movingCamera.position, lookAt, normal);
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
