import { Circle } from "pixi.js";
import { SmoothGraphics } from "@pixi/graphics-smooth";

import { Layer } from "client/types/layers";
import { shallowRef } from "client/shared/decorators";
import ProjectService from "client/services/projectService";
import { BLACK, DANGER, LIGHT } from "client/shared/constant";
import { Label } from "client/screen/label";
import { Draggable } from "client/base/draggable";

import type { JVertex } from "shared/json";
import type { Sheet } from "../sheet";

const SIZE = 4;
const BORDER_WIDTH = 1;
const BORDER_WIDTH_HOVER = 3;
const FILL_COLOR = 0x6699FF;

//=================================================================
/**
 * {@link Vertex} 是樹狀節點的控制項。
 */
//=================================================================
export class Vertex extends Draggable {

	public readonly type = "Vertex";
	public readonly $priority: number = Infinity;

	public readonly id: number;

	@shallowRef public name: string;

	private readonly _dot: SmoothGraphics;
	private readonly _label: Label;

	constructor(json: JVertex, sheet: Sheet) {
		super();

		this.id = json.id;
		this.$location.x = json.x;
		this.$location.y = json.y;
		this.name = json.name;

		this._dot = this.$addRootObject(new SmoothGraphics(), sheet.$layers[Layer.$vertex]);
		this.$setupHit(this._dot, new Circle(0, 0, SIZE * 2));

		this._label = this.$addRootObject(new Label(sheet), sheet.$layers[Layer.$label]);

		this.$reactDraw(this._draw, this._drawLabel);

		if(DEBUG_ENABLED) this._dot.name = "Vertex";
	}

	private _draw(): void {
		const s = ProjectService.scale.value;
		this._dot.x = this.$location.x;
		this._dot.y = this.$location.y;
		this._dot.scale.set(1 / s); // 把座標放大 s 倍以增進圓弧繪製品質

		const color = app.isDark.value ? LIGHT : BLACK;
		const width = this.$selected || this.$hovered ? BORDER_WIDTH_HOVER : BORDER_WIDTH;
		const size = SIZE * Math.sqrt(ProjectService.shrink.value);
		this._dot.clear()
			.lineStyle(width, this.$selected ? DANGER : color)
			.beginFill(FILL_COLOR)
			.drawCircle(0, 0, size)
			.endFill();
	}

	private _drawLabel(): void {
		this._label.$color = this.$selected ? DANGER : undefined;
		this._label.$draw(this.name, this.$location.x, this.$location.y);
	}
}
