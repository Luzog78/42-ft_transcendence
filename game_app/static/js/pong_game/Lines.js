/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Lines.js                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: marvin <marvin@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/09 15:53:07 by marvin            #+#    #+#             */
/*   Updated: 2024/06/09 15:53:07 by marvin           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as THREE from 'three';
import { Line2 } from 'line2';
import { LineMaterial } from 'linematerial';
import { LineGeometry } from 'linegeometry';

class Lines
{
	constructor(scene, points, colors, divisionCount, name="Line")
	{
		this.scene = scene;
		this.name = this.scene.getName(name);

		this.points = points;
		this.colors = colors;
		this.divisionCount = divisionCount;

		this.init();
	}

	getPositionsColors(points, divisionCount)
	{
		const colors = [];
		const positions = [];

		const spline = new THREE.CatmullRomCurve3(points);
		const divisions = Math.round(divisionCount * points.length);
		const point = new THREE.Vector3();

		for ( let i = 0; i < divisions; i ++ ) {
			
			const t = i / divisions;

			spline.getPoint( t, point );
			positions.push( point.x, point.y, point.z );
			
			let colorIndex = Math.floor(t * this.colors.length);
			let color = new THREE.Color();

			let first = this.colors[colorIndex];
			let second = this.colors[THREE.MathUtils.clamp(colorIndex + 1, 0, this.colors.length - 1)];
			
			color.lerpColors(first, second, t * this.colors.length - colorIndex);
			colors.push(color.r, color.g, color.b );
		}

		return { positions, colors };
	}

	getGeometry(points, divisionCount)
	{
		const { positions, colors } = this.getPositionsColors(points, divisionCount);

		const geometry = new LineGeometry();
		geometry.setPositions( positions );
		geometry.setColors( colors );

		return geometry;
	}

	init()
	{
		const geometry = this.getGeometry(this.points, this.divisionCount);
		const matLine = new LineMaterial({
			color: 0xffffff,
			linewidth: 5,
			vertexColors: true,
			transparent: true,
			opacity: 1,
		});

		this.mesh = new Line2( geometry, matLine );
		this.mesh.computeLineDistances();

		this.scene.add( this.mesh, this.name );
	}

	update(scene)
	{		
		const geometry = this.getGeometry(this.points, this.divisionCount);
		this.mesh.geometry.dispose();
		this.mesh.geometry = geometry;
	}
}

export { Lines }