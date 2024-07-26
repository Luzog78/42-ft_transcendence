/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Oauth.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/11 09:50:44 by psalame           #+#    #+#             */
/*   Updated: 2024/07/26 09:19:06 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { getLang, persistError, persistSuccess, redirect, onLogin } from "../script.js";
import { postJson } from "../utils.js";


async function Oauth(context) {
	setTimeout(() => {
		var code = new URLSearchParams(window.location.search).get("code");
		if (code == null || code.length == 0) {
			persistError(context, getLang(context, "errors.oauthMissingCredentials"));
			redirect("/login");
			return;
		}

		postJson(context, `api/oauth_callback`, {
			code: code,
			redirect_uri: window.location.href.split('?')[0] // bruh rip my cpu
		}).then(async (data) => {
			if (!data.ok) {
				persistError(context, getLang(context, data.error));
				redirect("/login");
				return;
			} else {
				try {
					localStorage.setItem("ft_token", data.token);
				} catch (e) {
					console.log("[❌] Token could not be saved in localStorage.");
				}
				context.user.isAuthenticated = true;
				context.user.token = data.token;
				await onLogin(context, data, true);
				persistSuccess(context, getLang(context, data.success));
				redirect("/");
			}
		});
	}, 200);

	return document.createElement("div");
}


export { Oauth };