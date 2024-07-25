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
		console.log("CREATE TEXT " + this.name);

		this.text = text;
		this.position = position;
		this.rotation = rotation;
		this.size = size;
		this.color = color;

		this.updateText(this.text);
		this.scene.elements[this.name] = this;
	}

	updateText(text)
	{
		console.log("UPDATE TEXT TO " + text);
		this.scene.removeMesh(this.mesh);
		this.text = String(text);

		this.mesh = this.scene.addText(this.text, {color: this.color}, this.size, this.name + "element");
		this.mesh.geometry.rotateX(this.rotation.x);
		this.mesh.geometry.rotateY(this.rotation.y);
		this.mesh.geometry.rotateZ(this.rotation.z);
		this.mesh.geometry.translate(this.position.x, this.position.y, this.position.z);
	}
}


export { DynamicText };
