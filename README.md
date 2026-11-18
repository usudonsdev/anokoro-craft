# あのころクラフト 公式サイト

https://anokoro.kotobabench.com/ （GitHub Pages）

旧コンソール版マイクラの「あの頃」をテーマにした、非公式ファンサーバーのサイトです。
運営用の非公開リポジトリは `usudonsdev/anokoro-craft-server`。

## 手元で見る

```bash
python3 -m http.server 8765
```

http://localhost:8765 を開く。ビルドは不要（HTML・CSS・JS のみ）。

## 更新する

- 文言・サーバーアドレス・リンクは `config.js` だけ書き換えればよい
- サーバーが立ったら `config.js` の `server.ready` を `true` にする
- `main` に push すると1〜2分で公開される

## 素材について

Mojang の素材（ロゴ・テクスチャ・フォント・音楽）は使っていない。背景・ボタン・BGM・効果音はすべて自作か、その場で生成している。
