/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   map.js                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/21 02:25:11 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/21 02:25:11 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from 'three';

import { WallLines } from "./LineEffects.js";
import { Lines } from "./Lines.js";
import { Player } from "./Player.js";
import { Ball } from "./Ball.js";

function initMap(scene, player_num)
{
	let light = new THREE.AmbientLight( 0x555555 ); // soft white light
	scene.scene.add(light);

	scene.ball = new Ball(scene, 0.15, {color: 0xffffff, emissive:0xffffff, emissiveIntensity:3}, "ball")
	scene.entities.push(scene.ball);

	if (player_num == 2)
		init2PlayerMap(scene);
	else
		initNPlayerMap(scene, player_num);

	initCamera(scene, player_num);
	// scene.updateCamera();
}

function initNPlayerMap(scene, number)
{
	const map_radius = Math.sqrt(number) * 2 + 2

	const floor_material = new THREE.MeshPhysicalMaterial( { color: 0x000000, side: THREE.DoubleSide } );
	floor_material.roughness = 0.65;
	floor_material.metalness = 0.0;

	const circle = new THREE.Mesh(new THREE.CircleGeometry(map_radius, number), floor_material ); // floor
	circle.position.set(0, 0.05, 0);
	circle.geometry.rotateX(-Math.PI / 2);
	scene.add(circle, "circle");

	scene.get("ball").position.set(0,0.25,0);

	const position_attribute = circle.geometry.getAttribute( 'position' );
	const vertex = new THREE.Vector3();
	const next_vertex = new THREE.Vector3();

	for (let i = 0; i < number; i++)
	{
		vertex.fromBufferAttribute( position_attribute, i + 2);
		next_vertex.fromBufferAttribute( position_attribute, ((i + 1) % number) + 2 );

		if (i == 0)
			scene.segment_size = vertex.distanceTo(next_vertex);

		let player_name = "player" + i
		let playerSize = vertex.distanceTo(next_vertex) * 0.3;
		let middle_point = new THREE.Vector3().addVectors(vertex, next_vertex).multiplyScalar(0.5);
		let color = new THREE.Color().setHSL(i / number, 1, 0.8, THREE.SRGBColorSpace);
		let angle = Math.atan2(next_vertex.z - vertex.z, next_vertex.x - vertex.x);

		let player_position = new THREE.Vector3(middle_point.x, 0.15, middle_point.z - 0.075);
		let player = new Player(scene, {color: color, emissive:color, emissiveIntensity:3}, playerSize, angle, player_position, player_name);
		if (i > scene.server.client_id)
			player.player.visible = false;
		scene.entities.push(player);

		let line_points = [vertex.clone(), next_vertex.clone()];
		for (let line of line_points)
			line.y += 0.05;
		let line_colors = i == scene.server.client_id ?
					[new THREE.Color(0xffffff), new THREE.Color(0xffffff)] :
					[new THREE.Color().setHSL(i / number, 1, 0.8, THREE.SRGBColorSpace)]

		new Lines(scene, line_points, line_colors, 5, 5, "line" + i);

		angle += Math.PI / 2;
		let direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
		direction.normalize();
		direction.y = 0;

		let spotlight_pos = middle_point.clone();
		spotlight_pos.addScaledVector(direction, 2);


		let spotLight = new THREE.SpotLight( 0xffffff, 10);
		spotLight.position.set(spotlight_pos.x, 1, spotlight_pos.z);
		scene.add(spotLight , "spotLight" + i);
	}

	let points_wall = [];
	let division = 50;

	const geometry_wall = new THREE.CircleGeometry(map_radius + 0.8, division);
	geometry_wall.rotateX(-Math.PI / 2);
	geometry_wall.rotateY(((2 * Math.PI) / number) * 2);

	for (let i = 0; i < division; i++)
	{
		vertex.fromBufferAttribute(geometry_wall.getAttribute("position"), i + 2);
		points_wall.push(vertex.clone());
	}
	points_wall.push(points_wall[0]);

	let colors_wall = [];
	for (let i = 0; i < number; i++)
		colors_wall.push(new THREE.Color().setHSL(i / number, 1, 0.8, THREE.SRGBColorSpace));
	colors_wall.push(colors_wall[0]);

	for (let i = 0; i < 8; i++)
	{
		const wallLine = new WallLines(scene, points_wall, colors_wall, 5, "line" + i, -0.5, 0.3);
		wallLine.line.mesh.position.y = -0.5 + 0.1 * i;
		scene.entities.push(wallLine);
	}
}

