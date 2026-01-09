import * as vscode from 'vscode';
import * as Utils from './utils';
import { SymbolCaptionFormatItem } from './symbolCaptionFormatter';
import { MyQuickPickItemBase, MyQuickPickItemButton } from './myQuickPickItemBase';
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










/**
 * シンボルの種類をアイコン名に変換する
 * @param kind
 * @returns
 */
function getSymbolKindIconName(kind: vscode.SymbolKind): string
{
	switch (kind)
	{
		case vscode.SymbolKind.Constant:	return 'symbol-constant';
		case vscode.SymbolKind.Variable:	return 'symbol-variable';
		case vscode.SymbolKind.Struct:		return 'symbol-struct';
		case vscode.SymbolKind.Interface:	return 'symbol-interface';
		case vscode.SymbolKind.Enum:		return 'symbol-enum';
		case vscode.SymbolKind.EnumMember:	return 'symbol-enum-member';
		case vscode.SymbolKind.Function:	return 'symbol-function';
		case vscode.SymbolKind.Field:		return 'symbol-field';
		case vscode.SymbolKind.Boolean:		return 'symbol-boolean';
		case vscode.SymbolKind.String:		return 'symbol-string';
		case vscode.SymbolKind.Array:		return 'symbol-array';
		case vscode.SymbolKind.Module:		return 'symbol-module';
		case vscode.SymbolKind.Property:	return 'symbol-property';
		case vscode.SymbolKind.Method:		return 'symbol-method';
		case vscode.SymbolKind.Class:		return 'symbol-class';
		case vscode.SymbolKind.Number:		return 'symbol-number';
		case vscode.SymbolKind.Constructor: return 'symbol-constructor';

		default:
			return '';
	}
}










/**
 * シンボルを表示し、ジャンプする機能を持つクイックピックアイテム。
 */
export class MyJumpToSymbolQuickPickItem extends MyQuickPickItemBase
{
	label: string;

	readonly document: vscode.TextDocument;

	readonly outlineObject: MyOutlineObject;

	readonly indentString: string;

