import { Vector } from "core/math/geometry/vector";
import { opposite } from "shared/types/direction";
import { Point } from "core/math/geometry/point";
import { JoinCandidate } from "./joinCandidate";

import type { QuadrantDirection } from "shared/types/direction";
import type { Joiner } from "./joiner";
import type { Piece } from "../pattern/piece";
import type { JAnchor } from "shared/json";

//=================================================================
/**
 * {@link JoinCandidateBuilder} helps complete the complicated
 * construction of {@link JoinCandidate}s.
 */
//=================================================================

export class JoinCandidateBuilder {

	public a: JAnchor[] = [];
	private offset: IPoint = { x: 0, y: 0 };
	private _additionalOffset?: Vector;

	constructor(
		private readonly p: Piece,
		private readonly q: QuadrantDirection,
		private readonly joiner: Joiner
	) {}

	/**
	 * This is the most complicated part of constructing a {@link JoinCandidate}.
	 */
	public $setup(that: JoinCandidateBuilder, f: Sign, shift: IPoint): number {
		const int = this.joiner.$getRelayJoinIntersection(that.p, shift, opposite(this.q));
		if(!int || !int.$isIntegral) return NaN;

		let off: IPoint;
		if(this.joiner.$oriented) {
			this.offset = off = int.$toIPoint();
			this.p.$offset(off);
			this.a[this.joiner.q] = {
				location: { x: -off.x, y: -off.y },
			};
			return off.x;
		} else {
			const target = f == 1 ? that : this;
			target.offset = off = { x: f * (that.p.sx - int.x), y: f * (that.p.sy - int.y) };
			target.p.$offset(off);
			this.a[this.joiner.q] = {
				location: { x: this.p.sx + f * off.x, y: this.p.sy + f * off.y },
			};
			return f * off.x;
		}
	}

	public set $additionalOffset(offset: IPoint) {
		this._additionalOffset = new Vector(offset);
	}

	public get $anchor(): Point {
		let a = this.p.$anchors[this.joiner.q]!;
		if(this._additionalOffset) a = a.$add(this._additionalOffset);
		return a;
	}

	public get $jAnchor(): Point {
		return new Point(this.a[this.joiner.q].location!);
	}

	public $build(pt: Point): JoinCandidate {
		return new JoinCandidate(
			this.p, this.offset, this.a, pt, this.q, this._additionalOffset
		);
	}
}
