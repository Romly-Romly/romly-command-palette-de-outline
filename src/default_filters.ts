const defaultFilters =
[
	{
		"documentPattern": "**/*.h",
		"filters": [
			"**/EnumMember",
			"**/Class/Field",
			"**/Struct/Field",
		]
	},
	{
		"documentPattern": "**/*.json",
		"filters": [
			"**/Array/String",
			"**/Array/Number",
			"**/Array/Array"
		]
	},
	{
		"documentPattern": "**/*.ts",
		"filters": [
			"**/Function/Variable",
			"**/Constructor/Variable",
			"**/Method/Variable",
			"**/Method/Property",
			"**/Interface/Property",
			"**/Constructor/Property",
			"**/Property/Property",
		]
	},
	{
		"documentPattern": "**/*.js",
		"filters": [
			"**/Variable/Property"
		]
	},
	{
		"documentPattern": "**/*.py",
		"filters": [
			"**/Function/Variable",
			"**/Function/Constant"
		]
	}
];

export default defaultFilters;