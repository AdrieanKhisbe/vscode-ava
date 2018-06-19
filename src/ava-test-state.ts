import * as vscode from 'vscode';
import { join } from 'path';
import { getAllTestFiles, getTestFromFile, getTestResultForFile, encodeFilePath} from './ava-test-resolver'
import { AvaTest, AvaTestFile } from './ava-test';
import * as Bromise from 'bluebird';
import * as chokidar from 'chokidar';
import * as commonPathPrefix from 'common-path-prefix';

export class AvaTestState {

	testFiles: AvaTestFile[];
	testFilePaths: string[];
	testIndex: Object;
	globalTestIndex: Object;
	private testWatcher;
	private readonly notifyChange
	constructor(public cwd: string, notifyChange?) {
		this.testIndex = [];
		this.testFilePaths = [];
		this.testFiles = [];
		this.globalTestIndex = {};
		this.notifyChange = notifyChange ? notifyChange : () => { }
	}

	load(): Promise<void> {
		return this.computeAvailableTests()
			.then((() => this.updateStatus()))
			.catch(console.error);
	}
	computeAvailableTests(): Promise<void> {
		return getAllTestFiles(this.cwd).then(testFiles => {
			this.testFilePaths = testFiles;
			const prefix = commonPathPrefix(testFiles)
			this.testIndex = {}
			this.globalTestIndex = {}
			return Bromise.map(testFiles, (path: string, index: Number) => {
				return getTestFromFile(this.cwd, path, prefix)
					.then(
						(tests: AvaTest[]) => {
							const testDict = tests.reduce((acc, val: AvaTest) => {
								if (val.label) acc[val.label] = val;
								if (val.avaFullTitle) this.globalTestIndex[val.avaFullTitle] = val;
								return acc;
							}, {})
							this.testIndex[encodeFilePath(path)] = testDict
							return new AvaTestFile(`test file ${index}`, this.cwd, path, tests)
						}
					).catch(console.error)
			})
				.then(testFiles => {
					this.testFiles = testFiles;
					this.notifyChange()
				})
		})
	}

	private handleTestStatusForFile(path?: string) {
		return getTestResultForFile(path)
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
			).catch(console.error)
	}
	private handleTestStatusGlobal() {
		return getTestResultForFile()
			.then(testResults => {
				if (testResults) {
					const timestampComment = testResults.comments[testResults.comments.length - 1];
					const timestamp = new Date(timestampComment.raw);
					console.log(timestampComment.raw, timestamp)
					testResults.asserts.forEach(assert => {

						const testTitle = testResults.tests[assert.test - 1].name
						const test: AvaTest = this.globalTestIndex[testTitle];
						console.log(testTitle, test)
						if (test && (!test.timestamp || test.timestamp <= timestamp)) {
							test.status = assert.ok;
							test.timestamp = timestamp;
						}
					})
				}
			}
			).catch(console.error)
	}

	updateStatus(): Promise<void> {
		return Promise.all([
			Bromise.map(this.testFilePaths,
				(path: string, index: Number) => this.handleTestStatusForFile(path)),
			this.handleTestStatusGlobal()
		]).then(() => { this.notifyChange() })
	}

	watchStatus() {
		this.testWatcher = chokidar.watch('/tmp/vscode-ava/*', {
			persistent: true,
			ignoreInitial: true,
			awaitWriteFinish: true
		});
		const changeCallback = path => {
			console.log(path)
			const match = /\/tmp\/vscode-ava\/tests-(.*)-exec.tap/.exec(path)
			if (match) {
				console.log(match)
				if (match[1] === 'ALL') {
					this.handleTestStatusGlobal()
						.then(() => { this.notifyChange() });
				} else {
					this.handleTestStatusForFile(match[1])
						.then(() => { this.notifyChange() });
				}
			}
		}
		this.testWatcher.on('change', changeCallback)
		this.testWatcher.on('add', changeCallback)
	}

	stopWatch() {
		if (this.testWatcher)
			this.testWatcher.close()
	}

}
