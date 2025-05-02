
# Google HTML/CSS Style Guide（日本語版）

このスタイルガイドは、Googleが公開しているHTML/CSSのコーディング規約に基づき、読みやすく保守しやすいマークアップを目的としています。

📄 参照元: [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html)

---

## 目次

1. インデント  
2. タグと属性の小文字化  
3. 属性の記述順  
4. セマンティックHTML  
5. 属性値の引用符  
6. 自己終了タグの扱い  
7. コメントの記述  
8. 空白行の使用  
9. ファイル構成と命名  

---

## 1. インデント

- **スペース2個**を使用  
- タブは使用しない  

```html
<!-- OK -->
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

---

## 2. タグと属性の小文字化

- すべてのタグ名・属性名は **小文字** を使用する

```html
<!-- OK -->
<div class="example"></div>

<!-- NG -->
<DIV CLASS="example"></DIV>
```

---

## 3. 属性の記述順

以下の順序で記述すると、可読性が高まります：

1. `id`  
2. `class`  
3. `name`  
4. `data-*`  
5. `src` / `href`  
6. `title` / `alt`  
7. `aria-*`

```html
<a id="main-link" class="btn" href="/" title="トップページ">Home</a>
```

---

## 4. セマンティックHTML

- `div` や `span` の濫用は避ける  
- 以下のような **意味のあるタグ** を積極的に使う：

  - `<header>`  
  - `<nav>`  
  - `<main>`  
  - `<section>`  
  - `<article>`  
  - `<footer>`

```html
<!-- OK -->
<article>
  <h1>記事のタイトル</h1>
  <p>記事の本文...</p>
</article>
```

---

## 5. 属性値の引用符

- 属性値には **常にダブルクォート `"`** を使用

```html
<!-- OK -->
<img src="logo.png" alt="会社ロゴ">

<!-- NG -->
<img src='logo.png' alt='会社ロゴ'>
```

---

## 6. 自己終了タグの扱い

- HTML5では、自己終了タグに `/` を使わない

```html
<!-- OK -->
<br>
<hr>

<!-- NG -->
<br />
<hr />
```

---

## 7. コメントの記述

- コメントは**わかりやすく簡潔に**  
- 必要な箇所には積極的に使用する

```html
<!-- サイドバー -->
<aside class="sidebar">
  ...
</aside>
```

---

## 8. 空白行の使用

- 関連のない要素の間には空白行を入れて、構造を明確にする

```html
<header>
  ...
</header>

<main>
  ...
</main>
```

---

## 9. ファイル構成と命名

- HTMLやCSSファイルは機能単位で分割  
- ファイル名・クラス名は **小文字＋ハイフン区切り（kebab-case）**

```text
ファイル例:
- index.html
- about-us.html
- styles/main.css
```

---

