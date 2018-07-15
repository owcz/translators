
{
	"translatorID":"3f50aaac-7acc-4350-acd0-59cb77faf620",
	"translatorType":2,
	"label":"Wikipedia Citation Templates",
	"creator":"Simon Kornblith",
	"target":"txt",
	"minVersion":"1.0.0b4.r1",
	"maxVersion":"",
	"priority":100,
	"displayOptions":{"exportCharset":"UTF-8"},
	"browserSupport":"gcs",
	"inRepository":true,
	"lastUpdated":"2015-02-21 07:16:26"
}

/* TO DO
 - specify order of properties when construction citation
 - remove debug statements
 - remove commented out stuff in date function with impunity
 - remove formatDate
 - things just for me: * {{, |df=mdy-all |ref=harv }}, ezproxy
 - Not sure how to not let it run export on notes in Zotero
 - fix dependency on wikidata-sdk.min.j
 - set up JSTOR/PQ/EBSCO to put the db in the Archive field
 - set up "via" param to pull ESBSCO/etc. data from Zotero
 - add support for OCLC https://forums.zotero.org/discussion/56659?page=1#Item_7
 - Wikidata support for publication and author names
*/

var fieldMap = {
/*
Field definitions:	https://www.zotero.org/support/kb/item_types_and_fields
Field names:		https://www.zotero.org/support/dev/translators/framework
Wikipedia CS1:		https://en.wikipedia.org/wiki/Help:Citation_Style_1
*/

	edition:"edition",
	publisher:"publisher",
	conference:"conferenceName",
	volume:"volume",
	issue:"issue",
	pages:"pages",
	number:"episodeNumber",
	type:"thesisType",
	doi:"DOI",
	isbn:"ISBN",
	issn:"ISSN",
	via:"archive"
};

var typeMap = {
	book:"Cite book",
	bookSection:"Cite book",
	journalArticle:"Cite journal",
	magazineArticle:"Cite news",
	newspaperArticle:"Cite news",
	thesis:"Cite paper",
	letter:"Cite",
	manuscript:"Cite book",
	interview:"Cite interview",
	film:"Cite AV media",
	artwork:"Cite",
	webpage:"Cite web",
	report:"Cite conference",
	bill:"Cite",
	hearing:"Cite",
	patent:"Cite",
	statute:"Cite",
	email:"Cite email",
	map:"Cite",
	blogPost:"Cite web",
	instantMessage:"Cite",
	forumPost:"Cite web",
	audioRecording:"Cite",
	presentation:"Cite paper",
	videoRecording:"Cite AV media",
	tvBroadcast:"Cite episode",
	radioBroadcast:"Cite episode",
	podcast:"Cite podcast",
	computerProgram:"Cite",
	conferencePaper:"Cite conference",
	document:"Cite",
	encyclopediaArticle:"Cite encyclopedia",
	dictionaryEntry:"Cite encyclopedia"
};

function printWikiParam(param, contents) {
	Zotero.write(" |"+param+"="+contents);
}

// function just for me: if a work/journal has a specific title, add a specific Wikilink
function addPipedWikilink(title, titleWikilink, properties) {
	if ( (properties.journal == title) || (properties.work == title) ) {
		if (properties.journal == title)  properties.journal = "[["+titleWikilink+"|"+title+"]]";
		if (properties.work == title)  properties.work = "[["+titleWikilink+"|"+title+"]]";
	}
}

