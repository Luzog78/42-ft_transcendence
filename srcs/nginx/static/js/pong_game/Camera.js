/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Camera.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: marvin <marvin@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/26 14:34:00 by marvin            #+#    #+#             */
/*   Updated: 2024/06/26 14:34:00 by marvin           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from 'three';
import CameraControls from 'cameracontrols';

CameraControls.install( { THREE: THREE } );

import { ScreenShake } from "./ScreenShake.js";


class Camera
{
	constructor(scene, renderer)
	{
		this.scene = scene;

		this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		this.camera.lookAt(0, 0, 0);
		this.camera.castShadow = true;

		this.camera_old_position = new THREE.Vector3();

		this.controls = new CameraControls(this.camera, renderer.domElement);
		this.shakeObject = ScreenShake();
	}

	update()
	{
		this.controls.update(this.scene.dt);
		this.shakeObject.update(this.camera);
	}

	setPosition(x, y, z, x_look=0, y_look=0, z_look=0, animation = true)
	{
		this.shakeObject.reset();

		this.camera_old_position = this.controls.getPosition();
		this.controls.setLookAt(x, y, z, x_look, y_look, z_look, animation);
	}

	shake(vecToAdd, milliseconds)
	{
		if (this.controls.active == true)
			return
		this.shakeObject.shake(this.camera, vecToAdd, milliseconds);
	}
}


export { Camera };
