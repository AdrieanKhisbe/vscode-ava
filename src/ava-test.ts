export class AvaTest {
	constructor(public label: String){}

}

export class AvaTestFile {
	constructor(public label: String, public path: String, public tests: AvaTest[]){}
}