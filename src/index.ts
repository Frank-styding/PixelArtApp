import { t } from "template-engine";
import RenderWasm from "assembly/render";
t("#root", [
  {
    tag: "div",
    className: "container",
  },
]);

Promise.all([
  RenderWasm.load({
    js_draw: function (data) {
      console.log(data, "hola");
    },
  }),
]).then(() => {
  RenderWasm.callWasm("set_mem", 0, 0, 11);
  RenderWasm.callWasm("set_mem", 0, 9, 11);
  RenderWasm.callWasm("set_mem", 1, 0, 22);
  RenderWasm.callWasm("set_mem", 1, 9, 22);
  RenderWasm.callWasm("set_mem", 2, 0, 33);
  RenderWasm.callWasm("set_mem", 2, 19, 33);
  RenderWasm.callWasm("resize_mem", 0, 20);
  RenderWasm.callWasm("memBufferPointer");
});
