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
	constructor(scene, points, colors, division_count, linewidth=5, name="Line")
	{
		this.scene = scene;
		this.name = this.scene.getName(name);

		this.points = points;
		this.colors = colors;
		this.division_count = division_count;
		this.linewidth = linewidth;

		this.init();
	}

	getPositionsColors(points, division_count)
	{
		const colors = [];
		const positions = [];

		const spline = new THREE.CatmullRomCurve3(points);
		const divisions = Math.round(division_count * points.length);
		const point = new THREE.Vector3();

		for ( let i = 0; i < divisions; i ++ )
		{
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
		positions.push(points[points.length - 1].x, points[points.length - 1].y, points[points.length - 1].z);
		colors.push(this.colors[this.colors.length - 1].r, this.colors[this.colors.length - 1].g, this.colors[this.colors.length - 1].b);

		return { positions, colors };
	}

	getGeometry(points, division_count)
	{
		const { positions, colors } = this.getPositionsColors(points, division_count);

		const geometry = new LineGeometry();
		geometry.setPositions( positions );
		geometry.setColors( colors );

		return geometry;
	}

	init()
	{
		const geometry = this.getGeometry(this.points, this.division_count);
		const mat_line = new LineMaterial({
			color: 0xffffff,
			linewidth: this.linewidth,
			vertexColors: true,
		});

		this.mesh = new Line2( geometry, mat_line );
		this.mesh.computeLineDistances();

		this.scene.add( this.mesh, this.name );
	}

	update(scene)
	{
		const geometry = this.getGeometry(this.points, this.division_count);
		this.mesh.geometry.dispose();
		this.mesh.geometry = geometry;
	}
}


export { Lines };
