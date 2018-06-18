import * as vscode from 'vscode';
import * as path from 'path';
import { getAllTestFiles, getTestFromFile, getTestResultForFile } from './ava-test-resolver'
import { AvaTest, AvaTestFile } from './ava-test';
import * as Bromise from 'bluebird';
import * as commonPathPrefix from 'common-path-prefix';

export class AvaTestState {

	testIndex: AvaTestFile[]
	testFiles: string[]
	constructor(public cwd: string) {
		this.testIndex = []
	}

	load(): Promise<void> {
		return getAllTestFiles(this.cwd).then(testFiles => {
			this.testFiles = testFiles;
			const prefix = commonPathPrefix(testFiles)
			return Bromise.map(testFiles, (path: string, index: Number) => {
				return Bromise.all([
					getTestFromFile(this.cwd, path, prefix),
					getTestResultForFile(path)
				])
					.then(
						([tests, testResults]) => {
							console.log('XXX')
							if (testResults) {
								const testDict = tests.reduce((acc, val) => {
									if (val.label) acc[val.label] = val;
									return acc;
								}, {})
								console.log(path, testDict, testResults)
								testResults.asserts.forEach(assert => {
									const testTitle = testResults.tests[assert.test - 1].name
									console.log(testTitle, testDict)
									testDict[testTitle].status = assert.ok
								})
							}
							return new AvaTestFile(`test file ${index}`, `${this.cwd}/${path}`, tests) // §todo: path .join
						}
					).catch(console.error)
			})
			.then(testIndex => {
				this.testIndex = testIndex;
			})
		})
	}

	updateStatus():void {

	}

}
