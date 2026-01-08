import * as vscode from 'vscode';
import { SymbolCaptionFormatItem } from './symbolCaptionFormatter';
import { MyQuickPickItemBase } from './myQuickPickItemBase';
import { SymbolFilter } from './symbolFilter';










/**
 * ドキュメントシンボルとインデント情報を保持する独自のアウトラインオブジェクト。
 */
export class MyOutlineObject
{
	// ドキュメントシンボルをそのまま保持
	documentSymbol: vscode.DocumentSymbol;

	// インデントレベル。ルートは0。
	readonly indent: number;

	constructor(documentSymbol: vscode.DocumentSymbol, indent: number)
	{
		this.documentSymbol = documentSymbol;
		this.indent = indent;
	}

	/**
	 * このアウトラインオブジェクトが typedef なら true を返す。
	 * @returns
	 */
	isTypedef(): boolean
	{
		return this.documentSymbol.kind === vscode.SymbolKind.Interface && this.documentSymbol.detail === 'typedef';
	}

	/**
	 * このアウトラインオブジェクトが無名構造体なら true を返す。
	 * @returns
	 */
	isUnnamedStruct(): boolean
	{
		return this.documentSymbol.kind === vscode.SymbolKind.Struct && this.documentSymbol.name.indexOf('__unnamed_struct') >= 0;
	}
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

	readonly indentString: string = '';

	// シンボルの種類名を表示する？
	readonly showSymbolKindName: boolean = false;

	constructor (config: vscode.WorkspaceConfiguration, languageId: string, totalLines: number)
	{
		this.languageId = languageId;
		this.showLineNumber = config.get<boolean>('showLineNumber', true);
		this.stripMarkdownHeadingMarkers = config.get<boolean>('markdown.stripHeaderMarkers', true);
		this.indentString = config.get<string>('indentString', '   ');
		this.showSymbolKindName = config.get<boolean>('debug.showSymbolKindName', false);
		if (this.showLineNumber)
		{
			// 必要な桁数を算出
			this.lineNumberDigits = Math.floor(Math.log10(totalLines)) + 1;
		}
		else
		{
			this.lineNumberDigits = 0;
		}
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
				case vscode.SymbolKind.Constructor: iconName = 'symbol-constructor';	break;
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
		// range が全体を含む範囲なので、 selectionRange ではなく range で並び替え
		const aStart = a.range.start;
		const bStart = b.range.start;

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

		outlineObjectList.push(new MyOutlineObject(symbol, indent));

		if (symbol.children.length > 0)
		{
			// 子シンボルを再帰処理 (親チェインに現在のsymbolを追加)
			decodeSymbols(symbol.children, outlineObjectList, indent + 1, symbolFilter, documentUri, [...parentChain, symbol.kind]);
		}
	}
}










export class MyOutlineObjectList
{
	private items: MyOutlineObject[] = [];

	constructor(items: MyOutlineObject[])
	{
	    this.items = [...items]; // コピーして保持
	}

	get length(): number { return this.items.length; }

	/**
	 * 指定されたインデックス(複数)の項目を削除する。
	 * @param indices
	 */
	private removeAtIndices(indices: number[])
	{
		// 降順ソートして大きいインデックスから削除
		indices.sort((a, b) => b - a);
		indices.forEach(index => this.items.splice(index, 1));
	}

	public toArray(): MyOutlineObject[]
	{
		return [...this.items]; // スプレッド構文でシャローコピー
		// または
		return this.items.slice(); // slice()でも可
	}

	/**
	 * 指定された項目の直後にある同じインデントの項目を返す。
	 * @param outlineObjectList
	 * @param index
	 * @returns
	 */
	private findNextSibling(index: number): MyOutlineObject | undefined
	{
		for (let i = index + 1; i < this.items.length; i++)
		{
			if (this.items[i].indent === this.items[index].indent)
			{
				return this.items[i];
			}
		}

		return undefined;
	}

	/**
	 * 独自のアウトラインオブジェクトのキャプション(outlineObject.documentSymbol.name)をフォーマッタ設定に従って変換する
	 * @param formatItems
	 */
	public formatCaptions(formatItems: SymbolCaptionFormatItem[])
	{
		// キャプションを変換する
		this.items.forEach(outlineObject =>
		{
			// シンボル種別を文字列に変換
			const kind = vscode.SymbolKind[outlineObject.documentSymbol.kind];

			// 指定されたシンボル種別に対応するフォーマッタを探す
			const item = formatItems.find(item =>
			{
				const symbolKinds = Array.isArray(item.symbolKinds) ? item.symbolKinds : [item.symbolKinds];
				return symbolKinds.some(symbolKind => kind === symbolKind);
			});

			if (item)
			{
				let s = outlineObject.documentSymbol.name;
				const match = s.match(new RegExp(item.regexp));
				if (match)
				{
					s = item.replacement;
					if (match.groups)
					{
						for (const [key, value] of Object.entries(match.groups))
						{
							s = s.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value ? value : '');
						}

						// 数字のキャプチャグループ
						for (let i = 1; i <= 9; i++)
						{
							s = s.replace(new RegExp(`\\$${i}`, 'g'), i < match.length && match[i] ? match[i] : "");
						}
					}
				}
				outlineObject.documentSymbol.name = s.trim();
			}
		});
	}

	/**
	 * typedef の直後に無名構造体がある場合にそれらをまとめる処理
	 * @param outlineObjectList
	 */
	public combineUnnamedStructAndTypedef()
	{
		const toRemove: number[] = [];
		for (let i = 0; i < this.items.length; i++)
		{
			const obj = this.items[i];

			// これが typedef なら
			if (obj.isTypedef())
			{
				// 直後の同じ階層のものを見つける
				const nextSibling = this.findNextSibling(i);
				if (nextSibling && nextSibling.isUnnamedStruct())
				{
					// それが無名構造体なら、名前を typedef のものに置き換え、 typedef 側は削除リストへ
					nextSibling.documentSymbol.name = obj.documentSymbol.name;
					nextSibling.documentSymbol.detail = obj.documentSymbol.detail;
					toRemove.push(i);
				}
			}
		}

		// 削除リストにあるものを削除
		this.removeAtIndices(toRemove);
	}

	public convertToQuickPickItems(config: vscode.WorkspaceConfiguration, document: vscode.TextDocument): vscode.QuickPickItem[]
	{
		const option = new MyConvertOption(config, document.languageId, document.lineCount);

		const result: vscode.QuickPickItem[] = [];
		for (const outlineObject of this.items)
		{
			result.push(new MyJumpToSymbolQuickPickItem(document, outlineObject, option));
		}
		return result;
	}

	/**
	 * アクティブなエディタからドキュメントシンボルを取得し、独自のアウトラインオブジェクトのリストを作る。
	 * @param editor
	 * @param symbolFilter シンボルフィルタ(省略可)
	 * @returns アウトラインオブジェクトの配列を含む Promise 。シンボルが取得できなかった場合は空配列を返す。
	 */
	static async createFromSymbols(symbols: vscode.DocumentSymbol[], documentUri: string, symbolFilter?: SymbolFilter): Promise<MyOutlineObjectList>
	{
		const outlineObjects: MyOutlineObject[] = [];
		decodeSymbols(symbols, outlineObjects, 0, symbolFilter, documentUri);
		return new MyOutlineObjectList(outlineObjects);
	}
}