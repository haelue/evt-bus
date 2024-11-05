#!/usr/bin/env node

const path = require("path");
const fs = require("fs");

// --------------------- common functions ---------------------

const path2 = {
  reg: /\\/g,
  normalize: (p) => path.normalize(p).replace(path2.reg, "/"),
  join: (...paths) => path.join(...paths).replace(path2.reg, "/"),
  resolve: (...pathSegments) =>
    path.resolve(...pathSegments).replace(path2.reg, "/"),
  isAbsolute: (p) => path.isAbsolute(p),
  relative: (from, to) => path.relative(from, to).replace(path2.reg, "/"),
  dirname: (p) => path.dirname(p).replace(path2.reg, "/"),
  basename: (p, ext) => path.basename(p, ext).replace(path2.reg, "/"),
  extname: (p) => path.extname(p).replace(path2.reg, "/"),
  sep: "/",
  delimiter: path.delimiter,
};

function walkPath(path, handler) {
  if (fs.statSync(path).isDirectory()) {
    const files = fs.readdirSync(path);
    for (let file of files) {
      const subPath = path2.join(path, file);
      walkPath(subPath, handler);
    }
  } else {
    handler(path);
  }
}

function writeFile(path, data) {
  fs.writeFile(path, data, "utf8", (err) => {
    if (err) {
      console.error("Error: write file failed: ", path, err);
      return;
    }
    console.log("write file succeed: ", path);
  });
}
module.exports.writeFile = writeFile;

// --------------------- generate definitions ---------------------

const autogen_head = `/** Auto generate by evt-autogen.js! */`;

function trimBlankLines(data) {
  let startLine = 0,
    endLine = data.length - 1;
  while (startLine <= endLine && data[startLine].trim() === "") {
    startLine++;
  }
  while (endLine >= startLine && data[endLine].trim() === "") {
    endLine--;
  }
  return data.slice(startLine, endLine + 1);
}

function generateDefs(emitPath, needEventArg, generateInSameFile) {
  // 读取来源文件
  fs.readFile(emitPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error: read file failed: ", emitPath, err);
      return;
    }

    let lines = trimBlankLines(data.split("\n"));

    let main_lineno = -1;
    let main_symbol = "";

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(
        /\s*(export|declare)\s*interface\s*EvtEmitDictionary\s*\{/,
      );
      if (match) {
        main_lineno = i;
        main_symbol = match[1].toString();
        break;
      }
    }

    if (main_lineno === -1) {
      console.error("Error: parse file interface def failed: ", emitPath);
      return;
    }

    for (let i = main_lineno + 1; i < lines.length; i++) {
      const match = lines[i].match(
        /\s*(export|declare)\s*interface\s*(EvtEmitAsyncDictionary|EvtOnOffDictionary|EvtOnCountDictionary)\s*\{/,
      );
      if (match) {
        lines = trimBlankLines(lines.slice(0, i));
        break;
      }
    }

    let out_emit = lines.join("\n");
    let out_emitasync =
      (generateInSameFile ? "" : lines.slice(0, main_lineno).join("\n")) +
      `${main_symbol} interface EvtEmitAsyncDictionary {`;
    let out_onoff =
      (generateInSameFile ? "" : lines.slice(0, main_lineno).join("\n")) +
      `${main_symbol} interface EvtOnOffDictionary {`;
    let out_oncount = `${main_symbol} interface EvtOnCountDictionary {`;

    let lower_data = "\n" + lines.slice(main_lineno + 1).join("\n"),
      index = 0;
    while (true) {
      const reg =
        /(^|\n)(\s*?)(\w+?)\s*?\(([\s\S]*?)\)\s*?:\s*?boolean(;?\s*?)($|\n)/g;
      const subtext = reg.exec(lower_data);
      if (!subtext) {
        out_emitasync += lower_data;
        out_onoff += lower_data;
        out_oncount += lower_data;
        break;
      }
      let uppper_temp = lower_data.substring(0, subtext.index);
      out_emitasync += uppper_temp;
      out_onoff += uppper_temp;
      out_oncount += uppper_temp;

      const space = subtext[2].toString();
      const name = subtext[3].toString();
      const args = subtext[4].toString();
      const tail = subtext[5].toString();

      let cbArgs = needEventArg
        ? `e: EvtMessage${args !== "" ? ", " : ""}${args}`
        : args;
      out_emitasync += `${index === 0 && uppper_temp.trim() === "" ? "" : "\n"}${space}${name}(${args}): Promise<boolean>${tail}\n`;
      out_onoff += `${index === 0 && uppper_temp.trim() === "" ? "" : "\n"}${space}${name}(cb?: (${cbArgs}) => void, gp?: EvtGroupName, order?: EvtOrder, repeatable?: EvtRepeatable): void${tail}\n`;
      out_oncount += `${index === 0 && uppper_temp.trim() === "" ? "" : "\n"}${space}${name}(cb?: (${cbArgs}) => void, gp?: EvtGroupName, order?: EvtOrder): number${tail}\n`;
      lower_data = lower_data.substring(subtext.index + subtext[0].length);
      index++;
    }
    // 写入目标文件
    if (generateInSameFile) {
      writeFile(
        emitPath,
        out_emit +
          "\n\n" +
          out_emitasync +
          "\n\n" +
          out_onoff +
          "\n\n" +
          out_oncount,
      );
    } else {
      const emitasyncPath = emitPath.replace(/\bemit\./, "emitasync.");
      const onoffPath = emitPath.replace(/\bemit\./, "onoff.");
      const oncountPath = emitPath.replace(/\bemit\./, "oncount.");
      writeFile(emitasyncPath, autogen_head + "\n\n" + out_emitasync);
      writeFile(onoffPath, autogen_head + "\n\n" + out_onoff);
      writeFile(oncountPath, autogen_head + "\n\n" + out_oncount);
    }
  });
}

if (require.main === module) {
  const simpleIdx = Math.max(
      process.argv.indexOf("-s"),
      process.argv.indexOf("-S"),
      process.argv.indexOf("-simple"),
      process.argv.indexOf("-SIMPLE"),
    ),
    needEventArg = simpleIdx < 0;

  const pathIdx = Math.max(
      process.argv.indexOf("-p"),
      process.argv.indexOf("-P"),
      process.argv.indexOf("-path"),
      process.argv.indexOf("-PATH"),
    ),
    path = pathIdx < 0 ? "src" : process.argv[pathIdx + 1];

  walkPath(path, (filePath) => {
    if (filePath.endsWith("emit.d.ts") || filePath.endsWith("emit.ts")) {
      generateDefs(filePath, needEventArg, false);
    } else if (filePath.endsWith("evt.d.ts") || filePath.endsWith("evt.ts")) {
      generateDefs(filePath, needEventArg, true);
    }
  });
}
