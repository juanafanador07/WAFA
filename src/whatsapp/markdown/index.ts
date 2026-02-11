import remarkParse from "remark-parse";
import { unified } from "unified";

import { remarkStrikethrough } from "./remarkStrikethrough";
import { whatsappStringify } from "./whatsappStringify";

export async function mdToWhatsapp(text: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkStrikethrough)
    .use(whatsappStringify)
    .process(text);

  return String(file.value);
}
