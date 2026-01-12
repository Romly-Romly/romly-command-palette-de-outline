import * as vscode from 'vscode';










/**
 * QuickPick のボタンを実装したクラス。
 * ボタンをクリックした時の処理を設定可能。ただし動作させるには onDidTriggerItemButton で execute を呼び出す必要があります。
 */
export class RyQuickPickItemButton implements vscode.QuickInputButton
{
	private action: (context: vscode.ExtensionContext | undefined) => void | Promise<void>;

	constructor (
		readonly iconPath: vscode.ThemeIcon | vscode.Uri | { light: vscode.Uri; dark: vscode.Uri },
		action: (context: vscode.ExtensionContext | undefined) => void | Promise<void>,
		readonly tooltip?: string
	)
	{
		this.iconPath = iconPath;
		this.action = action;
	}

	/**
	 * action に設定された処理を実行する。
	 * @param context
	 */
	async execute(context: vscode.ExtensionContext | undefined)
	{
		await this.action(context);
	}
}










/**
 * QuickPickItem を実装した基底クラス。
 * 選択した時の処理を実行する execute メソッドを定義してある。
 */
export abstract class RyQuickPickItemBase implements vscode.QuickPickItem
{
	abstract label: string;
	description?: string;
	detail?: string;
	picked?: boolean;
	alwaysShow?: boolean;
	buttons?: RyQuickPickItemButton[];

	abstract execute(context: vscode.ExtensionContext | undefined): void | Promise<void>;
}
