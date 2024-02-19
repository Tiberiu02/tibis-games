import { JSXElement } from "solid-js";

export function Button({
  onClick,
  children,
}: {
  onClick?: () => void;
  children?: JSXElement;
}) {
  return (
    <button
      class="rounded-lg border-2 border-gray-300 px-2 py-1 hover:bg-gray-50"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
