import { PolyBool } from "./polyBool";
import { UnionChainer } from "../classes/chainer/unionChainer";

import type { Chainer } from "../classes/chainer/chainer";
import type { Initializer } from "./initializer";
import type { Comparator } from "shared/types/types";
import type { ISegment } from "../classes/segment/segment";
import type { EndEvent } from "../classes/event";
import type { EventProvider } from "../classes/eventProvider";
import type { Intersector } from "../classes/intersector";
import type { PathEx, Polygon } from "shared/types/geometry";

type LineConstructor = new (p1: IPoint, p2: IPoint, i: number) => ISegment;

//=================================================================
/**
 * {@link UnionBase} is the base type of union operations.
 */
//=================================================================

export abstract class UnionBase extends PolyBool<Polygon, PathEx> {

	private readonly _initializer: Initializer;

	constructor(
		provider: EventProvider,
		intersector: Intersector,
		chainer: Chainer,
		initializer: Initializer
	) {
		super(provider, intersector, chainer);
		this._initializer = initializer;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected _initialize(components: Polygon[]): void {
		this._initializer.$init(components, (segment, delta) => this._addSegment(segment, delta));
	}

	protected _processEnd(event: EndEvent): void {
		const start = event.$other;
		if(!start.$isInside) this._collectedSegments.push(start.$segment);
		this._status.$delete(start);
	}
}
