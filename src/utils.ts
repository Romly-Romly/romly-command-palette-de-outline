import * as vscode from 'vscode';










/**
 * 文字列をクリップボードにコピーする。
 * @param text
 */
export async function copyToClipboard(text: string)
{
	await vscode.env.clipboard.writeText(text);
}










/**
 * あまり重要でないメッセージを表示する。メッセージはステータスバーに表示され5秒後に消える。
 * @param message メッセージの文字列。l10nに通される。
 */
export function showVeryLightMessage(message: string)
{
	// vscode.window.showWarningMessage(message);
	vscode.window.setStatusBarMessage(vscode.l10n.t(message), 5000);
}










/**
 * 文字列中のHTMLエンティティをプレーンテキストに変換する。
 * @param text
 * @returns
 */
export function decodeHtmlEntities(text: string): string
{
	const entityMap: Record<string, string> =
	{
		'&nbsp;': ' ',
		'&lt;': '<',
		'&gt;': '>',
		'&amp;': '&',
		'&quot;': '"',
		'&apos;': "'",
	};

	return text
		// 名前付きエンティティの変換
		.replace(/&[a-zA-Z]+;/g, (match) => entityMap[match] || match)
		// 10進数数値文字参照の変換 (&#160; など)
		.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
		// 16進数数値文字参照の変換 (&#x00A0; など)
		.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}










/**
 * 指定された行数を表示するのに必要な桁数を返す。
 * @param lineCount
 * @returns
 */
export function getDigitsCount(lineCount: number): number
{
	return Math.floor(Math.log10(lineCount)) + 1;
}