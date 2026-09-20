import { BUTTON_ATTRIBUTE, createIconSvg, LABEL } from "./constants";
import { searchEmailsFromSenders } from "./senders";

const HOST_STYLES = [
  ["display", "inline-flex"],
  ["align-items", "center"],
  ["justify-content", "center"],
  ["box-sizing", "border-box"],
  ["width", "40px"],
  ["height", "20px"],
  ["min-width", "40px"],
  ["min-height", "20px"],
  ["padding", "0"],
  ["border", "0"],
  ["flex", "0 0 auto"],
  ["visibility", "visible"],
  ["opacity", "1"],
  ["overflow", "visible"],
  ["position", "relative"],
  ["cursor", "pointer"],
  ["vertical-align", "middle"],
] as const;

const BUTTON_STYLES = `
  :host { display: inline-flex !important; }
  button {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 50%;
    color: #444746;
    cursor: pointer;
    display: inline-flex;
    height: 32px;
    justify-content: center;
    margin: 0;
    padding: 0;
    width: 32px;
  }
  button:hover, button:focus-visible { background: rgba(60, 64, 67, 0.12); outline: none; }
  svg { display: block; width: 20px; height: 20px; }
`;

export function applyHostStyles(element: HTMLElement) {
  for (const [property, value] of HOST_STYLES) {
    element.style.setProperty(property, value, "important");
  }
  element.removeAttribute("hidden");
}

export function createToolbarIcon(getSenders: () => string[]): HTMLElement {
  const host = document.createElement("div");
  host.setAttribute(BUTTON_ATTRIBUTE, "toolbar");
  host.setAttribute("role", "button");
  host.setAttribute("tabindex", "0");
  host.setAttribute("aria-label", LABEL);
  host.setAttribute("data-tooltip", LABEL);
  host.title = LABEL;
  applyHostStyles(host);

  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = BUTTON_STYLES;

  const button = document.createElement("button");
  button.type = "button";
  button.title = LABEL;
  button.append(createIconSvg());
  root.append(style, button);

  const activate = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    searchEmailsFromSenders(getSenders());
  };
  button.addEventListener("click", activate);
  host.addEventListener("click", activate);
  host.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") activate(event);
  });

  new MutationObserver(() => {
    if (
      host.hasAttribute("hidden") ||
      host.style.getPropertyValue("display") !== "inline-flex"
    ) {
      applyHostStyles(host);
    }
  }).observe(host, {
    attributeFilter: ["style", "hidden", "class"],
    attributes: true,
  });
  return host;
}
