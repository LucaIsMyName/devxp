
const Logo = ({ size = "", color }) => {
  return (
    <>
      <span className={`font-mono font-bold ${size === 'lg'
          ? "text-lg" :
          size === "md"
            ? "text-md" :
            size === "sm"
              ? "text-sm" :
              "text-base"
        } uppercase ${color | 'text-blue-600'}`}>Dev</span>
      <span className={`font-mono ${size === 'lg'
          ? "text-lg" :
          size === "md"
            ? "text-md" :
            size === "sm"
              ? "text-sm" :
              "text-base"
        } uppercase font-light ${color | 'text-white'}` }>XP</span>
    </>
  )
}

export default Logo;