/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ball.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: marvin <marvin@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/08 15:00:07 by marvin            #+#    #+#             */
/*   Updated: 2024/06/08 15:00:07 by marvin           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from 'three';
import { RingBlob } from "./ringBlob.js"
import { Particle } from "./particle.js"

function closestPointOnSegment(A, B, P)
{
	const AB = { x: B.x - A.x, y: B.y - A.y };
	const AP = { x: P.x - A.x, y: P.z - A.y };
	const AB_squared = AB.x * AB.x + AB.y * AB.y;

	if (AB_squared === 0)
		return A;

	let t = (AP.x * AB.x + AP.y * AB.y) / AB_squared;
	t = Math.max(0, Math.min(1, t));

	return { x: A.x + t * AB.x, y: A.y + t * AB.y };
}

function closestPointOnRectangle(rectangle, point)
{
	let closestPoint = null;
	let minDistance = Infinity;

	for (let i = 0; i < rectangle.length; i++)
	{
		const j = (i + 1) % rectangle.length;
		const segmentClosestPoint = closestPointOnSegment(rectangle[i], rectangle[j], point);
		const distance = Math.hypot(segmentClosestPoint.x - point.x, segmentClosestPoint.y - point.z);

		if (distance < minDistance) {
			minDistance = distance;
			closestPoint = segmentClosestPoint;
		}
	}

	return { closestPoint, minDistance };
}

class Ball
{
	constructor(scene, radius, options, name)
	{
		this.scene = scene;
		
		this.terminalVelocity = 12;

		let maxX = 1.2;
		let minX = 1.2;
		let maxZ = 1.2;
		let minZ = 1.2;
		this.vel = new THREE.Vector3(Math.random() * (maxX - minX) + minX, 0, Math.random() * (maxZ - minZ) + minZ);
		this.acc = new THREE.Vector3(0, 0, 0);

		this.trails = []
		this.trailsLength = 20;

		this.radius = radius;
		this.sphere = this.scene.addSphere(this.radius, options, name);
	}

	effectCollision(scene, wallname, position, normal)
	{
		let shake = Math.exp(this.vel.length() / 100) - 1;
		scene.shake.shake(scene.camera, new THREE.Vector3(shake, 0), 400);

		position = position.sub(normal.multiplyScalar(this.radius * 0.85));
		
		if (wallname.includes("wall"))
			scene.entities.push(new RingBlob(scene, 0.2, 100, {color: 0xffffff}, position));
		if (wallname == "playerbox" || wallname == "ennemybox")
			scene.get(wallname.replace("box", "")).bump(normal);
	}

	resolutionCollision(closestPoint, minDistance, wallname, scene)
	{
		let sphere = this.sphere.position;

		const collisionNormal = {
			x: (sphere.x - closestPoint.x) / minDistance,
			y: (sphere.z - closestPoint.y) / minDistance
		};

		const penetrationDepth = this.radius - minDistance;
		const newCircleCenter = {
			x: sphere.x + penetrationDepth * collisionNormal.x,
			y: sphere.z + penetrationDepth * collisionNormal.y
		};
		this.sphere.position.set(newCircleCenter.x, 0.25, newCircleCenter.y);
		
		this.vel.reflect(new THREE.Vector3(collisionNormal.x, 0, collisionNormal.y));
		if (this.vel.length() < this.terminalVelocity)
			this.vel.setLength(this.vel.length() + 0.1);

		// let wallSpeed = scene.get(wallname).;

		this.effectCollision(scene, wallname, 
							new THREE.Vector3(newCircleCenter.x, 0.25, newCircleCenter.y),
							new THREE.Vector3(collisionNormal.x, 0.25, collisionNormal.y),);
	}

	checkCollision(scene)
	{
		let walls = ["wall1", "wall2", "playerbox", "ennemybox"];
		for (let wallname of walls)
		{
			let wall = scene.get(wallname);
			let bounding = wall.geometry.boundingBox;

			let line = {x:wall.position.x - bounding.min.x, z:wall.position.z - bounding.min.z, x2:wall.position.x - bounding.max.x, z2:wall.position.z - bounding.max.z};
			let rectangle = [
				{ x: line.x, y: line.z },
				{ x: line.x2, y: line.z },
				{ x: line.x2, y: line.z2 },
				{ x: line.x, y: line.z2 }
			]
			let sphere = this.sphere.position;
			const { closestPoint, minDistance } = closestPointOnRectangle(rectangle, sphere);
			const collision = minDistance <= this.radius;

			if (!collision)
				continue;
			this.resolutionCollision(closestPoint, minDistance, wallname, scene);
		}
	}

	
	update(scene)
	{
		this.checkCollision(scene);
		
		let color = 270 - this.sphere.position.z * 20;
		this.sphere.material.color = new THREE.Color(`hsl(${color}, 100%, 80%)`);
		this.sphere.material.emissive = new THREE.Color(`hsl(${color}, 100%, 80%)`);
		
		if (this.trails.length < this.trailsLength)
		{
			let particle = new Particle(scene, this, 0.15, {
				color: this.sphere.material.color,
				emissive: this.sphere.material.color,
				emissiveIntensity: 3,
				transparent: true,
				opacity: 1,
				alphaTest: 0.01
			}, "particle");

			particle.mesh.position.set(this.sphere.position.x, this.sphere.position.y, this.sphere.position.z);
			this.trails.push(particle);
		}

		for (let i = 0; i < this.trails.length; i++)
			this.trails[i].update(scene)

		this.sphere.position.add(new THREE.Vector3().copy(this.vel).multiplyScalar(this.scene.dt));
		this.vel.add(this.acc);
		this.acc.multiplyScalar(0.99);
	}
}

export { Ball };