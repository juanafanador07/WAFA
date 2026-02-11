import { Nodes } from "mdast";
import { definitions, GetDefinition } from "mdast-util-definitions";
import { Processor } from "unified";

export function whatsappStringify(this: Processor) {
  function compile(node: Nodes, getDefinition: GetDefinition) {
    if ("value" in node) {
      if (node.type === "code") {
        return `\`\`\`${node.value}\`\`\`\n`;
      }

      if (node.type === "inlineCode") {
        return `\`${node.value}\``;
      }

      return node.value;
    }

    if (node.type === "break") {
      return "\n";
    }

    if (node.type === "thematicBreak") {
      return "\n---\n";
    }

    if (node.type === "image") {
      return `[${node.alt || ""}](${node.url})`;
    }

    if (node.type === "imageReference") {
      const def = getDefinition(node.identifier);

      if (!def) return "";

      if (node.alt) {
        return `[${node.alt}](${def.url})`;
      }

      return `(${def.url})`;
    }

    if (node.type === "definition" || node.type === "footnoteReference") {
      return "";
    }

    const values: string[] = [];
    for (let i = 0; i < node.children.length; i++) {
      const value = compile(node.children[i], getDefinition);
      if (node.type === "list") {
        if (node.ordered) {
          values.push(`${(node.start || 1) + i}. ${value}`);
        } else {
          values.push(`- ${value}`);
        }
      } else {
        values.push(value);
      }
    }

    const text = values.join("");

    if (node.type === "strong") {
      return `*${text}*`;
    }

    if (node.type === "emphasis") {
      return `_${text}_`;
    }

    if (node.type === "delete") {
      return `~${text}~`;
    }

    if (node.type === "heading") {
      return `\n*${text}*\n`;
    }

    if (node.type === "paragraph") {
      return `${text}\n`;
    }

    if (node.type === "link") {
      return `[${text}](${node.url})`;
    }

    if (node.type === "linkReference") {
      const def = getDefinition(node.identifier);

      if (!def) return text;

      return `[${text}](${def.url})`;
    }

    if (node.type === "blockquote") {
      return `> ${text}`;
    }

    return text;
  }

  this.compiler = (tree) => {
    const root = tree as Nodes;
    const getDefinition = definitions(root);
    return compile(root, getDefinition).trim();
  };
}
