declare module "@radix-ui/react-toggle-group" {
  import * as React from "react";

  type RootBaseProps = React.HTMLAttributes<HTMLDivElement> &
    React.RefAttributes<HTMLDivElement>;

  type RootSingleProps = {
    type?: "single";
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
  };

  type RootMultipleProps = {
    type: "multiple";
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
  };

  type RootProps = RootBaseProps & (RootSingleProps | RootMultipleProps);

  type ItemProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
    React.RefAttributes<HTMLButtonElement> & {
      value?: string;
    };

  export const Root: React.ForwardRefExoticComponent<RootProps>;
  export const Item: React.ForwardRefExoticComponent<ItemProps>;
}
