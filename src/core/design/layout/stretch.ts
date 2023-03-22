import { Repository } from "./repository";
import { getStructureSignature } from "./junction/validJunction";
import { State } from "core/service/state";

import type { StretchData } from "core/service/updateModel";
import type { JStretch } from "shared/json";
import type { ValidJunction } from "./junction/validJunction";

//=================================================================
/**
 * {@link Stretch} corresponds to a group of connected {@link ValidJunction}s.
 * Crease patterns on such a group will have to be determined together.
 */
//=================================================================

export class Stretch implements ISerializable<JStretch> {

	public readonly $id: string;

	/** {@link Repository} cache during dragging. */
	private readonly _repoCache = new Map<string, Repository>();

	/** Current {@link Repository} in used. */
	private _repo: Repository;

	constructor(junctions: ValidJunction[], prototype: JStretch) {
		const signature = getStructureSignature(junctions);
		this.$id = prototype.id;
		this._repo = new Repository(this, junctions, signature);
	}

	public toJSON(): JStretch {
		const configuration = this._repo.$configuration;
		return {
			id: this.$id,
			configuration: configuration?.toJSON(),
			pattern: configuration?.$pattern?.toJSON(),
		};
	}

	public get $repo(): Repository {
		return this._repo;
	}

	/**
	 * Update the combinations of {@link ValidJunction}s, and create
	 * or reuse {@link Repository} as needed.
	 */
	public $update(junctions: ValidJunction[]): void {
		const signature = getStructureSignature(junctions);
		if(signature === this._repo.$signature) return;
		if(State.$isDragging) {
			this._repoCache.set(this._repo.$signature, this._repo);
			const repo = this._repoCache.get(signature);
			if(repo) {
				this._repo = repo;
				State.$repoUpdated.add(repo);
				return;
			}
		}
		this._repo = new Repository(this, junctions, signature);
	}

	/** Clear {@link Repository} cache. */
	public $cleanup(): void {
		this._repoCache.clear();
	}

	/**
	 * Finish searching for patterns, called when the {@link Stretch} is first selected.
	 *
	 * Before that happens, a {@link Stretch} will always only yield the first pattern it finds,
	 * to save the computation time.
	 */
	public $complete(): StretchData {
		this._repo.$complete();
		return {
			data: this.toJSON(),
			patternCounts: this._repo.$configurations.map(c => c.$length!),
		};
	}
}
