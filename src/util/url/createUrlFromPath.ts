import path from "path";
import { AbsoluteContentBgl } from "../../types";

export function createUrlFromPath({
	absoluteBaseDir,
	file,
	baseUrl,
	baseDir = "",
}: {
	absoluteBaseDir: string;
	file: AbsoluteContentBgl;
	baseUrl: string;
	baseDir?: string;
}): string {
	const relativePath = path.join(
		baseDir,
		path.relative(absoluteBaseDir, file.absolutePath)
	);
	const url = new URL(relativePath, baseUrl);
	return url.toString();
}
