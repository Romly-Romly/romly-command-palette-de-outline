import * as vscode from 'vscode';










/**
 * 文字列をクリップボードにコピーする。
 * @param text
 */
export async function copyToClipboard(text: string)
{
	await vscode.env.clipboard.writeText(text);
}










export function showVeryLightMessage(message: string)
{
	// vscode.window.showWarningMessage(message);
	vscode.window.setStatusBarMessage(message, 3000);
}
