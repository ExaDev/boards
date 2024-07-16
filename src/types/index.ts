import { GraphDescriptor } from "breadboard/packages/schema/src/graph";
import { Dirent } from "fs";

export type WithContent<T> = T & { content: any };
export type WithAbsolutePath<T> = T & { absolutePath: string };
export type DirentWithContent = WithContent<Dirent>;
export type DirentWithAbsolutePath = WithAbsolutePath<Dirent>;
export type AbsoluteContentDirent = WithAbsolutePath<WithContent<Dirent>>;
export type WithContentOfType<T, K extends string, V> = T & { [k in K]: V };
export type AbsoluteContentBgl = WithAbsolutePath<
	WithContentOfType<Dirent, "content", GraphDescriptor>
>;
// export type AbsoluteContentBgl = Dirent & {
// 	absolutePath: string;
// 	content: GraphDescriptor;
// };
export type BglContent<T extends Dirent & { content: unknown }> = T & {
	content: GraphDescriptor;
};
export type DirentWithUnknownContent = Dirent & {
	content: unknown;
};
export { isBglContentFile, isBglLike, propIsBgl } from "./guards";

