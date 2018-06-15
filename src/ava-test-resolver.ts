import * as mock from 'mock-require';
import * as path from 'path';
import * as globby from 'globby'
import * as AvaFiles from 'ava/lib/ava-files';
import { AvaTest } from './ava-test'

export const getAllTestFiles = async (cwd: String, files: String[] | undefined) => {
	const candidateFiles = files || await globby(['**/*'], { cwd, ignore: ['node_modules/**'] })
	const avafileMatcher = new AvaFiles({ cwd });
	return candidateFiles.filter(filePath => avafileMatcher.isTest(filePath))
}

export const getTestFromFile = async (cwd: String, file: String): Promise<AvaTest[]> => {
	const testList: AvaTest[] = []
	mock('ava', {
		test: function (command: String) {
			testList.push(new AvaTest(command))
		}, apply: (subject: String, args: Array<any>) => {
			testList.push(new AvaTest(`apply: ${args[0]}`))
		}
	});

	require(`${cwd}/${file}`); // find a better way? (eval? haha) // move in another context?
	return testList;
}