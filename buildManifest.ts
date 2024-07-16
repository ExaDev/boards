#!/usr/bin/env -S npx -y tsx --no-cache

export { };
  import { GraphDescriptor } from "@google-labs/breadboard";
  import {
    BoardReference,
    BreadboardManifest,
    ResourceReference,
  } from "breadboard/packages/manifest/src/index";
  import fs, { Dirent } from "fs";
  import path from "path";

const processFilePath = "file://" + process.argv[1];
const isMainProcess = decodeURI(import.meta.url) === processFilePath;

if (isMainProcess) {
	await main().then(() => process.exit(0));
} else {
}

type WithContent<T> = T & { content: any };
type WithAbsolutePath<T> = T & { absolutePath: string };
type DirentWithContent = WithContent<Dirent>;
type DirentWithAbsolutePath = WithAbsolutePath<Dirent>;
type AbsoluteContentDirent = WithAbsolutePath<WithContent<Dirent>>;
type WithContentOfType<T, K extends string, V> = T & { [k in K]: V };

type AbsoluteContentBgl = WithAbsolutePath<
	WithContentOfType<Dirent, "content", GraphDescriptor>
>;
type BglContent<T extends Dirent & { content: unknown }> = T & {
	content: GraphDescriptor;
};

type DirentWithUnknownContent = Dirent & {
	content: unknown;
};

