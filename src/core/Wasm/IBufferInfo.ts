export type IBufferInfo = {
  type:
    | "uint8Clamped"
    | "uint8"
    | "uint16"
    | "uint32"
    | "int8"
    | "int16"
    | "int32"
    | "float32"
    | "float64";
  data?: number[];
  out?: boolean;
  size: number;
};
