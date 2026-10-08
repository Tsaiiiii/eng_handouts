"""把 repo 裡所有講義的作答紀錄網址改成同一個。

用法（在 repo 資料夾執行）：
    python3 作答紀錄/set_log_url.py https://script.google.com/macros/s/xxxx/exec

網址寫在講義最前面的 window.__CFG 設定裡，不在加密內容裡，所以不需要講義密碼。
"""
import glob, json, os, re, sys

if len(sys.argv) != 2 or not re.match(r'^https://script\.google\.com/.+/exec$', sys.argv[1]):
    sys.exit('請給一個 https://script.google.com/…/exec 的網址')
url = json.dumps(sys.argv[1])
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = glob.glob(os.path.join(root, '*.html')) + glob.glob(os.path.join(root, 'vocab', '*.html')) + glob.glob(os.path.join(root, 'reading', '*.html'))
for f in files:
    s = open(f, encoding='utf-8').read()
    t = re.sub(r'(window\.__CFG=\{"log":)"(?:[^"\\]|\\.)*"', lambda m: m.group(1) + url, s, count=1)
    if t != s:
        open(f, 'w', encoding='utf-8').write(t)
        print('已更新', os.path.relpath(f, root))
