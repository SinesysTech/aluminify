import { CodeBlockLowlight as TiptapCodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
// @ts-expect-error - lowlight types don't match but runtime works correctly
import { common, createLowlight } from "lowlight";

export const CodeBlockLowlight = TiptapCodeBlockLowlight.extend({
  addOptions() {
    // @ts-expect-error - parent spread with extended options causes type mismatch
    return {
      ...this.parent?.(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      lowlight: createLowlight(common),
      defaultLanguage: null,
      HTMLAttributes: {
        class: "block-node",
      },
    };
  },
});

export default CodeBlockLowlight;
