// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as Utils from './utils';
import { SymbolFilter } from './symbolFilter';










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










/**
 * ドキュメントシンボルとインデント情報を保持する独自のアウトラインオブジェクト。
 */
interface MyOutlineObject
{
	// ドキュメントシンボルをそのまま保持
	documentSymbol: vscode.DocumentSymbol;

	// インデントレベル。ルートは0。
	readonly indent: number;
}










/**
 * ドキュメントシンボルを再帰的に走査し、階層構造を値として保持した独自のアウトラインオブジェクトのリストを作る。
 * @param symbols 走査対象のドキュメントシンボル配列。
 * @param outlineObjectList 結果を格納する配列。
 * @param indent 現在のインデントレベル。最初の呼び出しでは省略(0)。
 * @param symbolFilter シンボルフィルタ(省略可能)
 * @param documentUri ドキュメントのURI (フィルタリング時に必要)
 * @param parentChain 親シンボルのSymbolKind配列(フィルタリング時に必要)
 */
function decodeSymbols(
	symbols: vscode.DocumentSymbol[],
	outlineObjectList: MyOutlineObject[],
	indent = 0,
	symbolFilter?: SymbolFilter,
	documentUri?: string,
	parentChain: vscode.SymbolKind[] = []
)
{
	// 標準では出現順になっていなかったので、先に並び替える。
	const sortedSymbols = symbols.slice().sort((a, b) =>
	{
		const aStart = a.selectionRange.start;
		const bStart = b.selectionRange.start;
		if (aStart.line !== bStart.line)
		{
			return aStart.line - bStart.line;
		}
		else
		{
			return aStart.character - bStart.character;
		}
	});

	for (const symbol of sortedSymbols)
	{
		// フィルタリング判定
		if (symbolFilter && documentUri)
		{
			if (!symbolFilter.shouldShowSymbol(symbol, parentChain, documentUri))
			{
				// このシンボルは表示しない
				continue;
			}
		}

		let obj: MyOutlineObject = { documentSymbol: symbol, indent: indent };
		outlineObjectList.push(obj);

		if (symbol.children.length > 0)
		{
			// 子シンボルを再帰処理 (親チェインに現在のsymbolを追加)
			decodeSymbols(symbol.children, outlineObjectList, indent + 1, symbolFilter, documentUri, [...parentChain, symbol.kind]);
		}
	}
}










/**
 * アクティブなエディタからドキュメントシンボルを取得し、独自のアウトラインオブジェクトのリストを作る。
 * @param editor
 * @param symbolFilter シンボルフィルタ(省略可)
 * @returns アウトラインオブジェクトの配列を含む Promise 。シンボルが取得できなかった場合は空配列を返す。
 */
async function makeOutlineObjectList(symbols: vscode.DocumentSymbol[], document: vscode.TextDocument, symbolFilter?: SymbolFilter): Promise<MyOutlineObject[]>
{
	let outlineObjectList: MyOutlineObject[] = [];
	decodeSymbols(symbols, outlineObjectList, 0, symbolFilter, document.uri.toString());
	return outlineObjectList;
}










// クイックピック用のアイテムに変換する時のオプション
class MyConvertOption
{
	// ドキュメントの言語IDがそのまま渡される。
	readonly languageId: string;

	// 行番号を表示する？
	readonly showLineNumber: boolean;

	// マークダウンの時、見出しの#を削除する？
	readonly stripMarkdownHeadingMarkers: boolean;

	// 行番号の桁数。コンストラクタで自動的に算出される。
	readonly lineNumberDigits: number;

	indentString: string = '';

	// シンボルの種類名を表示する？
	showSymbolKindName: boolean = false;

	constructor (languageId: string, showLineNumber: boolean, totalLines: number, stripMarkdownHeadingMarkers: boolean)
	{
		this.languageId = languageId;
		this.showLineNumber = showLineNumber;
		if (showLineNumber)
		{
			// 必要な桁数を算出
			this.lineNumberDigits = Math.floor(Math.log10(totalLines)) + 1;
		}
		else
		{
			this.lineNumberDigits = 0;
		}

		this.stripMarkdownHeadingMarkers = stripMarkdownHeadingMarkers;
	}
}










