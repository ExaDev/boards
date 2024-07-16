import fs, { Dirent } from "fs";
import path from "path";
import {
	AbsoluteContentBgl,
	DirentWithContent,
	isBglContentFile,
	WithContent,
} from "../types";

export function getBoards(baseDir: string): AbsoluteContentBgl[] {
	return fs
		.readdirSync(baseDir, { withFileTypes: true, recursive: true })
		.filter((file) => file.isFile() && file.name.endsWith(".json"))
		.map((file): DirentWithContent => {
			const filePath = path.join(baseDir, file.name);
			const content = fs.readFileSync(filePath, "utf-8");
			(file as any).content = JSON.parse(content);
			return file as WithContent<Dirent>;
		})
		.filter((file): boolean => isBglContentFile(file))
		.map((file): AbsoluteContentBgl => {
			(file as any).absolutePath = path.resolve(baseDir, file.name);
			return file as AbsoluteContentBgl;
		});
}
