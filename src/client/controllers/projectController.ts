import { Project } from "client/project/project";
import { Migration } from "client/patches";
import { deepAssign } from "client/utils/deepAssign";
import ProjectService from "client/services/projectService";

import type { JProject } from "shared/json";

/** 預先產生的待命 worker 實體，在 HTML 中宣告 */
declare let __worker: Worker | undefined;

/** 統一的 worker 路徑，在 HTML 中宣告 */
declare const __worker_src: string;

namespace ProjectController {

	const projectMap = new Map<number, Project>();

	export const current = ProjectService.project;

	/** 根據 id 取得專案。 */
	export function get(id: number): Project | undefined {
		return projectMap.get(id);
	}

	/** 取得待命 worker，或者產生一個新的 worker。 */
	function getOrCreateWorker(): Worker {
		const worker = __worker ? __worker : new Worker(__worker_src);
		__worker = undefined;
		return worker;
	}

	/**
	 * 創建新的專案。傳入的資料會被 deeply assign 在範本專案之上，而不會經過 migration。
	 */
	export function create(json: RecursivePartial<JProject>): Promise<Project> {
		json = deepAssign<RecursivePartial<JProject>>({
			design: {
				tree: {
					nodes: [
						{ id: 0, name: "", x: 10, y: 10 },
						{ id: 1, name: "", x: 10, y: 13 },
						{ id: 2, name: "", x: 10, y: 7 },
					],
					edges: [
						{ n1: 0, n2: 1, length: 1 },
						{ n1: 0, n2: 2, length: 1 },
					],
				},
			},
		}, json);
		const p = new Project(json, getOrCreateWorker());
		projectMap.set(p.id, p);
		return p.$initialized;
	}

	/**
	 * 開啟舊的專案。傳入的資料會經過 {@link Migration} 升級到最新的格式。
	 */
	export function open(json: Pseudo<JProject>): Promise<Project> {
		const p = new Project(Migration.$process(json), getOrCreateWorker());
		projectMap.set(p.id, p);
		return p.$initialized;
	}

	/**
	 * 關閉一個已經被開啟的專案，釋放對應的 worker 與其中所有記憶體。
	 *
	 * 如果專案全部關閉，會自動開啟一個待命的 worker。
	 */
	export function close(proj: Project): void {
		proj.$dispose(); // 解構必須優先執行
		if(current.value == proj) current.value = null;
		projectMap.delete(proj.id);
		if(projectMap.size == 0) __worker = new Worker(__worker_src);
	}
}

export default ProjectController;
