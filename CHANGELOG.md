# Change Log

## 日本語(Japanese)

[English version below](#english英語)

### [1.3.2] - 2026/01/10

- C言語で無名列挙型とtypedefもまとめられるようにした。

### [1.3.1] - 2026/01/10

- Pythonの時にホバーテキストから関数コメントがうまく取得できていなかった症状を修正

### [1.3.0] - 2026/01/10

- シンボルのホバーテキスト(関数のコメントなど)を表示する機能を追加。
- 行番号が出現位置と少しズレていたバグを修正。

### [1.2.0] - 2026/01/09

- シンボルの表示を正規表現でカスタマイズする機能を追加。例えば、引数部分を含めた関数定義全体が表示されるものを、関数名のみ表示するようにしてリストを見やすくする事ができます。
- Constructorシンボルにアイコンが表示されていなかった不具合を修正。
- フィルタ設定が見つからない時にディフォルト(サンプル)のフィルタ設定を書き込めるように。

### [1.1.0] - 2026/01/08

- C言語でtypedefに続く無名構造体をまとめるオプションを追加。ディフォルトで有効になっています。

### [1.0.0] - 2026/01/08

- 初回リリース。












-----










## English(英語)

[日本語版(Japanese version above)はこちら](#日本語japanese)

### [1.3.2] - 2026/01/10

- Added support for combining anonymous enum types with typedef in C language.

### [1.3.1] - 2026/01/10

- Fixed an issue where function comments were not being properly retrieved from hover text in Python.

### [1.3.0] - 2026/01/10

- Added functionality to display symbol hover text (such as fucntion comments).
- Fixed a bug where line numbers were slightly misaligned with their actual position.

### [1.2.0] - 2026/01/09

- Added feature to customize symbol display using regular expressions. For example, when the entire function definition including parameters is displayed, you can make it show only the function name, making the list easier to read.
- Fixed a bug where Constructor symbols were not displaying icons.
- When filter settings are not found, default (sample) filter settings can be written with user confirmation.

### [1.1.0] - 2026/01/08

- Added option to combine typedef with unnamed struct in C language. Enabled by default.

### [1.0.0] - 2026/01/08

- Inital release.
