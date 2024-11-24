import React, { useCallback, useState, useEffect } from 'react';

const Button = ({ children, title = '', className = '', isActive = false, isClicked, onClick, onMousedown }) => {

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
    className={`text-left font-mono ${isActive ? `bg-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-blue-700 text-white` : "bg-white text-black hover:bg-gray-50"} font-bold  p-2 border-2 rounded-lg shadow-sm bg-white hover:bg-gray-50 rounded-lg border-black/10 border-2 ${className}`}>
    {children}
  </button>;
}

export default Button;