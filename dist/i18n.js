export const messages = {
  zh: {
    title:'印记 · 电子水印器', description:'为图片添加精致的文字水印，自选四角位置，实时预览并原尺寸下载。图片仅在你的浏览器中处理。',
    home:'印记首页', brand:'印记', privacy:'本地处理，图片不上传', headline:'让每张图片，拥有你的印记', punctuation:'。', intro:'一枚恰到好处的水印，留住你的表达。',
    stepUpload:'上传图片', stepCustomize:'定制水印', stepSave:'保存作品', previewRegion:'图片预览', previewTitle:'画布预览', waiting:'等待添加图片', replace:'更换图片',
    emptyTitle:'从一张图片开始', emptyHint:'将图片拖到这里，或从设备中选择', upload:'选择图片', formats:'支持 JPG、PNG、WebP · 最大 30 MB', canvasLabel:'添加水印后的图片预览', drop:'松开鼠标，添加图片', previewEmpty:'上传后即时预览水印效果', previewLoaded:'实时预览 · 下载保留原尺寸', originalSize:'原尺寸导出',
    settings:'水印设置', customize:'定制水印', reset:'重置', text:'水印内容', textHint:'留空使用默认水印，输入即可替换', position:'水印位置', tl:'左上', tr:'右上', bl:'左下', br:'右下', style:'水印风格', capsule:'质感胶囊', simple:'简约文字', serif:'优雅衬线', handwriting:'原创手写', signatureIntqwq:'intqwq 连笔签名', signatureShuyuanlv:'数原律 连笔签名', signatureNote:'专属连笔签名 · 修改文字可返回普通手写', handwritingNote:'Lumen Hand · 原创 ASCII 字体', fontLoading:'正在加载手写字体…', fontError:'手写字体加载失败，请重试。', retryFont:'重新加载字体', margin:'边缘间距', marginHint:'调至 0% 可贴近边角', size:'水印大小', opacity:'不透明度', color:'文字颜色', light:'白色', dark:'深色', lightLabel:'白色文字', darkLabel:'深色文字', download:'下载水印图片', exportHint:'PNG 格式 · 保留原图尺寸', footerLeft:'轻一点的修饰，刚刚好的存在。', footerRight:'你的图片，始终只属于你。',
    invalidType:'请选择 JPG、PNG 或 WebP 图片。', tooLarge:'图片超过 30 MB，请选择较小的文件。', tooManyPixels:'图片尺寸过大，请使用不超过 4000 万像素、单边不超过 16384 像素的图片。', loaded:'图片已添加，调整设置即可预览。', readError:'无法读取这张图片，请检查文件是否完整，或换一张图片。', downloaded:'水印图片已生成，下载已开始。', exportError:'导出失败，图片可能超出浏览器的处理能力，请尝试较小的图片。', resetDone:'已恢复默认水印设置。', configureTool:'设置图片水印'
  },
  en: {
    title:'Watermark Studio', description:'Add beautiful text watermarks to your images. Choose a corner, preview your watermark and download at the original resolution. Images stay in your browser.',
    home:'Watermark Studio home', brand:'Watermark', privacy:'Processed locally. No uploads.', headline:'Make every image your own', punctuation:'.', intro:'A subtle watermark. A signature that stays with your work.',
    stepUpload:'Upload image', stepCustomize:'Customize', stepSave:'Save image', previewRegion:'Image preview', previewTitle:'Canvas preview', waiting:'No image selected', replace:'Change image',
    emptyTitle:'Start with an image', emptyHint:'Drag an image here, or choose one from your device', upload:'Choose image', formats:'JPG, PNG or WebP · Up to 30 MB', canvasLabel:'Preview of your watermarked image', drop:'Drop to add your image', previewEmpty:'Upload an image to preview your watermark', previewLoaded:'Live preview · Original resolution download', originalSize:'Original resolution',
    settings:'Watermark settings', customize:'Customize watermark', reset:'Reset', text:'Watermark text', textHint:'Leave blank for the default, or enter your own.', position:'Position', tl:'Top left', tr:'Top right', bl:'Bottom left', br:'Bottom right', style:'Style', capsule:'Soft capsule', simple:'Minimal', serif:'Elegant serif', handwriting:'Handwritten', signatureIntqwq:'intqwq signature', signatureShuyuanlv:'数原律 signature', signatureNote:'Custom cursive signature · Editing the text returns to handwriting', handwritingNote:'Lumen Hand · Original ASCII font', fontLoading:'Loading handwritten font…', fontError:'The handwritten font could not load. Please retry.', retryFont:'Reload font', margin:'Edge spacing', marginHint:'Set to 0% to move into the corner', size:'Size', opacity:'Opacity', color:'Text color', light:'White', dark:'Dark', lightLabel:'White text', darkLabel:'Dark text', download:'Download image', exportHint:'PNG format · Original resolution', footerLeft:'A subtle touch. A lasting signature.', footerRight:'Your images stay yours.',
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
