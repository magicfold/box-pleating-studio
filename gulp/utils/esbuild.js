const esbuild = require("gulp-esbuild");
const esSass = require("esbuild-sass-plugin").sassPlugin;
const esVue = require("esbuild-plugin-vue-next");
const exg = require("@fal-works/esbuild-plugin-global-externals").globalExternals;
const ssg = require("gulp-vue-ssg");
const through2 = require("gulp-through2");
const vt = require("@intlify/vue-i18n-extensions").transformVTDirective;

function esVueOption(options) {
	return {
		templateOptions: {
			compilerOptions: {
				comments: false, // Remove HTML comments
				directiveTransforms: options?.directiveTransforms,
			},
		},
	};
}

// Setting ECMAScript building target
const target = ["chrome66", "firefox78", "safari11", "opera53"];

const option = {
	bundle: true,
	treeShaking: true,
	legalComments: "none",
	charset: "utf8",
	target,
	external: ["*.woff2"],
	plugins: [
		exg({
			"vue": {
				varName: "Vue",
				namedExports: ["shallowRef", "watch", "computed", "reactive", "readonly",
					"shallowReadonly", "shallowReactive", "getCurrentInstance", "onMounted", "defineComponent",
					"createVNode", "unref", "openBlock", "createBlock", "createCommentVNode", "withModifiers",
					"createElementBlock", "resolveDirective", "createElementVNode", "withDirectives",
					"withCtx", "pushScopeId", "popScopeId", "toDisplayString", "renderSlot", "Fragment",
					"normalizeClass", "isRef", "vModelDynamic", "vModelText", "nextTick", "createTextVNode",
					"resolveComponent", "renderList", "vShow", "vModelSelect", "resolveDynamicComponent",
					"mergeProps", "createStaticVNode", "h"],
				defaultExport: false,
			},
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
	globalThis.Worker = class { };
	return {
		appRoot: options.appRoot,
		appOptions: app => {
			// Avoiding data pollution between builds
			globalThis.localStorage?.clear();
			app.use(i18n);
		},
		plugins: [
			esVue(esVueOption({
				directiveTransforms: { t: vt(i18n) }, // So that v-t directives will be processed
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

	/** Combine the external sourcemaps generated by esbuild */
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
