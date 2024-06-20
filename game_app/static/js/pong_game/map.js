import * as THREE from 'three';

import { WallLines } from "./LineEffects.js"
import { Lines } from "./Lines.js"
import { Player } from "./player.js"

function initMap(scene, player_num)
{
	let light = new THREE.AmbientLight( 0x555555 ); // soft white light
	scene.scene.add(light);

	if (player_num == 2)
		init2PlayerMap(scene);
	else
		initNPlayerMap(scene, player_num);
}

let middleVertexPositions = []
let angleVertex = []

function initNPlayerMap(scene, number)
{
	const mapRadius = Math.sqrt(number) * 2 + 2
	
	const geometry = new THREE.CircleGeometry(mapRadius, number);
	const material = new THREE.MeshPhysicalMaterial( { color: 0x000000, side: THREE.DoubleSide } );
	material.roughness = 0.6;
	material.metalness = 0.1;

	const circle = new THREE.Mesh( geometry, material ); // floor
	circle.position.set(0, 0.05, 0);
	circle.geometry.rotateX(-Math.PI / 2);
	// circle.geometry.rotateY(Math.PI / 4);
	scene.add(circle, "circle");
	
	scene.get("ball").position.set(0,0.25,0);

	const positionAttribute = geometry.getAttribute( 'position' );
	const vertex = new THREE.Vector3();
	const nextVertex = new THREE.Vector3();

	let distance = 0;
	for (let i = 0; i < number; i++)
	{
		vertex.fromBufferAttribute( positionAttribute, i + 2);
		nextVertex.fromBufferAttribute( positionAttribute, ((i + 1) % number) + 2 );
		if (i == 0)
			distance = vertex.distanceTo(nextVertex);

		let middlePoint = new THREE.Vector3().addVectors(vertex, nextVertex).multiplyScalar(0.5);
		middleVertexPositions.push(middlePoint);

		let angle = Math.atan2(nextVertex.z - vertex.z, nextVertex.x - vertex.x);
		angleVertex.push(angle);
	}

	for (let i = 0; i < number; i++)
	{
		let mid = middleVertexPositions[i];
		let angle = angleVertex[i];
		let playerName = "player" + i

		let color = new THREE.Color().setHSL(i / number, 1, 0.8, THREE.SRGBColorSpace);

		scene.entities.push(new Player(scene, {color: color, emissive:color, emissiveIntensity:3.5}, distance, playerName));
		
		let player = scene.get(playerName);
		player.player.position.set(mid.x, 0.15, mid.z - 0.075);
		player.player.rotation.y = -angle;
		player.angle = angle;
	}
}

function initCamera(scene)
{
	if (middleVertexPositions.length == 0)
		return;
	let cameraTempPos = middleVertexPositions[scene.server.client_id];
	scene.camera.position.set(cameraTempPos.x, 5, cameraTempPos.z);

	const lookAtPoint = new THREE.Vector3(0, 0, 0);
	const direction = new THREE.Vector3().subVectors(scene.camera.position, lookAtPoint);
	
	direction.normalize();
	direction.y = 0;

	scene.camera.position.addScaledVector(direction, 4);
	scene.camera.updateProjectionMatrix();
}

