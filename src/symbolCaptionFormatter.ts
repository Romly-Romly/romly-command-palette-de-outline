export interface SymbolCaptionFormatItem
{
	// 対象のシンボルの種別 (例: "Function", "Class")
	symbolKinds: string | string[];

	// マッチング用の正規表現パターン
	regexp: string;

	// 置換後のテンプレート文字列 (例: "${funcName}")
	replacement: string;
}

/**
 * 言語IDごとのフォーマッタ設定(複数のフォーマットのリスト)。
 */
export interface SymbolCaptionFormatter
{
	languageIds: string | string[];
	formatters: SymbolCaptionFormatItem[];
}
