const path = require("path");

const config = {
  name: "index",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
    filename: "main.js",
  },

  watch: true,
  devtool: "inline-source-map",

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /.(jpg|png|gif|wasm)$/,
        loader: "file-loader",
        options: {
          name: "[path][name].[ext]",
          outputPath: (url, resourcePath, context) => {
            if (resourcePath.endsWith(".wasm")) {
              return `resources/wasm/${path.basename(url)}`;
            }

            return `resources/${url}`;
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      app: path.resolve(__dirname, "src/app"),
      core: path.resolve(__dirname, "src/core"),
      assembly: path.resolve(__dirname, "src/assembly/wasm"),
    },
  },
};

module.exports = config;
