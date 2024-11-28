// Core conversion function with strong regex validation
const caseConverters = {
  // Basic case converters
  camelToKebab: (str) => {
    if (!str || !/^[a-z][a-zA-Z0-9]*$/.test(str)) return str;
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
  },

  kebabToCamel: (str) => {
    if (!str || !/^[a-z][a-z0-9-]*$/.test(str)) return str;
    return str.replace(/-([a-z0-9])/g, (_, letter) => letter.toUpperCase());
  },

  pascalToKebab: (str) => {
    if (!str || !/^[A-Z][a-zA-Z0-9]*$/.test(str)) return str;
    return str
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .substring(1);
  },

  kebabToPascal: (str) => {
    if (!str || !/^[a-z][a-z0-9-]*$/.test(str)) return str;
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  },

  camelToPascal: (str) => {
    if (!str || !/^[a-z][a-zA-Z0-9]*$/.test(str)) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  pascalToCamel: (str) => {
    if (!str || !/^[A-Z][a-zA-Z0-9]*$/.test(str)) return str;
    return str.charAt(0).toLowerCase() + str.slice(1);
  },

  snakeToKebab: (str) => {
    if (!str || !/^[a-z][a-z0-9_]*$/.test(str)) return str;
    return str.replace(/_/g, '-');
  },

  kebabToSnake: (str) => {
    if (!str || !/^[a-z][a-z0-9-]*$/.test(str)) return str;
    return str.replace(/-/g, '_');
  },

  // Advanced converters
  camelToSnake: (str) => {
    if (!str || !/^[a-z][a-zA-Z0-9]*$/.test(str)) return str;
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  },

  snakeToCamel: (str) => {
    if (!str || !/^[a-z][a-z0-9_]*$/.test(str)) return str;
    return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
  },
  
  snakeToPascal: (str) => {
    if (!str || !/^[a-z][a-z0-9_]*$/.test(str)) return str;
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  },
  
  pascalToSnake: (str) => {
    if (!str || !/^[A-Z][a-zA-Z0-9]*$/.test(str)) return str;
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .substring(1);
  }
};

// Utility function to process multiple strings or multiline strings
const convertCase = (str, converter) => {
  if (!str) return '';
  if (!converter) return str;
  
  return str
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => caseConverters[converter](line))
    .join('\n');
};

export { caseConverters, convertCase };