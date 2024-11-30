const Textarea = ({ id, label, type, value, minRows = 6, onChange, placeholder, className }) => {
  return (
    <textarea
      id={id}
      rows={minRows}
      value={value}
      onChange={onChange}
      placeholder={placeholder || "Text here ..."}
      className={`w-full resize-y border-2 dark:border-gray-700 dark:bg-gray-800 hover:pointer-cursor p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
    />
  )
}

export default Textarea;