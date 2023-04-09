import { watch } from "vue";

import { copyright } from "app/misc/copyright";

import type { I18n } from "vue-i18n";
import type { BpsLocale } from "shared/frontend/locale";
import type Settings from "./settingService";

const KEY = "locale";
const DEFAULT_LOCALE = "en";

//=================================================================
/**
 * {@link LanguageService} determines locale on startup and manages related settings.
 *
 * For historical reasons, language setting is store separately,
 * and is not part of the {@link Settings}.
 */
//=================================================================
namespace LanguageService {
	const _options: string[] = [];

	export const options = _options as readonly string[];

	/** Create i18n instance. */
	export function createPlugin(): I18n {
		const plugin = VueI18n.createI18n<[BpsLocale], string>({
			locale: DEFAULT_LOCALE,
			fallbackLocale: DEFAULT_LOCALE,
			silentFallbackWarn: true,
			messages: locale,
		});
		i18n = plugin.global;
		copyright.value; // warm-up
		return plugin;
	}

	export function init(): void {
		const build = Number(localStorage.getItem("build") || 0);
		const localeSetting = localStorage.getItem(KEY);
		const langs = getLanguages(localeSetting);
		const newLocale = langs.some(l => Number(locale[l].since) > build);

		if(langs.length > 1 && (!localeSetting || newLocale)) {
			_options.push(...langs);
		}
		i18n.locale = format(localeSetting || langs[0] || DEFAULT_LOCALE);
	}

	export function setup(): void {
		// Sync locale
		let syncing: boolean = false;
		window.addEventListener("storage", e => {
			if(e.key == KEY) {
				syncing = true;
				i18n.locale = e.newValue!;
			}
		});

		watch(() => i18n.locale, loc => {
			if(loc in locale) {
				if(!syncing) localStorage.setItem(KEY, loc);
				syncing = false;
			} else {
				loc = findFallbackLocale(loc);
				Vue.nextTick(() => i18n.locale = loc);
			}
			document.documentElement.lang = loc;
		}, { immediate: true });
	}

	/** Obtain the list of candidate languages. */
	function getLanguages(loc: string | null): string[] {
		const locales = Object.keys(locale);
		if(!navigator.languages) return locales;
		let languages = navigator.languages
			.map(a => locales.find(l => format(a).startsWith(l)))
			.filter((l): l is string => Boolean(l));
		if(loc) languages.unshift(loc);
		languages = Array.from(new Set(languages));
		return languages;
	}

	function findFallbackLocale(loc: string): string {
		const tokens = loc.split("-");
		while(tokens.length) {
			tokens.pop();
			const l = tokens.join("-");
			if(l in locale) return l;
		}
		return DEFAULT_LOCALE;
	}

	function format(l: string): string {
		return l.replace(/_/g, "-").toLowerCase();
	}

	export let onReset: Action;

	export function reset(): void {
		localStorage.removeItem(KEY);
		init();
		onReset?.();
	}
}

export default LanguageService;
