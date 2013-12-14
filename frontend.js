function outline() {

var url = document.getElementById("url_input").value;
var text = document.getElementById("direct_input").value;
var output = document.getElementById("output");
output.innerHTML = "";

// Options
var deep = document.getElementById("deep_outline").checked;
var XML = document.getElementById("xml_parser").checked;

// Direct input first
if(text) {
	processInput(text);
} else {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.onload = function() {
		processInput(xhr.responseText);
	};
	// output.innerHTML = "<p>Fetching URL…</p>";
	xhr.send(null);
}

function processInput(source) {
	try {
		var node;
		if(XML) {
			try{
				node = parseXML(source);
			} catch(parserError) {
				if(!(parserError instanceof Node)) throw new Error("Invalid XML"); // Explorer
				var errorDiv = parserError.getElementsByTagName("div")[0]; // WebKit
				if(!errorDiv) errorDiv = parserError; // Mozilla, Opera
				var error = new Error(errorDiv.textContent);
				var match = errorDiv.textContent.match(/line\s(\d+)/);
				if(match) error.line = parseInt(match[1]) - 1;
				match = errorDiv.textContent.match(/column\s(\d+)/);
				if(match) error.column = parseInt(match[1]) - 1;
				throw error;
			}
		} else {
			try {
				node = parseHTML(source);
			} catch(error) {
				throw new Error("This browser could not parse HTML input");
			}
		}
		processNode(node);
	} catch(error) {
		output.appendChild(printError(error, source));
	}
}

function processNode(node) {
	var body = getBody(node);
	
	// Make outline
	HTMLOutline(body);
	
	if(!deep) output.appendChild(printOutline(body.sectionList));
	else {
		var roots = getSectioningRoots(body);
		for(var i = 0; i < roots.length; i++) {
			output.appendChild(printOutline(roots[i].sectionList));
		}
	}
}

function getBody(node) {
	if(node.nodeType === 9) {
		var body = node.getElementsByTagName("body")[0];
		if(body === undefined) {
			body = node.createElement("body");
			while(node.childNodes.length > 0) {
				if(node.childNodes[0].nodeType === 10) node.removeChild(node.childNodes[0]);
				else body.appendChild(node.childNodes[0]);
			}
		}
		return body;
	} else if(node.nodeType === 11) {
		for(var i = 0; i < node.childNodes.length; i++) {
			if(node.childNodes[i].nodeType !== 1) continue;
			if(node.childNodes[i].nodeName.toLowerCase() === "body") return node.childNodes[i];
			var body = node.childNodes[i].getElementsByTagName("body")[0];
			if(body !== undefined) return body;
		}
		var body = node.ownerDocument.createElement("body");
		body.appendChild(node);
		return body;
	}
}

function printOutline(outline) {
	var ol = document.createElement("ol");
	ol.className = "outline";
	for(var i = 0; i < outline.length; i++) {
		ol.appendChild(printSection(outline[i]));
	}
	return ol;
}

function printSection(section) {
	var li = document.createElement("li");
	var title = document.createElement("span");
	title.className = "sec_title";
	li.appendChild(title);
	
	if(section.heading === null) {
		switch(section.associatedNodes[0].nodeName.toLowerCase()) {
			case "blockquote": title.textContent = "Quoted content"; break;
			case "body": title.textContent = "Document"; break;
			case "details": title.textContent = "Widget"; break;
			case "dialog": title.textContent = "Application"; break;
			case "fieldset": title.textContent = "Form controls"; break;
			case "figure": title.textContent = "Figure"; break;
			case "td": title.textContent = "Data cell"; break;
			case "article": title.textContent = "Article"; break;
			case "aside": title.textContent = "Sidebar"; break;
			case "nav": title.textContent = "Navigation"; break;
			case "section": title.textContent = "Section"; break;
		}
		title.className += " no_title";
	} else {
		title.textContent = section.heading.text;
	}
	
	var details = document.createElement("span");
	details.className = "details";
	var s = "<code>";
	if(section.explicit) s += "&lt;" + section.associatedNodes[0].nodeName.toLowerCase() + "&gt;";
	if(section.heading) s += "&lt;h" + (-section.heading.rank) + "&gt;";
	s += "</code>";
	details.innerHTML = s;
	li.appendChild(details);
	
	li.appendChild(printOutline(section.childSections));
	return li;
}

function printError(error, source) {
	var div = document.createElement("div");
	div.innerHTML = "<h4>Error!</h4>";
	var p = document.createElement("p");
	p.className = "error";
	p.textContent = error.message;
	div.appendChild(p);
	if(error.line !== undefined) {
		var line = source.split("\n")[error.line];
		if(line !== undefined) {
			p = document.createElement("pre");
			if(error.column !== undefined) {
				var caret = document.createElement("span");
				caret.className = "error_caret";
				caret.textContent = line.length > error.column ? line.charAt(error.column) : " ";
				p.appendChild(document.createTextNode(line.substring(0,error.column)));
				p.appendChild(caret);
				p.appendChild(document.createTextNode(line.substring(error.column+1)));
			} else p.textContent = line;
			div.appendChild(p);
		}
	}
	return div;
}

function getSectioningRoots(body) {
	var roots = new Array();
	var node = body;
	start: while(node) {
		if(node.sectionType === 2) roots.push(node);
		if(node.firstChild) {
			node = node.firstChild;
			continue start;
		}
		while(node) {
			if(node === body) break start;
			if(node.nextSibling) {
				node = node.nextSibling;
				continue start;
			}
			node = node.parentNode;
		}
	}
	return roots;
}

}

