# RealCode Server

## セットアップ

1. Install Docker
2. Run `$ cd realcode-server`
3. Run `$ docker-compose build`
   - `./app`と`./data`は，コピーせずローカルの内容をマウントします．
   - `./data` には，既にクイズのデータが保存されています．
4. Run `$ docker-compose pull`
   - `Node`，`mongodb`，`mongo-express`のイメージをプルします．
   - 1回実行すれば以後実行する必要はありません．
5. Run `$ docker-compose up`
   - 起動します．`-d`オプションでバックグラウンドで起動します．

## 動作確認

- ブラウザーで `localhost:8080/api` を入力して，`{ message: 'Welcome to our api!'}`と表示されたら，APIサーバーはOKです．
- ブラウザーで `localhost:8081` を入力して，mongo-expressの画面が正常な状態で表示されたら，mongodbもOKです．

## API一覧

APIエンドポイントは，`http://{IP Address}:8080/api` です．

### GET `/`

`{ message: 'Welcome to our api!'}` が返ってきます．

### POST `/`

POSTしたBodyが返ってきます．

### GET `/exercise-number`

データベースに格納されているクイズの件数`N`が`{ number: N }`で返ってきます．

### GET `/exercise?index={n}`

`n`番目のクイズが返ってきます．

### POST `/answer`

回答をPOSTします．HeaderおよびBodyは以下の形式です．

```javascript
const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
const body = JSON.stringify({
    "quizIndex": quizIndex,
    "difficulty": difficulty,
    "validity": validity
});
```

## ローカル/リモート切り替え
* `docker-compose.yml` の `server:` の `ports` のコメントアウト行を入れ替える
