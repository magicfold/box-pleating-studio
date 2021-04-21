
@shrewd class FlapContainer extends BaseContainer<TreeNode, Flap> {

	constructor(design: Design) {
		super(
			design,
			() => design.tree.$leaf,
			l => new Flap(design.$LayoutSheet, l)
		);
	}

	@shrewd public get $byId(): ReadonlyMap<number, Flap> {
		let result = new Map<number, Flap>();
		for(let f of this.values()) result.set(f.node.id, f);
		return result;
	}

	/** @exports */
	public delete(flaps: readonly Flap[]) {
		for(let f of flaps) {
			if(this._design.vertices.size == 3) break;
			f.node.$delete();
		}
	}

	public $selectAll() {
		this.forEach(f => f.$selected = true);
	}

	public $toVertex(flaps: Flap[]) {
		this._design.$TreeSheet.$clearSelection();
		for(let f of flaps) {
			let v = this._design.vertices.get(f.node)
			if(v) v.$selected = true;
		}
		this._design.mode = "tree";
	}
}
