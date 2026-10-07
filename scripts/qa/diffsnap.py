"""Compare two snapshots. Reports any word/link/img/label present in baseline but missing now.
usage: python diffsnap.py base.json now.json
"""
import json, sys
a = json.load(open(sys.argv[1], encoding='utf-8'))
b = json.load(open(sys.argv[2], encoding='utf-8'))
bad = 0
for k in a:
    if k not in b:
        print('MISSING PAGE', k); bad += 1; continue
    for f in ('words', 'links', 'imgs', 'labels'):
        miss = sorted(set(a[k][f]) - set(b[k][f]))
        add = sorted(set(b[k][f]) - set(a[k][f]))
        if miss:
            bad += 1
            print(f'[{k}] {f} REMOVED ({len(miss)}):', miss[:60])
        if add:
            print(f'[{k}] {f} added ({len(add)}):', add[:40])
print('RESULT:', 'CONTENT PRESERVED' if not bad else f'{bad} REGRESSIONS')
sys.exit(1 if bad else 0)
