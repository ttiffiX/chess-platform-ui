// Some browser dependencies still expect Node.js-style `global`.
Object.assign(globalThis, {
    global: globalThis,
});