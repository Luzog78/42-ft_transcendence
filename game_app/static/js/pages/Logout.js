import { getJson } from "../utils.js";
import { persistError, persistSuccess, popNext, redirect, refresh } from "../script.js";
import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";

function Logout(context) {
	let div = document.createElement("div");
	div.innerHTML = NavBar("Logout", context);
	div.innerHTML += Persistents(context);
	getJson("/api/logout").then(data => {
		if (data.ok) {
			context.user.is_authenticated = false;
			persistSuccess(context, data.success);
			if (context.user.is_authenticated) {
				context.user.is_authenticated = false;
				if (!context.next)
					refresh();
			}
		} else
			persistError(context, data.error);
		if (context.next)
			redirect(popNext(context));
	});
	return div.outerHTML;
}

export { Logout };
