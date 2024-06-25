/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   main.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ycontre <ycontre@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/21 02:24:36 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/25 15:18:10 by ycontre          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from 'three';

import { Scene } from "./Scene.js";


let scene;

async function init_scene()
{
	scene = new Scene(75);
	await scene.init()
	scene.scene.background = new THREE.Color(0x101010);

	scene.camera.castShadow = true;
}

function destroyObject()
{
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
	scene.elements = {};
}

function destroy_scene()
{
	scene.renderer.clear();
	const canvas = scene.renderer.domElement;
	if (canvas && canvas.parentElement)
		canvas.parentElement.removeChild(canvas);

	destroyObject();

	window.removeEventListener("keyup", scene.get("player" + scene.server.client_id).keyup_event_func);
	window.removeEventListener("keydown", scene.get("player" + scene.server.client_id).keydown_event_func);

	scene.server.disconnect();

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

	requestAnimationFrame( animate );
}


export { init_scene, destroy_scene, destroyObject, animate };
