# Romly Command Palette de Outline

## 日本語(Japanese)

[English version below](#english英語)

ドキュメントのアウトラインをコマンドパレットに表示する拡張機能です。サイドバーを表示することなく、素早くシンボルにジャンプできます。表示する必要のないシンボルはフィルタを設定して除外することもできます。

### 機能

- コマンドパレットにドキュメントのアウトラインを表示する。
- 行番号の表示／非表示を設定可能。
- シンボルの種類に対するグロブパターンのフィルタで表示しないシンボルを設定可能。
- シンボルの表示を正規表現でカスタマイズ可能。

### 必要条件

* VSCode バージョン1.107.0以降
* VSCodeのアウトライン表示が正常に動作している必要があります。

### 拡張機能の設定

* `Romly-CommandPalette-de-Outline.showLineNumber`: 行番号の表示／非表示。
* `Romly-CommandPalette-de-Outline.indentString`: インデントの代わりに使用する文字列。タブは使えないので、半角スペースを見やすいインデント幅になるよう繰り返してください。
* `Romly-CommandPalette-de-Outline.maxOutlineIndent`: アウトライン表示の最大深さ。0にすると全階層を表示、1ならトップレベルのみ表示。
* `Romly-CommandPalette-de-Outline.markdown.stripHeaderMarkers`: マークダウンのアウトラインを表示すると見出しの#記号がごちゃごちゃして見づらいので、`true`にすることでそれらを非表示にできます。
* `Romly-CommandPalette-de-Outline.c.combineUnnamedStructAndTypedef`: 有効にすると、C言語のアウトラインで無名構造体/列挙型とそのtypedefのシンボルを一つにまとめます。ちょっと見やすくなります。
* `Romly-CommandPalette-de-Outline.symbolFilters`: TypeScriptのアウトラインなどは関数の引数もシンボルとして表示されてしまい見づらいので、フィルタを指定して非表示にすることができます。下記のように指定します。 `filters` にはシンボルの種類をグロブパターンで指定します。シンボルの種類がわからない時は `Romly-CommandPalette-de-Outline.debug.showSymbolKindName` を `true` にしてアイコンの代わりにシンボルの種類の名前を表示し、確認してください。

	```
	"Romly-CommandPalette-de-Outline.symbolFilters": [
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

* `Romly-CommandPalette-de-Outline.enableSymbolFilters`: `Romly-CommandPalette-de-Outline.symbolFilters` を有効にするかどうかを切り替えます。一時的にフィルタを無効にしたいときなどに。
* `Romly-CommandPalette-de-Outline.symbolCaptionFormatters`: シンボルの表示をカスタマイズするための置換ルール。下記のような形式で設定します。言語IDはコマンドを呼び出した時にコマンドパレットのプレースホルダーに表示されています。

	```
	"Romly-CommandPalette-de-Outline.symbolCaptionFormatters": [
		{
			"languageIds": ["c"],
			"formatters": [
				{
					"symbolKinds": "Function",
					"regexp": "^(?<functionName>[a-zA-Z_]\\w*)\\s*\\(",
					"replacement": "${functionName}"
				}
			]
		},
		{
			"languageIds": ["cpp"],
			"formatters": [
				{
					"symbolKinds": ["Function", "Method"],
					"regexp": "(?<functionName>\\w+)\\s*\\([^)]*\\)(?:\\s*(?<qualifier>const|noexcept|override|final|volatile))*",
					"replacement": "${functionName} ${qualifier}"
				}
			]
		}
	],
	```

* `Romly-CommandPalette-de-Outline.enableSymbolCaptionFormat`: シンボルの表示カスタマイズを有効にするかどうかを切り替えます。一時的に元のシンボル名を表示したい時などに。
* `Romly-CommandPalette-de-Outline.fetchSymbolHoverText`: シンボルに対応するホバーテキスト(関数の説明など)を表示する場所。正しく説明文に当たる部分を表示できない可能性があります。また、長いファイルだと取得に時間がかかります。

	* `none`: ホバーテキストを取得しません。
	* `description`: シンボルの右に表示します。
	* `detail`: シンボルの下に表示します。各シンボルが2行表示になります。この時、見やすいよう左にマージンを `Romly-CommandPalette-de-Outline.hoverTextIndentSpaces` で設定できます。

* `Romly-CommandPalette-de-Outline.fetchHoverTextLanguageIdBlackList`: ファイルの言語IDがこのリストに含まれている場合はホバーテキストを取得しません。
* `Romly-CommandPalette-de-Outline.hoverTextIndentSpaces`: `Romly-CommandPalette-de-Outline.fetchSymbolHoverText` が `detail` に設定されている場合に、見やすさのため左にマージン代わりに挿入する半角スペースの数。

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
* Able to customize symbol display using regular expressions.

### Requirements

* VSCode version 1.107.0 or later.
* VSCode's outline view must be functioning properly.

### Extension Settings

* `Romly-CommandPalette-de-Outline.showLineNumber`: Show/hide line numbers.
* `Romly-CommandPalette-de-Outline.indentString`: String to use instead of indentation. Since tabs cannot be used, use multiple spaces to achieve a readable indent width.
* `Romly-CommandPalette-de-Outline.maxOutlineIndent`: Maximum depth of outline display. Set to 0 to show all levels, 1 to show only top-level items.
* `Romly-CommandPalette-de-Outline.markdown.stripHeaderMarkers`: When displaying Markdown outlines, the # symbols for headers can be visually distracting and hard to read, so setting this to `true` will hide them.
* `Romly-CommandPalette-de-Outline.c.combineUnnamedStructAndTypedef`: When enabled, combines unnamed struct and its typedef symbols into a single symbol in the C language outline. Improves readability a bit.
* `Romly-CommandPalette-de-Outline.symbolFilters`: TypeScript outlines and similar files display function arguments as symbols, making them hard to read, so you can specify filters to hide them. Specify as shown below. In `filters`, specify symbol kinds using glob patterns. If you don't know the symbol kind, set `Romly-CommandPalette-de-Outline.debug.showSymbolKindName` to `true` to display symbol kind names instead of icons, so you can confirm them.

	```
	"Romly-CommandPalette-de-Outline.symbolFilters": [
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

* `Romly-CommandPalette-de-Outline.enableSymbolFilters`: Toggles whether to enable `Romly-CommandPalette-de-Outline.symbolFilters`. Useful when you want to temporarily disable filters.
* `Romly-CommandPalette-de-Outline.symbolCaptionFormatters`: Replacement rules for customizing symbol display. Configure like the following format. The language ID is displayed in the command palette placeholder when the command is invoked.

	```
	"Romly-CommandPalette-de-Outline.symbolCaptionFormatters": [
		{
			"languageIds": ["c"],
			"formatters": [
				{
					"symbolKinds": "Function",
					"regexp": "^(?<functionName>[a-zA-Z_]\\w*)\\s*\\(",
					"replacement": "${functionName}"
				}
			]
		},
		{
			"languageIds": ["cpp"],
			"formatters": [
				{
					"symbolKinds": ["Function", "Method"],
					"regexp": "(?<functionName>\\w+)\\s*\\([^)]*\\)(?:\\s*(?<qualifier>const|noexcept|override|final|volatile))*",
					"replacement": "${functionName} ${qualifier}"
				}
			]
		}
	],
	```

* `Romly-CommandPalette-de-Outline.enableSymbolCaptionFormat`: Toggles whether to enable symbol display customization. Useful when you want to temporarily display the original symbol names.
* `Romly-CommandPalette-de-Outline.fetchSymbolHoverText`: Where to display hover text corresponding to symbols (such as function descriptions). There is a possibility that the correct description portion may not be displayed. Additionally, retrieval may take time for large files.

	* `none`: Does not fetch hover text.
	* `description`: Displays to the right of the symbol.
	* `detail`: Displays below the symbol. Each symbol will be displayed in two lines. In this case, you can set a left margin for better readability using `Romly-CommandPalette-de-Outline.hoverTextIndentSpaces`.

* `Romly-CommandPalette-de-Outline.fetchHoverTextLanguageIdBlackList`: Does not fetch hover text if the file's language ID is included in this list.
* `Romly-CommandPalette-de-Outline.hoverTextIndentSpaces`: Number of spaces to insert on the left as a margin substitute for readability when `Romly-CommandPalette-de-Outline.fetchSymbolHoverText` is set to `detail`.

### Known Issues

-

### Release Notes

Please see the [CHANGELOG.md](CHANGELOG.md).
