import React, { useMemo } from "react";
import { block_slugify } from "./content-helper";

type LinkBlock = {
  type: "link";
  content: TextBlock[];
  href: string;
};

interface TextBlock {
  type: "text";
  text: string;
  styles: {
    bold?: boolean;
    italic?: boolean;
  };
}

type InlineContent = LinkBlock | TextBlock;

export interface HeadingBlock {
  id: string;
  type: "heading";
  content: InlineContent[];
  props: {
    level: number;
  };
}

interface ParagraphBlock {
  id: string;
  type: "paragraph";
  content: InlineContent[];
}

interface TableBlock {
  id: string;
  type: "table";
  content: {
    type: "tableContent";
    rows: {
      cells: [InlineContent[]];
    }[];
  };
}

type BulletListItemBlock = {
  id: string;
  type: "bulletListItem";
  content: InlineContent[];
};

type NumberedListItemBlock = {
  id: string;
  type: "numberedListItem";
  content: InlineContent[];
};

type BulletListBlock = {
  id: string;
  type: "bulletList";
  content: BulletListItemBlock[];
};

type NumberedListBlock = {
  id: string;
  type: "numberedList";
  content: NumberedListItemBlock[];
};

type ImageBlock = {
  id: string;
  type: "image";
  props: {
    url: string;
    caption: string;
    width: number;
  };
};

export type BlockContent =
  | ParagraphBlock
  | TableBlock
  | BulletListItemBlock
  | BulletListBlock
  | NumberedListItemBlock
  | NumberedListBlock
  | HeadingBlock
  | ImageBlock;

export interface BlockContentObject {
  content: BlockContent[];
}

function InlineTextDOM({ value }: { value: TextBlock }) {
  if (value.styles.bold) return <strong>{value.text}</strong>;
  if (value.styles.italic) return <i>{value.text}</i>;
  return value.text;
}

function InlineLinkDOM({ value }: { value: LinkBlock }) {
  return (
    <a href={value.href}>
      <InlineContentListDOM value={value.content} />
    </a>
  );
}

function InlineContentListDOM({ value }: { value: InlineContent[] }) {
  return (
    <>
      {value.map((text, idx) => {
        if (text.type === "text")
          return <InlineTextDOM key={idx} value={text} />;
        if (text.type === "link")
          return <InlineLinkDOM key={idx} value={text} />;
        return null;
      })}
    </>
  );
}

function ParagraphDOM({ p }: { p: ParagraphBlock }) {
  return (
    <p>
      <InlineContentListDOM value={p.content} />
    </p>
  );
}

function HeadingDOM({ value }: { value: HeadingBlock }) {
  const anchor = block_slugify(value);
  const contentDom = (
    <a id={anchor} href={"#" + anchor}>
      <InlineContentListDOM value={value.content} />
    </a>
  );

  if (value.props.level === 1) {
    return <h1>{contentDom}</h1>;
  } else if (value.props.level === 2) {
    return <h2>{contentDom}</h2>;
  } else if (value.props.level === 3) {
    return <h3>{contentDom}</h3>;
  } else if (value.props.level === 4) {
    return <h4>{contentDom}</h4>;
  }
}

function BulletListDOM({ value }: { value: BulletListBlock }) {
  return (
    <ul>
      {value.content.map((item) => {
        return (
          <li key={item.id}>
            <InlineContentListDOM value={item.content} />
          </li>
        );
      })}
    </ul>
  );
}

function NumberedListDOM({ value }: { value: NumberedListBlock }) {
  return (
    <ol>
      {value.content.map((item) => {
        return (
          <li key={item.id}>
            <InlineContentListDOM value={item.content} />
          </li>
        );
      })}
    </ol>
  );
}

function ImageDOM({ value }: { value: ImageBlock }) {
  return (
    <figure>
      <img src={value.props.url} alt={value.props.caption} />
      <figcaption>{value.props.caption}</figcaption>
    </figure>
  );
}

function TableDOM({ t }: { t: TableBlock }) {
  const header = t.content.rows.slice(0, 1)[0];
  const body = t.content.rows.slice(1);

  return (
    <table>
      {header && (
        <thead>
          <tr>
            {header.cells.map((headerCell, headerIdx) => {
              return (
                <th key={headerIdx}>
                  <InlineContentListDOM value={headerCell} />
                </th>
              );
            })}
          </tr>
        </thead>
      )}
      <tbody>
        {body.map((bodyRow, bodyRowIdx) => {
          return (
            <tr key={bodyRowIdx}>
              {bodyRow.cells.map((bodyCell, bodyCellIdx) => {
                return (
                  <td key={bodyCellIdx}>
                    <InlineContentListDOM value={bodyCell} />
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function BlockContentPreview({ content }: { content: BlockContent[] }) {
  const trasnformContent = useMemo(() => {
    const tmp: BlockContent[] = [];
    let bulletList: BulletListItemBlock[] = [];
    let numberedList: NumberedListItemBlock[] = [];

    function flushBullet(key: string) {
      if (bulletList.length > 0) {
        tmp.push({
          type: "bulletList",
          id: key,
          content: bulletList,
        });

        bulletList = [];
      }
    }

    function flushNumber(key: string) {
      if (numberedList.length > 0) {
        tmp.push({
          type: "numberedList",
          id: key,
          content: numberedList,
        });

        numberedList = [];
      }
    }

    for (let i = 0; i < content.length; i++) {
      const p = content[i];
      if (p?.type === "bulletListItem") {
        flushNumber(i.toString());
        bulletList.push(p);
      } else if (p?.type === "numberedListItem") {
        flushBullet(i.toString());
        numberedList.push(p);
      } else if (p) {
        flushBullet(i.toString());
        flushNumber(i.toString());
        tmp.push(p);
      }
    }

    flushBullet(content.length.toString());
    flushNumber(content.length.toString());

    return tmp;
  }, [content]);

  return (
    <div>
      {trasnformContent.map((block) => {
        if (block.type === "paragraph") {
          return <ParagraphDOM key={block.id} p={block} />;
        }

        if (block.type === "table") {
          return <TableDOM key={block.id} t={block} />;
        }

        if (block.type === "bulletList") {
          return <BulletListDOM key={block.id} value={block} />;
        }

        if (block.type === "numberedList") {
          return <NumberedListDOM key={block.id} value={block} />;
        }

        if (block.type === "heading") {
          return <HeadingDOM key={block.id} value={block} />;
        }

        if (block.type === "image") {
          return <ImageDOM key={block.id} value={block} />;
        }
        return null;
      })}
    </div>
  );
}
