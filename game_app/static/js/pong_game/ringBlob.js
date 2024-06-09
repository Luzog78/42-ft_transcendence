/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ringBlob.js                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: marvin <marvin@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/09 01:13:05 by marvin            #+#    #+#             */
/*   Updated: 2024/06/09 01:13:05 by marvin           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from 'three';

class RingBlob
{
	constructor(scene, radiusMax, timeToFade, options, position, name="ringBlob")
	{
		this.scene = scene;
		this.name = this.scene.getName(name)
		
		this.radiusMax = radiusMax;
		this.currentRadius = 0;
		
		this.timeToFade = timeToFade;
		
		this.options = options;
		this.init(position);
	}

	init(position)
	{
		const geometry = new THREE.RingGeometry(0.01, 0.015, 32);
		const material = new THREE.MeshBasicMaterial({...this.options, side: THREE.DoubleSide, transparent: true, opacity: 1});
		this.mesh = new THREE.Mesh( geometry, material );
		
		this.mesh.position.set(position.x, position.y, position.z);

		this.mesh.rotation.y = Math.PI / 2;
		this.scene.add(this.mesh, this.name);
	}

	update(scene)
	{
		if (this.currentRadius >= this.radiusMax)
		{
			this.scene.remove(this);
			return;
		}
		this.currentRadius += this.radiusMax / this.timeToFade;

		this.mesh.geometry.dispose();
		this.mesh.geometry = new THREE.RingGeometry(this.currentRadius + 0.01, this.currentRadius + 0.03, 32);

		this.mesh.material.opacity -= 1 / this.timeToFade;
	}
}

export { RingBlob };