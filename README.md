# Romly Command Palette de Outline

## 日本語(Japanese)

[English version below](#english英語)

ドキュメントのアウトラインをコマンドパレットに表示する拡張機能です。サイドバーを表示することなく、素早くシンボルにジャンプできます。表示する必要のないシンボルはフィルタを設定して除外することもできます。

### 機能

- コマンドパレットにドキュメントのアウトラインを表示する。
- 行番号の表示／非表示を設定可能。
- シンボルの種類に対するグロブパターンのフィルタで表示しないシンボルを設定可能。

### 必要条件

* VSCode バージョン1.107.0以降
* VSCodeのアウトライン表示が正常に動作している必要があります。

### 拡張機能の設定

* `Romly-CommandPalette-de-Outline.showLineNumber`: 行番号の表示／非表示。
* `Romly-CommandPalette-de-Outline.indentString`: インデントの代わりに使用する文字列。タブは使えないので、半角スペースを見やすいインデント幅になるよう繰り返してください。
* `Romly-CommandPalette-de-Outline.markdown.stripHeaderMarkers`: マークダウンのアウトラインを表示すると見出しの#記号がごちゃごちゃして見づらいので、`true`にすることでそれらを非表示にできます。
* `Romly-CommandPalette-de-Outline.symbolFilters`: TypeScriptのアウトラインなどは関数の引数もシンボルとして表示されてしまい見づらいので、フィルタを指定して非表示にすることができます。下記のように指定します。 `filters` にはシンボルの種類をグロブパターンで指定します。シンボルの種類がわからない時は `Romly-CommandPalette-de-Outline.debug.showSymbolKindName` を `true` にしてアイコンの代わりにシンボルの種類の名前を表示し、確認してください。

	```
	`Romly-CommandPalette-de-Outline.symbolFilters`: [
		{
			"documentPattern": "**/*.ts",
			"filters": [
				"**/Function/Variable",
				"**/Constructor/Variable",
				"**/Method/Variable",
				"**/Interface/Property",
				"**/Class/Property"
			]
		},
		{
			"documentPattern": "**/*.py",
			"filters": [
				"**/Function/Variable",
				"**/Function/Constant"
			]
		}
	]
	```

### 既知の問題

-

### リリースノート

変更ログ [CHANGELOG.md](CHANGELOG.md) をご覧下さい。










-----










## English(英語)

[日本語版(Japanese version above)はこちら](#日本語japanese)

An VSCode extension that displays document outlines in the command palette. Allows you to jump to symbols quickly without displaying the sidebar. You can also configure filters to exclude symbols that don't need to be displayed.

### Features

* Display document outline in the command palette.
* Configurable display/hide line numbers.
* Filter symbols by kind using glob patterns to hide unwanted symbols.

### Requirements

* VSCode version 1.107.0 or later.
* VSCode's outline view must be functioning properly.

### Extension Settings

* `Romly-CommandPalette-de-Outline.showLineNumber`: Show/hide line numbers.
* `Romly-CommandPalette-de-Outline.indentString`: String to use instead of indentation. Since tabs cannot be used, use multiple spaces to achieve a readable indent width.
* `Romly-CommandPalette-de-Outline.markdown.stripHeaderMarkers`: When displaying Markdown outlines, the # symbols for headers can be visually distracting and hard to read, so setting this to `true` will hide them.
* `Romly-CommandPalette-de-Outline.symbolFilters`: TypeScript outlines and similar files display function arguments as symbols, making them hard to read, so you can specify filters to hide them. Specify as shown below. In `filters`, specify symbol kinds using glob patterns. If you don't know the symbol kind, set `Romly-CommandPalette-de-Outline.debug.showSymbolKindName` to `true` to display symbol kind names instead of icons, so you can confirm them.

	```
	`Romly-CommandPalette-de-Outline.symbolFilters`: [
		{
			"documentPattern": "**/*.ts",
			"filters": [
				"**/Function/Variable",
				"**/Constructor/Variable",
				"**/Method/Variable",
				"**/Interface/Property",
				"**/Class/Property"
			]
		},
		{
			"documentPattern": "**/*.py",
			"filters": [
				"**/Function/Variable",
				"**/Function/Constant"
			]
		}
	]
	```

### Known Issues

-

### Release Notes

Please see the [CHANGELOG.md](CHANGELOG.md).
