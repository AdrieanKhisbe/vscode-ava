import * as vscode from 'vscode';
import * as path from 'path';

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
		return new Promise(resolve => {
			return resolve([
				new AvaTestItem("Test1", vscode.TreeItemCollapsibleState.None),
				new AvaTestItem("Test2", vscode.TreeItemCollapsibleState.None)
			])
		})
	}

}

class AvaTestItem extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	get tooltip(): string {
		return `${this.label} - test`
	}
	iconPath = {
		light: path.join(__dirname, '..', '..', 'resources', 'light', 'reference-mark.svg'),
		dark: path.join(__dirname, '..', '..', 'resources', 'dark', 'reference-mark.svg')
	};

	contextValue = 'ava-test';
}
