import { LabeledView, View } from "./classes";
import { PaperUtil } from "./util/PaperUtil";
import { Layer, Style, unorderedArray } from "bp/global";
import { Constants } from "bp/content/json";
import type { Sheet } from "bp/design";
import type { Control } from "bp/class";

//////////////////////////////////////////////////////////////////
/**
 * {@link SheetView} 是對應於 {@link Sheet} 的 {@link View}。
 */
//////////////////////////////////////////////////////////////////

@shrewd export class SheetView extends View {

	private _border: paper.Path;
	private _grid: paper.CompoundPath;
	private _sheet: Sheet;

	constructor(sheet: Sheet) {
		super(sheet);
		this._sheet = sheet;

		this._border = new paper.Path.Rectangle({
			point: [0, 0],
			size: [0, 0],
			strokeWidth: 3,
		});
		this.$addItem(Layer.$sheet, this._border);

		this._grid = new paper.CompoundPath(Style.$sheet);
		this.$addItem(Layer.$sheet, this._grid);
	}

	public $contains(point: paper.Point): boolean {
		return this._border.contains(point);
	}

	protected $render(): void {
		let width = this._sheet.width;
		let height = this._sheet.height;

		PaperUtil.$setRectangleSize(this._border, width, height);

		this._grid.visible = this.$studio!.$display.$settings.showGrid;
		this._grid.removeChildren();
		for(let i = 1; i < height; i++) {
			PaperUtil.$addLine(this._grid, new paper.Point(0, i), new paper.Point(width, i));
		}
		for(let i = 1; i < width; i++) {
			PaperUtil.$addLine(this._grid, new paper.Point(i, 0), new paper.Point(i, height));
		}
	}

	@unorderedArray private get _labeledControls(): Control[] {
		return this._sheet.$controls.filter((c: Control) =>
			this._sheet.$design.$viewManager.$get(c) instanceof LabeledView
		);
	}

	@shrewd public get $margin(): number {
		if(!this._isActive || !this._sheet.$design._isActive) return 0;
		let controls = this._labeledControls;
		if(controls.length == 0 || !this.$studio || !this.$studio.$display.$settings.showLabel) return 0;

		let vm = this._sheet.$design.$viewManager;
		let overflows = controls.map(c => (vm.$get(c) as LabeledView<Control>).$overflow);
		return Math.max(...overflows);
	}

	/** 根據所有的文字標籤來逆推適合的尺度 */
	public $getScale(viewWidth: number, viewHeight: number, margin: number, fix: number): number {
		let factor = this._sheet.zoom / Constants.$FULL_ZOOM;
		let controls = this._labeledControls, width = this._sheet.width;
		let horizontalScale = (viewWidth - 2 * margin) * factor / width;
		if(controls.length == 0) return horizontalScale;

		if(this.$studio?.$display.$settings.showLabel) {
			let vm = this._sheet.$design.$viewManager;
			let views = controls.map(c => vm.$get(c) as LabeledView<Control>);
			let scales = views.map(v =>
				v.$getHorizontalScale(width, viewWidth - 2 * fix, factor)
			);
			horizontalScale = Math.min(horizontalScale, ...scales);
		}

		let verticalScale = (viewHeight * factor - margin * 2) / this._sheet.height;
		return Math.min(horizontalScale, verticalScale);
	}
}
