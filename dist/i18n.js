export const messages = {
  zh: {
    editTools:'图片编辑',crop:'裁剪',rotateLeft:'左转 90°',rotateRight:'右转 90°',undoEdit:'撤销编辑',restoreImage:'恢复原图',aspectRatio:'裁剪比例',freeRatio:'自由',imageRatio:'当前图片',cropX:'左边距 (px)',cropY:'上边距 (px)',cropWidth:'宽度 (px)',cropHeight:'高度 (px)',cancelCrop:'取消',applyCrop:'应用裁剪',freePosition:'自由拖动',positionHint:'直接拖动画布上的水印，可放置到任意位置。',horizontalPosition:'水平位置',verticalPosition:'垂直位置',dragHelp:'拖动水印调整位置。聚焦画布后，方向键微调 1 px，Shift + 方向键微调 10 px。Ctrl/⌘ + V 粘贴图片。',cropHelp:'拖动选区或四角调整裁剪；在选区外拖动可重选。方向键移动，Enter 应用，Esc 取消。',finishCrop:'请先应用或取消裁剪。',
    "traceTitle":"隐形 Trace ID",
    "traceIntro":"将可读取的唯一编号嵌入导出图片的像素。",
    "traceDefault":"默认开启 · 图片仅在本地处理",
    "traceReady":"下载时嵌入编号，不影响可见水印设置。",
    "traceOff":"已关闭，本次导出不会添加新的 Trace ID。",
    "traceTooSmall":"需至少 256 × 256 像素；也可关闭 Trace ID 后导出。",
    "traceCapacity":"不透明区域不足，无法可靠嵌入编号。可关闭 Trace ID 后导出。",
    "traceEmbedFailed":"未能验证嵌入的编号，未生成下载。请换图，或关闭 Trace ID 后导出。",
    "traceTimeout":"处理超时，请尝试较小的图片。",
    "traceProcessingError":"隐形水印处理失败，请重试或关闭 Trace ID。",
    "traceCheckTooLarge":"检测文件不能超过 200 MB。",
    "traceIdLabel":"此图片的编号",
    "traceCopy":"复制编号",
    "traceCopied":"编号已复制。",
    "traceSaveRecord":"保存上次导出的记录",
    "traceSaved":"记录已保存在此浏览器，建议另存一份。",
    "traceStorageUnavailable":"浏览器无法保存记录，请下载记录并妥善保存。",
    "traceAbout":"追踪能力与限制",
    "traceLimits":"用于识别副本，不会自动搜索网络或监控浏览。压缩、裁剪和编辑可能影响检测，缩放或旋转可能抹去编号。编号可以被复制或伪造，不是所有权或真实性证明。",
    "traceIndependent":"独立的实验性格式，与 Google SynthID 不兼容。像素会发生细微变化；至少需要 256 × 256 像素，并有足够的不透明区域。",
    "traceCheckTitle":"检测图片编号",
    "traceCheckIntro":"选择收到或找到的图片，检查是否含有本工具的 Trace ID。图片仍只在本地处理。",
    "traceCheckButton":"选择图片检测",
    "traceCheckHint":"找到编号后，可与保存的导出记录对照。",
    "traceChecking":"正在检查图片中的 Trace ID…",
    "traceFound":"检测到校验通过的 Trace ID",
    "traceNotFound":"未检测到校验通过的 Trace ID。图片可能未嵌入、已被修改，或使用了其他水印格式。",
    "traceLocalMatch":"此编号与本浏览器保存的一条导出记录相符。",
    "traceUnknownRecord":"编号校验通过，但此浏览器没有对应记录。请与保存的记录核对。",
    "exporting":"正在生成导出图片…",
    title:'印记 · 电子水印器', description:'为图片添加精致的文字水印，自选四角位置，实时预览并原尺寸下载。图片仅在你的浏览器中处理。',
    home:'印记首页', brand:'印记', privacy:'本地处理，图片不上传', headline:'让每张图片，拥有你的印记', punctuation:'。', intro:'一枚恰到好处的水印，留住你的表达。',
    stepUpload:'上传图片', stepCustomize:'定制水印', stepSave:'保存作品', previewRegion:'图片预览', previewTitle:'画布预览', waiting:'等待添加图片', replace:'更换图片',
    emptyTitle:'从一张图片开始', emptyHint:'拖入、选择图片，或按 Ctrl/⌘ + V 粘贴', upload:'选择图片', formats:'支持 JPG、PNG、WebP · 最大 30 MB', canvasLabel:'添加水印后的图片预览', drop:'松开鼠标，添加图片', previewEmpty:'上传后即时预览水印效果', previewLoaded:'实时预览 · 按当前画布像素导出', originalSize:'按画布尺寸导出',
    settings:'水印设置', customize:'定制水印', reset:'重置', text:'水印内容', textHint:'留空使用默认水印，输入即可替换', position:'水印位置', tl:'左上', tr:'右上', bl:'左下', br:'右下', style:'水印风格', capsule:'质感胶囊', simple:'简约文字', serif:'优雅衬线', handwriting:'原创手写', signatureIntqwq:'intqwq@X 签名', signatureNote:'使用提供的签名图片 · 修改文字可返回普通手写', signatureLoading:'正在加载签名图片…', signatureError:'签名图片加载失败，请重试。', retrySignature:'重新加载签名', handwritingNote:'Lumen Hand · 原创 ASCII 字体', fontLoading:'正在加载手写字体…', fontError:'手写字体加载失败，请重试。', retryFont:'重新加载字体', margin:'边缘间距', marginHint:'调至 0% 可贴近边角', size:'水印大小', opacity:'不透明度', color:'文字颜色', light:'白色', dark:'深色', lightLabel:'白色文字', darkLabel:'深色文字', download:'下载水印图片', exportHint:'PNG 格式 · 使用编辑后尺寸', footerLeft:'轻一点的修饰，刚刚好的存在。', footerRight:'你的图片，始终只属于你。',
    invalidType:'请选择 JPG、PNG 或 WebP 图片。', tooLarge:'图片超过 30 MB，请选择较小的文件。', tooManyPixels:'图片尺寸过大，请使用不超过 4000 万像素、单边不超过 16384 像素的图片。', loaded:'图片已添加，调整设置即可预览。', readError:'无法读取这张图片，请检查文件是否完整，或换一张图片。', downloaded:'水印图片已生成，下载已开始。', exportError:'导出失败，图片可能超出浏览器的处理能力，请尝试较小的图片。', resetDone:'已恢复默认水印设置。', configureTool:'设置图片水印'
  },
  en: {
    editTools:'Image editing',crop:'Crop',rotateLeft:'Rotate left 90°',rotateRight:'Rotate right 90°',undoEdit:'Undo edit',restoreImage:'Restore original',aspectRatio:'Aspect ratio',freeRatio:'Free',imageRatio:'Current image',cropX:'Left (px)',cropY:'Top (px)',cropWidth:'Width (px)',cropHeight:'Height (px)',cancelCrop:'Cancel',applyCrop:'Apply crop',freePosition:'Free placement',positionHint:'Drag the watermark on the canvas to place it anywhere.',horizontalPosition:'Horizontal position',verticalPosition:'Vertical position',dragHelp:'Drag the watermark to move it. Focus the canvas and use arrow keys for 1 px, Shift + arrows for 10 px. Ctrl/⌘ + V pastes an image.',cropHelp:'Drag the selection or its corners; drag outside to start a new crop. Arrow keys move, Enter applies, Esc cancels.',finishCrop:'Apply or cancel the crop first.',
    "traceTitle":"Invisible Trace ID",
    "traceIntro":"Embed a recoverable, unique ID in the exported image pixels.",
    "traceDefault":"On by default · Processed locally",
    "traceReady":"Added on download, alongside your visible watermark.",
    "traceOff":"Off. No new Trace ID will be added to this export.",
    "traceTooSmall":"Use an image at least 256 × 256, or turn off Trace ID to export.",
    "traceCapacity":"Not enough opaque image area to embed the ID reliably. Turn off Trace ID to export.",
    "traceEmbedFailed":"The embedded ID could not be verified. No download was created. Try another image, or turn off Trace ID.",
    "traceTimeout":"Processing timed out. Try a smaller image.",
    "traceProcessingError":"Invisible watermark processing failed. Retry, or turn off Trace ID.",
    "traceCheckTooLarge":"The image to check must be no larger than 200 MB.",
    "traceIdLabel":"ID for this image",
    "traceCopy":"Copy ID",
    "traceCopied":"ID copied.",
    "traceSaveRecord":"Save last export record",
    "traceSaved":"Record saved in this browser. Download a copy to keep it.",
    "traceStorageUnavailable":"Browser storage is unavailable. Download and keep the export record.",
    "traceAbout":"Tracking and limitations",
    "traceLimits":"Identifies copies; it does not search the web or monitor views. Compression, cropping and edits can affect detection; resizing or rotation may erase the ID. IDs can be copied or forged and are not proof of ownership or authenticity.",
    "traceIndependent":"An independent, experimental format, incompatible with Google SynthID. Pixels change slightly. Requires at least 256 × 256 pixels and enough opaque image area.",
    "traceCheckTitle":"Check an image",
    "traceCheckIntro":"Check a received or found image for this tool’s Trace ID. Images still stay in your browser.",
    "traceCheckButton":"Choose image to check",
    "traceCheckHint":"Recover an ID here and compare it with your saved export record.",
    "traceChecking":"Checking the image for a Trace ID…",
    "traceFound":"Verified Trace ID found",
    "traceNotFound":"No verified Trace ID found. The image may be unmarked, altered, or use a different watermark format.",
    "traceLocalMatch":"This ID matches an export record saved in this browser.",
    "traceUnknownRecord":"The ID passed its checksum, but this browser has no matching record. Compare it with your saved records.",
    "exporting":"Preparing your image…",
    title:'Watermark Studio', description:'Add beautiful text watermarks to your images. Paste, crop, rotate and place your watermark anywhere. Images stay in your browser.',
    home:'Watermark Studio home', brand:'Watermark', privacy:'Processed locally. No uploads.', headline:'Make every image your own', punctuation:'.', intro:'A subtle watermark. A signature that stays with your work.',
    stepUpload:'Upload image', stepCustomize:'Customize', stepSave:'Save image', previewRegion:'Image preview', previewTitle:'Canvas preview', waiting:'No image selected', replace:'Change image',
    emptyTitle:'Start with an image', emptyHint:'Drop, choose, or paste an image with Ctrl/⌘ + V', upload:'Choose image', formats:'JPG, PNG or WebP · Up to 30 MB', canvasLabel:'Preview of your watermarked image', drop:'Drop to add your image', previewEmpty:'Upload an image to preview your watermark', previewLoaded:'Live preview · Export at canvas pixel dimensions', originalSize:'Canvas resolution',
    settings:'Watermark settings', customize:'Customize watermark', reset:'Reset', text:'Watermark text', textHint:'Leave blank for the default, or enter your own.', position:'Position', tl:'Top left', tr:'Top right', bl:'Bottom left', br:'Bottom right', style:'Style', capsule:'Soft capsule', simple:'Minimal', serif:'Elegant serif', handwriting:'Handwritten', signatureIntqwq:'intqwq@X signature', signatureNote:'Your supplied signature · Editing the text returns to handwriting', signatureLoading:'Loading signature artwork…', signatureError:'The signature could not load. Please retry.', retrySignature:'Reload signature', handwritingNote:'Lumen Hand · Original ASCII font', fontLoading:'Loading handwritten font…', fontError:'The handwritten font could not load. Please retry.', retryFont:'Reload font', margin:'Edge spacing', marginHint:'Set to 0% to move into the corner', size:'Size', opacity:'Opacity', color:'Text color', light:'White', dark:'Dark', lightLabel:'White text', darkLabel:'Dark text', download:'Download image', exportHint:'PNG format · Edited image dimensions', footerLeft:'A subtle touch. A lasting signature.', footerRight:'Your images stay yours.',
    invalidType:'Choose a JPG, PNG or WebP image.', tooLarge:'This image exceeds 30 MB. Choose a smaller file.', tooManyPixels:'This image is too large. Use up to 40 megapixels, with neither side exceeding 16,384 pixels.', loaded:'Image added. Adjust the settings to preview your watermark.', readError:'This image could not be read. Check the file or try another image.', downloaded:'Your watermarked image is ready. Download started.', exportError:'Export failed. The image may exceed your browser’s limits. Try a smaller image.', resetDone:'Default watermark settings restored.', configureTool:'Configure watermark'
  }
};

export function resolveLanguage(languages = []) {
  for (const tag of languages) {
    if (typeof tag !== 'string') continue;
    const base=tag.trim().toLowerCase().split(/[-_]/)[0];
    if (base==='zh' || base==='en') return base;
  }
  return 'en';
}

export function browserLanguage(browser = globalThis.navigator) {
  return resolveLanguage(browser?.languages?.length ? browser.languages : [browser?.language]);
}

export function translate(key, language = browserLanguage()) {
  return messages[language]?.[key] ?? messages.en[key] ?? key;
}

export function localizePage(root = document, language = browserLanguage()) {
  root.documentElement.lang = language==='zh' ? 'zh-CN' : 'en';
  root.title = translate('title',language);
  root.querySelector('meta[name="description"]')?.setAttribute('content',translate('description',language));
  root.querySelectorAll('[data-i18n]').forEach(node => {node.textContent = translate(node.getAttribute('data-i18n'),language);});
  root.querySelectorAll('[data-i18n-aria]').forEach(node => {node.setAttribute('aria-label',translate(node.getAttribute('data-i18n-aria'),language));});
  return language;
}
