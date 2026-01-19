import { CodeBlockLowlight as TiptapCodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
// @ts-expect-error - lowlight types don't match but runtime works correctly
import { common, createLowlight } from "lowlight";

export const CodeBlockLowlight = TiptapCodeBlockLowlight.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      lowlight: createLowlight(common),
      defaultLanguage: null,
      HTMLAttributes: {
        class: "block-node",
      },
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  },
});

export default CodeBlockLowlight;
