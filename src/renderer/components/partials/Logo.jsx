
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
        } uppercase ${color | 'text-blue-600 dark:text-blue-300 dark:text-blue-600 dark:text-blue-300 dark:text-blue-700'}`}>Dev</span>
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