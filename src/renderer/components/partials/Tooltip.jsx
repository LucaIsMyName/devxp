import React from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import "tippy.js/animations/shift-away.css";


const Tooltip = ({ children, content, placement = "top", trigger = "mouseenter", theme = "dark", interactive = false, arrow = false, offset = [0, 0], className = "", visible, onClickOutside, ...props }) => {
  return (
    <Tippy
      content={content}
      placement={placement}
      trigger={trigger}
      theme={theme}
      interactive={interactive}
      arrow={arrow}
      offset={offset}
      className={className}
      visible={visible}
      onClickOutside={onClickOutside}
      animation="shift-away"
      {...props}>
      <div className="">{children}</div>
    </Tippy>
  );
};

export default Tooltip;