function init2PlayerMap(scene)
{

	let spotLight = new THREE.SpotLight( 0xffffff, 20);
	spotLight.position.set( 0, 1, 6 );
	spotLight.castShadow = true;
	scene.add( spotLight , "spotLight");

	spotLight = new THREE.SpotLight( 0xffffff, 20);
	spotLight.position.set( 0, 1, -6 );
	spotLight.castShadow = true;
	scene.add( spotLight , "spotLight");

	scene.entities.push(new Player(scene, {color: 0x1f56b5, emissive:0x1f56b5, emissiveIntensity:9}, 3, "player0"));
	scene.entities.push(new Player(scene, {color: 0xff4f4f, emissive:0xff4f4f, emissiveIntensity:3}, 3, "player1"));

	scene.get("player0").player.position.set(0,0.15,4.075);
	scene.get("player1").player.position.set(0,0.15,-4.075);
	scene.get("ball").position.set(0,0.25,0);

	scene.camera.position.x = 1.5;
	scene.camera.position.y = 4;
	
	scene.addBox(4, 0.1, 8, {color: 0x0}, "floor");
	scene.addBox(0.2, 0.75, 8, {color: 0xbbbbbb, emissive:0xbbbbbb, emissiveIntensity:2, visible:false}, "wall1");
	scene.addBox(0.2, 0.75, 8, {color: 0xbbbbbb, emissive:0xbbbbbb, emissiveIntensity:2, visible:false}, "wall2");
	scene.get("wall1").position.x = 2.1;
	scene.get("wall2").position.x = -2.1;

	let points_wall = [
		new THREE.Vector3(0, 0.75, 4),
		new THREE.Vector3(0, 0.75, 0),
		new THREE.Vector3(0, 0.75, -4.2),
	];
	let colors_wall = [
		new THREE.Color().setHSL(0.5, 1, 0.5, THREE.SRGBColorSpace),
		new THREE.Color().setHSL(0.5, 1, 0.85, THREE.SRGBColorSpace),
		new THREE.Color().setHSL(0.75, 1, 1.0, THREE.SRGBColorSpace),
		new THREE.Color().setHSL(1.0, 1, 0.75, THREE.SRGBColorSpace),
	]

	for (let i = 0; i < 8; i++)
	{
		scene.entities.push(new WallLines(scene, points_wall, colors_wall, 10, "line" + i));

		scene.get("line" + i).position.x = -2;
		scene.get("line" + i).position.y = -1 + 0.1 * i;
	}
	for (let i = 0; i < 8; i++)
	{
		scene.entities.push(new WallLines(scene, points_wall, colors_wall, 10, "line2" + i));

		scene.get("line2" + i).position.x = 2;
		scene.get("line2" + i).position.y = -1 + 0.1 * i;
	}

	let points_floor1 = [
		new THREE.Vector3(-1.95, 0.05, 4),
		new THREE.Vector3(-1.95, 0.05, 0),
		new THREE.Vector3(-1.95, 0.05, -4.2),
	];
	let points_floor2 = [
		new THREE.Vector3(-1.95, 0.05, -4),
		new THREE.Vector3(0, 0.05, -4),
		new THREE.Vector3(2.05, 0.05, -4),
	];
	let points_floor3 = [
		new THREE.Vector3(1.95, 0.05, 4),
		new THREE.Vector3(1.95, 0.05, 0),
		new THREE.Vector3(1.95, 0.05, -4.2),
	];
	let points_floor4 = [
		new THREE.Vector3(-1.95, 0.05, 4),
		new THREE.Vector3(0, 0.05, 4),
		new THREE.Vector3(2.05, 0.05, 4),
	];

	let colors_floor = [
		new THREE.Color().setHSL(0.8, 1, 0.8, THREE.SRGBColorSpace),
		new THREE.Color().setHSL(0.8, 1, 0.8, THREE.SRGBColorSpace),
		new THREE.Color().setHSL(0.75, 1,0.8, THREE.SRGBColorSpace),
		new THREE.Color().setHSL(0.7, 1, 0.8, THREE.SRGBColorSpace),
	]
	new Lines(scene, points_floor1, colors_floor, 13, 4, "linefloor");
	new Lines(scene, points_floor2, colors_floor, 13, 4, "linefloor");
	new Lines(scene, points_floor3, colors_floor, 13, 4, "linefloor");
	new Lines(scene, points_floor4, colors_floor, 13, 4, "linefloor");

	//floor
	for (let i = 0; i < 13; i++)
		scene.addBox(0.13, 0.11, 0.13, {color: 0x999999, emissive:0x999999}, "floor" + i).position.set((i * 0.3) - 1.80, 0.01, 0);

	scene.addText("0", {color: 0xffffff}, 0.5, new THREE.Vector3(-1.25,0.1,0.5), "text1")
	scene.addText("5", {color: 0xffffff}, 0.5, new THREE.Vector3(-1.25,0.1,-0.5), "text2")
}

export { initMap, initCamera }