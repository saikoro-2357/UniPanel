# UniPanel

## ローカル起動

```bash
npm install
npm start
```

`http://127.0.0.1:4173` を開きます。右上の「SNS共有」から、現在の盤面・背景色を含む共有URLを作成できます。

共有URLの形式:

```text
/share?code=3042&bg=000000
```

SNSクローラーには `/og.png` で生成した1200×630のPNGが返り、通常の閲覧者には同じ盤面を復元したUniPanelが表示されます。

## デプロイ

`Dockerfile`対応のホスティングサービスへ、そのままデプロイできます。DockerイメージにはOGPで日本語を描画するためのNoto CJKフォントが含まれます。公開後はHTTPSのURLをSNSへ貼ってください。
