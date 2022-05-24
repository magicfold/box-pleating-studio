
export type Path = IPoint[] & {

	/** 在聯集的場合當中，紀錄這個路徑是從哪幾個多邊形合成出來的 */
	from?: number[];

	/** 暫時紀錄 {@link Path.from} */
	temp?: Set<number>;

	/** 表示這個路徑是一個洞 */
	isHole?: boolean;
};

export type Polygon = Path[];

export type Line = [IPoint, IPoint];

export function same(p1: IPoint, p2: IPoint): boolean {
	return p1.x === p2.x && p1.y === p2.y;
}

/** 輪廓格式，一組輪廓由一個外圍路徑加上若干的內部洞組成 */
export type Contour = {

	/** 輪廓的外圍路徑 */
	outer: Path;

	/** 輪廓的內圍路徑，如果有的話 */
	inner?: Path[];

	/** 表示這個輪廓是一個洞 */
	isHole?: boolean;
};

/** 先依 x 座標排序、再依 y 座標排序 */
export function xyComparator(p1: IPoint, p2: IPoint): number {
	const dx = p1.x - p2.x;
	if(dx !== 0) return dx;
	return p1.y - p2.y;
}

export function toString(p: IPoint): string {
	return `(${p.x},${p.y})`;
}

/** 把一個多邊形的所有路徑方向顛倒並傳回新的多邊形 */
export function reverse(polygon: Polygon): Polygon {
	return polygon.map(path => path.concat().reverse());
}
