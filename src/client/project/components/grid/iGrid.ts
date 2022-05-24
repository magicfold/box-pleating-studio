import type { GraphicsLike } from "client/screen/contourUtil";
import type { Direction } from "client/types/enum";
import type { JSheet } from "shared/json/components";
import type { GridType } from "shared/json/enum";

export interface IGrid extends ISerializable<JSheet> {

	/** 格線的類型 */
	readonly type: GridType;

	/** 根據指定的座標，傳回文字標籤應該要繪製在哪一個方向 */
	$getLabelDirection(x: number, y: number): Direction;

	/** 繪製邊框的方法 */
	$drawBorder(border: GraphicsLike): void;

	/** 繪製格線的方法 */
	$drawGrid(grid: GraphicsLike): void;

	/** 在繪製的時候要偏移的座標 */
	readonly $offset: IPoint;

	/** 繪製的高度 */
	readonly $height: number;

	/** 繪製的寬度 */
	readonly $width: number;
}
