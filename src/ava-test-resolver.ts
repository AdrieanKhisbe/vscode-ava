import * as mock from 'mock-require';
import * as path from 'path';
import * as globby from 'globby'
import * as AvaFiles from 'ava/lib/ava-files';
import { AvaTest } from './ava-test'
import * as Bromise from 'bluebird';

export const getAllTestFiles = (cwd: String, files: String[] | undefined) => {
	return Bromise.resolve(files || globby(['**/*'], { cwd, ignore: ['node_modules/**'] })).then(
		(candidateFiles: String[]) => {
			const avafileMatcher = new AvaFiles({ cwd });
			console.log('yooo')
			return candidateFiles.filter(filePath => avafileMatcher.isTest(filePath))
		}
	).catch(console.log)
}

export const getTestFromFile = (cwd: String, file: String): AvaTest[] => {
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