class MyQuickPickItemButton implements vscode.QuickInputButton
{
	private action: (context: vscode.ExtensionContext) => void | Promise<void>;

	constructor (
		readonly iconPath: vscode.ThemeIcon | vscode.Uri | { light: vscode.Uri; dark: vscode.Uri },
		action: (context: vscode.ExtensionContext) => void | Promise<void>,
		tooltip?: string,
	)
	{
		this.iconPath = iconPath;
		this.action = action;
	}

	async execute(context: vscode.ExtensionContext)
	{
		await this.action(context);
	}
}










abstract class MyQuickPickItemBase implements vscode.QuickPickItem
{
	abstract label: string;
	description?: string;
	detail?: string;
	picked?: boolean;
	alwaysShow?: boolean;
	buttons?: MyQuickPickItemButton[];

	abstract execute(context: vscode.ExtensionContext): void | Promise<void>;
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










// シンボルにジャンプする独自クラス
class MyJumpToSymbolQuickPickItem extends MyQuickPickItemBase
{
	label: string;

	document: vscode.TextDocument;

	// ドキュメントシンボルをそのまま保持
	documentSymbol: vscode.DocumentSymbol;

	constructor (document: vscode.TextDocument, outlineObject: MyOutlineObject, option: MyConvertOption)
	{
		super();

		// 行番号を追加
		let lineNumberStr = '';
		if (option.showLineNumber)
		{
			const lineNum = outlineObject.documentSymbol.selectionRange.start.line + 1;
			if (option.lineNumberDigits > 0)
			{
				lineNumberStr = lineNum.toString().padStart(option.lineNumberDigits, '0');
			}
			else
			{
				lineNumberStr = lineNum.toString();
			}
			lineNumberStr = ':' + lineNumberStr + ' ';
		}

		// インデントを空白で擬似的に再現
		const s = option.indentString.repeat(outlineObject.indent);

		// アイコンを付与
		let iconName = '';
		if (option.showSymbolKindName)
		{
			iconName = `[${vscode.SymbolKind[outlineObject.documentSymbol.kind]}] `;
		}
		else
		{
			switch (outlineObject.documentSymbol.kind)
			{
				case vscode.SymbolKind.Constant:	iconName = 'symbol-constant';		break;
				case vscode.SymbolKind.Variable:	iconName = 'symbol-variable';		break;
				case vscode.SymbolKind.Struct:		iconName = 'symbol-struct';			break;
				case vscode.SymbolKind.Interface:	iconName = 'symbol-interface';		break;
				case vscode.SymbolKind.Enum:		iconName = 'symbol-enum';			break;
				case vscode.SymbolKind.EnumMember:	iconName = 'symbol-enum-member';	break;
				case vscode.SymbolKind.Function:	iconName = 'symbol-function';		break;
				case vscode.SymbolKind.Field:		iconName = 'symbol-field';			break;
				case vscode.SymbolKind.Boolean:		iconName = 'symbol-boolean';		break;
				case vscode.SymbolKind.String:		iconName = 'symbol-string';			break;
				case vscode.SymbolKind.Array:		iconName = 'symbol-array';			break;
				case vscode.SymbolKind.Module:		iconName = 'symbol-module';			break;
				case vscode.SymbolKind.Property:	iconName = 'symbol-property';		break;
				case vscode.SymbolKind.Method:		iconName = 'symbol-method';			break;
				case vscode.SymbolKind.Class:		iconName = 'symbol-class';			break;
				case vscode.SymbolKind.Number:		iconName = 'symbol-number';			break;
			}
			if (iconName.length > 0) { iconName = `\$(${iconName}) `; }
		}

		const isMarkdown = option.languageId === 'markdown';
		let caption = outlineObject.documentSymbol.name;
		if (isMarkdown && option.stripMarkdownHeadingMarkers)
		{
			caption = caption.replace(/^#+\s*/, '');
		}

		this.label = lineNumberStr + s + iconName + caption;
		this.description = outlineObject.documentSymbol.detail;

		this.document = document;
		this.documentSymbol = outlineObject.documentSymbol;
	}

	async execute(context: vscode.ExtensionContext)
	{
		const editor = vscode.window.activeTextEditor;
		if (editor)
		{
			// ドキュメントシンボルの位置にジャンプ
			const targetPosition = new vscode.Position(
				this.documentSymbol.selectionRange.start.line,
				this.documentSymbol.selectionRange.start.character
			);

			// カーソル位置を設定
			editor.selection = new vscode.Selection(targetPosition, targetPosition);

			// 画面をスクロール
			editor.revealRange(
				new vscode.Range(targetPosition, targetPosition),
				vscode.TextEditorRevealType.InCenter
			);
		}
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










function showVeryLightMessage(message: string)
{
	// vscode.window.showWarningMessage(message);
	vscode.window.setStatusBarMessage(message, 3000);
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
			showVeryLightMessage(vscode.l10n.t('No active text editor.'));
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
			showVeryLightMessage(vscode.l10n.t('No document symbols found in document: {0}', path.basename(editor.document.fileName)));
			return;
		}

		// シンボルフィルタを初期化して設定を読み込み
		const symbolFilter = new SymbolFilter();
		symbolFilter.loadConfiguration();

		// ドキュメントシンボルを独自の MyOutlineObject リストに変換
		let outlineObjectList = await makeOutlineObjectList(symbols, editor.document, symbolFilter);

		// フィルタした結果、表示するドキュメントシンボル情報が無ければ警告を表示して終了
		if (outlineObjectList.length === 0)
		{
			showVeryLightMessage(vscode.l10n.t('No symbols to show after filtering in document: {0}', path.basename(editor.document.fileName)));
			return;
		}

		// それを QuickPickItem のリストに変換
		const showLineNumber = vscode.workspace.getConfiguration('Romly-CommandPalette-de-Outline').get<boolean>('showLineNumber', true);
		const stripMarkdownHeadingMarkers = vscode.workspace.getConfiguration('Romly-CommandPalette-de-Outline').get<boolean>('markdown.stripHeaderMarkers', true);
		const option = new MyConvertOption(editor.document.languageId, showLineNumber, editor.document.lineCount, stripMarkdownHeadingMarkers);
		option.indentString = vscode.workspace.getConfiguration('Romly-CommandPalette-de-Outline').get<string>('indentString', '   ');
		option.showSymbolKindName = vscode.workspace.getConfiguration('Romly-CommandPalette-de-Outline').get<boolean>('debug.showSymbolKindName', false);
		const quickPickItems: vscode.QuickPickItem[] = [];
		for (const outlineObject of outlineObjectList)
		{
			const item = new MyJumpToSymbolQuickPickItem(editor.document, outlineObject, option);
			quickPickItems.push(item);
		}

		// デバッグ用メニューの追加
		const debugCopySymbolsMenu = vscode.workspace.getConfiguration('Romly-CommandPalette-de-Outline').get<boolean>('debug.showCopySymbolsMenu', false);
		if (debugCopySymbolsMenu)
		{
			// セパレーター
			quickPickItems.unshift({ label: '', kind: vscode.QuickPickItemKind.Separator });

			const quickPickItem = new MyCopyDocumentSymbolsToClipboardQuickPickItem();
			quickPickItems.unshift(quickPickItem);
		}

		// QuickPick を表示
		const quickPick = vscode.window.createQuickPick<vscode.QuickPickItem>();
		quickPick.items = quickPickItems;
		quickPick.placeholder = `[${editor.document.languageId}] ${path.basename(editor.document.fileName)}`;

		// アイテムが選択された時の処理
		quickPick.onDidAccept(async () =>
		{
			const selected = quickPick.selectedItems[0];
			if (selected && selected instanceof MyQuickPickItemBase)
			{
				await selected.execute(context);
			}
			quickPick.hide();
		});

		// アイテムのボタンが押された時の処理
		quickPick.onDidTriggerItemButton(async (e) =>
		{
			if (e.button instanceof MyQuickPickItemButton)
			{
				await e.button.execute(context);
			}
		});

		// QuickPick を表示
		quickPick.show();
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
