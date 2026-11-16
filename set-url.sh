#!/bin/sh
# 使い方: sh set-url.sh https://anokoro.example.com/
# index.html・robots.txt・sitemap.xml の仮URLを、まとめて本物のURLに置き換えます。
set -e
NEW="$1"
case "$NEW" in https://*/) ;; *) echo "末尾に / を付けた https:// のURLを指定してください"; exit 1;; esac
cd "$(dirname "$0")"
OLD=$(grep -o '<loc>[^<]*</loc>' sitemap.xml | head -1 | sed 's#</*loc>##g')
for f in index.html robots.txt sitemap.xml; do
  sed -i.bak "s#${OLD}#${NEW}#g" "$f" && rm "$f.bak"
done
echo "置き換えました: ${OLD} → ${NEW}"
