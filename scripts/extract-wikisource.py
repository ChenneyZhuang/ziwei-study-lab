from bs4 import BeautifulSoup, Tag
from pathlib import Path
import json
import argparse

parser=argparse.ArgumentParser(description='Extract searchable passages from a saved Wikisource HTML page.')
parser.add_argument('html',type=Path)
source=parser.parse_args().html
root=BeautifulSoup(source.read_text(), 'html.parser').select_one('.mw-parser-output')
if not root: raise SystemExit('source article body missing')
items=[]
volume='紫微斗数全书'
section=''
anchor=''
for node in root.children:
    if not isinstance(node,Tag): continue
    heading=node.find(['h2','h3','h4'],recursive=False) if 'mw-heading' in (node.get('class') or []) else None
    if heading:
        title=heading.get_text(' ',strip=True)
        if heading.name=='h2': volume=title;section=''
        else: section=title
        anchor=heading.get('id','')
        continue
    if node.name!='p' and not (node.name=='div' and 'poem' in (node.get('class') or [])): continue
    text=node.get_text('\n',strip=True)
    lines=[x.strip() for x in text.splitlines() if len(x.strip())>2]
    for line in lines:
        items.append({'volume':volume,'section':section or volume,'anchor':anchor,'text':line})
if len(items)<100:raise SystemExit(f'unexpectedly few passages: {len(items)}')
Path('public/data/quanshu-wikisource.json').write_text(json.dumps(items,ensure_ascii=False,separators=(',',':')))
print(f'Extracted {len(items)} passages from Wikisource')
