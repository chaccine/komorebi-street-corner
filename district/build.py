"""Assemble the standalone district with standard Python. No runtime dependencies."""
import base64
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'src'
MODULES = ('weather', 'engine', 'ground', 'buildings', 'courtyard', 'riverside', 'afternoon', 'sky', 'audio', 'gestures', 'district')


def build():
    template = (SOURCE / 'page.html').read_text(encoding='utf-8')
    scripts = '\n\n'.join((SOURCE / (name + '.js')).read_text(encoding='utf-8') for name in MODULES)
    # The cover is shown only while the 3D context starts or when WebGL is unavailable.
    poster = ROOT / 'cover.webp'
    portrait = ROOT / 'cover-portrait.webp'
    picture = ''
    if poster.is_file():
        data = base64.b64encode(poster.read_bytes()).decode('ascii')
        source = ''
        if portrait.is_file():
            small = base64.b64encode(portrait.read_bytes()).decode('ascii')
            source = f'<source media="(max-aspect-ratio: 21/25)" srcset="data:image/webp;base64,{small}">'
        picture = (f'<picture class="poster" aria-hidden="true">{source}'
                   f'<img alt="" src="data:image/webp;base64,{data}"></picture>')
    page = template.replace('<!-- POSTER -->', picture).replace('/* DISTRICT MODULES */', scripts)
    output = ROOT / 'index.html'
    temp = output.with_suffix('.part')
    temp.write_bytes(page.encode('utf-8'))
    temp.replace(output)
    print(f'{output.name}  {output.stat().st_size:,} bytes')


if __name__ == '__main__':
    build()
