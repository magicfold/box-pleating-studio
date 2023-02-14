import { Rectangle } from "core/math/rectangle";
import { opposite } from "shared/types/direction";
import { CornerType } from "shared/json/enum";

import type { JJunction } from "shared/json";
import type { ITreeNode } from "core/design/context";
import type { QuadrantDirection } from "shared/types/direction";

interface ValidJunctionData {
	lca: ITreeNode;
	s: IPoint;
	o: IPoint;
	f: IPoint;
	dir: QuadrantDirection;
	tip: IPoint;
}

const MASK = 3;

//=================================================================
/**
 * {@link ValidJunction} 代表一個合法的重疊。
 */
//=================================================================

export class ValidJunction implements ISerializable<JJunction> {

	/** 第一個角片 */
	public readonly $a: ITreeNode;

	/** 第二個角片 */
	public readonly $b: ITreeNode;

	public readonly $valid = true;

	/** 兩個角片的 LCA */
	public readonly $lca: ITreeNode;

	/** {@link $a} 對應的象限代碼 */
	public readonly $q1: number;

	/** {@link $b} 對應的象限代碼 */
	public readonly $q2: number;

	/** 角片尖點矩形的尺寸 */
	public readonly $s: Readonly<IPoint>;

	/** 重疊區域的尺寸 */
	public readonly $o: Readonly<IPoint>;

	/** {@link $a} 對應的尖點之所在 */
	private readonly _tip: Readonly<IPoint>;

	/** 相位係數 */
	private readonly _f: Readonly<IPoint>;

	/** 所有在幾何上覆蓋自身的 {@link ValidJunction} */
	private readonly _coveredBy: ValidJunction[] = [];

	constructor(a: ITreeNode, b: ITreeNode, data: ValidJunctionData) {
		this.$a = a;
		this.$b = b;

		this.$lca = data.lca;
		this.$s = data.s;
		this.$o = data.o;
		this._f = data.f;
		this._tip = data.tip;

		this.$q1 = a.id << 2 | data.dir;
		this.$q2 = b.id << 2 | opposite(data.dir);
	}

	toJSON(): JJunction {
		return {
			c: [
				{ type: CornerType.$flap, e: this.$a.id, q: this.$q1 & MASK },
				{ type: CornerType.$side },
				{ type: CornerType.$flap, e: this.$b.id, q: this.$q2 & MASK },
				{ type: CornerType.$side },
			],
			ox: this.$o.x,
			oy: this.$o.y,
			sx: this.$s.x,
		};
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 公開方法
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public get $orientedIds(): [number, number] {
		const [a, b] = [this.$a.id, this.$b.id];
		return this._f.x > 0 ? [a, b] : [b, a];
	}

	/**
	 * 自身是否被另外一個 {@link ValidJunction}「實質上」覆蓋。
	 *
	 * 實質覆蓋是比幾何覆蓋進一步的概念：
	 * 如果 A 覆蓋了 B、B 覆蓋了 C，可是 C 了 B 之外並沒有被其它 {@link ValidJunction} 覆蓋，
	 * 那麼此時由於 B 會被 A 無效化，這麼一來 B 對 C 的覆蓋也是無效的，
	 * 所以 C 實質上其實是沒有被覆蓋。依此類推。
	 */
	public get $isCovered(): boolean {
		if(this._isCovered === undefined) {
			this._isCovered = this._coveredBy.some(j => !j.$isCovered);
		}
		return this._isCovered;
	}
	private _isCovered: boolean | undefined;

	/** 設置一個覆蓋 */
	public $setCoveredBy(that: ValidJunction): void {
		this._coveredBy.push(that);
	}

	/** 清除覆蓋的資訊 */
	public $resetCovering(): void {
		this._coveredBy.length = 0;
		this._isCovered = undefined;
	}

	/** 當比較矩形完全一樣大的時候，比較兩者的遠近 */
	public $isCloserThan(that: ValidJunction): boolean {
		return this.$s.x < that.$s.x || this.$s.y < that.$s.y;
	}

	/** 根據指定的距離基準來取得覆蓋比較矩形 */
	public $getBaseRectangle(distanceToA: number): Rectangle {
		const x = this._tip.x + distanceToA * this._f.x;
		const y = this._tip.y + distanceToA * this._f.y;
		return new Rectangle({ x, y }, { x: x - this.$o.x * this._f.x, y: y - this.$o.y * this._f.y });
	}
}

export function getStructureSignature(junctions: ValidJunction[]): string {
	return JSON.stringify(junctions.map(j => j.toJSON()));
}
