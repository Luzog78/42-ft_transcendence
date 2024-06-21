/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   particle.js                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: marvin <marvin@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/18 23:53:26 by marvin            #+#    #+#             */
/*   Updated: 2024/06/18 23:53:26 by marvin           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from 'three';


class Particle
{
	constructor(scene, pos, vel, acc, accDec, radius, options, lifetime, name="particle")
	{
		this.scene = scene;
		this.name = this.scene.getName(name);

		this.basePos = pos.clone();
		this.baseVel = vel.clone();
		this.baseAcc = acc.clone();

		this.positionOffset = new THREE.Vector3(0, 0, 0);

		this.pos = pos;
		this.vel = vel;
		this.acc = acc;

		this.accDec = accDec;

		this.lifetime = lifetime;
		this.radius = radius;
		this.options = options;

		this.mesh = null;

		this.updates = []

		this.init();
	}

	static updatePhysics(particle)
	{
		particle.mesh.position.add(particle.vel.clone().multiplyScalar(particle.scene.dt));
		particle.vel.add(particle.acc.clone().multiplyScalar(particle.scene.dt));

		let accelerationFactor = Math.pow(10, Math.log10(particle.accDec) / 0.006);
		particle.acc.multiplyScalar(Math.pow(accelerationFactor, particle.scene.dt));
	}

	static updateFadeOpacity(particle)
	{
		particle.mesh.material.opacity -= 1 / (particle.lifetime / particle.scene.dt);
	}
	static updateRemoveOnFade(particle)
	{
		if (particle.mesh.material.opacity <= 0)
		{
			particle.scene.remove(particle);
			return;
		}
	}

	static updateResetPositionOnFade(particle, object)
	{
		if (particle.mesh.material.opacity <= 0)
		{
			particle.mesh.position.set(object.position.x, object.position.y, object.position.z);
			particle.mesh.position.add(particle.positionOffset);

			particle.mesh.material.opacity = 1;

			particle.vel = particle.baseVel.clone();
			particle.acc = particle.baseAcc.clone();
		}
	}


	addUpdate(func, args=[])
	{
		args.unshift(this);
		this.updates.push({func, args});
	}

	init()
	{
		const geometry = new THREE.SphereGeometry(this.radius, 4, 4);
		const material = new THREE.MeshBasicMaterial({
			...this.options,
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 1,
		});
		this.mesh = new THREE.Mesh( geometry, material );

		this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
		this.scene.add(this.mesh, this.name);
	}

	update()
	{
		for (let update of this.updates)
			update.func(...update.args);
	}
}


export { Particle };
