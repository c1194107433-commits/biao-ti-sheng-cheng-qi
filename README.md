# 小红书标题生成器

一个零依赖的小网页，通过服务端调用 Dify 工作流，为商品生成小红书标题。安全结果显示绿色标签及复制按钮；有风险、待核实或其他人工复核结果显示橙色标签、草稿和判断说明。

## 本机运行

使用 Node.js 22 或更新版本。在项目根目录自行创建 `local.env`，填写 `DIFY_API_BASE` 和 `DIFY_API_KEY` 两个环境变量。地址需要包含 `/v1`，本机 Dify 通常为 `http://localhost/v1`。配置文件已加入 Git 和 Vercel 忽略列表，不应提交或上传。

运行 `node dev-server.js`，打开 http://localhost:3000。

## 部署到 Vercel

导入此 GitHub 仓库，选择 Other 框架，无需安装依赖或执行构建，使用根目录文件。配置环境变量 `DIFY_API_BASE`、`DIFY_API_KEY` 后部署。

Vercel 必须能够访问 Dify 地址；云端部署中的 localhost 指向云端运行环境，无法访问你的电脑。请使用可从 Vercel 访问的 Dify 服务地址。

## 文件

- `index.html`：响应式表单和结果展示，只请求 `/api/generate`。
- `api/generate.js`：输入校验、使用 Node 内置 fetch 调用 Dify、输出筛选和错误处理。
- `dev-server.js`：本机服务，启动时加载本地配置，只对外提供页面和生成接口。
- `vercel.json`：访问路由与 60 秒函数运行上限。
- `.gitignore`、`.vercelignore`：排除本地配置和预览截图。

只调用 `POST /workflows/run`，使用 `blocking` 模式，用户标识为 `xiaozhou-web`。后端在约 59 秒中断等待，给 Vercel 60 秒硬限制预留响应时间；前端 60 秒兜底。错误统一返回中文提示，密钥不进入前端代码。
