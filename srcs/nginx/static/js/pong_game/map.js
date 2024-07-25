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
import { DynamicText } from "./DynamicText.js";
import { destroyObject } from './main.js';

function initMap(scene, theme, time_left)
{
	clearInterval(scene.intervalId);
	destroyObject(scene);

	const light = new THREE.AmbientLight( 0x555555 ); // soft white light
	scene.scene.add(light);

	scene.addBall();

	const player_num = scene.player_num;
	const color_theme = getColorTheme(theme, player_num);

	if (player_num == 2)
		init2PlayerMap(scene, color_theme);
	else
		initNPlayerMap(scene, player_num, color_theme);

	if (scene.server.client_id < player_num && scene.game_mode != "BR")
		initText(scene, player_num, time_left);
	initCamera(scene, player_num);
}

function getColorTheme(theme, player_num)
{
	const colors = {}
	colors["mapN"] = {}
	colors["map2"] = {}

	if (theme == 0)
	{
		for (let i = 0; i < player_num; i++)
			colors["mapN"][i] = new THREE.Color().setHSL(i / player_num, 1, 0.8, THREE.SRGBColorSpace);
		colors["map2"][0] = new THREE.Color(0x1f56b5);
		colors["map2"][1] = new THREE.Color(0xff4f4f);
	}
	else if (theme == 1)
	{
		for (let i = 0; i < player_num; i++)
			colors["mapN"][i] = new THREE.Color().setRGB(0.5, 0.5, 0.5, THREE.SRGBColorSpace);
		colors["map2"][0] = new THREE.Color().setRGB(0.5, 0.5, 0.5, THREE.SRGBColorSpace);
		colors["map2"][1] = new THREE.Color().setRGB(0.5, 0.5, 0.5, THREE.SRGBColorSpace);
	}
	else if (theme == 2)
	{
		for (let i = 0; i < player_num; i++)
			colors["mapN"][i] = new THREE.Color().setHSL((i / player_num) + 0.3, 0.5, 0.8, THREE.SRGBColorSpace);
		colors["map2"][0] = new THREE.Color(0x6B87B8);
		colors["map2"][1] = new THREE.Color(0xDF7777);
	}
	else if (theme == 3)
	{
		let startColor = new THREE.Color(0xB85194); // Rouge
		let endColor = new THREE.Color(0xFFB870); // Bleu
		for (let i = 0; i < player_num; i++)
			colors["mapN"][i] = startColor.clone().lerp(endColor, i / (player_num - 1));
		colors["map2"][0] = startColor;
		colors["map2"][1] = endColor;
	}
	return colors
}

