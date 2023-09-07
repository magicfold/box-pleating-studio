import { JoinLogic } from "./joinLogic";

import type { JoinResult } from "./joinLogic";

//=================================================================
/**
 * Simple join is the lucky case where the line of joining
 * intersects exactly on the intersection of the gadget ridges.
 * In this case, the join "just works" and no special treatment is needed.
 *
 * A special case of the simple join is when the two gadgets involved
 * have the same axis direction, which is know as the perfect join.
 */
//=================================================================
export class SimpleJoinLogic extends JoinLogic {

	public *$join(): Generator<JoinResult> {
		if(!this.data) return;
		const { c1, c2, pt, bv } = this.data;

		// Find the intersection
		const int = c1.e.$intersection(c2.e); // p1-perspective
		if(!int) return;

		// Check the simple join condition
		if(
			!c1.p.$direction.$parallel(c2.p.$direction) &&
				!int.sub(pt).$parallel(bv)
		) return;

		// Complete
		if(!this._setupAnchor(int)) return;
		this._setupDetour([int], [int]);
		yield this._result();
	}
}
