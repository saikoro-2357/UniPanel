# UniPanel

4×4のビットパネルをクリックしてUnicode文字を作り、文字コードの確認・コピー・共有やターゲット問題を楽しめるブラウザツールです。

## ローカル起動

```bash
npm install
npm start
```

`http://127.0.0.1:4173` を開きます。右上の「Xで投稿」から、現在の `U+****`・文字・盤面を復元するURLを入れたXの投稿画面を開けます。

共有URLの形式:

```text
/share?code=3042&bg=000000
```

SNSクローラーには `/og.png` で生成した1200×630のPNGが返り、通常の閲覧者には同じ盤面を復元したUniPanelが表示されます。

画面表示には同梱のNoto Sans JPを使用します。フォントはSIL Open Font License 1.1で、ライセンス本文は `fonts/OFL.txt` にあります。

## デプロイ

`Dockerfile`対応のホスティングサービスへ、そのままデプロイできます。DockerイメージにはOGPで日本語を描画するためのNoto CJKフォントが含まれます。公開後はHTTPSのURLをSNSへ貼ってください。
