import React from "react";

// Based on Font Awesome Free 5.15.4 regular square (CC BY 4.0).
// Modified geometry: diamond with matching outline thickness and corner radii.
// https://github.com/FortAwesome/Font-Awesome/blob/5.15.4/svgs/regular/square.svg

const FaRegDiamond = ({ size, ...props }) => {
  const computedSize = size ?? "1em";

  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 512 512"
      width={computedSize}
      height={computedSize}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="
          M222.059 46.059
          A48 48 0 0 1 289.941 46.059
          L465.941 222.059
          A48 48 0 0 1 465.941 289.941
          L289.941 465.941
          A48 48 0 0 1 222.059 465.941
          L46.059 289.941
          A48 48 0 0 1 46.059 222.059
          Z

          M260.243 84.243
          A6 6 0 0 0 251.757 84.243
          L84.243 251.757
          A6 6 0 0 0 84.243 260.243
          L251.757 427.757
          A6 6 0 0 0 260.243 427.757
          L427.757 260.243
          A6 6 0 0 0 427.757 251.757
          Z
        "
      />
    </svg>
  );
};

export default FaRegDiamond;
