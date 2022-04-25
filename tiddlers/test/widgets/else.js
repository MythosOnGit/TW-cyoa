/*\
title: test/widgets/else.js
type: application/javascript
tags: $:/tags/test-spec

Tests the <$else> and <$cyoa else> widgets

\*/

describe("$else and $cyoa-else",function() {

var utils = require("test/utils.js");

it("renders else shorthand",function() {
	var core = utils.testBook([
		{title: "Main",text: `
			<$cyoa id=A /><$else id=B />
			<$cyoa id=C if=false/><$else id=D/>`}]);
	expect(utils.activeNodes(core)).toEqual(["A","D"]);
});

it("handles else blocks",function() {
	var core = utils.testBook([{title: "Main",text: `
		<$cyoa id=A else/><!-- else before nothing runs -->
		<$cyoa id=B if=true/>
		<$cyoa id=C if=true/>
		<$cyoa id=D if=false else/>
		<$cyoa id=E else/>
		<$cyoa id=F if=true/>
		<$cyoa id=G if=true else/>
		<$cyoa id=H/>
		<$cyoa id=I else/>
		
		<!-- Now we test else blocks and nesting -->
		<$cyoa id=J/>  <$cyoa id=K><$cyoa id=L else/></$cyoa>
		<$cyoa id=M if=true ><$cyoa id=N if=false/></$cyoa> <$cyoa id=O else/>
		<$cyoa id=P if=false><$cyoa id=Q if=true /></$cyoa> <$cyoa id=R else/>

		<!-- Now test in arbitrary nesting -->
		<$cyoa id=S if=false/>
		<p><$cyoa id=T/></p>
		<$cyoa id=U else/>

		<$cyoa id=V/>
		<div><p><$cyoa id=W else/></p></div>
	`}]);
	expect(utils.activeNodes(core)).toEqual(["A","B","C","F","H","J","K","L","M","R","T","V"]);
});

it('respects indexing',function() {
	var core = utils.testBook([{title: "Main",text: `
		<$cyoa id=A index=1>
			<$cyoa id=B/>
			<$cyoa id=C else/>
			<$cyoa id=D/>
		</$cyoa>
	`}]);
	expect(utils.activeNodes(core)).toEqual(["A","D"]);
});

});
