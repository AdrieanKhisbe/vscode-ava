import { basename } from 'path';

export class AvaTest {
	file: String
	constructor(public label: string, public path: string, public line: number, public type: string, public status?: boolean) {
		this.file = basename(path)
	}
	public getDescription() {
		if (['after', 'afterEach', 'before', 'beforeEach'].indexOf(this.type) !== -1) {
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
}