async function main() {
	const baseDir = "./docs";
	const absoluteBaseDir = path.resolve(baseDir);
	if (!fs.existsSync(baseDir)) {
		throw new Error(`Directory ${baseDir} not found`);
	}

	const files: AbsoluteContentBgl[] = getBoards(baseDir);

	console.log({ files });
	const destDir = baseDir;
	const absoluteDestDir = path.resolve(destDir);
	const manifestFileName = "manifest.bbm.json";
	const manifestDest = path.join(absoluteDestDir, manifestFileName);

	const baseUrl = "https://raw.githubusercontent.com/ExaDev/boards/main/";
	const rawGithubManifestUrl = makeRawGitHubUrl({
		org: "ExaDev",
		repo: "boards",
    dir: "docs",
		file: manifestFileName,
	});

	const rawGitHubUrlManifest: BreadboardManifest = makeManifest({
		boardFiles: files,
		boardPathResolver: (file) =>
			createUrlFromPath(absoluteBaseDir, file, baseUrl, baseDir),
		title: "Raw GitHub URL Manifest",
		reference: rawGithubManifestUrl,
	});
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

	const relativeManifest = makeManifest({
		boardFiles: files,
		boardPathResolver: (file) => {
			const url = createUrlFromPath(absoluteBaseDir, file, baseUrl, baseDir);
			const mappedUrl = relativeUri({
				source: rawGithubManifestUrl,
				target: url,
			});
			return mappedUrl;
		},
	});
	const breadboardAiRepoBoards: BreadboardManifest = {
		title: "Breadboard AI Boards",
		reference: rawGithubManifestUrl,
		boards: [
			"https://raw.githubusercontent.com/breadboard-ai/breadboard/main/boards/components/convert-string-to-json/index.json",
		].map(
			(url): BoardReference => ({
				reference: relativeUri({
					source: rawGithubManifestUrl,
					target: url,
				}),
				// title: new URL(url).pathname.split("/").pop(),
			})
		),
	};
	relativeManifest.boards = relativeManifest.boards.concat();

	const combinedManifest: BreadboardManifest = makeManifest({
		boardFiles: files,
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

	fs.writeFileSync(manifestDest, JSON.stringify(combinedManifest, null, "\t"));
}

function getBoards(baseDir: string): AbsoluteContentBgl[] {
	return fs
		.readdirSync(baseDir, { withFileTypes: true, recursive: true })
		.filter((file) => file.isFile() && file.name.endsWith(".json"))
		.map((file): DirentWithContent => {
			const filePath = path.join(baseDir, file.name);
			const content = fs.readFileSync(filePath, "utf-8");
			const json = JSON.parse(content);

			(file as any).content = json;
			return file as WithContent<Dirent>;
		})
		.filter((file) => isBglContentFile(file))
		.map((file) => {
			(file as any).absolutePath = path.resolve(baseDir, file.name);
			return file as AbsoluteContentBgl;
		});
}

function isBglContentFile<T extends DirentWithUnknownContent>(
	file: T
): file is BglContent<T> {
	return propIsBgl(file, "content");
}

function createUrlFromPath(
	absoluteBaseDir: string,
	file: AbsoluteContentBgl,
	baseUrl: string,
	baseDir: string = ""
): string {
	const relativePath = path.join(
		baseDir,
		path.relative(absoluteBaseDir, file.absolutePath)
	);
	const url = new URL(relativePath, baseUrl);
	const urlString = url.toString();
	return urlString;
}

function makeManifest({
	boardPathResolver = (file: AbsoluteContentBgl) =>
		path.join(file.parentPath, file.name),
	boardFiles = [],
	title = undefined,
	manifests = [],
	schemaUrl = undefined,
	reference = undefined,
}: {
	boardPathResolver?: (file: AbsoluteContentBgl) => string;
	boardFiles?: AbsoluteContentBgl[];
	title?: string;
	manifests?: BreadboardManifest[];
	schemaUrl?: string;
	reference?: string;
}): BreadboardManifest {
	return {
		$schema: schemaUrl,
		reference,
		title,
		manifests,
		boards: boardFiles.map(makeBoardReference(boardPathResolver)),
	};
}

function makeBoardReference(
	pathResolver: (file: AbsoluteContentBgl) => string
): (
	value: AbsoluteContentBgl,
	index: number,
	array: AbsoluteContentBgl[]
) => ResourceReference {
	return (file) =>
		({
			reference: pathResolver(file),
			title: file.content.title || file.name,
		}) satisfies ResourceReference;
}

function isBglLike(json: Record<string, any>): json is GraphDescriptor {
	return Array.isArray(json.nodes) && Array.isArray(json.edges);
}

function propIsBgl<T>(
	obj: T,
	prop: string
): obj is T & { [k in typeof prop]: GraphDescriptor } {
	return isBglLike(obj[prop]);
}

function nonEmptyString(val: string): boolean {
	return !!val;
}

function makeRawGitHubUrl({
	org,
	repo,
	dir,
	file,
	ref = "main",
}: {
	org: string;
	repo: string;
	file: string;
	dir?: string;
	ref?: string;
}): string {
	return new URL(
		`https://raw.githubusercontent.com/${[org, repo, ref, dir, file]
			.filter(nonEmptyString)
			.join("/")}`
	).toString();
}

function makeGitHubIoUrl({
	org,
	repo = "",
	dir = "",
	file,
}: {
	org: string;
	file: string;
	dir?: string;
	repo?: string;
}): string {
	return new URL(
		`https://${org.toLowerCase()}.github.io/${[repo, dir, file]
			.filter(nonEmptyString)
			.join("/")}`
	).toString();
}

function relativeUri({
	source,
	target,
}: {
	source: string;
	target: string;
}): string {
	const sourceURL = new URL(source);
	const targetURL = new URL(target);

	// Ensure both URLs are of the same origin
	if (sourceURL.origin !== targetURL.origin) {
		throw new Error(
			`Source and target URLs must have the same origin ${sourceURL.origin} !== ${targetURL.origin}`
		);
	}

	if (sourceURL.protocol !== targetURL.protocol) {
		throw new Error(`Source and target URLs must have the same protocol ${sourceURL.protocol} !== ${targetURL.protocol}`);
	}
	const protocol = sourceURL.protocol;

	const sourcePathSegments = sourceURL.pathname.split("/");
	const targetPathSegments = targetURL.pathname.split("/");

	// Remove empty segments caused by leading/trailing slashes
	const sourcePath = sourcePathSegments.filter((segment) => segment);
	const targetPath = targetPathSegments.filter((segment) => segment);

	// Find the common path length
	let commonLength = 0;
	while (
		commonLength < sourcePath.length &&
		commonLength < targetPath.length &&
		sourcePath[commonLength] === targetPath[commonLength]
	) {
		commonLength++;
	}

	// Calculate the relative path
	const upSegments = sourcePath.length - commonLength - 1;
	const downSegments = targetPath.slice(commonLength);

	const relativePath = "../".repeat(upSegments) + downSegments.join("/");

	return relativePath;
}
