#!/usr/bin/env -S npx -y tsx --no-cache

import { main } from "./main";

const processFilePath = "file://" + process.argv[1];
const isMainProcess = decodeURI(import.meta.url) === processFilePath;

if (isMainProcess) {
	console.debug("Invoked as main process");
	await main().then(() => process.exit(0));
} else {
	console.log("Invoked as module");
}
