
var crawlInterval = null;

console.log("GeoTumblr Toolbar Activated!");

populateBookmarks();
updateDisabled();

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
function supportsLocalStorage() {
	try {
		return 'localStorage' in window && window['localStorage'] !== null;
	} catch (e) {
		return false;
	}
}
function messageActiveTab(n, m) {
	if (typeof safari !== 'undefined') {
		console.log("Safari dispatchMessage { "+n+": "+m+" }");
		safari.application.activeBrowserWindow.activeTab.page.dispatchMessage(n, m);
	} else if (typeof chrome !== 'undefined') {
		console.log("Chrome sendMessage updateSettings");
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {name: n, message: m}, function(response) {
				// console.log(response.farewell);
			});
		});
	}
}
