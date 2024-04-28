import { BlockContent } from "./block-content";
import { block_slugify } from "./content-helper";

export interface TableOfContent {
  name: string;
  anchor: string;
  sub: TableOfContent[];
}

interface TableOfContentWithParent extends TableOfContent {
  parent?: TableOfContentWithParent;
}

export function constructTableOfContent(
  content: BlockContent[]
): TableOfContent[] {
  const root: TableOfContentWithParent = { anchor: "", name: "", sub: [] };
  const allNodes: TableOfContentWithParent[] = [];
  let node = root;
  let ptrLevel = 10;

  for (const block of content) {
    if (block.type === "heading") {
      const newNode: TableOfContentWithParent = {
        anchor: "#" + block_slugify(block),
        name: block.content
          .map((c) => {
            if (c.type === "text") return c.text;
            return "";
          })
          .join(),
        sub: [],
      };

      if (block.props.level === ptrLevel) {
        const parent = node.parent ?? node;
        newNode.parent = parent;
        parent.sub.push(newNode);
      } else if (block.props.level > ptrLevel) {
        newNode.parent = node;
        node.sub.push(newNode);
      } else {
        const parent = node.parent ?? node;
        newNode.parent = parent;
        parent.sub.push(newNode);
      }

      node = newNode;
      allNodes.push(newNode);
      ptrLevel = block.props.level;
    }
  }

  // Remove all parents
  for (const n of allNodes) {
    delete n.parent;
  }

  return root.sub;
}
