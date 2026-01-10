import * as vscode from 'vscode';
import * as path from 'path';
import * as Utils from './utils';
import { MyOutlineObjectList, MyJumpToSymbolQuickPickItem, MyConvertOption } from './myOutlineObject';
import { MyQuickPickItemBase, MyQuickPickItemButton } from './myQuickPickItemBase';
import { SymbolFilter, SymbolFilterConfig } from './symbolFilter';
import { SymbolCaptionFormatter, SymbolCaptionFormatItem } from './symbolCaptionFormatter';

// ディフォルトフィルター
import defaultFilters from "./default_filters";










/**
 * この拡張機能の識別子
 */
const EXTENSION_ID = 'Romly-CommandPalette-de-Outline';

const CONFIG_KEY_SYMBOL_FILTERS = 'symbolFilters';
const CONFIG_KEY_SYMBOL_CAPTION_FORMATTERS = 'symbolCaptionFormatters';




















async function showFunctions()
{
	const editor = vscode.window.activeTextEditor;
	if (!editor) { return; }

	const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
		'vscode.executeDocumentSymbolProvider',
		editor.document.uri
	);

	if (!symbols) { return; }

	const s: string[] = [];

	// ドキュメント情報
	s.push('// fileName: ' + editor.document.fileName);
	s.push(`// uri: ${editor.document.uri.toString()}`);
	s.push(`// languageId: ${editor.document.languageId}`);
	s.push(`// lineCount: ${editor.document.lineCount}`);
	s.push(`// encoding: ${editor.document.encoding}`);
	s.push(`// eol: ${editor.document.eol}`);
	s.push(`// isDirty: ${editor.document.isDirty}`);
	s.push(`// isUntitled: ${editor.document.isUntitled}`);
	s.push('');

	printSymbolTree(symbols, s);
	await Utils.copyToClipboard(s.join('\n'));
}









function printSymbolTree(symbols: vscode.DocumentSymbol[], s: string[], indent = 0)
{
	// 各シンボルの構造
	// interface DocumentSymbol
	// {
	// 	name: string;		// シンボルの名前(関数名、クラス名など)
	// 	detail: string;		// 追加情報(型情報など)
	// 	kind: SymbolKind;	// シンボルの種類(後述)
	// 	range: Range;				// シンボル全体の範囲。例えば関数であれば関数本体を含む。クラスであればクラス全体。
	// 	selectionRange: Range;		// シンボル名の範囲、定義箇所。例えば関数であれば関数名のみ。クラスであればクラス名のみ。
	// 	children: DocumentSymbol[];		// 子シンボルの配列
	// }
	//
	// kindの種類
	// - `SymbolKind.File` (0)
	// - `SymbolKind.Module` (1)
	// - `SymbolKind.Namespace` (2)
	// - `SymbolKind.Class` (4)
	// - `SymbolKind.Method` (5)
	// - `SymbolKind.Function` (11)
	// - `SymbolKind.Variable` (12)
	// - `SymbolKind.Struct` (22)
	// など
	for (const symbol of symbols)
	{
		const prefix = '    '.repeat(indent);

		// 基本情報
		const kindName = vscode.SymbolKind[symbol.kind];
		const line = symbol.range.start.line + 1;
		const endLine = symbol.range.end.line + 1;

		// selection rangeも表示
		const selLine = symbol.selectionRange.start.line + 1;
		const selEndLine = symbol.selectionRange.end.line + 1;

		// detailがあれば表示
		const detail = symbol.detail ? ` | detail: "${symbol.detail}"` : '';

		s.push(
			`${prefix}${symbol.name} [${kindName}]${detail} ` +
			`range: (${symbol.range.start.line}:${symbol.range.start.character})-(${symbol.range.end.line}:${symbol.range.end.character}), ` +
			`sel: (${symbol.selectionRange.start.line}:${symbol.selectionRange.start.character})-(${symbol.selectionRange.end.line}:${symbol.selectionRange.end.character})`
		);

		if (symbol.children.length > 0)
		{
			printSymbolTree(symbol.children, s, indent + 1);
		}
	}
}










// カスタムアクションを代入できるクラス
class MyQuickPickItemCustomAction extends MyQuickPickItemBase
{
	label: string;
	private action: (context: vscode.ExtensionContext) => void | Promise<void>;

