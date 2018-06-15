export class AvaTest {
	constructor(public label: String, public line: number){
	}

}

export class AvaTestFile {
	constructor(public label: String, public path: String, public tests: AvaTest[]){}
}