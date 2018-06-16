import { basename } from 'path';

export class AvaTest {
	file: String
	constructor(public label: string, public path: string, public line: number, public type: string, public status?: boolean) {
		this.file = basename(path)
	}

	get special() {
		return ['after', 'afterEach', 'before', 'beforeEach'].indexOf(this.type) !== -1
	}
	get iconStatus() {
		if (this.special) return 'special';
		if (this.status === undefined)
			return 'pending'
		return this.status ? 'passed' : 'failed'
	}
	public getDescription() {
		if (this.special) {
			return `<${this.type}>` + (this.label ? `: ${this.label}` : '')
		}
		return (this.label || '<anonymous test>') + ` status: ${this.status}`
	}
}

export class AvaTestFile {
	file: String
	constructor(public label: string, public path: string, public tests: AvaTest[]) {
		this.file = basename(path)
	}
	public getDescription() {
		return this.file;
	}

	get iconStatus() {
		const tests = this.tests.filter(t => !t.special);
		if (tests.some(t => t.status === undefined)) return 'pending';
		return tests.some(t => !t.status) ? 'failed' : 'passed';
	}
}