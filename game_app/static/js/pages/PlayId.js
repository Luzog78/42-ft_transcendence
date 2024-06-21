import { getJson } from "../utils.js";
import { PlayWaiting } from "./PlayWaiting.js";
import { Pong } from "./Pong.js";
import { PongResult } from "./PongResult.js";


async function PlayId(context, id) {
	let data = await getJson(context, `/api/game/g/${id}`);

	if (data.ok) {
		if (data.waiting)
			return PlayWaiting(context, id, data);

		if (data.playing)
			return Pong(context, id, data);

		if (data.ended)
			return PongResult(context, id, data);
	}

	// return PlayError(context, id, data);
}


export { PlayId };
