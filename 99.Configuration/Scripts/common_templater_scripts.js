/**
 * A collection of helper functions for use in Templater scripts.
 */

// 🛠️ Helpers
const helpers = {
  async rePrompt(tp, message, validateFn, errorMsg, defaultVal = "") {
    let val;
    do {
      val = await tp.system.prompt(message, defaultVal);
      if (!validateFn(val)) {
        new Notice("⚠️ " + (errorMsg || "Invalid input"));
      }
    } while (!validateFn(val));
    return val;
  },

  slugify(str) {
    return str
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  },

  randomId(length = 4) {
    return Math.random().toString(36).substring(2, 2 + length);
  },

  isValidDate(dateStr) {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  },

  dateToNumber(dateStr) {
    return new Date(dateStr).getTime();
  },

  extractList(content) {
    return content
      .split("\n")
      .map(line => line.trim().replace(/^- /, ""))
      .filter(line => line.length > 0 && !line.startsWith("#"));
  },

  getFrontmatterType(file) {
    const cache = app.metadataCache.getFileCache(file);
    return cache?.frontmatter?.fileClass || null;
  },
   async promptSelect(tp, label, options, allowNone = false) {
    const displayOptions = allowNone ? ["(none)", ...options] : options;
    const value = await tp.system.suggester(displayOptions, displayOptions, true, label);
    return allowNone && value === "(none)" ? "" : value;
  },

  async promptTags(tp, defaultVal = "") {
    const raw = await tp.system.prompt("🏷️ Tags (comma-separated)", defaultVal);
    return raw
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);
  },

};

function getHelpers() {
  return helpers;
}
module.exports = getHelpers;
