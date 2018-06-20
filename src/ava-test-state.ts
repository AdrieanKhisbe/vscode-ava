import * as vscode from 'vscode';
import {set, map} from 'lodash';
import { sep, join } from 'path';
import { getAllTestFiles, getTestFromFile, getTestResultForFile, encodeFilePath } from './ava-test-resolver'
import { AvaTest, AvaTestFile, AvaTestFolder } from './ava-test';
import * as Bromise from 'bluebird';
import * as chokidar from 'chokidar';
import * as commonPathPrefix from 'common-path-prefix';

export class AvaTestState {

	testFiles: AvaTestFile[];
	testFilePaths: string[];
	prefix: string;
	testIndex: {[index: string]: {[index: string]: AvaTest}};
	folderIndex: {[index: string]: AvaTestFolder};
	testFilesIndex: {[index: string]: AvaTestFile};
	globalTestIndex: {[index: string]: AvaTest};
	rootFolder: AvaTestFolder;
	public readonly cwd: string;
	private testWatcher?: chokidar.FSWatcher;
	private readonly notifyChange: () => void
	constructor(public workspace: vscode.WorkspaceFolder, notifyChange?: () => void) {
		this.cwd = workspace.uri.path;
		this.testIndex = {};
		this.folderIndex = {};
		this.testFilePaths = [];
		this.prefix = '';
		this.testFiles = [];
		this.rootFolder = new AvaTestFolder(this.workspace.name, this.cwd, '.', []);
		this.testFilesIndex = {};
		this.globalTestIndex = {};
		this.notifyChange = notifyChange ? notifyChange : () => { };
	}

	load(): Thenable<void> {
		return this.computeAvailableTests()
			.then((() => this.updateStatus()));
	}
	computeAvailableTests(): Thenable<void> {
		return getAllTestFiles(this.cwd).then((testFiles: string[]) => {
			this.testFilePaths = testFiles;
			this.prefix = commonPathPrefix(testFiles);
			const prefixRegex = new RegExp(`^${this.prefix}`);
			this.testIndex = {};
			this.globalTestIndex = {};
			return Bromise.map(testFiles, (path: string, index: Number) => {
				return getTestFromFile(this.cwd, path, this.prefix)
					.then(
						(tests: AvaTest[]) => {
							const testDict = tests.reduce((acc: {[index: string]: AvaTest}, val: AvaTest) => {
								if (val.label) acc[val.label] = val;
								return acc;
							}, {})
							this.testIndex[encodeFilePath(path)] = testDict;
							const testFile = new AvaTestFile(`test file ${index}`, this.cwd, path, tests);
							set(this.testFilesIndex, path.replace(prefixRegex, '').split(sep), testFile);
							return testFile;
						}
					)
			})
				.then(testFiles => {
					this.testFiles = testFiles;
					this.rootFolder = this.populateFolder(this.testFilesIndex, this.workspace.name, this.prefix);
					this.notifyChange();
				});
		})
	}

	private populateFolder(fileTree: {[index: string]: AvaTestFile}, folderName: string, path: string) {
		const pathTrailingSep = path.endsWith(sep) ? path : path + sep;
		const folder: AvaTestFolder = new AvaTestFolder(folderName, this.cwd, pathTrailingSep,
			map(fileTree, (value, key) => {
				if (value instanceof AvaTestFile) {
					return value;
				} else {
					return this.populateFolder(value, key, join(path, key));
				}
			})
		)
		this.folderIndex[pathTrailingSep] = folder;
		return folder;
	}

	private handleTestStatusForTree(tree: AvaTestFolder | AvaTestFile, root = false) : Thenable<void>{
		if (tree instanceof AvaTestFile) {
			return this.handleTestStatusForFile(tree.path);
		} else {
			return Bromise.all([
				this.handleTestStatusFolder(tree, root),
				Bromise.map(tree.content, (subtree: AvaTestFolder | AvaTestFile) => this.handleTestStatusForTree(subtree))
			]).then(() => {});
		}
	}
	private handleTestStatusForFile(path: string) {
		return getTestResultForFile(this.cwd, path)
			.then(testResults => {
				if (testResults) {
					const timestampComment = testResults.comments[testResults.comments.length - 1];
					const timestamp = new Date(timestampComment.raw);
					testResults.asserts.forEach(assert => {
						const testTitle = testResults.tests[assert.test - 1].name
						const indexForPath = this.testIndex[encodeFilePath(path)]
						if (indexForPath && indexForPath[testTitle]) {
							const test: AvaTest = indexForPath[testTitle];
							if (!test.timestamp || test.timestamp <= timestamp) {
								test.status = assert.ok;
								test.timestamp = timestamp;
							}
						}
					})
				}
			}
			)
	}
	private handleTestStatusFolder(folder: AvaTestFolder, global = false) {
		const arg = global ? undefined : folder.path
		return getTestResultForFile(this.cwd, arg)
			.then(testResults => {
				if (testResults) {
					const timestampComment = testResults.comments[testResults.comments.length - 1];
					const timestamp = new Date(timestampComment.raw);
					testResults.asserts.forEach(assert => {

						const testTitle = testResults.tests[assert.test - 1].name
						const test: AvaTest = folder.testIndex[testTitle];
						if (test && (!test.timestamp || test.timestamp <= timestamp)) {
							test.status = assert.ok;
							test.timestamp = timestamp;
						}
					})
				}
			}
			).catch(console.error)
	}

	updateStatus(): Thenable<void> {
		return this.handleTestStatusForTree(this.rootFolder, true)
			.then(() => { this.notifyChange() })
	}

	watchStatus() {
		this.testWatcher = chokidar.watch('/tmp/vscode-ava/*', {
			persistent: true,
			ignoreInitial: true,
			awaitWriteFinish: true
		});
		const changeCallback = (path: string) => {
			const match = new RegExp(`/tmp/vscode-ava/tests-${encodeFilePath(this.cwd)}-(.*)-exec.tap`).exec(path)
			if (match) {
				if (match[1] === 'ALL') {
					this.handleTestStatusFolder(this.rootFolder, true)
						.then(() => { this.notifyChange() });
				} else {
					const file = match[1].replace(/__slash__/g, sep);
					const folder = this.folderIndex[file];
					if (folder) {
						this.handleTestStatusFolder(folder)
							.then(() => { this.notifyChange() });
					} else {
						this.handleTestStatusForFile(match[1])
							.then(() => { this.notifyChange() });
					}
				}
			}
		}
		this.testWatcher.on('change', changeCallback);
		this.testWatcher.on('add', changeCallback);
	}

	stopWatch() {
		if (this.testWatcher)
			this.testWatcher.close();
	}

}
