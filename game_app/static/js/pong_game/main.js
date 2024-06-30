/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   main.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: marvin <marvin@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/21 02:24:36 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/30 20:35:45 by marvin           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from 'three';

import { Scene } from "./Scene.js";


let scene = undefined;

async function initScene()
{
	if (scene !== undefined)
		return;

	scene = new Scene();
	await scene.init()

	scene.scene.background = new THREE.Color(0x101010);
	scene.renderer.setAnimationLoop( animate );
}

function destroyObject()
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

	window.removeEventListener("keyup", scene.get("player" + scene.server.client_id).keyup_event_func);
	window.removeEventListener("keydown", scene.get("player" + scene.server.client_id).keydown_event_func);

	scene.renderer.clear();
	const canvas = scene.renderer.domElement;
	if (canvas && canvas.parentElement)
		canvas.parentElement.removeChild(canvas);

	destroyObject();

	let server = scene.server;
	server.send("disconnect");
	setTimeout(() => server.disconnect(), 250);

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
	// requestAnimationFrame( animate );
}


export { initScene, destroyScene, destroyObject, animate };
