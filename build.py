import sys
import os
import re
import json

BASE_PATH = ""
REGEX_EXPORT_METHOD = "\s?\/\/(\s?)(Export|Export ((\[[a-zA-Z0-9, _\+]+\]|\[\]) \[[a-zA_Z0-9, _\+]+\]))\n+[ a-z_A-Z0-9\*]+ [\*a-z_A-Z0-9]+(\([\na-zA-Z0-9_ ,]+\)|\(\))"


DEFAULT_CONFIG = {
    "commands": [
        "emcc $FILE_PATH$ -O -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=128MB -sEXPORTED_FUNCTIONS=",
        {
            "method": "join",
            "options": [","],
            "value": {
                "method": "map",
                "value": "$exported_methods$",
                "template": "_$$"
            }
        }
    ]
}


def processJSON(data, context: dict[str, any], isValue=False, isTemplate=False, parentData=None):
    if isinstance(data, str):
        if context.get(data.replace("$", "")) is not None:
            return context.get(data.replace("$", ""))

        aux = re.search("\$([a-zA-Z0-9]+|([a-zA-Z0-9]+[0-9:]+))\$", data)
        if aux is not None:
            items = aux.group().replace("$", "").split(":")
            aux1 = None
            if re.search("[0-9]+", items[0]) is not None:
                aux1 = parentData
            else:
                referent = items.pop(0)
                aux1 = context.get(referent)

            for item in items:

                aux1 = aux1[int(item)]

            if isValue:
                return aux1

            data = data.replace(aux.group(), str(aux1))

        for key, value in context.items():
            data = data.replace(f"${key}$", f"{value}")

        return data

    if isinstance(data, list):

        def mapIter(item):
            return processJSON(item, context,
                               parentData=parentData, isTemplate=isTemplate)

        data_1 = map(mapIter, data)

        if isValue:
            return data_1

        return "".join(data_1)

    if isinstance(data, dict):
        _method = data.get("method")
        _value = data.get("value")
        _template = data.get("template")
        _options = data.get("options")
        _value = processJSON(_value, context=context,
                             isValue=True,  parentData=parentData)
        if _method == "join":
            _value = str(_options).join(map(str, list(_value)))

            if _template is None:
                return _value

            n_context = {}
            n_context.update(context)
            n_context.update({
                "DATA": _value,
            })

            return processJSON(_template, context=n_context, parentData=_value, isTemplate=True)

        if _method == "map":

            if _template is None:
                return _value

            n_context = {}
            n_context.update(context)

            aux = []

            for item in _value:
                n_context.update({
                    "DATA": item,
                })
                aux.append(processJSON(_template, n_context))

            return aux

        if _method == "iterStr":
            if _template is None:
                return "\n".join(map(str, list(_value)))

            aux = []
            for item in list(_value):
                n_context = {
                    "DATA": item
                }
                n_context.update(context)

                aux.append(processJSON(_template,
                                       context=n_context, parentData=item, isTemplate=True))

            return "".join(aux)


def readConfig():
    file = open("./config.json", "r")
    text = file.read()
    data = json.loads(text)
    return data


def createFile(path: str, data: str):
    file = open(path, 'w')
    file.write(data)
    file.close()


def createFiles(assembly_dir, config):
    if not os.path.exists(assembly_dir + "\\cpp"):
        return
    base_path = assembly_dir + "\\wasm"

    if not os.path.exists(base_path):
        os.mkdir(base_path)

    for file in os.listdir(assembly_dir + "\\cpp"):

        compileFile(assembly_dir + "\\cpp\\" + file, base_path, config)


def processFile(filePath, config):
    exported_methods = []
    exported_methods.extend(config["default_methods"])

    file = open(filePath, "r")
    text = file.read()

    export_iter = re.finditer(REGEX_EXPORT_METHOD, text)
    funcs_info = []
    for item in export_iter:
        aux = item.group()
        name = re.search("[a-zA-Z0-9_]+\(",
                         aux).group().replace("(", "").replace(" ", "")

        type_args = re.finditer("\[[a-zA-Z0-9, _\+]+\]|\[\]",
                                aux)

        aux1 = list(type_args)

        if len(aux1) > 0:
            args = aux1[0].group().replace(
                "[", "").replace("]", "").split(",")

            return_type = aux1[1].group().replace(
                "[", "").replace("]", "").split(",")

            funcs_info.append((name, args, return_type))

        exported_methods.append(name)

    return exported_methods, funcs_info


def compileFile(file_path, base_path, config):
    name = os.path.basename(file_path).replace(".cpp", "")
    exported_methods, funcs_info = processFile(file_path, config)

    wasm_file_path = base_path + "\\" + name + "\\" + name + ".wasm"
    if not os.path.exists(os.path.dirname(wasm_file_path)):
        os.mkdir(os.path.dirname(wasm_file_path))

    if os.path.exists(wasm_file_path):
        os.remove(wasm_file_path)

    command = processJSON(config["command"], {
        "FILE_PATH": file_path,
        "EXPORTED_FUNCTIONS": exported_methods,
        "WASM_FILE_PATH": wasm_file_path
    })
    print(command)
    os.system(command)
    os.remove("a.out.js")
    os.rename("a.out.wasm", wasm_file_path)

    data = processJSON(config["Template::index.ts"], {
        "FILE_NAME": name,
        "FUNC_INFO": funcs_info
    })

    createFile(base_path + "\\" + name + "\\"+"index.ts", data)


def main():
    config = readConfig()
    createFiles(config["assemblyPath"], config)


if __name__ == "__main__":
    main()
