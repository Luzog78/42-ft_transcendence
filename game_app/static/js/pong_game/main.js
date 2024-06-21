/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   main.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/21 02:24:36 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/21 02:34:28 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from 'three';

import { Scene } from "./Scene.js";


let scene;

function init_scene()
{
	scene = new Scene(75);
	scene.scene.background = new THREE.Color(0x101010);

	scene.camera.castShadow = true;
}

function destroy_scene()
{
	scene.renderer.clear();
	const canvas = scene.renderer.domElement;
	if (canvas && canvas.parentElement)
		canvas.parentElement.removeChild(canvas);

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

	window.removeEventListener("keyup", scene.get("player" + scene.server.client_id).keyup_event_func);
	window.removeEventListener("keydown", scene.get("player" + scene.server.client_id).keydown_event_func);

	scene.server.disconnect();

	scene = undefined;
}

function animate()
{
	if (scene == undefined)
		return;
	requestAnimationFrame(animate);
	scene.update();
}


export { init_scene, destroy_scene, animate };
