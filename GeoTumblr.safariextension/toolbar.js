var crawlInterval = null;

console.log("GeoTumblr Toolbar Activated!");

populateBookmarks();
updateDisabled();

$('#batchButton').click(function() {
	if (localStorage.getItem("batchCrawl") == "true" || $(this).hasClass('active')) {
		if ($(this).hasClass('active')) {
			$(this).removeClass('active');
			localStorage.removeItem("batchIsCrawling");
			clearInterval(crawlInterval);
		} else {
			localStorage.setItem("batchIsCrawling", "true");
			$(this).addClass('active');
			crawlInterval = setInterval(function(){
				messageActiveTab("batchAdvanceCrawl");
				console.log("crawlInterval");
			}, 500);
			messageActiveTab("batchEditPosts");
		}
	} else {
		messageActiveTab("batchEditPosts");
	}
});
$('#fnrButton').click(function() {
	if ($(this).hasClass('disabled') == false) messageActiveTab("findAndReplaceTag");
});
$('#addButton').click(function() {
	if ($(this).hasClass('disabled') == false) messageActiveTab("addTags");
});
$('#removeButton').click(function() {
	if ($(this).hasClass('disabled') == false) messageActiveTab("removeTags");
});
$('#markButton').click(function() {
	messageActiveTab("markPost");
});
$('#bookmarks').change(function() {
	if ($(this).val() != "") messageActiveTab("goToMark", $(this).val());
});

if (window.addEventListener) {
	window.addEventListener("storage", refreshStorage, false);
} else {
	window.attachEvent("onstorage", refreshStorage);
}

function parseVal(val) {
	if (val === "true") return true;
	if (val === "false") return false;
	if (val === "" || val === undefined) return null;
	return val;
}
function refreshStorage() {
	populateBookmarks();
	updateDisabled();
}
function populateBookmarks() {
	$('#bookmarks option').each(function() {
		if ($(this).val() != "") $(this).remove();
	});
	var bookmarks = new Array();
	for (var i = 0; i < 10; i++) {
		var mark = localStorage.getItem("bookmark"+i);
		if (mark) bookmarks.push(mark);
	}
	bookmarks.sort().reverse();
	for (var i = 0; i < bookmarks.length; i++) {
		var mark = bookmarks[i];
		if (mark) $('#bookmarks').append('<option value="'+mark+'">'+mark+'</option>');
	}
	if ($('#bookmarks option').length > 1) {
		$('#bookmarks').prop('disabled', false);
	} else {
		$('#bookmarks').prop('disabled', true);
	}
}
function updateDisabled() {
	var find = localStorage.getItem("tagsFind");
	var replace = localStorage.getItem("tagsReplace");
	var add = localStorage.getItem("tagsAdd");
	var remove = localStorage.getItem("tagsRemove");
	console.log(find+" && "+replace);
	if (find && replace) {
		$('#fnrButton').removeClass('disabled');
		$('#fnrButton').attr('title', 'Find "'+find+'" & Replace with "'+replace+'"');
	} else {
		$('#fnrButton').addClass('disabled');
		$('#fnrButton').attr('title', 'Find (undefined) & Replace with (undefined)');
	}
	if (add) {
		$('#addButton').removeClass('disabled');
		$('#addButton').attr('title', 'Add "'+add+'"');
	} else {
		$('#addButton').addClass('disabled');
		$('#addButton').attr('title', "Add (undefined)");
	}
	if (remove) {
		$('#removeButton').removeClass('disabled');
		$('#removeButton').attr('title', 'Remove "'+remove+'"');
	} else {
		$('#removeButton').addClass('disabled');
		$('#removeButton').attr('title', "Remove (undefined)");
	}
	var batch = "Batch Edit";
	var next = parseVal(localStorage.getItem("batchToNext"));
	var prev = parseVal(localStorage.getItem("batchToPrev"));
	if (next || prev) {
		if (next) batch += " (to next page";
		if (prev) batch += " (to previous page";
		if (parseVal(localStorage.getItem("batchCrawl"))) {
			batch += ", through remaining pages)";
		} else {
			batch += ")";
		}
	}
	$('#batchButton').attr('title', batch);
}
function supportsLocalStorage() {
	try {
		return 'localStorage' in window && window['localStorage'] !== null;
	} catch (e) {
		return false;
	}
}
function messageActiveTab(message, args) {
	safari.application.activeBrowserWindow.activeTab.page.dispatchMessage(message, args);
}