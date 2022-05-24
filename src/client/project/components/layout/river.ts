import { Graphics } from "pixi.js";
import { SmoothGraphics } from "@pixi/graphics-smooth";

import { Layer } from "client/types/layers";
import { shallowRef } from "client/shared/decorators";
import { Control } from "client/base/control";
import { drawContours, fillContours } from "client/screen/contourUtil";
import ProjectService from "client/services/projectService";

import type { Contour } from "shared/types/geometry";
import type { Sheet } from "../sheet";

const HINGE_WIDTH = 3;
const HINGE_COLOR = 0x6699FF;
const SHADE_ALPHA = 0.3;
const SHADE_HOVER = 0.15;

//=================================================================
/**
 * {@link Flap} 是角片矩形的控制項。
 */
//=================================================================
export class River extends Control {

	public readonly type = "Flap";
	public readonly $priority: number = 1;

	public readonly tag: string;

	@shallowRef private _contours: Contour[];

	private readonly _shade: Graphics;
	private readonly _hinge: SmoothGraphics;


	constructor(tag: string, contour: Contour[], sheet: Sheet) {
		super();

		this.tag = tag;
		this._contours = contour;

		this._shade = this.$addRootObject(new Graphics(), sheet.$layers[Layer.$shade]);
		this._hinge = this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.$hinge]);
		this.$setupHit(this._shade);

		this.$reactDraw(this._draw, this._drawShade);

		if(DEBUG_ENABLED) this._hinge.name = "River Hinge";
	}

	private _drawShade(): void {
		if(this.$selected) this._shade.alpha = SHADE_ALPHA;
		else if(this.$hovered) this._shade.alpha = SHADE_HOVER;
		else this._shade.alpha = 0;
	}

	private _draw(): void {
		const color = app.settings.colorScheme.hinge ?? HINGE_COLOR;
		this._shade.clear();
		fillContours(this._shade, this._contours, HINGE_COLOR);

		const sh = ProjectService.shrink.value;
		this._hinge.clear().lineStyle(HINGE_WIDTH * sh, color);
		drawContours(this._hinge, this._contours);
	}
}