function initNPlayerMap(scene, player_num, colors)
{
	const map_radius = Math.sqrt(player_num) * 2 + 2

	const floor_material = new THREE.MeshPhysicalMaterial( { color: 0x000000, side: THREE.DoubleSide } );
	floor_material.roughness = 0.65;
	floor_material.metalness = 0.0;

	const circle = new THREE.Mesh(new THREE.CircleGeometry(map_radius, player_num), floor_material ); // floor
	circle.position.set(0, 0.05, 0);
	circle.geometry.rotateX(-Math.PI / 2);
	scene.add(circle, "circle");

	const position_attribute = circle.geometry.getAttribute( 'position' );
	const vertex = new THREE.Vector3();
	const next_vertex = new THREE.Vector3();

	for (let i = 0; i < player_num; i++)
	{
		vertex.fromBufferAttribute( position_attribute, i + 2);
		next_vertex.fromBufferAttribute( position_attribute, ((i + 1) % player_num) + 2 );

		if (i == 0)
			scene.segment_size = vertex.distanceTo(next_vertex);

		let player_name = "player" + i
		let playerSize = vertex.distanceTo(next_vertex) * 0.3;
		let middle_point = new THREE.Vector3().addVectors(vertex, next_vertex).multiplyScalar(0.5);
		let color = colors["mapN"][i];
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
					[new THREE.Color(0xffffff), new THREE.Color(0xffffff)] : [color]

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
	geometry_wall.rotateY(((2 * Math.PI) / player_num) * 2);

	for (let i = 0; i < division; i++)
	{
		vertex.fromBufferAttribute(geometry_wall.getAttribute("position"), i + 2);
		points_wall.push(vertex.clone());
	}
	points_wall.push(points_wall[0]);

	let colors_wall = [];
	for (let i = 0; i < player_num; i++)
		colors_wall.push(colors["mapN"][i]);
	colors_wall.push(colors_wall[0]);

	for (let i = 0; i < 8; i++)
	{
		const wallLine = new WallLines(scene, points_wall, colors_wall, 5, "line" + i, -0.5, 0.3);
		wallLine.line.mesh.position.y = -0.5 + 0.1 * i;
		scene.entities.push(wallLine);
	}
}

function initCamera(scene, player_num, following_player = null)
{
	scene.camera.shakeObject.reset();
	if (following_player == null)
	{
		following_player = scene.server.client_id;
		if (scene.server.client_id >= player_num)
			following_player = 0;
	}
	if (player_num == 2)
	{
		scene.camera.setPosition(1.5, 4, 0);
		return ;
	}

	let camera_pos = scene.get("player" + following_player).player.position.clone();
	camera_pos = new THREE.Vector3(camera_pos.x, 4, camera_pos.z);

	const look_at_point = new THREE.Vector3(0, 0, 0);
	const direction = new THREE.Vector3().subVectors(camera_pos, look_at_point);
	direction.normalize();
	direction.y = 0;

	camera_pos.addScaledVector(direction, 4);
	scene.camera.setPosition(camera_pos.x, camera_pos.y, camera_pos.z);
}

async function init2PlayerMap(scene, colors)
{
	let spotLight = new THREE.SpotLight( 0xffffff, 20);
	spotLight.position.set( 0, 1, 6 );
	spotLight.castShadow = true;
	scene.add( spotLight , "spotLight");

	spotLight = new THREE.SpotLight( 0xffffff, 20);
	spotLight.position.set( 0, 1, -6 );
	spotLight.castShadow = true;
	scene.add( spotLight , "spotLight");

	scene.entities.push(new Player(scene, {color: colors["map2"][0], emissive: colors["map2"][0], emissiveIntensity:9}, 1, 0, new THREE.Vector3(0,0.15,4.075), "player0"));
	scene.entities.push(new Player(scene, {color: colors["map2"][1], emissive: colors["map2"][1], emissiveIntensity:3}, 1, 0, new THREE.Vector3(0,0.15,-4.075), "player1"));

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
		colors["map2"][0],
		colors["map2"][0],
		new THREE.Color().setHSL(0.75, 1, 1.0, THREE.SRGBColorSpace),
		colors["map2"][1]
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
	let visual_angle = Math.PI - player.angle;
	let direction_scale = 1;
	let y_offset = 1;
	const player_id = parseInt(player.name.replace("player", ""));
	if (scene.player_num == 2)
	{
		direction_scale = 0;
		visual_angle = (player_id + 1) * Math.PI;
		y_offset = 0.5;
	}

	let max_size;
	max_size = Math.min(scene.segment_size / 2, 2);
	if (scene.player_num == 2)
		max_size = 1;

	const text_size = max_size / (name.length * 0.5);

	const text_position = new THREE.Vector3().copy(player.player.position);
	const direction = new THREE.Vector3(Math.cos(player.angle + Math.PI / 2), 0, Math.sin(player.angle + Math.PI / 2));

	if (scene.player_num != 2 && scene.game_mode != "BR")
	{
		const rotation = new THREE.Vector3(-Math.PI / 2, Math.PI + visual_angle, 0);
		const dynamic_score_position = text_position.clone();
		dynamic_score_position.addScaledVector(direction, -1);
		new DynamicText(scene, "0", dynamic_score_position, rotation, text_size, 0xffffff, player.name + "textscore");
	}


	if (player.name == "player" + scene.server.client_id)
		return;

	text_position.y += y_offset;
	text_position.addScaledVector(direction, direction_scale);

	const text = scene.addText(name, {color: 0xffffff}, text_size, player.name + "text");

	text.geometry.rotateY(visual_angle);
	text.geometry.translate(text_position);
}

function initText(scene, player_num, time_left)
{
	if (scene.game_mode == "TO")
	{
		const my_player = scene.get("player" + scene.server.client_id);

		let text_size = (1 / scene.segment_size ) * 4;
		const rotation = new THREE.Vector3(-Math.PI / 2, Math.PI - my_player.angle + Math.PI, 0);

		if (player_num == 2)
		{
			text_size = 0.5;
			rotation.y = Math.PI / 2;
		}

		const text_position = new THREE.Vector3(0,0.1,0);
		const time = new Date(time_left * 1000).toISOString().substring(14, 19);
		new DynamicText(scene, time, text_position, rotation, text_size, 0xffffff, "timertext");
		
	}
	
	if (scene.game_mode != "BR" && player_num == 2)
	{
		const score_1_pos = new THREE.Vector3(-1.25,0.1,0.5);
		const score_2_pos = new THREE.Vector3(-1.25,0.1,-0.5);

		const rotation_score = new THREE.Vector3(-Math.PI / 2, Math.PI / 2, 0);
		new DynamicText(scene, "0", score_1_pos, rotation_score, 0.5, 0xffffff, "player0textscore");
		new DynamicText(scene, "0", score_2_pos, rotation_score, 0.5, 0xffffff, "player1textscore");
	}
}


export { initMap, initPlayerText, initCamera };
