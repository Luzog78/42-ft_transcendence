/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   DynamicText.js                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: marvin <marvin@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/28 22:42:31 by marvin            #+#    #+#             */
/*   Updated: 2024/06/28 22:42:31 by marvin           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

class DynamicText
{
	constructor(scene, text, position, rotation, size, color, name="text")
	{
		this.scene = scene;
		this.name = this.scene.getName(name);

		this.text = text;
		this.position = position;
		this.size = size;
		this.color = color;

		this.mesh = this.scene.addText(this.text, {color: this.color}, this.size, this.name);
		this.mesh.geometry.rotateX(rotation.x);
		this.mesh.geometry.rotateY(rotation.y);
		this.mesh.geometry.rotateZ(rotation.z);
		this.mesh.geometry.translate(this.position.x, this.position.y, this.position.z);
	}

	updateText(text)
	{
		this.scene.remove(this);
		this.text = text;
		this.mesh = this.scene.addText(this.text, {color: this.color}, this.size, this.name);
	}
}

export { DynamicText }