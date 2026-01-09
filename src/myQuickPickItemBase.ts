import * as vscode from 'vscode';










export class MyQuickPickItemButton implements vscode.QuickInputButton
{
	private action: (context: vscode.ExtensionContext | undefined) => void | Promise<void>;

	constructor (
		readonly iconPath: vscode.ThemeIcon | vscode.Uri | { light: vscode.Uri; dark: vscode.Uri },
		action: (context: vscode.ExtensionContext | undefined) => void | Promise<void>,
		tooltip?: string,
	)
	{
		this.iconPath = iconPath;
		this.action = action;
	}

	async execute(context: vscode.ExtensionContext | undefined)
	{
		await this.action(context);
	}
}










export abstract class MyQuickPickItemBase implements vscode.QuickPickItem
{
	abstract label: string;
	description?: string;
	detail?: string;
	picked?: boolean;
	alwaysShow?: boolean;
	buttons?: MyQuickPickItemButton[];

	abstract execute(context: vscode.ExtensionContext | undefined): void | Promise<void>;
}
