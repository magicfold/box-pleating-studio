import { computed, reactive, shallowReadonly, shallowRef } from "vue";

import { defaultTitle } from "app/shared/constants";
import Lib from "./libService";
import Dialogs from "./dialogService";
import settings from "./settingService";

import type { Stretch } from "client/project/components/layout/stretch";
import type { Project } from "client/project/project";
import type { ComputedRef } from "vue";
import type * as Client from "client/main";
import type { DirectionKey } from "shared/types/types";
import type { StudioOptions } from "client/options";
import type { Device } from "client/project/components/layout/device";

/**
 * We encapsule the Client in this service so that it is not exposed in other parts of the app.
 * Declared in HTML.
 */
declare const bp: typeof Client;

/** Before the Studio is initialized, use a default value as placeholder. */
export function proxy<T>(target: Action<T>, defaultValue: T): ComputedRef<T> {
	return computed(() => StudioService.initialized.value ? target() : defaultValue);
}

//=================================================================
/**
 * {@link StudioService} manages the initialization of BP Studio and bridging.
 */
//=================================================================
namespace StudioService {

	/** If the Studio has been initialized. */
	export const initialized = shallowRef(false);

	/** Hooks for setup options. */
	export const $onSetupOptions: Consumer<StudioOptions>[] = [];

	/** The {@link Project} that is currently selected. */
	export const project = proxy(() => {
		const proj = bp.projects.current.value;
		const title = proj?.design.title;
		document.title = defaultTitle + (title ? " - " + title : "");
		return proj;
	}, null);

	/** Initialize the Client, and return whether it was successful. */
	export async function init(): Promise<boolean> {
		await Promise.all(bpLibs.map(l => Lib.loadScript(l)));
		if(typeof bp === "undefined") return false;

		// Setup the bridges
		bp.options.onLongPress = () => showPanel.value = true;
		bp.options.onDrag = () => showPanel.value = false;
		bp.options.onDeprecate = (title?: string) => {
			const t = title || i18n.t("keyword.untitled");
			const message = i18n.t("message.oldVersion", [t]);
			Dialogs.alert(message);
		};
		for(const setup of $onSetupOptions) setup(bp.options);

		if(errMgr.ok()) initialized.value = true;
		return true;
	}

	export const style = proxy(() => bp.style, null!);
	export const mouseCoordinates = proxy(() => bp.mouseCoordinates.value, null);
	export const selections = proxy(() => bp.selection.selections, []);
	export const selection = computed(() => selections.value[0] ?? null);
	export const stretch = computed(() => {
		const type = selection.value.type;
		if(type == "Stretch") return selection.value as Stretch;
		if(type == "Device") return (selection.value as Device).stretch;
		return null;
	});

	export const plugins = proxy(() => bp.plugins, null!);

	export const isDragging = proxy(() => bp.drag.isDragging.value, false);
	export const draggableSelected = proxy(() => bp.selection.draggables.value.length > 0, false);

	export const history = proxy(() => bp.history, {
		canUndo: false,
		canRedo: false,
		undo() { /* */ },
		redo() { /* */ },
		notify() { /* */ },
		notifyAll() { /* */ },
	});

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Delegate methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	export function beforePrint(): void {
		bp.beforePrint(null);
	}
	export function selectAll(): void {
		bp.selection.selectAll();
	}
	export function unselectAll(): void {
		bp.selection.clear();
	}
	export function svg(proj: Project): Promise<Blob> {
		return Promise.resolve(bp.svg(proj, settings.includeHiddenElement));
	}
	export function png(proj: Project): Promise<Blob> {
		return bp.png(proj);
	}
	export function copyPNG(): Promise<void> {
		return bp.copyPNG();
	}
	export function dragByKey(key: DirectionKey): void {
		bp.drag.dragByKey(key);
	}
}

export const showPanel = shallowRef(false);

export default shallowReadonly(reactive(StudioService));
