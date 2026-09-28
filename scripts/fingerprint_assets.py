"""Version dependent asset URLs, then their parents, before publishing dist/."""
import hashlib
import re
from pathlib import Path

root=Path(__file__).resolve().parents[1]/'dist'

def version(path):
    content=(root/path).read_bytes()
    if Path(path).suffix in {'.js','.css','.html'}:
        content=content.replace(b'\r\n',b'\n')
    return hashlib.sha256(content).hexdigest()[:12]

def update(file,dependencies):
    target=root/file
    content=target.read_text(encoding='utf-8')
    for dependency in dependencies:
        relative='./'+dependency
        # Every URL is a quoted literal in HTML, CSS or JavaScript.
        pattern=re.escape(relative)+r'(?:\?v=[^\s\"\'<>)]*)?'
        content=re.sub(pattern,relative+'?v='+version(dependency),content)
    target.write_text(content,encoding='utf-8',newline='\n')

update('style.css',['fonts/lumen-hand.woff2'])
update('app.js',['renderer.js','i18n.js','signature.js','signatures/intqwq-x.png'])
update('index.html',['app.js','style.css','fonts/lumen-hand.woff2'])
print('Versioned HTML, modules, stylesheet, font and signature artwork URLs.')
