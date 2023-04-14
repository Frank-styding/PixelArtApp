import { IBufferInfo } from "./IBufferInfo";
import { Wasm } from "./Wasm";

export class WasmArgs<T extends (IBufferInfo | number)[] = []> {
  public argsInfo: T;
  public buffers: ArrayBuffer[];
  public outBuffers: number[];
  public args?: number[];

  constructor(...argsInfo: T) {
    this.argsInfo = argsInfo;
    this.buffers = [];
    this.outBuffers = [];
  }

  getClassBuffer(type: string) {
    switch (type) {
      case "uint8Clamped":
        return Uint8ClampedArray;
      case "uint8":
        return Uint8Array;
      case "uint16":
        return Uint16Array;
      case "uint32":
        return Uint32Array;
      case "int8":
        return Int8Array;
      case "int16":
        return Int16Array;
      case "int32":
        return Int32Array;
      case "float32":
        return Float32Array;
      case "float64":
        return Float64Array;
      default:
        return undefined;
    }
  }

  bind(wasm: Wasm<any>) {
    this.buffers = [];
    this.args = this.argsInfo.map((arg, i) => {
      if (typeof arg == "object") {
        const classBuffer = this.getClassBuffer(arg.type);
        const pointer = wasm.exports["malloc"](
          classBuffer.BYTES_PER_ELEMENT * arg.size
        );

        const buffer = new classBuffer(
          wasm.exports["memory"].buffer,
          pointer,
          arg.size
        );

        if (arg.data !== undefined) {
          buffer.set(arg.data);
        }

        this.buffers.push(buffer);
        if (arg.out) {
          this.outBuffers.push(this.buffers.length - 1);
        }

        return buffer.byteOffset;
      }
      return arg;
    });
  }

  getArgs() {
    return this.args;
  }

  getOutBuffers() {
    return this.outBuffers.map((i) => this.buffers[i]);
  }
}
