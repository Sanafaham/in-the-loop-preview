from pathlib import Path
from zipfile import ZipFile
import hashlib, json
ROOT=Path(__file__).resolve().parent.parent
SHA='c5c4249f41027501fee7755f8b9926089f59e323524bafe5d3b97c9ce87e6837'
a=ROOT/'qa/approved/IN_THE_LOOP_FINAL_APPROVED_EDITION(3).zip'
assert hashlib.sha256(a.read_bytes()).hexdigest()==SHA, 'Approved archive checksum changed'
with ZipFile(a) as z:
 for n in z.namelist():
  assert not Path(n).is_absolute() and '..' not in Path(n).parts
 z.extractall(ROOT/'qa/.approved-site')
print('Verified immutable approved archive and prepared reference site')
