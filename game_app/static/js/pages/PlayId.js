import { getJson } from "../utils.js";
import { Err404 } from "./Err404.js";
import { Pong } from "./Pong.js";
import { PongResult } from "./PongResult.js";


async function PlayId(context, id) {
	let data = await getJson(context, `/api/game/g/${id}`);

	if (data && data.ok) {
		if (data.waiting || data.playing)
			return Pong(context, id, data);

		if (data.ended)
			return PongResult(context, id, data);
	}

	return Err404(context);
}


export { PlayId };
