from pathlib import Path
from html.parser import HTMLParser
import json,re,hashlib,subprocess
subprocess.run(['python3','qa/prepare-reference.py'],check=True)
s=Path('qa/.approved-site/index.html').read_text()
class Contract(HTMLParser):
 def __init__(self):super().__init__();self.invites=[];self.current=None;self.tag=None;self.attrs={};self.skip=0;self.text=[];self.links=[];self.media=[];self.images=[]
 def handle_starttag(self,t,a):
  a=dict(a)
  if t in ('script','style'):self.skip+=1
  if t=='div' and 'try-chatgpt' in a.get('class',''):self.current={};self.invites.append(self.current)
  if self.current is not None:
   if t=='h3':self.tag='title';self.current[self.tag]=''
   if t=='p' and 'try-prompt' in a.get('class',''):self.tag='prompt';self.current[self.tag]=''
   if t=='button' and 'data-copy-prompt' in a:self.current['copyPrompt']=a['data-copy-prompt']
   if t=='a' and 'try-open' in a.get('class',''):self.current['href']=a['href']
  if t=='a':self.links.append(a.get('href',''))
  if t in ('video','source'):self.media.append({'tag':t,**a})
  if t=='img':self.images.append(a)
 def handle_data(self,d):
  if not self.skip:self.text.append(d)
  if self.current is not None and self.tag:self.current[self.tag]+=d
 def handle_endtag(self,t):
  if t in ('script','style'):self.skip-=1
  if t in ('h3','p'):self.tag=None
  if t=='div' and self.current is not None and 'href' in self.current:self.current=None
p=Contract();p.feed(s)
# Literal data arrays are parsed by Node below; no candidate data is used as an expected value.
d={'invitations':p.invites,'links':p.links,'images':p.images,'media':p.media,'editorialTextSha256':hashlib.sha256(''.join(p.text).encode()).hexdigest()}
Path('qa/approved/content.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
