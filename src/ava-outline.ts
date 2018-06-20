import * as vscode from 'vscode';
import * as path from 'path';
import * as _ from 'lodash';
import { AvaTestState } from './ava-test-state'
import { AvaTest, AvaTestFile, AvaTestFolder } from './ava-test';
import { runTests } from './ava-test-runner';
import * as Bromise from 'bluebird';

export class AvaNodeProvider implements vscode.TreeDataProvider<AvaTestItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<AvaTestItem | undefined> = new vscode.EventEmitter<AvaTestItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<AvaTestItem | undefined> = this._onDidChangeTreeData.event;

	private readonly testStates: AvaTestState[]
	constructor() {
		this.testStates = _.map(vscode.workspace.workspaceFolders,
			(workspace: vscode.WorkspaceFolder) => {
				const testState = new AvaTestState(
					workspace,
					() => this._onDidChangeTreeData.fire()
				)
				testState.load();
				testState.watchStatus();
				return testState;
			});
	}

	refresh(): void {
		this.testStates.map(ts => ts.load());
	}

	runTests(test: AvaTest | AvaTestFile): void {
		if (test instanceof AvaTestFile) {
			runTests({ cwd: test.cwd, file: test.path }); // §todo cwd handling (prompting if several)
		} else {
			if (test.special)
				vscode.window.showInformationMessage(`${test.getDescription()} is not runnable.`)
			else
				runTests({ cwd: test.cwd, file: test.path, label: test.label });
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
					test => new AvaTestItem(test, vscode.TreeItemCollapsibleState.None)
				)
			)
		}
		if (element && element.item instanceof AvaTestFolder) {
			return Bromise.resolve(
				element.item.content.map(
					test => new AvaTestItem(test, vscode.TreeItemCollapsibleState.Expanded)
				)
			)
		}
		if (this.testStates.length === 1) {
			return Bromise.resolve(this.testStates[0].rootFolder.content.map(
				(tfd: AvaTestFile) => new AvaTestItem(tfd, vscode.TreeItemCollapsibleState.Expanded)
			));
		} else {
			return Bromise.resolve(this.testStates.map(
				(ts: AvaTestState) => new AvaTestItem(ts.rootFolder, vscode.TreeItemCollapsibleState.Expanded)
			));
		}

	}

class AvaTestItem extends vscode.TreeItem {
	constructor(
		public readonly item: AvaTest | AvaTestFile | AvaTestFolder,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public command?: vscode.Command
	) {
		super(item.getDescription(), collapsibleState);
	}

	get tooltip(): string {
		if (this.item instanceof AvaTest)
			return `${this.item.getDescription()} - ${this.item.type} - line ${this.item.line}`;
		else if (this.item instanceof AvaTestFile)
			return `${this.label} - ${this.item.tests.length} tests`
		else
			return `${this.label} test folder`;
	}
	get iconPath() {
		return {
			light: path.join(__dirname, '..', 'resources', `${this.item.iconStatus}-autorun-light.svg`),
			dark: path.join(__dirname, '..', 'resources', `${this.item.iconStatus}-autorun-dark.svg`)
		}
	};

	contextValue = 'ava-test';
}
