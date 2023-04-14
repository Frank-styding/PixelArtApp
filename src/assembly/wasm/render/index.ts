import { Wasm } from "core/Wasm/Wasm";
import wasmPath from "./render.wasm";
type IMethods = {
resize_mem:{args:[number,number];
res:void;
};
read_mem:{args:[number,number];
res:number;
};
set_mem:{args:[number,number,number];
res:void;
};
memBufferPointer:{args:[];
res:number;
};
}
const wasm = new Wasm<IMethods>('render')
wasm.setFile(wasmPath);
export default wasm;
