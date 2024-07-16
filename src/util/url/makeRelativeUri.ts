export function makeRelativeUri({
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
		throw new Error(
			`Source and target URLs must have the same protocol ${sourceURL.protocol} !== ${targetURL.protocol}`
		);
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