function initCamera(scene, player_num)
{
	if (player_num == 2)
	{
		scene.camera.setPosition(1.5, 4, 0);
		return ;
	}

	let camera_pos = scene.get("player" + scene.server.client_id).player.position.clone();
	camera_pos = new THREE.Vector3(camera_pos.x, 4, camera_pos.z);

	const look_at_point = new THREE.Vector3(0, 0, 0);
	const direction = new THREE.Vector3().subVectors(camera_pos, look_at_point);
	direction.normalize();
	direction.y = 0;

	camera_pos.addScaledVector(direction, 4);
	scene.camera.setPosition(camera_pos.x, camera_pos.y, camera_pos.z);
}

async function init2PlayerMap(scene)
{
	let spotLight = new THREE.SpotLight( 0xffffff, 20);
	spotLight.position.set( 0, 1, 6 );
	spotLight.castShadow = true;
	scene.add( spotLight , "spotLight");

	spotLight = new THREE.SpotLight( 0xffffff, 20);
	spotLight.position.set( 0, 1, -6 );
	spotLight.castShadow = true;
	scene.add( spotLight , "spotLight");

	scene.entities.push(new Player(scene, {color: 0x1f56b5, emissive:0x1f56b5, emissiveIntensity:9}, 1, 0, new THREE.Vector3(0,0.15,4.075), "player0"));
	scene.entities.push(new Player(scene, {color: 0xff4f4f, emissive:0xff4f4f, emissiveIntensity:3}, 1, 0, new THREE.Vector3(0,0.15,-4.075), "player1"));

	scene.get("ball").position.set(0,0.25,0);
	if (scene.server.client_id == 0)
		scene.get("player1").player.visible = false;

	scene.addBox(4, 0.1, 8, {color: 0x0}, "floor");
	scene.addBox(0.2, 0.75, 8, {color: 0xbbbbbb, emissive:0xbbbbbb, emissiveIntensity:2, visible:false}, "wall1");
	scene.addBox(0.2, 0.75, 8, {color: 0xbbbbbb, emissive:0xbbbbbb, emissiveIntensity:2, visible:false}, "wall2");
	scene.get("wall1").position.x = 2.1;
	scene.get("wall2").position.x = -2.1;

	let points_wall = [
		new THREE.Vector3(0, 0.75, 4),
		new THREE.Vector3(0, 0.75, 0),
		new THREE.Vector3(0, 0.75, -4),
	];

	let colors_wall = [
		new THREE.Color().setHSL(0.5, 1, 0.5, THREE.SRGBColorSpace),
		new THREE.Color().setHSL(0.5, 1, 0.85, THREE.SRGBColorSpace),
		new THREE.Color().setHSL(0.75, 1, 1.0, THREE.SRGBColorSpace),
		new THREE.Color().setHSL(1.0, 1, 0.75, THREE.SRGBColorSpace),
	]

	for (let i = 0; i < 8; i++)
	{
		scene.entities.push(new WallLines(scene, points_wall, colors_wall, 10, "line" + i, -1, -0.2));

		scene.get("line" + i).position.x = -2;
		scene.get("line" + i).position.y = -1 + 0.1 * i;
	}
	for (let i = 0; i < 8; i++)
	{
		scene.entities.push(new WallLines(scene, points_wall, colors_wall, 10, "line2" + i, -1, -0.2));

		scene.get("line2" + i).position.x = 2;
		scene.get("line2" + i).position.y = -1 + 0.1 * i;
	}

	let points_floor1 = [
		new THREE.Vector3(-2, 0.05, 4),
		new THREE.Vector3(-2, 0.05, 0),
		new THREE.Vector3(-2, 0.05, -4),
	];
	let points_floor2 = [
		new THREE.Vector3(-2, 0.05, -4),
		new THREE.Vector3(0, 0.05, -4),
		new THREE.Vector3(2, 0.05, -4),
	];
	let points_floor3 = [
		new THREE.Vector3(2, 0.05, 4),
		new THREE.Vector3(2, 0.05, 0),
		new THREE.Vector3(2, 0.05, -4),
	];
	let points_floor4 = [
		new THREE.Vector3(-2, 0.05, 4),
		new THREE.Vector3(0, 0.05, 4),
		new THREE.Vector3(2, 0.05, 4),
	];

	let colors_floor = [
		new THREE.Color().setHSL(0.8, 1, 0.8, THREE.SRGBColorSpace),
		new THREE.Color().setHSL(0.8, 1, 0.8, THREE.SRGBColorSpace),
		new THREE.Color().setHSL(0.75, 1,0.8, THREE.SRGBColorSpace),
		new THREE.Color().setHSL(0.7, 1, 0.8, THREE.SRGBColorSpace),
	]
	new Lines(scene, points_floor1, colors_floor, 2, 4, "linefloor");
	new Lines(scene, points_floor2, colors_floor, 2, 4, "linefloor");
	new Lines(scene, points_floor3, colors_floor, 2, 4, "linefloor");
	new Lines(scene, points_floor4, colors_floor, 2, 4, "linefloor");

	for (let i = 0; i < 13; i++)
		scene.addBox(0.13, 0.11, 0.13, {color: 0x999999, emissive:0x999999}, "floor" + i).position.set((i * 0.3) - 1.80, 0.01, 0);
	
	scene.segment_size = 4
	
}

