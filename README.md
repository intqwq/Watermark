# 印记 · 电子水印器

本地处理图片的静态网页工具：选择 JPG、PNG、WebP 图片，设置四角文字水印，并按原始像素尺寸导出 PNG。

- 默认文字：`Made by intqwq@X`，以浅色占位文字显示在输入框中。留空（或仅空格）时，预览与导出自动使用默认文字；输入其他内容会完全替换默认水印。重置后恢复占位提示与默认效果。
- 默认右下角、质感胶囊、4% 大小、90% 不透明度。
- 支持质感胶囊、简约文字、优雅衬线，以及白色和深色文字。
- 图片通过浏览器解码与 Canvas 处理，不发送至服务器。
- 中英文界面按浏览器首选语言列表自动匹配（所有 `zh` 变体使用简体中文，`en` 变体使用英文；无匹配时使用英文）。浏览器语言变化后会更新界面，不重置图片或水印。
- 图标提供 SVG、16/32/48 像素 ICO、32 像素 PNG 和 180 像素苹果触屏图标；链接带版本号以更新图标缓存。
- 支持最大 30 MB、4000 万像素、单边 16384 像素图片；设备内存与浏览器限制仍可能影响大图导出。
- 预览与导出使用同一原图坐标系。过长水印自动缩小以留在画面内。
- 输出为静态 PNG；保留像素尺寸及透明区域，不复制原文件 EXIF 元数据，也不承诺原始色彩配置或文件大小。

需要 Node.js 20+（语法检查与测试）及 Python 3（本地服务）。运行 `npm start`，打开 http://127.0.0.1:5173 。无需安装依赖。`npm run check` 检查 JavaScript 语法，`npm test` 验证语言匹配与默认水印行为。

浏览器若支持 `document.modelContext`，可调用 `configure_watermark` 更新界面设置。当前环境未提供支持此接口的验证上下文，因此未进行原生 WebMCP 合约验证。

## 树莓派 / Bridge

生产地址：https://watermark.intqwq.com

流量路径：Cloudflare Tunnel → 已安装的 Bridge `127.0.0.1:18080` → 水印器 `127.0.0.1:18104`。应用仅监听本机，通过 `bridge register` 接入，不修改 Bridge 源码或其他应用配置。

在已安装 Bridge 的 Debian/Ubuntu 树莓派上，将本项目复制至临时目录，然后运行 `sudo bash deploy/install.sh`。安装器保留 `/opt/watermark/releases/` 下的历史版本，并使用 `/opt/watermark/current` 指向当前版本。systemd 管理自动启动和故障重启。

更新前确认端口、域名仍归本应用使用；如果修改端口或域名，需要同时修改服务文件、注册清单和安装器。安装器会调用 Bridge 同步该域名的 DNS。

验证：

```sh
systemctl is-active watermark
curl -fsS http://127.0.0.1:18104/healthz
curl -fsS -H 'Host: watermark.intqwq.com' http://127.0.0.1:18080/healthz
curl -fsS https://watermark.intqwq.com/healthz
```

静态服务只允许列出的前端文件和 `/healthz`，不提供目录浏览、源码配置、图片上传接口。
