import { LoaderWasm } from "./LoaderWasm";
import { WasmArgs } from "./WasmArgs";

interface IExportsMethod {
  args: any[];
  res: any;
}

type IExportsMethods = Record<string, IExportsMethod>;

export class Wasm<I extends IExportsMethods = {}> {
  exports: Record<string, any>;
  filePath: string;
  heap: Uint8Array;

  constructor(public name: string) {}

  setFile(filepath: string) {
    this.filePath = filepath;
  }

  async load(data: Record<string, any> = {}) {
    const exports = LoaderWasm.getExports(this.name);

    if (exports == undefined && this.filePath != undefined) {
      await Wasm.loadFile(this.name, this.filePath, data);
      this.exports = LoaderWasm.getExports(this.name);
      this.heap = LoaderWasm.heapRegister[this.name];
      return;
    }

    this.heap = LoaderWasm.heapRegister[this.name];
    this.exports = exports;
  }

  callWasm<K extends keyof I>(
    methodName: K,
    ...args: I[K]["args"]
  ): I[K]["res"] {
    const method = this.exports[methodName as string];
    if (args.length == 0) {
      return method();
    }
    const wasmArgs = new WasmArgs(...args);
    wasmArgs.bind(this);
    const _args = wasmArgs.getArgs();
    return method(..._args);
  }

  static async loadFile(
    name: string,
    filePath: string,
    data: Record<string, any>
  ) {
    LoaderWasm.registerFile(name, filePath);
    await LoaderWasm.loadFile(name, data);
  }

  static async loadWasmBuffer(
    name: string,
    buffer: ArrayBuffer,
    data: Record<string, any>
  ) {
    LoaderWasm.registerBuffer(name, buffer);
    await LoaderWasm.loadFromBuffer(name, buffer, data);
  }
}
