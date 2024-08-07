/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   main.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/21 02:24:36 by ysabik            #+#    #+#             */
/*   Updated: 2024/07/26 09:20:32 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from 'three';

import { Scene } from "./Scene.js";
import { tryTo } from '../utils.js';

let scene = undefined;

async function initScene(uid)
{
	if (scene !== undefined)
		return;

	scene = new Scene();
	await scene.init(uid);

	scene.scene.background = new THREE.Color(0x101010);
	scene.renderer.setAnimationLoop( animate );
}

function destroyObject(object)
{
	if (object === undefined)
		return;

	if (object.geometry)
		object.geometry.dispose();

	if (object.material)
	{
		if (Array.isArray(object.material))
			object.material.forEach(material => material.dispose());
		else
			object.material.dispose();
	}

	scene.removeMesh(object);
}

function destroyObjects()
{
	clearInterval(scene.interval_timer_id);
	scene.scene.traverse(object => {
		if (!object.isMesh)
			return;

		if (object.geometry)
			object.geometry.dispose();

		if (object.material)
		{
			if (Array.isArray(object.material))
				object.material.forEach(material => material.dispose());
			else
				object.material.dispose();
		}
	});

	while (scene.scene.children.length > 0)
		scene.scene.remove(scene.scene.children[0]);

	scene.entities = [];
	scene.balls = [];
	scene.elements = {};
}

function destroyScene()
{
	if (scene === undefined)
		return;

	tryTo(() => window.removeEventListener("keyup", scene.get("player" + scene.server.client_id).keyup_event_func));
	tryTo(() => window.removeEventListener("keydown", scene.get("player" + scene.server.client_id).keydown_event_func));

	tryTo(() => window.removeEventListener("keyup", scene.spectator.keyup_event_func));
	tryTo(() => window.removeEventListener("keydown", scene.spectator.keydown_event_func));

	scene.renderer.clear();
	const canvas = scene.renderer.domElement;
	if (canvas && canvas.parentElement)
		canvas.parentElement.removeChild(canvas);

	destroyObjects();

	let server = scene.server;
	server.send("disconnect");
	server.disconnect()

	scene.renderer.setAnimationLoop( null );

	scene = undefined;
}

let frame_rate_ms = 1000 / 120;
let previous_timestamp = 0;

function animate(timestamp)
{
	if (scene == undefined)
		return;

	if (timestamp - previous_timestamp > frame_rate_ms)
	{
		scene.update();
		previous_timestamp = timestamp;
	}
}

function fillWithBots()
{
	if (scene === undefined)
		return;
	scene.server.sendData("fill", []);
}


export { initScene, destroyScene, destroyObjects, destroyObject, animate, fillWithBots };
