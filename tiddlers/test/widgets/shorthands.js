/*\
title: test/widgets/shorthands.js
type: application/javascript
tags: $:/tags/test-spec

Tests the <$visited> and <$first> widgets

\*/

describe("$cyoa only",function() {

var utils = require("test/utils.js");

it("renders first and visited long and shorthand",function() {
	var core = utils.testBook([
		utils.group("default","set",{variable: "test"}),
		{title: "Main","cyoa.touch": "Notouched Pretouched Never","cyoa.append": "Pretouched",text: `
			<$cyoa id=A only=first />
			<$cyoa id=B only=visited />
			<$cyoa id=C only=always />
			<$first id=D />
			<$visited id=E />`},
		{title: "Notouched","cyoa.only": "visited",text: "<$cyoa id=F/>"},
		{title: "Pretouched","cyoa.only": "visited","cyoa.append": "Never Prefirst",text: `
			<!-- This tiddler will already have been touched -->
			<$cyoa id=G only=first />
			<$cyoa id=H only=visited />
			<$cyoa id=I only=always />
			<$first id=J />
			<$visited id=K />`},
		{title: "Never","cyoa.only": "first",text: "<$cyoa id=L/>"},
		{title: "Prefirst","cyoa.only": "first",text: "<$cyoa id=M/>"}
	]);
	expect(utils.activeNodes(core)).toEqual(["A","C","D","H","I","K","M","Prefirst","Pretouched"]);
});

});
