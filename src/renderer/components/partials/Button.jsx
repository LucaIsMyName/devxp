import React, { useCallback, useState, useEffect } from 'react';

const Button = ({ children, title, className, isActive, isClicked, onClick, onHover, onMousedown }) => {

  const [active, setActive] = useState(isActive);
  const [clicked, setClicked] = useState(isClicked);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setActive(isActive);
  }, [isActive]);

  return <button
    title={title}
    data-component="Button"
    onClick={onClick}
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    onMouseDown={onMousedown}
    onHover={onHover}
    className={`text-left ${isActive ? `bg-blue-500 hover:bg-blue-700 text-white` : "bg-white text-black hover:bg-gray-50"} font-bold p-2 rounded-lg border-black/10 border-2 ${className}`}>
    {children}
  </button>;
}

export default Button;