import { getJson } from "../utils.js";
import { redirect, refresh } from "../script.js";
import { NavBar } from "../components/NavBar.js";
import { Persistants } from "../components/Persistants.js";

function Logout(context) {
	let div = document.createElement("div");
	div.innerHTML = NavBar("Logout", context);
	div.innerHTML += Persistants(context);
	getJson("/api/logout").then(data => {
		if (data.ok) {
			context.user.is_authenticated = false;
			context.persistant.success.push(data.success);
			if (context.user.is_authenticated) {
				context.user.is_authenticated = false;
				if (!context.next)
					refresh();
			}
		} else
			context.persistant.error.push(data.error);
		if (context.next) {
			let next = context.next;
			context.next = null;
			redirect(next);
		}
	});
	return div.outerHTML;
}

export { Logout };