	constructor (
		label: string,
		action: (context: vscode.ExtensionContext) => void | Promise<void>,
		options?: {
			description?: string;
			detail?: string;
			picked?: boolean;
			alwaysShow?: boolean;
		}
	)
	{
		super();
		this.label = label;
		this.action = action;

		if (options)
		{
			this.description = options.description;
			this.detail = options.detail;
			this.picked = options.picked;
			this.alwaysShow = options.alwaysShow;
		}
	}

	async execute(context: vscode.ExtensionContext)
	{
		await this.action(context);
	}
}










/**
 * ドキュメントシンボルをクリップボードにコピーする独自クラス
 */
class MyCopyDocumentSymbolsToClipboardQuickPickItem extends MyQuickPickItemBase
{
	label = vscode.l10n.t('Copy Document Symbols to Clipboard');
	description = vscode.l10n.t('for Debug');
	detail = '';

	async execute(context: vscode.ExtensionContext)
	{
		showFunctions();
	}
}










function getApplicableFormatters(formatters: SymbolCaptionFormatter[], languageId: string): SymbolCaptionFormatItem[]
{
	// 指定された言語IDにマッチするフォーマッタをすべて取得
	const matched = formatters.filter(c =>
	{
		const ids = Array.isArray(c.languageIds) ? c.languageIds : [c.languageIds];
		return ids.some(id => id === languageId);
	});

	// マッチした全てのフォーマッタの formatters を単一のリストに統合して返す
	return matched.flatMap(c => c.formatters);
}










/**
 * クイックピックアイテムのリストにシンボル以外のメニュー項目などを必要に応じて追加する。
 * @param quickPickItems
 */
function addExtraItems(quickPickItems: vscode.QuickPickItem[])
{
	// セパレーター
	quickPickItems.unshift({ label: '', kind: vscode.QuickPickItemKind.Separator });

	const quickPickItem = new MyCopyDocumentSymbolsToClipboardQuickPickItem();
	quickPickItems.unshift(quickPickItem);
}










/**
 * 各シンボルのホバーテキストを非同期で取得して一通り取得し終わったらクイックピックのアイテムを更新する。
 * @param quickPick
 * @param appendToDescription true なら description に追加、false なら detail に追加
 */
function fetchHoverTexts(quickPick: vscode.QuickPick<vscode.QuickPickItem>, appendToDescription: boolean, numIndentSpaces: number = 0)
{
	const promise = (async function ()
	{
		for (let i = 0; i < quickPick.items.length; i++)
		{
			const item = quickPick.items[i];
			if (item instanceof MyJumpToSymbolQuickPickItem)
			{
				const kind = vscode.SymbolKind[item.getDocumentSymbol().kind];
				{
					await item.updateHoverText(appendToDescription, numIndentSpaces);
				}
			}
		}
	})();
	promise.then(() => quickPick.items = quickPick.items);
}










/**
 * アウトラインを表示するクイックピックを生成して返す
 * @param editor
 * @param items
 * @returns
 */
function createQuickPick(editor: vscode.TextEditor, items: vscode.QuickPickItem[])
{
	const quickPick = vscode.window.createQuickPick<vscode.QuickPickItem>();
	quickPick.items = items;
	quickPick.placeholder = `[${editor.document.languageId}] ${path.basename(editor.document.fileName)}`;
	quickPick.keepScrollPosition = true;

	// アイテムが選択された時の処理
	quickPick.onDidAccept(async () =>
	{
		const selected = quickPick.selectedItems[0];
		if (selected && selected instanceof MyQuickPickItemBase)
		{
			await selected.execute(undefined);
		}
		quickPick.hide();
	});

	// アイテムのボタンが押された時の処理
	quickPick.onDidTriggerItemButton(async (e) =>
	{
		if (e.button instanceof MyQuickPickItemButton)
		{
			await e.button.execute(undefined);
		}
	});

	return quickPick;
}










// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext)
{
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('romly-command-palette-de-outline.showOutline', async () =>
	{
		// まずアクティブなエディタを取得。取得できなければ警告を表示して終了。
		const editor = vscode.window.activeTextEditor;
		if (!editor)
		{
			Utils.showVeryLightMessage(vscode.l10n.t('No active text editor.'));
			return;
		}

		// ドキュメントシンボルを取得
		const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
			'vscode.executeDocumentSymbolProvider',
			editor.document.uri
		);

		// ドキュメントにシンボル情報が無ければ警告を表示して終了
		if (!symbols)
		{
			Utils.showVeryLightMessage(vscode.l10n.t('No document symbols found in document: {0}', path.basename(editor.document.fileName)));
			return;
		}



		const langId = editor.document.languageId;
		const config = vscode.workspace.getConfiguration(EXTENSION_ID);
		const debugMode = config.get<boolean>('debugMode', false);

		// フィルタ設定を読み込み。
		// 設定が見つからない(キーが存在しない)場合はディフォルト設定を設定に書き込んで使うか尋ねる。
		// キーが存在して空配列だった場合は意図的に設定されていないとしてフィルタ設定無しとする。
		const filters = config.get<SymbolFilterConfig[]>(CONFIG_KEY_SYMBOL_FILTERS, []);
		if (filters.length === 0)
		{
			const msg = vscode.l10n.t("No filter settings found. Shall I put sample filters to the setting file?");
			vscode.window.showInformationMessage(msg, vscode.l10n.t("Yes")).then(value =>
			{
				if (value === vscode.l10n.t("Yes, please"))
				{
					// 設定にサンプルを書き込む
					config.update(CONFIG_KEY_SYMBOL_FILTERS, defaultFilters, true);

					// 書き込んだ旨を表示
					const msg = vscode.l10n.t("Sample filters have been written to your settings. Please execute the command again.");
					vscode.window.showInformationMessage(msg);
				}
			});
		}

		// シンボルフィルタを初期化して設定を読み込み
		let symbolFilter = undefined;
		if (config.get<boolean>('enableSymbolFilters', true))
		{
			symbolFilter = new SymbolFilter();
			symbolFilter.setConfiguration(filters);
		}

		// ドキュメントシンボルを独自の MyOutlineObject リストに変換
		const maxIndent = config.get<number>('maxOutlineIndent', 0);
		const outlineObjectList = await MyOutlineObjectList.createFromSymbols(symbols, editor.document.uri.toString(), symbolFilter, maxIndent);

		// キャプションのフォーマット処理
		if (config.get<boolean>('enableSymbolCaptionFormat', true))
		{
			const symbolCaptionFormatters = config.get<SymbolCaptionFormatter[]>(CONFIG_KEY_SYMBOL_CAPTION_FORMATTERS, []);
			const formatItems = getApplicableFormatters(symbolCaptionFormatters, langId);
			outlineObjectList.formatCaptions(formatItems);
		}

		// Cの特別な処理(typedefと直後の無名構造体/無名列挙型を結合)
		if (langId === 'c' && config.get<boolean>('c.combineUnnamedStructAndTypedef', true))
		{
			outlineObjectList.combineUnnamedStructAndTypedef();
		}

		// フィルタした結果、表示するドキュメントシンボル情報が無ければ警告を表示して終了
		if (outlineObjectList.length === 0)
		{
			Utils.showVeryLightMessage(vscode.l10n.t('No symbols to show after filtering in document: {0}', path.basename(editor.document.fileName)));
			return;
		}

		// それを QuickPickItem のリストに変換
		const option = new MyConvertOption(config, langId, editor.document.lineCount);
		const quickPickItems: vscode.QuickPickItem[]  = await outlineObjectList.convertToQuickPickItems(option, editor.document, debugMode);

		// デバッグ用メニューの追加
		if (debugMode)
		{
			addExtraItems(quickPickItems);
		}

		// クイックピックの表示
		const quickPick = createQuickPick(editor, quickPickItems);
		quickPick.show();

		// 非同期でホバーテキストを取得
		const fetchSymbolHoverText = config.get<string>('fetchSymbolHoverText', "detail");
		if (fetchSymbolHoverText.trim().length > 0 && fetchSymbolHoverText !== "none")
		{
			// 言語IDブラックリストに含まれている場合は取得しない
			let langIdlackList = config.get<string | string[]>('fetchHoverTextLanguageIdBlackList', []);
			langIdlackList = Array.isArray(langIdlackList) ? langIdlackList : [langIdlackList];
			if (!(langIdlackList.includes(langId)))
			{
				let numSpaces = 0;
				if (fetchSymbolHoverText === "detail")
				{
					numSpaces = config.get<number>('hoverTextIndentSpaces', 16);
				}
				fetchHoverTexts(quickPick, fetchSymbolHoverText === "description", numSpaces);
			}
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
