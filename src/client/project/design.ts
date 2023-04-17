import { Container } from "@pixi/display";

import { field, shallowRef } from "client/shared/decorators";
import { View } from "client/base/view";
import { display } from "client/screen/display";
import { MOUNTED } from "client/base/mountable";
import { Tree } from "./components/tree/tree";
import { Layout } from "./components/layout/layout";
import { SelectionController } from "client/controllers/selectionController";
import { Flap } from "./components/layout/flap";
import { isTypedArray } from "shared/utils/array";
import { River } from "./components/layout/river";
import { Vertex } from "./components/tree/vertex";
import { Edge } from "./components/tree/edge";

import type { ITagObject } from "client/shared/interface";
import type { Sheet } from "./components/sheet";
import type { Project } from "./project";
import type { UpdateModel } from "core/service/updateModel";
import type { DesignMode, JDesign, JFlap, JState, JStretch, JVertex, Memento } from "shared/json";

//=================================================================
/**
 * {@link Design} is the main object of a {@link Project}.
 */
//=================================================================
export class Design extends View implements ISerializable<JDesign>, ITagObject {

	public readonly $tag = "design";
	public readonly $project: Project;

	@field public title: string;
	@field public description: string;
	@shallowRef public mode: DesignMode;

	public readonly layout: Layout;
	public readonly tree: Tree;

	/** Prototypes of various objects before they are constructed. */
	public readonly $prototype: JDesign;

	constructor(project: Project, json: JDesign, state?: JState) {
		super();
		this.$prototype = json;
		this.title = json.title ?? "";
		this.description = json.description ?? "";
		this.mode = json.mode ?? "tree";
		this.$project = project;

		const view = this.$addRootObject(new Container(), display.designs);
		this.addEventListener(MOUNTED, e => view.visible = e.state);

		this.layout = new Layout(project, view, json.layout.sheet, state?.layout);
		this.tree = new Tree(project, view, json.tree, state?.tree);
		this.$addChild(this.layout.$sheet);
		this.$addChild(this.tree.$sheet);

		this.$reactDraw(this._onModeChanged);
	}

	public get sheet(): Sheet {
		return this.mode == "layout" ? this.layout.$sheet : this.tree.$sheet;
	}

	public toJSON(): JDesign {
		return {
			title: this.title,
			mode: this.mode,
			layout: this.layout.toJSON(),
			tree: this.tree.toJSON(),
		};
	}

	public get patternNotFound(): boolean {
		return false;
	}

	/** Update using the model returned from the Core. */
	public $update(model: UpdateModel): void {
		this.layout.$cleanUp(model);
		this.tree.$update(model);
		this.layout.$update(model);
		this.$project.history.$flush();
	}

	/** Find the unique object corresponding to the given tag. */
	public $query(tag: string): ITagObject | undefined {
		if(tag == "design") return this;
		// if(tag == "layout") return this.layout.$sheet;
		// if(tag == "tree") return this.tree.$sheet;
		// const m = tag.match(/^([a-z]+)(\d+(?:,\d+)*)(?:\.(.+))?$/);
		// if(m) {
		// 	const init = m[1], id = m[2], then = m[3];
		// 	if(init == "s") return this.$stretches.get(id);
		// 	if(init == "r") return this.$stretches.get(id)!.$repository?.$query(then);

		// 	const t = this.$tree;
		// 	if(init == "e" || init == "re" || init == "ee") {
		// 		const edge = t.$find(id);
		// 		if(!edge) return undefined;
		// 		if(init == "e") return edge;
		// 		if(init == "re") return this.$rivers.get(edge);
		// 		if(init == "ee") return this.$edges.get(edge);
		// 	}

		// 	const n = t.$node.get(Number(id))!;
		// 	if(init == "n") return n;
		// 	if(init == "f") return this.$flaps.get(n);
		// 	if(init == "v") return this.$vertices.get(n);
		// }
		return undefined;
	}

	public $addMementos(mementos: Memento[]): void {
		const { layout, tree } = this.$prototype;
		for(const [tag, json] of mementos) {
			const init = tag.substring(0, 1);
			if(init === "f") layout.flaps.push(json as JFlap);
			if(init === "v") tree.nodes.push(json as JVertex);
			if(init === "s") layout.stretches.push(json as JStretch);
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Interface methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public goToDual(): void {
		const selections = SelectionController.selections;
		if(this.mode == "layout") {
			if(isTypedArray(selections, Flap)) this.layout.$goToDual(selections);
			else if(selections[0] instanceof River) this.layout.$goToDual(selections[0]);
		} else {
			if(isTypedArray(selections, Vertex)) this.tree.$goToDual(selections);
			else if(selections[0] instanceof Edge) this.tree.$goToDual(selections[0]);
		}
	}

	public delete(): void {
		const selections = SelectionController.selections;
		if(this.mode == "layout") {
			if(isTypedArray(selections, Flap)) this.tree.$delete(selections.map(f => f.$vertex));
		} else {
			if(isTypedArray(selections, Vertex)) this.tree.$delete(selections);
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _onModeChanged(): void {
		const mode = this.mode;
		this.layout.$sheet.$toggle(mode === "layout");
		this.tree.$sheet.$toggle(mode === "tree");
		if(mode === "layout") this.layout.$syncFlaps.clear();
	}
}
