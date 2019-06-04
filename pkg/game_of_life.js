import * as wasm from './game_of_life_bg';

let WASM_VECTOR_LEN = 0;

let cachedTextEncoder = new TextEncoder('utf-8');

let cachegetUint8Memory = null;
function getUint8Memory() {
    if (cachegetUint8Memory === null || cachegetUint8Memory.buffer !== wasm.memory.buffer) {
        cachegetUint8Memory = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8Memory;
}

let passStringToWasm;
if (typeof cachedTextEncoder.encodeInto === 'function') {
    passStringToWasm = function(arg) {

        let size = arg.length;
        let ptr = wasm.__wbindgen_malloc(size);
        let writeOffset = 0;
        while (true) {
            const view = getUint8Memory().subarray(ptr + writeOffset, ptr + size);
            const { read, written } = cachedTextEncoder.encodeInto(arg, view);
            writeOffset += written;
            if (read === arg.length) {
                break;
            }
            arg = arg.substring(read);
            ptr = wasm.__wbindgen_realloc(ptr, size, size += arg.length * 3);
        }
        WASM_VECTOR_LEN = writeOffset;
        return ptr;
    };
} else {
    passStringToWasm = function(arg) {

        const buf = cachedTextEncoder.encode(arg);
        const ptr = wasm.__wbindgen_malloc(buf.length);
        getUint8Memory().set(buf, ptr);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    };
}

let cachedTextDecoder = new TextDecoder('utf-8');

function getStringFromWasm(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory().subarray(ptr, ptr + len));
}

export function __wbg_error_4bb6c2a97407129a(arg0, arg1) {
    let varg0 = getStringFromWasm(arg0, arg1);

    varg0 = varg0.slice();
    wasm.__wbindgen_free(arg0, arg1 * 1);

    console.error(varg0);
}

const heap = new Array(32);

heap.fill(undefined);

heap.push(undefined, null, true, false);

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

export function __wbg_new_59cb74e423758ede() {
    return addHeapObject(new Error());
}

function getObject(idx) { return heap[idx]; }

let cachegetUint32Memory = null;
function getUint32Memory() {
    if (cachegetUint32Memory === null || cachegetUint32Memory.buffer !== wasm.memory.buffer) {
        cachegetUint32Memory = new Uint32Array(wasm.memory.buffer);
    }
    return cachegetUint32Memory;
}

export function __wbg_stack_558ba5917b466edd(ret, arg0) {

    const retptr = passStringToWasm(getObject(arg0).stack);
    const retlen = WASM_VECTOR_LEN;
    const mem = getUint32Memory();
    mem[ret / 4] = retptr;
    mem[ret / 4 + 1] = retlen;

}

export function __widl_f_log_1_(arg0) {
    console.log(getObject(arg0));
}

export function __widl_f_time_with_label_(arg0, arg1) {
    let varg0 = getStringFromWasm(arg0, arg1);
    console.time(varg0);
}

export function __widl_f_time_end_with_label_(arg0, arg1) {
    let varg0 = getStringFromWasm(arg0, arg1);
    console.timeEnd(varg0);
}

export function __wbg_random_58bd29ed438c19c0() {
    return Math.random();
}

export function __wbindgen_string_new(p, l) { return addHeapObject(getStringFromWasm(p, l)); }

export function __wbindgen_throw(ptr, len) {
    throw new Error(getStringFromWasm(ptr, len));
}

function freeUniverse(ptr) {

    wasm.__wbg_universe_free(ptr);
}
/**
*/
export class Universe {

    static __wrap(ptr) {
        const obj = Object.create(Universe.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;
        freeUniverse(ptr);
    }

    /**
    * @param {string} init_mode
    * @param {number} threshold
    * @returns {Universe}
    */
    static new(init_mode, threshold) {
        const ptr0 = passStringToWasm(init_mode);
        const len0 = WASM_VECTOR_LEN;
        try {
            return Universe.__wrap(wasm.universe_new(ptr0, len0, threshold));

        } finally {
            wasm.__wbindgen_free(ptr0, len0 * 1);

        }

    }
    /**
    * @returns {void}
    */
    tick() {
        return wasm.universe_tick(this.ptr);
    }
    /**
    * @returns {number}
    */
    width() {
        return wasm.universe_width(this.ptr) >>> 0;
    }
    /**
    * @returns {number}
    */
    height() {
        return wasm.universe_height(this.ptr) >>> 0;
    }
    /**
    * @param {number} width
    * @returns {void}
    */
    set_width(width) {
        return wasm.universe_set_width(this.ptr, width);
    }
    /**
    * @param {number} height
    * @returns {void}
    */
    set_height(height) {
        return wasm.universe_set_height(this.ptr, height);
    }
    /**
    * @returns {number}
    */
    cells() {
        return wasm.universe_cells(this.ptr);
    }
    /**
    * @param {number} row
    * @param {number} col
    * @returns {void}
    */
    toggle_cell(row, col) {
        return wasm.universe_toggle_cell(this.ptr, row, col);
    }
    /**
    * @param {number} row
    * @param {number} col
    * @returns {void}
    */
    add_glider_at(row, col) {
        return wasm.universe_add_glider_at(this.ptr, row, col);
    }
    /**
    * @returns {void}
    */
    add_glider() {
        return wasm.universe_add_glider(this.ptr);
    }
}

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

export function __wbindgen_object_drop_ref(i) { dropObject(i); }

