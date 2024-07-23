import {
	BoardReference,
	BreadboardManifest,
} from "breadboard/packages/manifest/src";
import fs from "fs";
import path from "path";
import { AbsoluteContentBgl } from "./types";
import { GitHubRepoData } from "./types/GitHubRepoData";
import { dereferenceManifest } from "./util/dereference";
import { getBoards } from "./util/getBoards";
import { makeManifest } from "./util/makeManifest";
import { createUrlFromPath } from "./util/url/createUrlFromPath";
import { makeRawGitHubUrl } from "./util/url/makeRawGitHubUrl";
import { makeRelativeUri } from "./util/url/makeRelativeUri";
import { makeGitHubIoUrl } from "./util/url/makeUrl";

export async function main() {
	const baseDir = "./docs";
	const absoluteBaseDir = path.resolve(baseDir);
	if (!fs.existsSync(baseDir)) {
		throw new Error(`Directory ${baseDir} not found`);
	}

	const files: AbsoluteContentBgl[] = getBoards(baseDir);

	console.log({ files });
	const absoluteDestDir = path.resolve(baseDir);
	const manifestFileName = "manifest.bbm.json";
	const manifestDest = path.join(absoluteDestDir, manifestFileName);

	const repositoryInfo: GitHubRepoData = {
		org: "ExaDev",
		repo: "boards",
		dir: "docs",
	};
	const baseUrl = makeRawGitHubUrl(repositoryInfo);
	////////////////////////////////////////
	const rawGithubManifestUrl = makeRawGitHubUrl({
		...repositoryInfo,
		file: manifestFileName,
	});
	////////////////////////////////////////
	const rawGitHubUrlManifest: BreadboardManifest = makeManifest({
		boardFiles: files,
		boardPathResolver: (file) =>
			createUrlFromPath({
				absoluteBaseDir: absoluteBaseDir,
				file: file,
				baseUrl: baseUrl,
				baseDir: baseDir,
			}),
		title: "Raw GitHub URL Manifest",
		reference: rawGithubManifestUrl,
	});
	////////////////////////////////////////
	const gitHubIoUrlManifest: BreadboardManifest = makeManifest({
		boardFiles: files,
		boardPathResolver: (file) =>
			makeGitHubIoUrl({
				org: "ExaDev",
				repo: "boards",
				file: file.name,
			}),
		title: "GitHub.io URL Manifest",
		reference: makeGitHubIoUrl({
			org: "ExaDev",
			repo: "boards",
			file: manifestFileName,
		}),
	});
	////////////////////////////////////////
	const relativeManifest = makeManifest({
		boardFiles: files,
		boardPathResolver: (file) => {
			const url = createUrlFromPath({
				absoluteBaseDir: absoluteBaseDir,
				file: file,
				baseUrl: baseUrl,
				baseDir: baseDir,
			});
			return makeRelativeUri({
				source: rawGithubManifestUrl,
				target: url,
			});
		},
	});
	////////////////////////////////////////
	const breadboardAiRepoBoards: BreadboardManifest = {
		title: "Breadboard AI Boards",
		reference: rawGithubManifestUrl,
		boards: [
			"https://raw.githubusercontent.com/breadboard-ai/breadboard/main/boards/components/convert-string-to-json/index.json",
		].map(
			(url): BoardReference => ({
				reference: makeRelativeUri({
					source: rawGithubManifestUrl,
					target: url,
				}),
				// title: new URL(url).pathname.split("/").pop(),
			})
		),
	};
	////////////////////////////////////////
	const combinedManifest: BreadboardManifest = makeManifest({
		boardFiles: files,
		reference: "https://exadev.github.io/boards/manifest.bbm.json",
		manifests: [
			breadboardAiRepoBoards,
			rawGitHubUrlManifest,
			gitHubIoUrlManifest,
			relativeManifest,
		],
		boardPathResolver: (file) =>
			path.relative(absoluteDestDir, file.absolutePath),
		title: "ExaDev Board Manifest",
		schemaUrl: makeRawGitHubUrl({
			org: "breadboard-ai",
			repo: "breadboard",
			dir: "packages/manifest",
			file: "bbm.schema.json",
		}),
	});
	////////////////////////////////////////
	fs.writeFileSync(manifestDest, JSON.stringify(combinedManifest, null, "\t"));
	////////////////////////////////////////
	console.log("\n");
	console.log("=".repeat(80));
	console.log("\n");
	const dereferenced = await dereferenceManifest(combinedManifest, 10);
	console.log({ dereferenced });
	fs.writeFileSync(
		"dereferenced.json",
		JSON.stringify(dereferenced, null, "\t")
	);
}
