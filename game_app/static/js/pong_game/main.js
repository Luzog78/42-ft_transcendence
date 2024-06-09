import * as THREE from 'three';
import { Scene } from "./scene.js"
import { WallLines } from "./wallLines.js"

let scene = new Scene(75);
scene.scene.background = new THREE.Color(0x101010);

scene.camera.position.x = 1.5;
scene.camera.position.y = 4;
scene.camera.castShadow = true;

scene.addBox(4, 0.1, 4, {color: 0x0}, "box1");
scene.addBox(4, 0.1, 4, {color: 0x0}, "box2");
scene.get("box1").position.z = 2;
scene.get("box2").position.z = -2;

scene.addBox(0.2, 0.75, 8, {color: 0xbbbbbb, emissive:0xbbbbbb, emissiveIntensity:2, visible:false}, "wall1");
scene.addBox(0.2, 0.75, 8, {color: 0xbbbbbb, emissive:0xbbbbbb, emissiveIntensity:2, visible:false}, "wall2");
scene.get("wall1").position.x = 2.1;
scene.get("wall2").position.x = -2.1;

let points = [
	new THREE.Vector3(0, 0.75, 4),
	new THREE.Vector3(0, 0.75, 0),
	new THREE.Vector3(0, 0.75, -4.2),
];
let colors = [
	new THREE.Color().setHSL(0.5, 1, 0.5, THREE.SRGBColorSpace),
	new THREE.Color().setHSL(0.5, 1, 0.85, THREE.SRGBColorSpace),
	new THREE.Color().setHSL(0.75, 1, 1.0, THREE.SRGBColorSpace),
	new THREE.Color().setHSL(1.0, 1, 0.75, THREE.SRGBColorSpace),
]

for (let i = 0; i < 8; i++)
{
	scene.entities.push(new WallLines(scene, points, colors, 10, "line" + i));

	scene.get("line" + i).position.x = -2;
	scene.get("line" + i).position.y = -1 + 0.1 * i;
}

for (let i = 0; i < 8; i++)
{
	scene.entities.push(new WallLines(scene, points, colors, 10, "line2" + i));

	scene.get("line2" + i).position.x = 2;
	scene.get("line2" + i).position.y = -1 + 0.1 * i;
}


//floor
for (let i = 0; i < 13; i++)
	scene.addBox(0.13, 0.11, 0.13, {color: 0x999999, emissive:0x999999}, "floor" + i).position.set((i * 0.3) - 1.80, 0.01, 0);

scene.addText("0", {color: 0xffffff}, 0.5, new THREE.Vector3(-1.25,0.1,0.5), "text1")
scene.addText("5", {color: 0xffffff}, 0.5, new THREE.Vector3(-1.25,0.1,-0.5), "text2")


let light = new THREE.AmbientLight( 0x555555 ); // soft white light
scene.scene.add(light);

let spotLight = new THREE.SpotLight( 0xffffff, 20);
spotLight.position.set( 0, 1, 6 );
spotLight.castShadow = true;
scene.add(spotLight , "spotLight");

spotLight = new THREE.SpotLight( 0xffffff, 20);
spotLight.position.set( 0, 1, -6 );
spotLight.castShadow = true;
scene.add(spotLight , "spotLight");

function animate() {
	requestAnimationFrame(animate);
	scene.update();

	// scene.get("player").position.x = Math.sin(Date.now() * 0.001) * 1.25;
	// scene.get("ennemy").position.x = Math.cos(Date.now() * 0.001) * 1.25;
}

animate();