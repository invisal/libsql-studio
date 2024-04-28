import slugify from "slugify";
import { HeadingBlock } from "./block-content";

export function block_slugify(header: HeadingBlock): string {
  return slugify(
    header.content
      .map((c) => {
        if (c.type === "text") return c.text;
        return "";
      })
      .join()
  )
    .toLowerCase()
    .replaceAll(".", "");
}
