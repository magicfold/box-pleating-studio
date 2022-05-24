const esbuild = require("gulp-esbuild");
const esSass = require("esbuild-sass-plugin").sassPlugin;
const esVue = require("esbuild-plugin-vue-next");
const exg = require("esbuild-plugin-external-global").externalGlobalPlugin;
const ssg = require("gulp-vue-ssg");
const through2 = require("gulp-through2");
const vt = require("@intlify/vue-i18n-extensions").transformVTDirective;

function esVueOption(options) {
	return {
		templateOptions: {
			compilerOptions: {
				comments: false, // 移除 HTML 註釋
				directiveTransforms: options?.directiveTransforms,
			},
		},
	};
}

// 設定 ECMAScript 編譯目標
const target = ["chrome80", "firefox70", "safari11", "opera60"];

const option = {
	bundle: true,
	treeShaking: true,
	legalComments: "none",
	charset: "utf8",
	target,
	plugins: [
		exg({
			"vue": "window.Vue",
			"vue-i18n": "window.VueI18n",
		}),
		esVue(esVueOption()),
		esSass(),
	],
};

function ssgOption(options) {
	const VueI18n = require("vue-i18n");
	const i18n = VueI18n.createI18n({
		locale: "en",
		messages: options.messages,
	});
	globalThis.i18n = i18n.global;
	return {
		appRoot: options.appRoot,
		appOptions: app => app.use(i18n),
		plugins: [
			esVue(esVueOption({
				directiveTransforms: { t: vt(i18n) }, // 必須加上這個才會轉換 v-t 的內容
			})),
		],
	};
}

module.exports = {
	ssgI18n(options) {
		return ssg(ssgOption(options));
	},

	esbuild(options) {
		return esbuild(Object.assign({}, option, options));
	},

	/** 合併 esbuild 輸出的外部 source map */
	sourceMap() {
		return through2({
			flush(files) {
				const maps = files.filter(f => f.extname == ".map");
				for(const file of maps) {
					const source = files.find(f => f.basename + ".map" == file.basename);
					const map = JSON.parse(through2.read(file));
					map.file = source.basename;
					source.sourceMap = map;
					files.splice(files.indexOf(file), 1);
				}
			},
		});
	},

	target,
	extra: __filename,
};
