export namespace HtmlUtils {
  export function someInParents(element: Element | null, fn: (node: Element) => boolean): boolean {
    let el = element;
    while (el && el instanceof Element) {
      if (fn(el)) {
        return true;
      }
      el = el.parentNode as Element | null;
    }
    return false;
  }

  export function classInParents(element: Element | null, cssClass: string): boolean {
    return someInParents(element, (n) => n.classList.contains(cssClass));
  }

  export function escapeHtml(initialString: string): string {
    const str = "" + initialString;
    const matchHtmlRegExp = /["'&<>]/;
    const match = matchHtmlRegExp.exec(str);

    if (!match) {
      return str;
    }

    let html = "";
    let lastIndex = 0;
    let index;

    for (index = match.index; index < str.length; index += 1) {
      let escape;
      switch (str.charCodeAt(index)) {
        case 34: // "
          escape = "&quot;";
          break;
        case 38: // &
          escape = "&amp;";
          break;
        case 39: // '
          escape = "&#39;";
          break;
        case 60: // <
          escape = "&lt;";
          break;
        case 62: // >
          escape = "&gt;";
          break;
        default:
          continue;
      }

      if (lastIndex !== index) {
        html += str.substring(lastIndex, index);
      }

      lastIndex = index + 1;
      html += escape;
    }

    return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
  }
}
