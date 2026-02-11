import { gfmStrikethroughFromMarkdown } from "mdast-util-gfm-strikethrough";
import { gfmStrikethrough } from "micromark-extension-gfm-strikethrough";
import { Processor } from "unified";

export function remarkStrikethrough(this: Processor) {
  const data = this.data();

  if (!data.micromarkExtensions) {
    data.micromarkExtensions = [];
  }

  if (!data.fromMarkdownExtensions) {
    data.fromMarkdownExtensions = [];
  }

  data.micromarkExtensions.push(gfmStrikethrough());
  data.fromMarkdownExtensions.push(gfmStrikethroughFromMarkdown());
}
