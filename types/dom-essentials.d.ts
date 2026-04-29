// =============================================================================
// DOM Essentials — Subset of lib.dom.d.ts for DayBack action IntelliSense
// =============================================================================
//
// We intentionally exclude `declare var event: Event` because DayBack action
// scripts run inside eval() where `event` is a DayBackEvent calendar object,
// not the browser's deprecated window.event. That declaration lives in
// dayback-globals.d.ts instead.
//
// This file is NOT meant to be exhaustive. Properties that are missing will
// resolve as `any`, which is fine since checkJs is off.
// =============================================================================

// ---------------------------------------------------------------------------
// Console
// ---------------------------------------------------------------------------

interface Console {
  assert(condition?: boolean, ...data: any[]): void;
  clear(): void;
  count(label?: string): void;
  debug(...data: any[]): void;
  dir(item?: any, options?: any): void;
  error(...data: any[]): void;
  group(...data: any[]): void;
  groupCollapsed(...data: any[]): void;
  groupEnd(): void;
  info(...data: any[]): void;
  log(...data: any[]): void;
  table(tabularData?: any, properties?: string[]): void;
  time(label?: string): void;
  timeEnd(label?: string): void;
  timeLog(label?: string, ...data: any[]): void;
  trace(...data: any[]): void;
  warn(...data: any[]): void;
}

declare var console: Console;

// ---------------------------------------------------------------------------
// Timers
// ---------------------------------------------------------------------------

declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function setInterval(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearTimeout(id?: number): void;
declare function clearInterval(id?: number): void;
declare function requestAnimationFrame(callback: (time: number) => void): number;
declare function cancelAnimationFrame(handle: number): void;

// ---------------------------------------------------------------------------
// Alert / Confirm / Prompt
// ---------------------------------------------------------------------------

declare function alert(message?: any): void;
declare function confirm(message?: string): boolean;
declare function prompt(message?: string, defaultValue?: string): string | null;

// ---------------------------------------------------------------------------
// Encoding
// ---------------------------------------------------------------------------

declare function atob(data: string): string;
declare function btoa(data: string): string;
declare function encodeURIComponent(str: string | number | boolean): string;
declare function decodeURIComponent(str: string): string;
declare function encodeURI(uri: string): string;
declare function decodeURI(uri: string): string;

// ---------------------------------------------------------------------------
// DOM Events
// ---------------------------------------------------------------------------

interface EventListenerOptions {
  capture?: boolean;
}

interface AddEventListenerOptions extends EventListenerOptions {
  once?: boolean;
  passive?: boolean;
  signal?: AbortSignal;
}

interface EventInit {
  bubbles?: boolean;
  cancelable?: boolean;
  composed?: boolean;
}

interface DOMEvent {
  readonly type: string;
  readonly target: EventTarget | null;
  readonly currentTarget: EventTarget | null;
  readonly bubbles: boolean;
  readonly cancelable: boolean;
  readonly defaultPrevented: boolean;
  readonly timeStamp: number;
  preventDefault(): void;
  stopPropagation(): void;
  stopImmediatePropagation(): void;
}

interface MouseEvent extends DOMEvent {
  readonly clientX: number;
  readonly clientY: number;
  readonly pageX: number;
  readonly pageY: number;
  readonly screenX: number;
  readonly screenY: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly button: number;
  readonly buttons: number;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly relatedTarget: EventTarget | null;
}

interface KeyboardEvent extends DOMEvent {
  readonly key: string;
  readonly code: string;
  readonly keyCode: number;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly repeat: boolean;
}

interface InputEvent extends DOMEvent {
  readonly data: string | null;
  readonly inputType: string;
}

interface FocusEvent extends DOMEvent {
  readonly relatedTarget: EventTarget | null;
}

interface DragEvent extends MouseEvent {
  readonly dataTransfer: any;
}

interface WheelEvent extends MouseEvent {
  readonly deltaX: number;
  readonly deltaY: number;
  readonly deltaZ: number;
  readonly deltaMode: number;
}

interface TouchEvent extends DOMEvent {
  readonly touches: any;
  readonly targetTouches: any;
  readonly changedTouches: any;
}

// ---------------------------------------------------------------------------
// EventTarget
// ---------------------------------------------------------------------------

interface EventTarget {
  addEventListener(type: string, listener: ((ev: any) => void) | null, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: ((ev: any) => void) | null, options?: boolean | EventListenerOptions): void;
  dispatchEvent(event: DOMEvent): boolean;
}

// ---------------------------------------------------------------------------
// Node
// ---------------------------------------------------------------------------

interface Node extends EventTarget {
  readonly nodeType: number;
  readonly nodeName: string;
  readonly parentNode: Node | null;
  readonly parentElement: HTMLElement | null;
  readonly childNodes: NodeList;
  readonly firstChild: Node | null;
  readonly lastChild: Node | null;
  readonly nextSibling: Node | null;
  readonly previousSibling: Node | null;
  readonly ownerDocument: Document | null;
  textContent: string | null;
  appendChild<T extends Node>(node: T): T;
  removeChild<T extends Node>(node: T): T;
  insertBefore<T extends Node>(node: T, child: Node | null): T;
  replaceChild<T extends Node>(node: T, oldChild: Node): T;
  cloneNode(deep?: boolean): Node;
  contains(other: Node | null): boolean;
  hasChildNodes(): boolean;
  normalize(): void;
  isEqualNode(otherNode: Node | null): boolean;
  isSameNode(otherNode: Node | null): boolean;

  readonly ELEMENT_NODE: 1;
  readonly TEXT_NODE: 3;
  readonly COMMENT_NODE: 8;
  readonly DOCUMENT_NODE: 9;
  readonly DOCUMENT_FRAGMENT_NODE: 11;
}

// ---------------------------------------------------------------------------
// NodeList / HTMLCollection
// ---------------------------------------------------------------------------

interface NodeList {
  readonly length: number;
  item(index: number): Node | null;
  forEach(callbackfn: (value: Node, key: number, parent: NodeList) => void, thisArg?: any): void;
  [index: number]: Node;
}

interface HTMLCollection {
  readonly length: number;
  item(index: number): Element | null;
  namedItem(name: string): Element | null;
  [index: number]: Element;
}

// ---------------------------------------------------------------------------
// DOMRect / DOMTokenList
// ---------------------------------------------------------------------------

interface DOMRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

interface DOMTokenList {
  readonly length: number;
  value: string;
  add(...tokens: string[]): void;
  remove(...tokens: string[]): void;
  contains(token: string): boolean;
  toggle(token: string, force?: boolean): boolean;
  replace(oldToken: string, newToken: string): boolean;
  item(index: number): string | null;
  forEach(callbackfn: (value: string, key: number, parent: DOMTokenList) => void, thisArg?: any): void;
  [index: number]: string;
}

// ---------------------------------------------------------------------------
// CSSStyleDeclaration
// ---------------------------------------------------------------------------

interface CSSStyleDeclaration {
  cssText: string;
  readonly length: number;
  getPropertyValue(property: string): string;
  setProperty(property: string, value: string | null, priority?: string): void;
  removeProperty(property: string): string;
  item(index: number): string;

  // Common properties
  alignItems: string;
  background: string;
  backgroundColor: string;
  backgroundImage: string;
  border: string;
  borderBottom: string;
  borderColor: string;
  borderRadius: string;
  borderTop: string;
  bottom: string;
  boxShadow: string;
  boxSizing: string;
  color: string;
  cursor: string;
  display: string;
  flex: string;
  flexDirection: string;
  float: string;
  font: string;
  fontSize: string;
  fontWeight: string;
  gap: string;
  height: string;
  justifyContent: string;
  left: string;
  lineHeight: string;
  margin: string;
  marginBottom: string;
  marginLeft: string;
  marginRight: string;
  marginTop: string;
  maxHeight: string;
  maxWidth: string;
  minHeight: string;
  minWidth: string;
  opacity: string;
  outline: string;
  overflow: string;
  overflowX: string;
  overflowY: string;
  padding: string;
  paddingBottom: string;
  paddingLeft: string;
  paddingRight: string;
  paddingTop: string;
  pointerEvents: string;
  position: string;
  right: string;
  textAlign: string;
  textDecoration: string;
  textOverflow: string;
  top: string;
  transform: string;
  transition: string;
  userSelect: string;
  verticalAlign: string;
  visibility: string;
  whiteSpace: string;
  width: string;
  zIndex: string;

  [index: number]: string;
  [property: string]: any;
}

// ---------------------------------------------------------------------------
// Element
// ---------------------------------------------------------------------------

interface Element extends Node {
  readonly tagName: string;
  id: string;
  className: string;
  readonly classList: DOMTokenList;
  innerHTML: string;
  outerHTML: string;
  readonly style: CSSStyleDeclaration;
  readonly attributes: NamedNodeMap;
  readonly children: HTMLCollection;
  readonly firstElementChild: Element | null;
  readonly lastElementChild: Element | null;
  readonly nextElementSibling: Element | null;
  readonly previousElementSibling: Element | null;
  readonly childElementCount: number;
  readonly clientWidth: number;
  readonly clientHeight: number;
  readonly clientTop: number;
  readonly clientLeft: number;
  readonly scrollWidth: number;
  readonly scrollHeight: number;
  scrollTop: number;
  scrollLeft: number;

  getAttribute(qualifiedName: string): string | null;
  setAttribute(qualifiedName: string, value: string): void;
  removeAttribute(qualifiedName: string): void;
  hasAttribute(qualifiedName: string): boolean;
  getAttributeNames(): string[];
  querySelector(selectors: string): Element | null;
  querySelectorAll(selectors: string): NodeListOf<Element>;
  closest(selectors: string): Element | null;
  matches(selectors: string): boolean;
  getBoundingClientRect(): DOMRect;
  scrollTo(options?: ScrollToOptions): void;
  scrollTo(x: number, y: number): void;
  scrollIntoView(arg?: boolean | ScrollIntoViewOptions): void;
  insertAdjacentHTML(position: InsertPosition, text: string): void;
  insertAdjacentElement(position: InsertPosition, element: Element): Element | null;
  insertAdjacentText(position: InsertPosition, text: string): void;
  remove(): void;
  before(...nodes: (Node | string)[]): void;
  after(...nodes: (Node | string)[]): void;
  replaceWith(...nodes: (Node | string)[]): void;
  append(...nodes: (Node | string)[]): void;
  prepend(...nodes: (Node | string)[]): void;
}

interface NamedNodeMap {
  readonly length: number;
  item(index: number): Attr | null;
  getNamedItem(qualifiedName: string): Attr | null;
  setNamedItem(attr: Attr): Attr | null;
  removeNamedItem(qualifiedName: string): Attr;
  [index: number]: Attr;
}

interface Attr {
  readonly name: string;
  value: string;
}

interface NodeListOf<T extends Node> {
  readonly length: number;
  item(index: number): T | null;
  forEach(callbackfn: (value: T, key: number, parent: NodeListOf<T>) => void, thisArg?: any): void;
  [index: number]: T;
}

type InsertPosition = 'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend';

interface ScrollToOptions {
  behavior?: 'auto' | 'smooth';
  left?: number;
  top?: number;
}

interface ScrollIntoViewOptions {
  behavior?: 'auto' | 'smooth';
  block?: 'start' | 'center' | 'end' | 'nearest';
  inline?: 'start' | 'center' | 'end' | 'nearest';
}

// ---------------------------------------------------------------------------
// HTMLElement and common subtypes
// ---------------------------------------------------------------------------

interface HTMLElement extends Element {
  title: string;
  lang: string;
  dir: string;
  hidden: boolean;
  tabIndex: number;
  draggable: boolean;
  contentEditable: string;
  readonly isContentEditable: boolean;
  readonly offsetParent: Element | null;
  readonly offsetTop: number;
  readonly offsetLeft: number;
  readonly offsetWidth: number;
  readonly offsetHeight: number;
  innerText: string;
  readonly dataset: DOMStringMap;
  click(): void;
  focus(options?: FocusOptions): void;
  blur(): void;

  // Event handlers
  onclick: ((this: HTMLElement, ev: MouseEvent) => any) | null;
  ondblclick: ((this: HTMLElement, ev: MouseEvent) => any) | null;
  onmousedown: ((this: HTMLElement, ev: MouseEvent) => any) | null;
  onmouseup: ((this: HTMLElement, ev: MouseEvent) => any) | null;
  onmouseover: ((this: HTMLElement, ev: MouseEvent) => any) | null;
  onmouseout: ((this: HTMLElement, ev: MouseEvent) => any) | null;
  onmouseenter: ((this: HTMLElement, ev: MouseEvent) => any) | null;
  onmouseleave: ((this: HTMLElement, ev: MouseEvent) => any) | null;
  onkeydown: ((this: HTMLElement, ev: KeyboardEvent) => any) | null;
  onkeyup: ((this: HTMLElement, ev: KeyboardEvent) => any) | null;
  onchange: ((this: HTMLElement, ev: DOMEvent) => any) | null;
  oninput: ((this: HTMLElement, ev: DOMEvent) => any) | null;
  onfocus: ((this: HTMLElement, ev: FocusEvent) => any) | null;
  onblur: ((this: HTMLElement, ev: FocusEvent) => any) | null;
  onscroll: ((this: HTMLElement, ev: DOMEvent) => any) | null;
}

interface DOMStringMap {
  [name: string]: string | undefined;
}

interface FocusOptions {
  preventScroll?: boolean;
}

interface HTMLInputElement extends HTMLElement {
  value: string;
  type: string;
  name: string;
  placeholder: string;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  checked: boolean;
  defaultValue: string;
  defaultChecked: boolean;
  readonly files: FileList | null;
  maxLength: number;
  minLength: number;
  max: string;
  min: string;
  step: string;
  pattern: string;
  multiple: boolean;
  readonly form: HTMLFormElement | null;
  select(): void;
  setSelectionRange(start: number | null, end: number | null, direction?: string): void;
}

interface HTMLTextAreaElement extends HTMLElement {
  value: string;
  name: string;
  placeholder: string;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  rows: number;
  cols: number;
  maxLength: number;
  minLength: number;
  defaultValue: string;
  readonly form: HTMLFormElement | null;
  select(): void;
  setSelectionRange(start: number | null, end: number | null, direction?: string): void;
}

interface HTMLSelectElement extends HTMLElement {
  value: string;
  name: string;
  disabled: boolean;
  required: boolean;
  multiple: boolean;
  readonly selectedIndex: number;
  readonly selectedOptions: HTMLCollection;
  readonly options: HTMLCollection;
  readonly form: HTMLFormElement | null;
  add(element: HTMLElement, before?: HTMLElement | number | null): void;
  remove(index?: number): void;
}

interface HTMLButtonElement extends HTMLElement {
  value: string;
  name: string;
  type: string;
  disabled: boolean;
  readonly form: HTMLFormElement | null;
}

interface HTMLAnchorElement extends HTMLElement {
  href: string;
  target: string;
  rel: string;
  download: string;
  readonly origin: string;
  pathname: string;
  search: string;
  hash: string;
  host: string;
  hostname: string;
  port: string;
  protocol: string;
  text: string;
}

interface HTMLImageElement extends HTMLElement {
  src: string;
  alt: string;
  width: number;
  height: number;
  readonly naturalWidth: number;
  readonly naturalHeight: number;
  readonly complete: boolean;
  crossOrigin: string | null;
  loading: string;
}

interface HTMLFormElement extends HTMLElement {
  action: string;
  method: string;
  readonly elements: HTMLCollection;
  readonly length: number;
  submit(): void;
  reset(): void;
}

interface HTMLDivElement extends HTMLElement {}
interface HTMLSpanElement extends HTMLElement {}
interface HTMLLabelElement extends HTMLElement {
  htmlFor: string;
}
interface HTMLTableElement extends HTMLElement {}
interface HTMLTableRowElement extends HTMLElement {}
interface HTMLTableCellElement extends HTMLElement {}
interface HTMLCanvasElement extends HTMLElement {
  width: number;
  height: number;
  getContext(contextId: '2d'): any;
  getContext(contextId: string, ...args: any[]): any;
  toDataURL(type?: string, quality?: number): string;
}
interface HTMLStyleElement extends HTMLElement {
  media: string;
  type: string;
  readonly sheet: any;
}
interface HTMLScriptElement extends HTMLElement {
  src: string;
  type: string;
  async: boolean;
  defer: boolean;
  text: string;
}
interface HTMLLinkElement extends HTMLElement {
  href: string;
  rel: string;
  type: string;
  media: string;
}
interface HTMLIFrameElement extends HTMLElement {
  src: string;
  srcdoc: string;
  name: string;
  width: string;
  height: string;
  readonly contentDocument: Document | null;
  readonly contentWindow: Window | null;
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

interface Document extends Node {
  readonly documentElement: HTMLElement;
  readonly head: HTMLElement;
  readonly body: HTMLElement;
  readonly activeElement: Element | null;
  title: string;
  readonly URL: string;
  readonly readyState: string;
  readonly cookie: string;

  getElementById(elementId: string): HTMLElement | null;
  getElementsByClassName(classNames: string): HTMLCollection;
  getElementsByTagName(qualifiedName: string): HTMLCollection;
  querySelector(selectors: string): Element | null;
  querySelectorAll(selectors: string): NodeListOf<Element>;

  createElement(tagName: 'div'): HTMLDivElement;
  createElement(tagName: 'span'): HTMLSpanElement;
  createElement(tagName: 'input'): HTMLInputElement;
  createElement(tagName: 'button'): HTMLButtonElement;
  createElement(tagName: 'select'): HTMLSelectElement;
  createElement(tagName: 'textarea'): HTMLTextAreaElement;
  createElement(tagName: 'a'): HTMLAnchorElement;
  createElement(tagName: 'img'): HTMLImageElement;
  createElement(tagName: 'form'): HTMLFormElement;
  createElement(tagName: 'table'): HTMLTableElement;
  createElement(tagName: 'canvas'): HTMLCanvasElement;
  createElement(tagName: 'style'): HTMLStyleElement;
  createElement(tagName: 'script'): HTMLScriptElement;
  createElement(tagName: 'link'): HTMLLinkElement;
  createElement(tagName: 'iframe'): HTMLIFrameElement;
  createElement(tagName: 'label'): HTMLLabelElement;
  createElement(tagName: string): HTMLElement;

  createTextNode(data: string): Node;
  createDocumentFragment(): DocumentFragment;
  createComment(data: string): Node;

  createEvent(eventInterface: string): DOMEvent;
  execCommand(commandId: string, showUI?: boolean, value?: string): boolean;
  getSelection(): Selection | null;

  addEventListener(type: string, listener: ((ev: any) => void) | null, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: ((ev: any) => void) | null, options?: boolean | EventListenerOptions): void;
}

interface DocumentFragment extends Node {
  querySelector(selectors: string): Element | null;
  querySelectorAll(selectors: string): NodeListOf<Element>;
  getElementById(elementId: string): HTMLElement | null;
  append(...nodes: (Node | string)[]): void;
  prepend(...nodes: (Node | string)[]): void;
}

interface Selection {
  readonly anchorNode: Node | null;
  readonly anchorOffset: number;
  readonly focusNode: Node | null;
  readonly focusOffset: number;
  readonly isCollapsed: boolean;
  readonly rangeCount: number;
  toString(): string;
  removeAllRanges(): void;
  addRange(range: Range): void;
}

interface Range {
  readonly startContainer: Node;
  readonly startOffset: number;
  readonly endContainer: Node;
  readonly endOffset: number;
  readonly collapsed: boolean;
  setStart(node: Node, offset: number): void;
  setEnd(node: Node, offset: number): void;
  selectNode(node: Node): void;
  selectNodeContents(node: Node): void;
  cloneContents(): DocumentFragment;
  deleteContents(): void;
  extractContents(): DocumentFragment;
  insertNode(node: Node): void;
  getBoundingClientRect(): DOMRect;
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

interface Window extends EventTarget {
  readonly document: Document;
  readonly innerWidth: number;
  readonly innerHeight: number;
  readonly outerWidth: number;
  readonly outerHeight: number;
  readonly scrollX: number;
  readonly scrollY: number;
  readonly pageXOffset: number;
  readonly pageYOffset: number;
  readonly devicePixelRatio: number;
  readonly navigator: Navigator;
  readonly location: Location;
  readonly history: History;
  readonly localStorage: Storage;
  readonly sessionStorage: Storage;
  readonly performance: Performance;
  name: string;
  opener: Window | null;
  readonly parent: Window;
  readonly top: Window | null;
  readonly self: Window;
  readonly frames: Window;
  readonly length: number;

  getComputedStyle(elt: Element, pseudoElt?: string | null): CSSStyleDeclaration;
  getSelection(): Selection | null;
  matchMedia(query: string): MediaQueryList;
  open(url?: string, target?: string, features?: string): Window | null;
  close(): void;
  print(): void;
  scrollTo(options?: ScrollToOptions): void;
  scrollTo(x: number, y: number): void;
  scrollBy(options?: ScrollToOptions): void;
  scrollBy(x: number, y: number): void;
  postMessage(message: any, targetOrigin: string, transfer?: any[]): void;

  addEventListener(type: string, listener: ((ev: any) => void) | null, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: ((ev: any) => void) | null, options?: boolean | EventListenerOptions): void;

  [key: string]: any;
}

interface MediaQueryList extends EventTarget {
  readonly matches: boolean;
  readonly media: string;
}

// ---------------------------------------------------------------------------
// Navigator / Location / History
// ---------------------------------------------------------------------------

interface Navigator {
  readonly userAgent: string;
  readonly language: string;
  readonly languages: readonly string[];
  readonly platform: string;
  readonly onLine: boolean;
  readonly clipboard: Clipboard;
  readonly geolocation: any;
  readonly maxTouchPoints: number;
  readonly serviceWorker: any;
}

interface Clipboard extends EventTarget {
  readText(): Promise<string>;
  writeText(data: string): Promise<void>;
}

interface Location {
  href: string;
  readonly origin: string;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  assign(url: string): void;
  replace(url: string): void;
  reload(): void;
  toString(): string;
}

interface History {
  readonly length: number;
  readonly state: any;
  back(): void;
  forward(): void;
  go(delta?: number): void;
  pushState(data: any, unused: string, url?: string | null): void;
  replaceState(data: any, unused: string, url?: string | null): void;
}

interface Performance {
  now(): number;
  mark(markName: string): void;
  measure(measureName: string, startMark?: string, endMark?: string): void;
  getEntriesByName(name: string): any[];
  getEntriesByType(type: string): any[];
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

interface Storage {
  readonly length: number;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  key(index: number): string | null;
}

// ---------------------------------------------------------------------------
// Fetch API
// ---------------------------------------------------------------------------

interface Headers {
  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  has(name: string): boolean;
  set(name: string, value: string): void;
  forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any): void;
}

interface Body {
  readonly bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  json(): Promise<any>;
  text(): Promise<string>;
}

interface Response extends Body {
  readonly headers: Headers;
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly type: string;
  readonly url: string;
  clone(): Response;
}

interface Request extends Body {
  readonly headers: Headers;
  readonly method: string;
  readonly url: string;
  readonly referrer: string;
  clone(): Request;
}

interface RequestInit {
  body?: any;
  cache?: string;
  credentials?: string;
  headers?: Record<string, string> | Headers;
  integrity?: string;
  keepalive?: boolean;
  method?: string;
  mode?: string;
  redirect?: string;
  referrer?: string;
  referrerPolicy?: string;
  signal?: AbortSignal;
}

declare function fetch(input: string | Request, init?: RequestInit): Promise<Response>;

// ---------------------------------------------------------------------------
// AbortController / AbortSignal
// ---------------------------------------------------------------------------

interface AbortController {
  readonly signal: AbortSignal;
  abort(reason?: any): void;
}

declare var AbortController: {
  prototype: AbortController;
  new(): AbortController;
};

interface AbortSignal extends EventTarget {
  readonly aborted: boolean;
  readonly reason: any;
  onabort: ((this: AbortSignal, ev: any) => any) | null;
}

// ---------------------------------------------------------------------------
// MutationObserver
// ---------------------------------------------------------------------------

interface MutationObserverInit {
  attributes?: boolean;
  attributeFilter?: string[];
  attributeOldValue?: boolean;
  characterData?: boolean;
  characterDataOldValue?: boolean;
  childList?: boolean;
  subtree?: boolean;
}

interface MutationRecord {
  readonly type: 'attributes' | 'characterData' | 'childList';
  readonly target: Node;
  readonly addedNodes: NodeList;
  readonly removedNodes: NodeList;
  readonly previousSibling: Node | null;
  readonly nextSibling: Node | null;
  readonly attributeName: string | null;
  readonly attributeNamespace: string | null;
  readonly oldValue: string | null;
}

interface MutationObserver {
  observe(target: Node, options?: MutationObserverInit): void;
  disconnect(): void;
  takeRecords(): MutationRecord[];
}

declare var MutationObserver: {
  prototype: MutationObserver;
  new(callback: (mutations: MutationRecord[], observer: MutationObserver) => void): MutationObserver;
};

// ---------------------------------------------------------------------------
// IntersectionObserver
// ---------------------------------------------------------------------------

interface IntersectionObserverInit {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

interface IntersectionObserverEntry {
  readonly boundingClientRect: DOMRect;
  readonly intersectionRatio: number;
  readonly intersectionRect: DOMRect;
  readonly isIntersecting: boolean;
  readonly rootBounds: DOMRect | null;
  readonly target: Element;
  readonly time: number;
}

interface IntersectionObserver {
  readonly root: Element | null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  observe(target: Element): void;
  unobserve(target: Element): void;
  disconnect(): void;
  takeRecords(): IntersectionObserverEntry[];
}

declare var IntersectionObserver: {
  prototype: IntersectionObserver;
  new(callback: (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void, options?: IntersectionObserverInit): IntersectionObserver;
};

// ---------------------------------------------------------------------------
// ResizeObserver
// ---------------------------------------------------------------------------

interface ResizeObserverEntry {
  readonly target: Element;
  readonly contentRect: DOMRect;
  readonly borderBoxSize: ReadonlyArray<{ blockSize: number; inlineSize: number }>;
  readonly contentBoxSize: ReadonlyArray<{ blockSize: number; inlineSize: number }>;
}

interface ResizeObserver {
  observe(target: Element): void;
  unobserve(target: Element): void;
  disconnect(): void;
}

declare var ResizeObserver: {
  prototype: ResizeObserver;
  new(callback: (entries: ResizeObserverEntry[], observer: ResizeObserver) => void): ResizeObserver;
};

// ---------------------------------------------------------------------------
// URL / URLSearchParams
// ---------------------------------------------------------------------------

interface URL {
  hash: string;
  host: string;
  hostname: string;
  href: string;
  readonly origin: string;
  password: string;
  pathname: string;
  port: string;
  protocol: string;
  search: string;
  readonly searchParams: URLSearchParams;
  username: string;
  toString(): string;
  toJSON(): string;
}

declare var URL: {
  prototype: URL;
  new(url: string, base?: string): URL;
  createObjectURL(obj: Blob | MediaSource): string;
  revokeObjectURL(url: string): void;
};

interface URLSearchParams {
  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  getAll(name: string): string[];
  has(name: string): boolean;
  set(name: string, value: string): void;
  sort(): void;
  toString(): string;
  forEach(callbackfn: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: any): void;
}

declare var URLSearchParams: {
  prototype: URLSearchParams;
  new(init?: string | Record<string, string> | string[][]): URLSearchParams;
};

// ---------------------------------------------------------------------------
// Blob / File / FormData
// ---------------------------------------------------------------------------

interface Blob {
  readonly size: number;
  readonly type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
  slice(start?: number, end?: number, contentType?: string): Blob;
  text(): Promise<string>;
}

declare var Blob: {
  prototype: Blob;
  new(blobParts?: any[], options?: { type?: string; endings?: string }): Blob;
};

interface File extends Blob {
  readonly lastModified: number;
  readonly name: string;
}

interface FileList {
  readonly length: number;
  item(index: number): File | null;
  [index: number]: File;
}

interface FileReader extends EventTarget {
  readonly result: string | ArrayBuffer | null;
  readonly readyState: number;
  readonly error: any;
  readAsArrayBuffer(blob: Blob): void;
  readAsDataURL(blob: Blob): void;
  readAsText(blob: Blob, encoding?: string): void;
  abort(): void;
  onload: ((this: FileReader, ev: any) => any) | null;
  onerror: ((this: FileReader, ev: any) => any) | null;
  onloadend: ((this: FileReader, ev: any) => any) | null;
}

declare var FileReader: {
  prototype: FileReader;
  new(): FileReader;
};

interface FormData {
  append(name: string, value: string | Blob, fileName?: string): void;
  delete(name: string): void;
  get(name: string): string | File | null;
  getAll(name: string): (string | File)[];
  has(name: string): boolean;
  set(name: string, value: string | Blob, fileName?: string): void;
  forEach(callbackfn: (value: string | File, key: string, parent: FormData) => void, thisArg?: any): void;
}

declare var FormData: {
  prototype: FormData;
  new(form?: HTMLFormElement): FormData;
};

// ---------------------------------------------------------------------------
// MediaSource (minimal, used by URL.createObjectURL)
// ---------------------------------------------------------------------------

interface MediaSource extends EventTarget {}

// ---------------------------------------------------------------------------
// XMLHttpRequest
// ---------------------------------------------------------------------------

interface XMLHttpRequest extends EventTarget {
  readonly readyState: number;
  readonly response: any;
  readonly responseText: string;
  responseType: string;
  readonly responseURL: string;
  readonly status: number;
  readonly statusText: string;
  timeout: number;
  withCredentials: boolean;

  open(method: string, url: string, async?: boolean, username?: string | null, password?: string | null): void;
  send(body?: any): void;
  abort(): void;
  setRequestHeader(name: string, value: string): void;
  getResponseHeader(name: string): string | null;
  getAllResponseHeaders(): string;

  onreadystatechange: ((this: XMLHttpRequest, ev: any) => any) | null;
  onload: ((this: XMLHttpRequest, ev: any) => any) | null;
  onerror: ((this: XMLHttpRequest, ev: any) => any) | null;
  onprogress: ((this: XMLHttpRequest, ev: any) => any) | null;
  ontimeout: ((this: XMLHttpRequest, ev: any) => any) | null;

  readonly UNSENT: 0;
  readonly OPENED: 1;
  readonly HEADERS_RECEIVED: 2;
  readonly LOADING: 3;
  readonly DONE: 4;
}

declare var XMLHttpRequest: {
  prototype: XMLHttpRequest;
  new(): XMLHttpRequest;
  readonly UNSENT: 0;
  readonly OPENED: 1;
  readonly HEADERS_RECEIVED: 2;
  readonly LOADING: 3;
  readonly DONE: 4;
};

// ---------------------------------------------------------------------------
// jQuery (minimal — used in DayBack via $ and jQuery)
// ---------------------------------------------------------------------------

interface JQuery {
  length: number;
  [index: number]: HTMLElement;

  // Traversal
  find(selector: string): JQuery;
  closest(selector: string): JQuery;
  parent(selector?: string): JQuery;
  parents(selector?: string): JQuery;
  children(selector?: string): JQuery;
  siblings(selector?: string): JQuery;
  next(selector?: string): JQuery;
  prev(selector?: string): JQuery;
  first(): JQuery;
  last(): JQuery;
  eq(index: number): JQuery;
  filter(selector: string | ((index: number, element: HTMLElement) => boolean)): JQuery;
  not(selector: string | JQuery): JQuery;
  has(selector: string): JQuery;
  is(selector: string): boolean;
  each(fn: (index: number, element: HTMLElement) => void): JQuery;

  // Manipulation
  text(): string;
  text(text: string): JQuery;
  html(): string;
  html(htmlString: string): JQuery;
  val(): string;
  val(value: string | number | string[]): JQuery;
  attr(attributeName: string): string | undefined;
  attr(attributeName: string, value: string | number | null): JQuery;
  prop(propertyName: string): any;
  prop(propertyName: string, value: any): JQuery;
  data(key: string): any;
  data(key: string, value: any): JQuery;
  removeData(key?: string): JQuery;
  addClass(className: string): JQuery;
  removeClass(className?: string): JQuery;
  toggleClass(className: string, state?: boolean): JQuery;
  hasClass(className: string): boolean;
  css(propertyName: string): string;
  css(propertyName: string, value: string | number): JQuery;
  css(properties: Record<string, string | number>): JQuery;
  width(): number;
  width(value: number | string): JQuery;
  height(): number;
  height(value: number | string): JQuery;

  // DOM insertion
  append(...content: (string | HTMLElement | JQuery)[]): JQuery;
  prepend(...content: (string | HTMLElement | JQuery)[]): JQuery;
  after(...content: (string | HTMLElement | JQuery)[]): JQuery;
  before(...content: (string | HTMLElement | JQuery)[]): JQuery;
  appendTo(target: string | HTMLElement | JQuery): JQuery;
  prependTo(target: string | HTMLElement | JQuery): JQuery;
  wrap(wrappingElement: string | HTMLElement | JQuery): JQuery;
  wrapAll(wrappingElement: string | HTMLElement | JQuery): JQuery;
  wrapInner(wrappingElement: string | HTMLElement | JQuery): JQuery;
  unwrap(): JQuery;
  remove(selector?: string): JQuery;
  detach(selector?: string): JQuery;
  empty(): JQuery;
  clone(withDataAndEvents?: boolean): JQuery;
  replaceWith(newContent: string | HTMLElement | JQuery): JQuery;

  // Events
  on(events: string, handler: (event: any, ...args: any[]) => void): JQuery;
  on(events: string, selector: string, handler: (event: any, ...args: any[]) => void): JQuery;
  off(events?: string, handler?: (event: any) => void): JQuery;
  off(events: string, selector: string, handler?: (event: any) => void): JQuery;
  one(events: string, handler: (event: any, ...args: any[]) => void): JQuery;
  trigger(eventType: string, extraParameters?: any[]): JQuery;
  click(handler?: (event: any) => void): JQuery;
  change(handler?: (event: any) => void): JQuery;
  focus(handler?: (event: any) => void): JQuery;
  blur(handler?: (event: any) => void): JQuery;
  keydown(handler?: (event: any) => void): JQuery;
  keyup(handler?: (event: any) => void): JQuery;
  mouseenter(handler?: (event: any) => void): JQuery;
  mouseleave(handler?: (event: any) => void): JQuery;
  hover(handlerIn: (event: any) => void, handlerOut?: (event: any) => void): JQuery;
  submit(handler?: (event: any) => void): JQuery;

  // Effects
  show(duration?: number | string): JQuery;
  hide(duration?: number | string): JQuery;
  toggle(duration?: number | string): JQuery;
  fadeIn(duration?: number | string, complete?: () => void): JQuery;
  fadeOut(duration?: number | string, complete?: () => void): JQuery;
  fadeToggle(duration?: number | string, complete?: () => void): JQuery;
  slideDown(duration?: number | string, complete?: () => void): JQuery;
  slideUp(duration?: number | string, complete?: () => void): JQuery;
  slideToggle(duration?: number | string, complete?: () => void): JQuery;
  animate(properties: Record<string, any>, duration?: number | string, easing?: string, complete?: () => void): JQuery;
  stop(clearQueue?: boolean, jumpToEnd?: boolean): JQuery;

  // Dimensions / Position
  offset(): { top: number; left: number } | undefined;
  offset(coordinates: { top: number; left: number }): JQuery;
  position(): { top: number; left: number };
  scrollTop(): number;
  scrollTop(value: number): JQuery;
  scrollLeft(): number;
  scrollLeft(value: number): JQuery;
  outerWidth(includeMargin?: boolean): number;
  outerHeight(includeMargin?: boolean): number;
  innerWidth(): number;
  innerHeight(): number;

  // Utilities
  toArray(): HTMLElement[];
  get(): HTMLElement[];
  get(index: number): HTMLElement;
  index(element?: string | HTMLElement | JQuery): number;
  map(callback: (index: number, domElement: HTMLElement) => any): JQuery;
  slice(start: number, end?: number): JQuery;
  promise(type?: string): any;

  // DayBack-specific: fullCalendar
  fullCalendar(method: string, ...args: any[]): any;

  [key: string]: any;
}

interface JQueryStatic {
  (selector: string | HTMLElement | Document | Window | JQuery | ((this: Document) => void)): JQuery;
  ajax(settings: any): any;
  ajax(url: string, settings?: any): any;
  get(url: string, data?: any, success?: (data: any) => void, dataType?: string): any;
  post(url: string, data?: any, success?: (data: any) => void, dataType?: string): any;
  getJSON(url: string, data?: any, success?: (data: any) => void): any;
  each(collection: any, callback: (indexInArray: any, valueOfElement: any) => void): any;
  extend(deep: boolean, target: any, ...sources: any[]): any;
  extend(target: any, ...sources: any[]): any;
  map(array: any[], callback: (elementOfArray: any, indexInArray: number) => any): any[];
  grep(array: any[], fn: (elementOfArray: any, indexInArray: number) => boolean, invert?: boolean): any[];
  isArray(obj: any): obj is any[];
  isFunction(obj: any): obj is Function;
  isPlainObject(obj: any): boolean;
  trim(str: string): string;
  parseJSON(json: string): any;
  contains(container: Element, contained: Element): boolean;
  fn: any;

  [key: string]: any;
}

// ---------------------------------------------------------------------------
// Global variable declarations (excluding `event` — see dayback-globals.d.ts)
// ---------------------------------------------------------------------------

declare var document: Document;
/**
 * @deprecated Not reliably available in the DayBack action eval() context.
 * Use `document` directly for DOM access. Avoid `window.*` in action scripts.
 */
declare var window: Window & typeof globalThis;
declare var navigator: Navigator;
declare var location: Location;
declare var history: History;
declare var localStorage: Storage;
declare var sessionStorage: Storage;
declare var performance: Performance;
declare var $: JQueryStatic;
declare var jQuery: JQueryStatic;

// ---------------------------------------------------------------------------
// AngularJS (minimal — DayBack uses $rootScope and $timeout)
// ---------------------------------------------------------------------------

interface AngularJSStatic {
  module(name: string, requires?: string[]): any;
  element(element: string | HTMLElement | Document | JQuery): JQuery;
  forEach(obj: any, iterator: (value: any, key: any) => void, context?: any): any;
  copy<T>(source: T): T;
  extend(dst: any, ...src: any[]): any;
  isString(value: any): value is string;
  isNumber(value: any): value is number;
  isArray(value: any): value is any[];
  isObject(value: any): boolean;
  isFunction(value: any): value is Function;
  isDefined(value: any): boolean;
  isUndefined(value: any): boolean;
  toJson(obj: any, pretty?: boolean | number): string;
  fromJson(json: string): any;
  noop(): void;
  identity<T>(value: T): T;
  [key: string]: any;
}

interface AngularJSScope {
  $apply(fn?: string | (() => void)): void;
  $applyAsync(fn?: string | (() => void)): void;
  $digest(): void;
  $watch(watchExpression: string | (() => any), listener?: (newVal: any, oldVal: any, scope: AngularJSScope) => void, objectEquality?: boolean): () => void;
  $on(name: string, listener: (event: any, ...args: any[]) => void): () => void;
  $emit(name: string, ...args: any[]): any;
  $broadcast(name: string, ...args: any[]): any;
  $evalAsync(fn?: string | (() => void)): void;
  $destroy(): void;
  [key: string]: any;
}

declare var angular: AngularJSStatic;
declare var $rootScope: AngularJSScope;
/**
 * Triggers an Angular digest cycle after the callback runs.
 * Use `$timeout` when updating Angular-bound UI (filter state, popover scope
 * variables, config UI properties) from inside an async callback. Use plain
 * `setTimeout` for pure timing delays (CSS transitions, debounce, action
 * timeout guards). Use `dbk.observe()` for DOM readiness — never `setTimeout`.
 *
 * @example
 * // Update popover-bound data after an API call
 * $timeout(function () {
 *   editEvent.status[0] = 'Completed';
 *   dbk.refreshEditPopover(editEvent);
 * }, 0);
 *
 * @param fn - Callback to execute after the delay
 * @param delay - Milliseconds to wait (default 0 — runs after current digest)
 * @param invokeApply - Whether to trigger $apply (default true)
 */
declare function $timeout(fn: () => void, delay?: number, invokeApply?: boolean): Promise<any>;
