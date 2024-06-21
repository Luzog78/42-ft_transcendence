/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Trail.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: marvin <marvin@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/13 00:25:59 by marvin            #+#    #+#             */
/*   Updated: 2024/06/21 20:59:30 by marvin           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from 'three';


class Trail
{
	constructor(scene, ball, radius, options, name)
	{
		this.ball = ball;
		this.scene = scene;
		this.name = this.scene.getName(name);

		this.radius = radius;
		this.options = options;

		this.scale = 1;

		this.init();
	}

	init()
	{
		let geometry = new THREE.SphereGeometry(this.radius, 32, 32);
		let material = new THREE.MeshStandardMaterial(this.options);

		this.mesh = new THREE.Mesh(geometry, material);
		this.scene.scene.add(this.mesh);
	}

	update(scene)
	{
		this.mesh.material.opacity -= 3.3333333 * this.scene.dt;
		let scaleFactor = Math.pow(0.0011096997970157978, this.scene.dt);
		this.mesh.geometry.scale(scaleFactor, scaleFactor, scaleFactor);

		if (this.mesh.material.opacity < 0)
		{
			this.mesh.geometry.dispose();
			this.mesh.geometry = new THREE.SphereGeometry(this.radius, 16, 16);

			this.mesh.material.color = this.ball.sphere.material.color;
			this.mesh.material.emissive = this.ball.sphere.material.emissive;

			this.mesh.position.copy(this.ball.sphere.position);
			this.mesh.material.opacity = 1;
		}
	}
}


export { Trail };
