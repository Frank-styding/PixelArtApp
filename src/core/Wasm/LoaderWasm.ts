type IExports = Record<string, Record<string, any>>;
type IBuffers = Record<string, ArrayBuffer>;
type IFilesPath = Record<string, string>;
type IHeepRegister = Record<string, Uint8Array>;

export class LoaderWasm {
  static exports: IExports = {};
  static buffers: IBuffers = {};
  static filesPath: IFilesPath = {};
  static heapRegister: IHeepRegister = {};
  static envConfig: Record<string, any> = {};
  static defaultConfig = {};

  private constructor() {}

  static async loadFile(name: string, data: Record<string, any>) {
    if (this.exports[name]) {
      return this.exports[name];
    }
    let buffer = this.buffers[name];
    if (!buffer) {
      const filePath = this.filesPath[name];
      if (!filePath) return;
      const response = await fetch(filePath);
      const buffer = await response.arrayBuffer();

      await this.loadFromBuffer(name, buffer, data);
    }
    return this.exports[name];
  }

  static async loadFromBuffer(
    name: string,
    buffer: ArrayBuffer,
    data: Record<string, any>
  ) {
    if (this.exports[name] != undefined) {
      return;
    }

    const { env, heap } = this.getDefaultEnv();

    const { instance } = await WebAssembly.instantiate(new Uint8Array(buffer), {
      module: {},
      env: { ...env, ...data },
    });

    this.heapRegister[name] = heap;

    this.exports[name] = instance.exports;
  }

  static getDefaultEnv() {
    const memory = new WebAssembly.Memory({
      initial: 4000,
    });
    const heap = new Uint8Array(memory.buffer);

    return {
      env: {
        memory: memory,
        LOG: (...data: any[]) => {
          console.log(data.join(" "));
        },
        emscripten_resize_heap: (requestedSize: number) => {
          requestedSize = requestedSize >>> 0;
        },
        emscripten_memcpy_big: () => {},
        DYNAMICTOP_PTR: 4096,
        abort: function (err) {
          throw new Error("abort " + err);
        },
        abortOnCannotGrowMemory: function (err) {
          throw new Error("abortOnCannotGrowMemory " + err);
        },
        ___cxa_throw: function (ptr, type, destructor) {
          console.error(
            "cxa_throw: throwing an exception, " + [ptr, type, destructor]
          );
        },
        ___cxa_allocate_exception: function (size) {
          console.error("cxa_allocate_exception" + size);
          return false; // always fail
        },
        ___setErrNo: function (err) {
          throw new Error("ErrNo " + err);
        },
        _emscripten_get_heap_size: function () {
          return heap.length;
        },
        _emscripten_resize_heap: function (size) {
          return false; // always fail
        },
        _emscripten_memcpy_big: function (dest, src, count) {
          heap.set(heap.subarray(src, src + count), dest);
        },
        _Znam: function () {},
        __memory_base: 0,
        __table_base: 0,
        table: new WebAssembly.Table({
          initial: 33,
          maximum: 33,
          element: "anyfunc",
        }),
      },
      heap,
    };
  }

  static getExports(name: string) {
    return this.exports[name];
  }

  static getArrayBuffer(name: string) {
    return this.buffers[name];
  }

  static registerFile(name: string, filePath: string) {
    this.filesPath[name] = filePath;
  }

  static registerBuffer(name: string, buffer: ArrayBuffer) {
    this.buffers[name] = buffer;
  }

  static isLoaded(name: string) {
    return this.exports[name] != undefined;
  }
}
