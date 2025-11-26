/**
 * Utility function to combine class names
 * Merges multiple class name strings while handling tailwind conflicts
 * @param  {...any} classes - Class name strings or conditional values
 * @returns {string} - Combined class names
 */
export function cn(...classes) {
  return classes
    .filter((className) => typeof className === "string" && className.length > 0)
    .join(" ");
}
