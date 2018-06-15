import * as mock from 'mock-require';
import * as stackTrace from 'stack-trace';
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
			const st = stackTrace.get();
			testList.push(new AvaTest(command, st[1].getLineNumber()))
		}
	});

	require(`${cwd}/${file}`); // find a better way? (eval? haha) // move in another context?
	mock.stop('ava')
	return testList;
}