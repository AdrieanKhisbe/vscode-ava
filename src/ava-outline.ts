import * as vscode from 'vscode';
import * as path from 'path';
import { getAllTestFiles, getTestFromFile } from './ava-test-resolver'
import { AvaTest, AvaTestFile } from './ava-test';
import * as Bromise from 'bluebird';

export class AvaNodeProvider implements vscode.TreeDataProvider<AvaTestItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<AvaTestItem | undefined> = new vscode.EventEmitter<AvaTestItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<AvaTestItem | undefined> = this._onDidChangeTreeData.event;

	constructor() {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: AvaTestItem): vscode.TreeItem {
		element.command = {
			command: 'ava.file-tree.openSelection',
			title: '',
			arguments: [element.label]
		};
		return element;
	}

	getChildren(element?: AvaTestItem): Thenable<AvaTestItem[]> {

		if (element && element.item instanceof AvaTestFile) {
			return Bromise.resolve(
				element.item.tests.map(
					test => new AvaTestItem(test, vscode.TreeItemCollapsibleState.None)
				)
			)
		}
		const cwd = vscode.workspace.workspaceFolders[0].uri.path;// §todo: handling multi workspace
		return getAllTestFiles(cwd).then(testFiles => {
			return Bromise.map(testFiles, (path: String, index: Number) => {
				const tests = getTestFromFile(cwd, path)
				return new AvaTestFile(`test file ${index}`, path, tests)
			})
		}).then(testsFileDetails => {
			return Bromise.resolve(testsFileDetails.map(
				(tfd: AvaTestFile) => new AvaTestItem(tfd, vscode.TreeItemCollapsibleState.Collapsed)
			));
		});

	}

class AvaTestItem extends vscode.TreeItem {
	constructor(
		public readonly item: AvaTest | AvaTestFile,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public command?: vscode.Command
	) {
		super(item.label, collapsibleState);
	}

	get tooltip(): string {
		if (this.item instanceof AvaTest)
			return `${this.label} - line ${this.item.line}`;
		else
			return `${this.label} - ${this.item.tests.length} tests`
	}
	iconPath = {
		light: path.join(__dirname, '..', '..', 'resources', 'light', 'reference-mark.svg'),
		dark: path.join(__dirname, '..', '..', 'resources', 'dark', 'reference-mark.svg')
	};

	contextValue = 'ava-test';
}
