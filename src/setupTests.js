// Jest setup (CRA loads this automatically before every test file).
import '@testing-library/jest-dom';

// jsdom is missing a few browser APIs that Radix UI and cmdk rely on.
class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
if (!window.ResizeObserver) window.ResizeObserver = ResizeObserverStub;
if (!window.DOMRect) window.DOMRect = { fromRect: () => ({ top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 }) };
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false;
if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false, media: query, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; },
  });
}
window.scrollTo = () => {};
