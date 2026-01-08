import * as vscode from 'vscode';
import { minimatch } from 'minimatch';










/**
 * フィルタ設定の定義
 */
export interface SymbolFilterConfig
{
	documentPattern: string;	// "**/*.ts" などのファイルパターン
	filters: string[];			// ["function/variable", "class/method/*"] などのフィルタパターン
}



/**
 * パースされたパターンのセグメント
 */
interface PatternSegment
{
	type: 'exact' | 'any' | 'deep';		// exact: "function", any: "*", deep: "**"
	kind?: string;
}

/**
 * パースされたフィルタパターン
 */
interface ParsedPattern
{
	segments: PatternSegment[];
}










/**
 * シンボルフィルタリングを管理するクラス
 */
export class SymbolFilter
{
	private configs: SymbolFilterConfig[] = [];
	private patternCache: Map<string, ParsedPattern> = new Map();

	/**
	 * フィルタを設定する。
	 */
	setConfiguration(filters: SymbolFilterConfig[])
	{
		this.configs = filters;
	}

	/**
	 * 指定されたドキュメントに適用されるフィルタパターンを取得
	 */
	private getApplicableFilters(documentUri: string): string[]
	{
		const matchedConfigs = this.configs.filter(
			c => minimatch(documentUri, c.documentPattern)
		);

		// すべてのfiltersを統合
		return matchedConfigs.flatMap(c => c.filters);
	}

	/**
	 * パターン文字列をパースして内部表現に変換（キャッシュ付き）
	 */
	private parsePattern(pattern: string): ParsedPattern
	{
		// キャッシュチェック
		const cached = this.patternCache.get(pattern);
		if (cached)
		{
			return cached;
		}

		// パース実行
		const segments = pattern.split('/').map(seg =>
		{
			if (seg === '**')
			{
				return { type: 'deep' as const };
			}
			else if (seg === '*')
			{
				return { type: 'any' as const };
			}
			else
			{
				return { type: 'exact' as const, kind: seg as string };
			}
		});

		const parsed: ParsedPattern = { segments };

		// キャッシュに保存
		this.patternCache.set(pattern, parsed);

		return parsed;
	}

	/**
	 * セグメントマッチングの再帰処理
	 */
	private matchSegments(
		chain: string[],
		segments: PatternSegment[],
		chainIndex: number,
		segmentIndex: number
	): boolean
	{
		// 両方終わった → マッチ成功
		if (segmentIndex >= segments.length && chainIndex >= chain.length)
		{
			return true;
		}

		// パターンだけ残ってる → 失敗
		if (segmentIndex >= segments.length)
		{
			return false;
		}

		// チェインだけ残ってる
		if (chainIndex >= chain.length)
		{
			// 残りが全部 ** なら成功の可能性
			return segments.slice(segmentIndex).every(s => s.type === 'deep');
		}

		const segment = segments[segmentIndex];
		const currentKind = chain[chainIndex];

		switch (segment.type)
		{
			case 'exact':
				// 完全一致が必要
				if (segment.kind === currentKind)
				{
					return this.matchSegments(chain, segments, chainIndex + 1, segmentIndex + 1);
				}
				return false;

			case 'any':
				// 1つスキップ
				return this.matchSegments(chain, segments, chainIndex + 1, segmentIndex + 1);

			case 'deep':
				// ** は貪欲マッチと非貪欲マッチの両方を試す
				// まず0個スキップ（次のセグメントへ）
				if (this.matchSegments(chain, segments, chainIndex, segmentIndex + 1))
				{
					return true;
				}
				// 1個以上スキップ
				return this.matchSegments(chain, segments, chainIndex + 1, segmentIndex);
		}
	}

	/**
	 * パターンにマッチするかチェック
	 */
	private matchesPattern(
		symbolKind: vscode.SymbolKind,
		parentChain: vscode.SymbolKind[],
		pattern: ParsedPattern
	): boolean
	{
		// 実際のシンボル階層を構築
		const fullChain = [...parentChain, symbolKind];
		const kindNames = fullChain.map(kind => vscode.SymbolKind[kind]);

		// パターンマッチング
		return this.matchSegments(kindNames, pattern.segments, 0, 0);
	}

	/**
	 * 指定されたシンボルを表示すべきかどうかを判定
	 * @param symbol 判定対象のシンボル
	 * @param parentChain 親シンボルのSymbolKind配列（ルートから順に）
	 * @param documentUri ドキュメントのURI
	 * @returns 表示すべきならtrue、フィルタで除外するならfalse
	 */
	shouldShowSymbol(
		symbol: vscode.DocumentSymbol,
		parentChain: vscode.SymbolKind[],
		documentUri: string
	): boolean
	{
		// 適用可能なフィルタパターンを取得
		const applicableFilters = this.getApplicableFilters(documentUri);

		// フィルタがなければ全て表示
		if (applicableFilters.length === 0)
		{
			return true;
		}

		// いずれかのフィルタにマッチしたら非表示
		for (const filterPattern of applicableFilters)
		{
			const parsed = this.parsePattern(filterPattern);
			if (this.matchesPattern(symbol.kind, parentChain, parsed))
			{
				return false;
			}
		}

		return true;
	}
}