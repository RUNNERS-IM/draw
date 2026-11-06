import React from "react";

// Based on Google Material Design Icons rounded_corner (Apache 2.0).
// https://react-icons.github.io/react-icons/search/#q=MdRoundedCorner
// Modified geometry: larger dashed square with one sharp top-right edge.

const MdSharpCorner = ({ size, ...props }) => {
  const computedSize = size ?? "1em";

  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 24 24"
      width={computedSize}
      height={computedSize}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path fill="none" d="M0 0h24v24H0z" />
      <path d="M19 19h2v2h-2zm0-2h2v-2h-2zM3 13h2v-2H3zm0 4h2v-2H3zm0-8h2V7H3zm0-4h2V3H3zm4 0h2V3H7zm8 16h2v-2h-2zm-4 0h2v-2h-2zm4 0h2v-2h-2zm-8 0h2v-2H7zm-4 0h2v-2H3zM11 3h10v10h-2V5h-8z" />
    </svg>
  );
};

export default MdSharpCorner;
