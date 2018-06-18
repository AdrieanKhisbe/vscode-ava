import * as vscode from 'vscode';
import * as path from 'path';
import { getAllTestFiles, getTestFromFile, getTestResultForFile } from './ava-test-resolver'
import { AvaTest, AvaTestFile } from './ava-test';
import * as Bromise from 'bluebird';
import * as commonPathPrefix from 'common-path-prefix';

export class AvaTestState {

	testFiles: AvaTestFile[]
	testFilePaths: string[]
	testIndex: Object
	globalTestIndex: Object
	constructor(public cwd: string) {
		this.testIndex = []
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
				})
		})
	}

	updateStatus(): Promise<void> {
		return Bromise.map(this.testFilePaths, (path: string, index: Number) => {
			return getTestResultForFile(path)
				.then(testResults => {
						if (testResults) {
							testResults.asserts.forEach(assert => {
								const testTitle = testResults.tests[assert.test - 1].name
								const indexForPath = this.testIndex[path]
								if(indexForPath && indexForPath[testTitle])
									indexForPath[testTitle].status = assert.ok
							})
						}
					}
				)
		})
	}

}
