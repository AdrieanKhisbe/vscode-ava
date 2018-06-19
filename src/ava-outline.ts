import * as vscode from 'vscode';
import * as path from 'path';
import { AvaTestState } from './ava-test-state'
import { AvaTest, AvaTestFile } from './ava-test';
import {runTests} from './ava-test-runner';
import * as Bromise from 'bluebird';

export class AvaNodeProvider implements vscode.TreeDataProvider<AvaTestItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<AvaTestItem | undefined> = new vscode.EventEmitter<AvaTestItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<AvaTestItem | undefined> = this._onDidChangeTreeData.event;

	private readonly testState: AvaTestState
	constructor() {
		// §todo: handling multi workspace
		this.testState = new AvaTestState(
			vscode.workspace.workspaceFolders[0].uri.path,
			() => this._onDidChangeTreeData.fire()
		);
		this.testState.load();
		this.testState.watchStatus();
	}

	refresh(): void {
		this.testState.load();
	}

	runTests(test: AvaTest | AvaTestFile): void {
		if (test instanceof AvaTestFile) {
			runTests({file: test.path}); // §todo cwd handling (prompting if several)
		} else {
			if(test.special)
			  vscode.window.showInformationMessage(`${test.getDescription()} is not runnable.`)
			else
			  runTests({file: test.path, label: test.label});
		}
	}

	getTreeItem(element: AvaTestItem): vscode.TreeItem {
		element.command = {
			command: 'ava.test-tree.openSelection',
			title: '',
			arguments: [element.item]
		};
		return element;
	}

	openSelection(item: AvaTest | AvaTestFile) {
		const location = new vscode.Location(vscode.Uri.file(item.path),
			new vscode.Position(item instanceof AvaTest ? item.line - 1 : 0, 0)
		)
		return vscode.workspace.openTextDocument(location.uri).then(doc => {
			return vscode.window.showTextDocument(doc).then(editor => {
				let reviewType: vscode.TextEditorRevealType =
					(location.range.start.line === vscode.window.activeTextEditor.selection.active.line)
						? vscode.TextEditorRevealType.InCenterIfOutsideViewport
						: vscode.TextEditorRevealType.InCenter;

				const testSelection = new vscode.Selection(location.range.start, location.range.end);
				vscode.window.activeTextEditor.selection = testSelection;
				vscode.window.activeTextEditor.revealRange(testSelection, reviewType);
			})
		})
	}

	getChildren(element?: AvaTestItem): Thenable<AvaTestItem[]> {
		//§TODO handle multi-workspace
		if (element && element.item instanceof AvaTestFile) {
			return Bromise.resolve(
				element.item.tests.map(
					test =>  new AvaTestItem(test, vscode.TreeItemCollapsibleState.None)
				)
			)
		}
		return Bromise.resolve(this.testState.testFiles.map(
			(tfd: AvaTestFile) => new AvaTestItem(tfd, vscode.TreeItemCollapsibleState.Expanded)
		));

	}

}

class AvaTestItem extends vscode.TreeItem {
	constructor(
		public readonly item: AvaTest | AvaTestFile,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public command?: vscode.Command
	) {
		super(item.getDescription(), collapsibleState);
	}

	get tooltip(): string {
		if (this.item instanceof AvaTest)
			return `${this.item.getDescription()} - ${this.item.type} - line ${this.item.line}`;
		else
			return `${this.label} - ${this.item.tests.length} tests`
	}
	get iconPath() {
		return {
			light: path.join(__dirname, '..', 'resources', `${this.item.iconStatus}-autorun-light.svg`),
			dark: path.join(__dirname, '..', 'resources', `${this.item.iconStatus}-autorun-dark.svg`)
		}
	};

	contextValue = 'ava-test';
}