	constructor (document: vscode.TextDocument, outlineObject: MyOutlineObject, option: MyConvertOption)
	{
		super();
		this.document = document;
		this.outlineObject = outlineObject;
		this.indentString = option.indentString.repeat(outlineObject.indent);	// インデントを空白で擬似的に再現

		// 行番号を追加。range が全体の範囲、 selectionRange がアウトラインへの表示部分なので、行番号は range から算出
		let lineNumberStr = '';
		if (option.showLineNumber)
		{
			const lineNum = outlineObject.documentSymbol.range.start.line + 1;
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

		// アイコンを付与
		let iconName = '';
		if (option.showSymbolKindName)
		{
			iconName = `[${vscode.SymbolKind[outlineObject.documentSymbol.kind]}] `;
		}
		else
		{
			iconName = getSymbolKindIconName(outlineObject.documentSymbol.kind);
			if (iconName.length > 0) { iconName = `\$(${iconName}) `; }
		}

		const isMarkdown = option.languageId === 'markdown';
		let caption = outlineObject.documentSymbol.name;
		if (isMarkdown && option.stripMarkdownHeadingMarkers)
		{
			caption = caption.replace(/^#+\s*/, '');
		}

		this.label = lineNumberStr + this.indentString + iconName + caption;
		this.description = outlineObject.documentSymbol.detail;
	}

	public getDocumentSymbol(): vscode.DocumentSymbol
	{
		return this.outlineObject.documentSymbol;
	}

	async execute(context: vscode.ExtensionContext)
	{
		const editor = vscode.window.activeTextEditor;
		if (editor)
		{
			// ドキュメントシンボルの位置にジャンプ(カーソル位置を設定)
			const targetPosition = this.getDocumentSymbol().selectionRange.start;
			editor.selection = new vscode.Selection(targetPosition, targetPosition);

			// 画面をスクロール
			editor.revealRange(
				new vscode.Range(targetPosition, targetPosition),
				vscode.TextEditorRevealType.InCenter
			);
		}
	}

	/**
	 * 取得したホバーテキストから、関数の説明を抽出する。
	 * コードブロックを取り除いて、最初の行が説明になっていると仮定。
	 * @param hoverText
	 * @returns
	 */
	private static getFunctionDescriptionFromHoverText(hoverText: string): string
	{
		// コードブロックを除去
		hoverText = hoverText.replace(/```[a-z]*\n[\s\S]*?```/g, '');

		// 空行を削除
		hoverText = hoverText.replace(/^\s*$\n/gm, '');

		// 最初の行を採用
		hoverText = hoverText.split('\n')[0].trim();

		// HTMLエンティティの除去
		hoverText = Utils.decodeHtmlEntities(hoverText);

		return hoverText;
	}

	/**
	 * ホバープロバイダを使って指定されたカーソル位置のホバーテキストを取得する。
	 * @param documentUri
	 * @param pos
	 * @returns
	 */
	private static async getHoverText(documentUri: vscode.Uri, pos: vscode.Position): Promise<string>
	{
		const hovers = await vscode.commands.executeCommand<vscode.Hover[]>('vscode.executeHoverProvider', documentUri, pos);

		if (hovers && hovers.length > 0)
		{
			const allTexts = [];
			for (let i = 0; i < Math.min(1, hovers[0].contents.length); i++)
			{
				const content = hovers[0].contents[i];

				// MarkdownStringの場合
				if (content instanceof vscode.MarkdownString)
				{
					allTexts.push(content.value);
				}
				// stringの場合
				else if (typeof content === 'string')
				{
					allTexts.push(content);
				}
			}
			return allTexts.join('\n');
		}
		else
		{
			return '';
		}
	}

	/**
	 * シンボルの概要をホバーテキストから取得し、 description または detail に追加する。
 	 * @param appendToDescription true なら description に追加、false なら detail に追加
	 * @param numIndentSpaces description に追加する場合に、インデントとして表示する半角スペースの数。
	 */
	public async updateHoverText(appendToDescription: boolean, numIndentSpaces: number = 0)
	{
		let hoverText = await MyJumpToSymbolQuickPickItem.getHoverText(this.document.uri, this.getDocumentSymbol().selectionRange.start);
		hoverText = MyJumpToSymbolQuickPickItem.getFunctionDescriptionFromHoverText(hoverText);
		if (hoverText.length > 0)
		{
			if (appendToDescription)
			{
				this.description += ' ' + hoverText;
			}
			else
			{
				this.detail = ' '.repeat(numIndentSpaces) + this.indentString + hoverText;
			}
		}
	}
}










interface DecodeSymbolsOptions
{
	symbolFilter?: SymbolFilter;			// シンボルフィルタ(省略可能)
	documentUri?: string;					// ドキュメントのURI (フィルタリング時に必要)
	parentChain: vscode.SymbolKind[];		// 親シンボルのSymbolKind配列(フィルタリング時に必要)
	maxIndentLevel: number;
}

/**
 * ドキュメントシンボルを再帰的に走査し、階層構造を値として保持した独自のアウトラインオブジェクトのリストを作る。
 * @param symbols 走査対象のドキュメントシンボル配列。
 * @param outlineObjectList 結果を格納する配列。
 * @param indent 現在のインデントレベル。最初の呼び出しでは省略(0)。
 * @param options
 */
function decodeSymbols(
	symbols: vscode.DocumentSymbol[],
	outlineObjectList: MyOutlineObject[],
	indent = 0,
	options: DecodeSymbolsOptions
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
		if (options.symbolFilter && options.documentUri)
		{
			if (!options.symbolFilter.shouldShowSymbol(symbol, options.parentChain, options.documentUri))
			{
				// このシンボルは表示しない
				continue;
			}
		}

		outlineObjectList.push(new MyOutlineObject(symbol, indent));

		if (symbol.children.length > 0)
		{
			// 最大インデントレベルのチェック
			if (options.maxIndentLevel === 0 || indent < options.maxIndentLevel - 1)
			{
				// 子シンボルを再帰処理 (親チェインに現在のsymbolを追加)
				const newOption = { ...options, parentChain: [...options.parentChain, symbol.kind] };
				decodeSymbols(symbol.children, outlineObjectList, indent + 1, newOption);
			}
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
					nextSibling.documentSymbol.range = obj.documentSymbol.range;
					nextSibling.documentSymbol.selectionRange = obj.documentSymbol.selectionRange;
					toRemove.push(i);
				}
			}
		}

		// 削除リストにあるものを削除
		this.removeAtIndices(toRemove);
	}

	/**
	 * このリストを QuickPickItem の配列に変換する。
	 * @param config
	 * @param document
	 * @returns
	 */
	public async convertToQuickPickItems(config: vscode.WorkspaceConfiguration, document: vscode.TextDocument): Promise<vscode.QuickPickItem[]>
	{
		const option = new MyConvertOption(config, document.languageId, document.lineCount);

		const result: vscode.QuickPickItem[] = [];
		for (const outlineObject of this.items)
		{
			const item = new MyJumpToSymbolQuickPickItem(document, outlineObject, option);
			// item.buttons = [new MyQuickPickItemButton(new vscode.ThemeIcon('trash'), async (context) =>
			// {
			// })];
			result.push(item);
		}
		return result;
	}

	/**
	 * アクティブなエディタからドキュメントシンボルを取得し、独自のアウトラインオブジェクトのリストを作る。
	 * @param editor
	 * @param symbolFilter シンボルフィルタ(省略可)
	 * @returns アウトラインオブジェクトの配列を含む Promise 。シンボルが取得できなかった場合は空配列を返す。
	 */
	static async createFromSymbols(symbols: vscode.DocumentSymbol[], documentUri: string, symbolFilter?: SymbolFilter, maxIndentLevel: number = 0): Promise<MyOutlineObjectList>
	{
		const outlineObjects: MyOutlineObject[] = [];
		const options = { symbolFilter, documentUri, parentChain: [], maxIndentLevel };
		decodeSymbols(symbols, outlineObjects, 0, options);
		return new MyOutlineObjectList(outlineObjects);
	}
}