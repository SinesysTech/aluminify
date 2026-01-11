declare module "@radix-ui/react-toggle-group" {
  import * as React from "react";

  type RootProps = Record<string, unknown> & React.RefAttributes<unknown>;
  type ItemProps = Record<string, unknown> & React.RefAttributes<unknown>;

  export const Root: React.ForwardRefExoticComponent<RootProps>;
  export const Item: React.ForwardRefExoticComponent<ItemProps>;
}
