/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Oauth.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: psalame <psalame@student.42angouleme.fr    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/11 09:50:44 by psalame           #+#    #+#             */
/*   Updated: 2024/07/11 11:29:27 by psalame          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { getLang, persistError, redirect } from "../script.js";

async function Oauth(context) {
	setTimeout(() => {
		var code = new URLSearchParams(window.location.search).get("code");
		if (code == null || code.length == 0) {
			persistError(context, getLang(context, "errors.oauthMissingCredentials"));
			redirect("/login");
			return;
		}
		
		postJson(context, `api/oauth_callback`, {
			code: code
		}).then((data) => {
			if (!data.ok) {
				persistError(context, getLang(context, data.error));
				redirect("/login");
				return;
			}
		});
	}, 200);

	return "";
}

export {
	Oauth
}