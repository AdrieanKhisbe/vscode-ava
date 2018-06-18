import * as vscode from 'vscode';
import * as path from 'path';
import { getAllTestFiles, getTestFromFile, getTestResultForFile } from './ava-test-resolver'
import { AvaTest, AvaTestFile } from './ava-test';
import * as Bromise from 'bluebird';
import * as commonPathPrefix from 'common-path-prefix';

export class AvaTestState {

	testFiles: AvaTestFile[];
	testFilePaths: string[];
	testIndex: Object;
	globalTestIndex: Object;
	private readonly notifyChange
	constructor(public cwd: string, notifyChange?) {
		this.testIndex = [];
		this.testFilePaths=[];
		this.testFiles = [];
		this.globalTestIndex = {};
		this.notifyChange = notifyChange ? notifyChange : () => {}
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
							this.testIndex[path] = testDict
							return new AvaTestFile(`test file ${index}`, `${this.cwd}/${path}`, tests) // §todo: path .join
						}
					).catch(console.error)
			})
				.then(testFiles => {
					this.testFiles = testFiles;
					this.notifyChange()
				})
		})
	}

	updateStatus(): Promise<void> {
		const resolveSingleTestFiles = Bromise.map(this.testFilePaths, (path: string, index: Number) => {
			return getTestResultForFile(path)
				.then(testResults => {
						if (testResults) {
							const timestampComment = testResults.comments[testResults.comments.length - 1];
							const timestamp = new Date(timestampComment.raw);
							console.log(timestampComment.raw, timestamp)
							testResults.asserts.forEach(assert => {
				
								const testTitle = testResults.tests[assert.test - 1].name
								const indexForPath = this.testIndex[path]
								if(indexForPath && indexForPath[testTitle]) {
									const test: AvaTest = indexForPath[testTitle];
									if(!test.timestamp || test.timestamp <= timestamp) {
										test.status = assert.ok;
										test.timestamp = timestamp;
									}
								}
							})
						}
					}
				).catch(console.error)
		})
		const resolveCommonFiles = getTestResultForFile()
				.then(testResults => {
						if (testResults) {
							const timestampComment = testResults.comments[testResults.comments.length - 1];
							const timestamp = new Date(timestampComment.raw);
							console.log(timestampComment.raw, timestamp)
							testResults.asserts.forEach(assert => {
				
								const testTitle = testResults.tests[assert.test - 1].name
								const test: AvaTest = this.globalTestIndex[testTitle];
								console.log(testTitle, test)
								if(test && (!test.timestamp || test.timestamp <= timestamp)){
										test.status = assert.ok;
										test.timestamp = timestamp;
									}
							})
						}
					}
				).catch(console.error)
		return Promise.all([resolveSingleTestFiles, resolveCommonFiles]).then(() => { this.notifyChange()})
	}

}