function initPlayerText(scene, player, name)
{
	const text_position = new THREE.Vector3().copy(player.player.position);
	const direction = new THREE.Vector3(Math.cos(player.angle + Math.PI / 2), 0, Math.sin(player.angle + Math.PI / 2));

	let max_size;
	max_size = Math.min(scene.segment_size / 2, 2);
	if (scene.player_num == 2)
		max_size = 1;

	const text_size = max_size / (name.length * 0.5);
	const text = scene.addText(name, {color: 0xffffff}, text_size, player.name + "text");

	let visual_angle = Math.PI - player.angle;
	let direction_scale = 1;
	let y_offset = 1;
	if (scene.player_num == 2)
	{
		direction_scale = 0;
		visual_angle = (scene.server.client_id) * Math.PI; //turn the text to the player
		y_offset = 0.5;
	}

	text_position.y += y_offset;
	text_position.addScaledVector(direction, direction_scale);

	text.geometry.rotateY(visual_angle);
	text.geometry.translate(text_position);
}

function initTextScore(scene, player_num)
{
	const score_1_pos = new THREE.Vector3(-1.25,0.1,0.5);
	const score_2_pos = new THREE.Vector3(-1.25,0.1,-0.5);

	const score_1 = scene.addText("0", {color: 0xffffff}, 0.5, "score1");
	const score_2 = scene.addText("5", {color: 0xffffff}, 0.5, "score2");

	score_1.geometry.rotateX(-Math.PI / 2);
	score_1.geometry.rotateY(Math.PI / 2);
	score_1.geometry.translate(score_1_pos);

	score_2.geometry.rotateX(-Math.PI / 2);
	score_2.geometry.rotateY(Math.PI / 2);
	score_2.geometry.translate(score_2_pos)
}

export { initMap, initTextScore, initPlayerText };
