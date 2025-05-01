import { defineConfig } from "vite";
import { viteStaticCopy } from 'vite-plugin-static-copy';
import vitePluginString from 'vite-plugin-string';
import { resolve } from 'path';

export default defineConfig({
	base: '',
	server: { port: 8888 },
	appType: 'mpa',
	plugins: [
		vitePluginString(),
		viteStaticCopy({
			targets: [
				{
					src: 'doodoo/samples/',
					dest: 'doodoo/',
				},
				{
					src: 'lines/drawings/',
					dest: 'lines/',
				},
			]
		}),
	],
	build: {
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'index.html')			
			}
		},
	},
});