function doExport() {
	var first = true;
	while(item = Zotero.nextItem()) {
		// determine type
		var type = typeMap[item.itemType];
		Zotero.debug("item.itemType: "+item.itemType);
		if(!type) type = "Cite";
		
		var properties = new Object();
		
		for(var wikiField in fieldMap) {
			var zoteroField = fieldMap[wikiField];
			if(item[zoteroField]) properties[wikiField] = item[zoteroField];
		}
		
		// Begin citation
		Zotero.write((first ? "" : "\r\n") + "* {{"+type);
		// Write out "Creators": separates authors, editors, and translators; ignores contributors, reviewed authors
		if (item.creators[0]) {
			var allCreators = item.creators;
			//Zotero.debug("item.creators: "+item.creators);
			var authorCount = 1;
			var editorCount = 1;
			var translatorCount = 1;
			for (var i=0; i<allCreators.length; i++) {
				var currentCreator = allCreators[i];
				var currentCreatorType = ZU.getLocalizedCreatorType(currentCreator.creatorType);
				if (currentCreator.firstName) {
					if (currentCreatorType == "Author") {
						Zotero.write(' |last' + authorCount + '=' + currentCreator.lastName);
						Zotero.write(' |first' + authorCount + '=' + currentCreator.firstName);
						authorCount++;
					}
					if (currentCreatorType == "Editor") {
						Zotero.write(' |editor-last' + editorCount + '=' + currentCreator.lastName);
						Zotero.write(' |editor-first' + editorCount + '=' + currentCreator.firstName);
						editorCount++;
					}
					if (currentCreatorType == "Translator") {
						Zotero.write(' |translator-last' + translatorCount + '=' + currentCreator.lastName);
						Zotero.write(' |translator-first' + translatorCount + '=' + currentCreator.firstName);
						translatorCount++;
					}
				} else {
					if (currentCreatorType == "Author") {
						Zotero.write(' |author' + authorCount + '=' + currentCreator.lastName);
						authorCount++;
					}
					if (currentCreatorType == "Editor") {
						Zotero.write(' |editor' + editorCount + '=' + currentCreator.lastName);
						editorCount++;
					}
					if (currentCreatorType == "Translator") {
						Zotero.write(' |translator' + translatorCount + '=' + currentCreator.lastName);
						translatorCount++;
					}
				}
			}
		}
		
		/* THIS PART NEEDS TO BE RE-EVALUATED, WHETHER IT'S STILL RELEVANT
		if(item.creators && item.creators.length) {
			if(type == "Cite episode") {
				// now add additional creators
				properties.credits = formatAuthors(item.creators, true);
			} else if(type == "Cite AV media") {
				properties.people = "";
				
				// make first creator first, last
				properties.people = formatFirstAuthor(item.creators, true);
				// now add additional creators
				if(item.creators.length) properties.people += ", "+formatAuthors(item.creators, true);
				
				// use type
				if(item.type) {
					properties.medium = item.type;
				}
			} else if(type == "Cite email") {
				// get rid of non-authors
				for(var i=0; i<item.creators.length; i++) {
					if(item.creators[i].creatorType != "author") {
						// drop contributors
						item.creators.splice(i--, 1);
					}
				}
				
				// make first authors first, last
				properties.author = formatFirstAuthor(item.creators);
				// add supplemental authors
				if(item.creators.length) {
					properties.author += ", "+formatAuthors(item.creators);
				}
			} else if(type == "Cite interview") {
				// check for an interviewer or translator
				var interviewers = [];
				var translators = [];
				for(var i=0; i<item.creators.length; i++) {
					if(item.creators[i].creatorType == "translator") {
						translators.push(item.creators.splice(i--,1)[0]);
					} else if(item.creators[i].creatorType == "interviewer") {
						interviewers.push(item.creators.splice(i--,1)[0]);
					} else if(item.creators[i].creatorType == "contributor") {
						// drop contributors
						item.creators.splice(i--,1);
					}
				}
				
				// interviewers
				if(interviewers.length) {
					properties.interviewer = formatAuthors([interviewers.shift()]);
					if(interviewers.length) properties.cointerviewers = formatAuthors(interviewers);
				}
				// translators
				if(translators.length) {
					properties.cointerviewers = (properties.cointerviewers ? properties.cointerviewers+", " : "");
					properties.cointerviewers += formatAuthors(translators);
				}
				// interviewees
				if(item.creators.length) {
					// take up to 4 interviewees
					var i = 1;
					while((interviewee = item.creators.shift()) && i <= 4) {
						var lastKey = "last";
						var firstKey = "first";
						if(i != 1) {
							lastKey += i;
							firstKey += i;
						}
						
						properties[lastKey] = interviewee.lastName;
						properties[firstKey] = interviewee.firstName;
					}
				}
				// medium
				if(item.medium) {
					properties.type = item.medium
				}
			} else {
				// check for an editor or translator
				var editors = [];
				var translators = [];
				for(var i=0; i < item.creators.length; i++) {
					var creator = item.creators[i];
					if(creator.creatorType == "translator") {
						translators.push(item.creators.splice(i--,1)[0]);
					} else if(creator.creatorType == "editor") {
						editors.push(item.creators.splice(i--,1)[0]);
					} else if(creator.creatorType == "contributor") {
						// drop contributors
						item.creators.splice(i--, 1);
					}
				}
				
				// editors
				var others = "";
				if(editors.length) {
					var editorText = formatAuthors(editors)+(editors.length == 1 ? " (ed.)" : " (eds.)");
					if(item.itemType == "bookSection" || type == "Cite conference" || type == "Cite encyclopedia") {
						// as per docs, use editor only for chapters
						properties.editors = editorText;
					} else {
						others = editorText;
					}
				}
				// translators
				if(translators.length) {
					if(others) others += ", ";
					others += formatAuthors(translators)+" (trans.)";
				}
				
				// We need to be certain that these come out in the right order, so
				// deal with it when actually writing output
				if (item.creators.length) {
					properties.authors = item.creators.map(function(c) {
						return {
							last: c.lastName,
							first: c.firstName
						};
					});
				}
				
				// attach others
				if(others) {
					properties.others = others;
				}
			}
		}*/
		
		if(item.itemType == "bookSection") {
			properties.title = item.publicationTitle;
			properties.chapter = item.title;;
		} else {
			properties.title = item.title;
			
			if(type == "Cite journal") {
				properties.journal = item.publicationTitle;
			} else if(type == "Cite conference") {
				properties.booktitle = item.publicationTitle;
			} else if(type == "Cite encyclopedia") {
				properties.encyclopedia = item.publicationTitle;
			} else {
				properties.work = item.publicationTitle;
			}
		}
		
		if(item.place) {
			if(type == "Cite episode") {
				properties.city = item.place;
			} else {
				properties.location = item.place;
			}
		}
		
		if(item.series) {
			properties.series = item.series;
		} else if(item.seriesTitle) {
			properties.series = item.seriesTitle;
		} else if(item.seriesText) {
			properties.series = item.seriesText;
		}
		
		if(item.date) {
			if(type == "Cite email") {
				properties.senddate = formatDate(item.date);
			} else {
				properties.date = ZU.strToISO(item.date);
			}
			// Wikipedia doesn't accept yyyy-mm formats (as the mm can look like a year range), so convert to MMMM:
			var date = ZU.strToDate(properties.date);
			if ((date.year !== undefined) && (date.month !== undefined) && !date.day) {
				properties.date = item.date.toLocaleString("en-US", { month: "long" }); // e.g., April 1994
			}
		}
		
		if(item.runningTime) {
			if(type == "Cite episode") {
				properties.minutes = item.runningTime;
			} else {
				properties.time = item.runningTime;
			}
		}
		
		if(item.url) { ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			item.url = item.url.replace(/.ezproxy.library.wisc.edu/, '');
		}
	
		if(item.url /*&& item.accessDate*/) {
			if(item.itemType == "bookSection") {
				properties.chapterurl = item.url;
			} else {
				properties.url = item.url;
			}
		}

		if (properties.language) {
			item.language = properties.language;
		}
		
		if(properties.pages) {
			// Remove redundant ranges, e.g., 41–41, http://regexr.com/3dmss
			var pageRange = /(\d*)[–-](\d*)/.exec(properties.pages);
			// [0] is the full range, $1→[1] and $2→[2]
			if (pageRange && (pageRange[1] == pageRange[2])) { 
				properties.page = pageRange[1];
				properties.pages = null;
			} else if (pageRange) {
				//otherwise replace hyphen with en dash
				properties.pages = properties.pages.replace(/-/,"–")
			} else {
				//otherwise use "page" instead of "pages" for non-ranges
				properties.page = properties.pages;
				properties.pages = null;
			}
		}
		
		if(item.extra) {
			// automatically fill in PMCID, PMID, and JSTOR fields
			var extraFields={
				oclc: /^OCLC\s*\:\s*([0-9]+)/m,
				pmid: /^PMID\s*\:\s*([0-9]+)/m,
				pmc: /^PMCID\s*\:\s*((?:PMC)?[0-9]+)/m
			};
			
			for(var f in extraFields){
				var match = item.extra.match(extraFields[f]);
				if(match) properties[f] = match[1];
			}
		}
		
		if(item.url) {
			//try to extract missing fields from URL
			var libraryURLs={ 
				pmid:/www\.ncbi\.nlm\.nih\.gov\/pubmed\/([0-9]+)/i,
				pmc:/www\.ncbi\.nlm\.nih\.gov\/pmc\/articles\/((?:PMC)?[0-9]+)/i,
				jstor:/www\.jstor\.org\/stable\/([^?#]+)/i
			};
			
			for(var f in libraryURLs){
				if(properties[f]) continue; //don't overwrite from extra field
				var match = item.url.match(libraryURLs[f]);
				if(match) properties[f] = match[1];
			}
		}
		
		// Only include access dates for web citations
		if(item.accessDate && (type == "Cite web")) {
			properties.accessdate = ZU.strToISO(item.accessDate);
			///////////////////////////////////////////////////////////////// personal fix: also add dummy archive urls – this doesn't work so well
			/*if (properties.url) {
				var yyyymmdd = properties.accessdate.replace(/-/g, '').substring(0,8); 
				properties.archiveurl = "https://web.archive.org/web/"+yyyymmdd+"000000/"+properties.url;
				properties.archivedate = properties.accessdate;
				properties.deadurl = "no";
			}*/
		}
		
		// replace double quotes in title with single quotes (since the quotes are embedded)
		properties.title = properties.title.replace(/[“”"]/g, '\''); 
		
		// My special processing for adding wikilinks, since we're not doing Wikidata right now
		if (properties.journal || properties.work) {
			var linkAnyOfThese = ["Booklist","Library Journal","Publishers Weekly","Kirkus Reviews",
				"The New York Times","The Washington Post","The Huffington Post","Financial Times",
				"National Review","Moyers & Company","American Historical Review",
				"The Times Higher Education Supplement", "Journal of the History of Ideas","New Formations","Commonweal",
				"The Times Literary Supplement","Public Administration Review","London Review of Books",
				"Journal of American History","Boston Review","The Hedgehog Review","History News Network",
				"The New Republic","Bookforum","Contemporary Sociology","Ars Technica","IGN","PC Gamer",
				"Digital Spy","Rock, Paper, Shotgun","Metacritic","GameSpot","GameZone","VG247","IGN",
				"Kill Screen","Game Informer","GamesRadar","USgamer","Eurogamer","Yahoo Finance","CNN",
				"The Verge","Popular Science","Bloomberg.com","Refinery29","Gamasutra","VideoGamer.com",
				"Engadget","Digital Trends","Vice Motherboard","Destructoid","Hardcore Gamer",
				"Science & Society","The American Historical Review","New Statesman","Anarchist Studies",
				"Labour/Le Travail","Change: The Magazine of Higher Learning","History of Education Quarterly",
				"The Journal of Education","New York History","The Journal of American History",
				"The American Historical Review","American Journal of Education","New York Times Book Review",
				"Choice: Current Reviews for Academic Libraries","Times Higher Education","Labour / Le Travail",
				"New York Review of Books","The Annals of the American Academy of Political and Social Science",
				"Reviews in American History","Journal of American Studies","Times Higher Education Supplement",
				"Slavic Review","The Slavonic and East European Review","The Russian Review","Soviet Studies",
				"The Oral History Review","The Catholic Historical Review","The Journal of Modern History",
				"The New York Review of Books","Political Science Quarterly","Historische Zeitschrift",
				"The History Teacher","Canadian Journal of History","Peace & Change","Social Science History",
				"Virginia Quarterly Review","The Wilson Quarterly","American Studies International",
				"Michigan Law Review","Chronicle of Higher Education","The Register of the Kentucky Historical Society",
				"The New Leader","New York Times","New York Herald Tribune","The Kenyon Review","The Southern Review",
				"Review of Contemporary Fiction","The Village Voice","New Society","Magazine of Art","The Art Bulletin",
				"American Journal of Sociology","Land Economics","Journal of the American Institute of Planners",
				"Teachers College Record","The Journal of Higher Education","College Composition and Communication",
				"The Spectator","Harper's Magazine","The Phi Delta Kappan","The Georgia Review","Chicago Daily Tribune",
				"Artforum","The Review of Metaphysics","Saturday Review of Literature","Queen's Quarterly","Art in America",
				"Zzap!64", "Sinclair User", "Your Sinclair", "Computer and Video Games", "Retro Gamer",
				"Electronic Gaming Monthly", "The Guardian", "The Art Newspaper","Kotaku","Shacknews",
				"Official Xbox Magazine","GamesRadar","Saturday Review of Education","Education Digest",
				"The New York Times Book Review","Harvard Educational Review","American School Board Journal",
				"Chicago Tribune", "MCV UK", "British Educational Research Journal", "Journal of Communication",
				"Educational Researcher","The New Yorker","Journal of Interdisciplinary History","Journal of Psychohistory",
				"Journal of Contemporary History","Journal of Marriage & Family","Journal of Southern History",
				"Journal of Illinois History","The William and Mary Quarterly","Journal of Women's History",
				"Christian Century","History Teacher","Journal of Social History","The Economic History Review",
				"Review of Radical Political Economics","The Age","Democracy Now!","The Intercept","The Observer",
				"New Leader","The Nation","Village Voice","Theology Today","Partisan Review","The Sunday Telegraph",
				"World Literature Today","Los Angeles Times","Artnet News","ARTnews","Hyperallergic","Wall Street Journal",
				"Research in African Literatures","Third Text","The Slavonic and East European Review",
				"The American Historical Review","The Geographical Journal","The American Political Science Review",
				"American Slavic and East European Review","Journal of Political Economy","The Independent",
				"Psychology Today","The Daily Dot","Broadly","The Daily Beast","WorkingUSA","Anarcho-Syndicalist Review",
				"International Review of Social History","Journal of the American Academy of Religion","History Today",
				"Annals of the American Academy of Political and Social Science","The Chronicle of Higher Education",
				"The London Review of Books","The Times Educational Supplement","New Statesman & Society",
				"European History Quarterly","South China Morning Post","South China Sunday Morning Post",
				"Third World Quarterly","Heroes Never Die","GamesIndustry.biz","USA Today","CNNMoney","Recode",
				"Columbia Journalism Review","XLR8R","The Economist","AllThingsD","Recode","Mashable","DNAinfo",
				"FiveThirtyEight","The Atlantic","TheWrap","TechCrunch","Book Week","ROAR Magazine","Artsy", "OkayAfrica",
				"Times Live","Vancouver Sun", "The Architect's Newspaper"];
			for (var i=0; i<linkAnyOfThese.length; i++) {
				if (properties.journal == linkAnyOfThese[i])  properties.journal = "[["+linkAnyOfThese[i]+"]]";
				if (properties.work == linkAnyOfThese[i])  properties.work = "[["+linkAnyOfThese[i]+"]]";
			}
			// when it isn't as simple as adding brackets, works/journals that match $1 will be piped to $2
			addPipedWikilink("Dissent", "Dissent (American magazine)", properties);
			addPipedWikilink("Wired", "Wired (magazine)", properties);
			addPipedWikilink("Polygon", "Polygon (website)", properties);
			addPipedWikilink("International Affairs", "International Affairs (journal)", properties);
			addPipedWikilink("History", "History (journal)", properties);
			addPipedWikilink("TLS", "Times Literary Supplement", properties);
			addPipedWikilink("Nation", "The Nation", properties);
			addPipedWikilink("The Historian", "The Historian (journal)", properties);
			addPipedWikilink("Political Studies", "Political Studies (journal)", properties);
			addPipedWikilink("Social Anarchism", "Social Anarchism (journal)", properties);
			addPipedWikilink("RQ", "Reference and User Services Quarterly", properties);
			addPipedWikilink("African Arts", "African Arts (journal)", properties);
			addPipedWikilink("America", "America (Jesuit magazine)", properties);
			addPipedWikilink("Art Journal", "Art Journal (College Art Association journal)", properties);
			addPipedWikilink("Atlantic", "The Atlantic (magazine)", properties);
			addPipedWikilink("Billboard", "Billboard (magazine)", properties);
			addPipedWikilink("Body Politic", "The Body Politic (magazine)", properties);
			addPipedWikilink("Choice", "Choice: Current Reviews for Academic Libraries", properties);
			addPipedWikilink("Commentary", "Commentary (magazine)", properties);
			addPipedWikilink("Crash", "Crash (magazine)", properties);
			addPipedWikilink("Critical Sociology", "Critical Sociology (journal)", properties);
			addPipedWikilink("Environmental Politics", "Environmental Politics (journal)", properties);
			addPipedWikilink("Ethics", "Ethics (journal)", properties);
			addPipedWikilink("Fact", "Fact (UK magazine)", properties);
			addPipedWikilink("Fifth Estate", "Fifth Estate (periodical)", properties);
			addPipedWikilink("Fortune", "Fortune (magazine)", properties);
			addPipedWikilink("Frieze", "Frieze (magazine)", properties);
			addPipedWikilink("H-Net Reviews in the Humanities & Social Sciences", "H-Net Reviews", properties);
			addPipedWikilink("International Affairs (Royal Institute of International Affairs 1944-)", "International Affairs (journal)", properties);
			addPipedWikilink("Jezebel", "Jezebel (website)", properties);
			addPipedWikilink("Jacobin", "Jacobin (magazine)", properties);
			addPipedWikilink("Metro", "Metro (British newspaper)", properties);
			addPipedWikilink("Military Affairs", "Military Affairs (journal)", properties);
			addPipedWikilink("Nature", "Nature (journal)", properties);
			addPipedWikilink("Biography", "Biography (journal)", properties);
			addPipedWikilink("Labor History", "Labor History (journal)", properties);
			addPipedWikilink("American Studies", "American Studies (journal)", properties);
			addPipedWikilink("Human Rights", "Human Rights (journal)", properties);
			addPipedWikilink("Outside", "Outside (magazine)", properties);
			addPipedWikilink("Pitchfork", "Pitchfork (website)", properties);
			addPipedWikilink("Progressive", "The Progressive", properties);
			addPipedWikilink("New Republic", "The New Republic", properties);
			addPipedWikilink("Paste", "Paste (magazine)", properties);
			addPipedWikilink("Ruminator", "Ruminator Review", properties);
			addPipedWikilink("Salon", "Salon (website)", properties);
			addPipedWikilink("Time", "Time (magazine)", properties);
			addPipedWikilink("USA Today Magazine", "USA Today (magazine)", properties);
		}
		
		if (item.libraryCatalog == "EBSCOhost") {
			properties.via = "[[EBSCOhost]]";
		}
		if (item.libraryCatalog == "ProQuest") {
			properties.via = "[[ProQuest]]";
		}
		if (item.libraryCatalog == "Gale") {
			properties.via = "[[Gale (publisher)|Gale]]";
		}
		if (item.libraryCatalog == "LexisNexis") {
			properties.via = "[[LexisNexis]]";
		}
		if (item.libraryCatalog == "Project MUSE") {
			properties.via = "[[Project MUSE]]";
		}
		if (item.libraryCatalog == "Cambridge Journals Online") {
			properties.via = "[[Cambridge Journals Online]]";
		}
		if (item.libraryCatalog == "MIT Press Journals") {
			properties.via = "[[MIT Press|MIT Press Journals]]";
		}
		if (item.libraryCatalog == "Taylor and Francis+NEJM") {
			properties.via = "[[Taylor & Francis]]";
		}
		if (item.libraryCatalog == "www.highbeam.com"|"HighBeam") {
			properties.via = "[[HighBeam Research|HighBeam]]";
		}

		// write out these params in a specific order, if they exist
		var specificWikiParams = ["chapter", "title", "work", "journal", "volume", "issue", "page", "pages", "date", "year", "url", "language", "accessdate", "doi", "isbn", "issn", "via", "archiveurl", "archivedate", "deadurl"];
		for (var i=0; i<specificWikiParams.length; i++) {
			if (properties[specificWikiParams[i]]) {
				Zotero.debug(specificWikiParams[i]+": "+properties[specificWikiParams[i]]);
				printWikiParam(specificWikiParams[i],properties[specificWikiParams[i]]);
				delete properties[specificWikiParams[i]];
			}
		}

		// write out rest of properties
		for(var key in properties) {
			if (!properties[key]) continue;
			Zotero.write(" |"+key+"="+properties[key]);
		}
		Zotero.write(" |df=mdy-all }}");
		
		first = false;
	}
}
