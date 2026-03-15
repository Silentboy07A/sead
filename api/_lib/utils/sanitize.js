/**
 * Simple NoSQL Injection Sanitizer
 * Recursively removes keys starting with $ from objects
 */
function sanitize(v) {
  if (v instanceof Array) {
    for (let i = 0; i < v.length; i++) {
      if (typeof v[i] === 'object' && v[i] !== null) {
        sanitize(v[i]);
      }
    }
  } else if (typeof v === 'object' && v !== null) {
    Object.keys(v).forEach(key => {
      if (key.startsWith('$')) {
        delete v[key];
      } else if (typeof v[key] === 'object' && v[key] !== null) {
        sanitize(v[key]);
      }
    });
  }
  return v;
}

module.exports = sanitize;
