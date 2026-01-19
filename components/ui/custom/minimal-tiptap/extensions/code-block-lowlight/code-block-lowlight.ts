import { CodeBlockLowlight as TiptapCodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
// @ts-expect-error - lowlight types don't match but runtime works correctly
import { common, createLowlight } from "lowlight";

export const CodeBlockLowlight = TiptapCodeBlockLowlight.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      lowlight: createLowlight(common),
      // TipTap expects a non-optional prefix (TS requirement in newer versions)
      languageClassPrefix: "language-",
      // Required options in newer @tiptap/extension-code-block-lowlight typings
      exitOnTripleEnter: true,
      exitOnArrowDown: true,
      enableTabIndentation: false,
      tabSize: 2,
      defaultLanguage: null,
      HTMLAttributes: {
        class: "block-node",
      },
    };
  },
});

export default CodeBlockLowlight;
