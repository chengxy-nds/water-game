import { removeBackground } from '@imgly/background-removal-node';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath, pathToFileURL } from 'url';

/**
 * 智能抠图核心逻辑：输入图像路径，输出无背景透明 32-bit RGBA PNG
 */
export async function processMatting(inputPath, outputPath) {
  const resolvedInput = path.resolve(inputPath);
  if (!fs.existsSync(resolvedInput)) {
    throw new Error(`Input file not found: ${resolvedInput}`);
  }

  // 默认输出路径推导至 processed_assets
  let finalOutput = outputPath;
  if (!finalOutput) {
    const ext = path.extname(resolvedInput);
    const baseName = path.basename(resolvedInput, ext);
    // 优先推导到工程根目录下的 processed_assets/
    const projectRoot = path.resolve(process.cwd());
    const processedDir = path.join(projectRoot, 'processed_assets');
    finalOutput = path.join(processedDir, `${baseName}_transparent.png`);
  } else {
    finalOutput = path.resolve(finalOutput);
  }

  // 确保输出目录存在
  const outputDir = path.dirname(finalOutput);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 配置模型静态资源路径（指向本地 node_modules 目录）
  const serverDir = path.dirname(fileURLToPath(import.meta.url));
  const resourcesDist = path.join(serverDir, 'node_modules', '@imgly', 'background-removal-node', 'dist');
  const publicPath = pathToFileURL(resourcesDist).href.replace(/\/?$/, '/');

  // 执行 AI 背景消除
  const fileUrl = pathToFileURL(resolvedInput).href;
  const blob = await removeBackground(fileUrl, {
    publicPath,
    output: {
      format: 'image/png',
      quality: 1.0,
    },
  });

  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(finalOutput, buffer);

  return {
    success: true,
    inputPath: resolvedInput,
    outputPath: finalOutput,
    sizeBytes: buffer.length,
  };
}

/**
 * MCP Stdio 协议处理
 */
function startMcpServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  const sendResponse = (response) => {
    process.stdout.write(JSON.stringify(response) + '\n');
  };

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let message;
    try {
      message = JSON.parse(trimmed);
    } catch (e) {
      return;
    }

    const { id, method, params } = message;

    // 1. 初始化握手
    if (method === 'initialize') {
      sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'matting-mcp-server',
            version: '1.0.0',
          },
        },
      });
      return;
    }

    if (method === 'notifications/initialized') {
      return;
    }

    // 2. 工具列表暴露
    if (method === 'tools/list') {
      sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          tools: [
            {
              name: 'remove_background',
              description: 'AI 智能抠图：提取图像主体并去除背景，生成带透明 Alpha 通道的高清 PNG 资产底模。',
              inputSchema: {
                type: 'object',
                properties: {
                  inputPath: {
                    type: 'string',
                    description: '原始素材图片路径（支持绝对路径或相对于 raw_assets/ 的路径）。',
                  },
                  outputPath: {
                    type: 'string',
                    description: '可选：输出的透明 PNG 目标路径。若未传，则默认输出至 processed_assets/ 目录。',
                  },
                },
                required: ['inputPath'],
              },
            },
          ],
        },
      });
      return;
    }

    // 3. 执行工具调用
    if (method === 'tools/call') {
      const toolName = params?.name;
      const args = params?.arguments || {};

      if (toolName === 'remove_background') {
        try {
          const result = await processMatting(args.inputPath, args.outputPath);
          sendResponse({
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `抠图完成！透明底模已成功保存至:\n${result.outputPath}\n(文件大小: ${(result.sizeBytes / 1024).toFixed(1)} KB)`,
                },
              ],
            },
          });
        } catch (err) {
          sendResponse({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32603,
              message: `抠图处理失败: ${err.message}`,
            },
          });
        }
        return;
      }

      sendResponse({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Unknown tool: ${toolName}`,
        },
      });
      return;
    }

    if (method === 'ping') {
      sendResponse({ jsonrpc: '2.0', id, result: {} });
      return;
    }
  });
}

// 既可作为命令行 CLI 独立运行，也可作为 MCP Server stdio 进程启动
const args = process.argv.slice(2);
if (args.length > 0 && args[0] !== '--stdio') {
  const [input, output] = args;
  processMatting(input, output)
    .then((res) => {
      console.log(`[CLI] Matting success! Saved to ${res.outputPath} (${res.sizeBytes} bytes)`);
    })
    .catch((err) => {
      console.error(`[CLI] Error:`, err);
      process.exit(1);
    });
} else {
  startMcpServer();
}
