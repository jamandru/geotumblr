var notify_colors = ["#e1fd58", "#a5edfe", "#eacffe", "#ffcbcb"];

$(document).ready(function() {

	console.log("GeoTumblr Popover Activated!");

	loadBlogsData();
	loadGlobalData();

	$('.alert a').click(function() {
		$('.nav-tabs a[href="'+$(this).attr('href')+'"]').click();
	});

	$('fieldset:not(.details) .group').each(function() {
		var id = $(this).find('input').attr('id');
		if (!id) id = $(this).find('textarea').attr('id');
		if (id) $(this).find('label').attr('for', id);
	});

	$('fieldset:not(.details) input:checkbox').click(function() {
		if (!supportsLocalStorage()) { return false; }
		if ($(this).is(':checked')) {
			localStorage.setItem($(this).attr('id'), "true");
		} else {
			localStorage.setItem($(this).attr('id'), "false");
		}
	});

	$('fieldset:not(.details) select').change(function() {
		if (!supportsLocalStorage()) { return false; }
		localStorage.setItem($(this).attr('id'), $(this).val());
	});

	$('fieldset:not(.details) input:text:not(.color)').blur(function() {
		if (!supportsLocalStorage()) { return false; }
		localStorage.setItem($(this).attr('id'), $(this).val());
	});

	$('fieldset:not(.details) textarea').blur(function() {
		if (!supportsLocalStorage()) { return false; }
		cleanUpTags($(this), true);
		localStorage.setItem($(this).attr('id'), $(this).val());
	});

	$('#addBlogButton').click(function() {
		var id = $('#blogs .blog').length;
		if (id < 10) initBlog(id);
		$('#blogs').scrollTop();
		$('#blogs').scrollTop($('#blog'+id).offset().top - $('#blogs').offset().top);
		toggleSortable();
	});

	$('#deleteSettingsButton').click(function() {
		localStorage.clear();
		location.reload();
	});

	$('fieldset:not(.details) .radiocb input:checkbox').change(function() {
		if ($(this).prop('checked') == true) {
			$(this).parent().siblings().find('input:checkbox').each(function() {
				if ($(this).prop('checked') == true) $(this).click();
			});
		}
	});

	$('input.mark').change(function() {
		if ($(this).prop('checked') == true) {
			$(this).parent().parent().find('.color').show();
		} else {
			$(this).parent().parent().find('.color').hide();
		}
	});

	$('input.color').blur(function() {
		var default_color = $(this).data("default_color");
		if (!supportsLocalStorage()) { return false; }
		if ($(this).val() == "" || $(this).val() == default_color) {
			localStorage.removeItem($(this).attr('id'));
			$(this).val(default_color);
		} else {
			localStorage.setItem($(this).attr('id'), $(this).val());
		}
		if ($(this).val()) $(this).css('background-color', $(this).val());
	});

	$('#reblogPostAs').change(function() {
		var val = $(this).val();
		if (val == "schedule") {
			$('#reblogSchedule').show();
			if ($('#reblogSchedule').val() == "") {
				$('#reblogSchedule').val(defaultSchedule());
			}
		} else {
			$('#reblogSchedule').hide();
		}
	});

	$('#viewHideFollowing').change(function() {
		if ($(this).prop('checked') == true) {
			$('#viewHideFollowingSelf').parent().show();
		} else {
			$('#viewHideFollowingSelf').parent().hide();
		}
	});

	$('.numeric').keypress(function (e) {
		// if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
		// 	return false;
		// }
	});

});

if (window.addEventListener) {
	window.addEventListener("storage", handleStorage, false);
} else {
	window.attachEvent("onstorage", handleStorage);
};

function supportsLocalStorage() {
	try {
		return 'localStorage' in window && window['localStorage'] !== null;
	} catch (e) {
		return false;
	}
}

function handleStorage(e) {
	console.log("Storage Changed!");
	if (!e) { e = window.event; }
}

function parseVal(val) {
	if (val === "true") return true;
	if (val === "false") return false;
	if (val === "" || val === undefined) return null;
	return val;
}

function clearUnusedBlogsData(n) {
	if (!supportsLocalStorage()) { return false; }
	for (var i = n; i <= 10; i++) {
		localStorage.removeItem("blog"+i+".userName");
	};
	if (n==0) { localStorage.removeItem("blogsTotal"); }
}

function saveBlogsData() {
	if (!supportsLocalStorage()) { return false; }
	var total = $('#blogs .blog').length;
	clearUnusedBlogsData(total);
	localStorage.setItem("blogsTotal", total.toString());
	for (var i = 0; i < total; i++) {
		var userName = $("#blog"+i+' input.userName').val();
		localStorage.setItem("blog"+i+".userName", userName);
			$('#blog'+i+' .title').text(userName);
	};
	toggleReblogOptions();
}

function loadGlobalData() {
	if (!supportsLocalStorage()) { return false; }
	$('fieldset:not(.details) input:checkbox').each(function() {
		$(this).prop('checked', parseVal(localStorage.getItem($(this).attr('id'))));
	});
	$('fieldset:not(.details) input:text, fieldset:not(.details) textarea, fieldset:not(.details) select').each(function() {
		var val = localStorage.getItem($(this).attr('id'));
		if (val) $(this).val(val);
	});
	if ($('#reblogPostAs').val() == "schedule") {
		$('#reblogSchedule').show();
		if ($('#reblogSchedule').val() == "") {
			$('#reblogSchedule').val(defaultSchedule());
		}
	} else {
		$('#reblogSchedule').hide();
	}
	if ($('#viewHideFollowing').prop('checked')) {
		$('#viewHideFollowingSelf').parent().show();
	} else {
		$('#viewHideFollowingSelf').parent().hide();
	}
	$('input.color').each(function(i) {
		$(this).data("default_color", notify_colors[i]);
		if ($(this).val() == "") $(this).val(notify_colors[i]);
		if ($(this).val()) $(this).css('background-color', $(this).val());
		if ($(this).parent().find('input.mark').prop('checked') == false) $(this).hide();
	});
}

function loadBlogsData() {
	if (!supportsLocalStorage()) { return false; }
	var total = parseInt(localStorage.getItem("blogsTotal"));
	if (!total) {
		setDefaultValues();
		total = parseInt(localStorage.getItem("blogsTotal"));
	}
	if (total > 0) {
		for (var i = 0; i < total; i++) {
			// create a new element
			initBlog(i);
			// get details
			var userName = localStorage.getItem("blog"+i+".userName");
			// fill in details
			$('#blog'+i+' .key').text(i+1);
			if (i == 9) $('#blog'+i+' .key').text("0");
			$('#blog'+i+' .title').text(userName);
			$('#blog'+i+' input.userName').val(userName);
			$('#blog'+i+' input').blur();
			// close details
			var $myBlog = $('#blog'+i);
			$myBlog.removeClass('open');
			$myBlog.find('.details').hide();
		}
		initSortable();
		$('#blogs').scrollTop(0);
	}
	toggleReblogOptions();
	toggleSortable();
}

function setDefaultValues() {
	if (!supportsLocalStorage()) { return false; }

	console.log("setDefaultValues");

	var defaultBlogs = ["lifeisgood", "postmastergeneral", "daddylikes", "immatour"];

	var total = defaultBlogs.length;
	localStorage.setItem("blogsTotal", total.toString());
	for (var i = 0; i < total; i++) {
		localStorage.setItem("blog"+i+".userName", defaultBlogs[i]);
	}

	localStorage.setItem("viewFocusGlow", true);
	localStorage.setItem("viewHideMine", true);
	localStorage.setItem("viewHideReblog", true);
	localStorage.setItem("viewHideLiked", true);
	localStorage.setItem("viewHideFollowing", true);
	localStorage.setItem("viewSidebarMin", true);
	localStorage.setItem("viewSidebarFix", true);
	localStorage.setItem("viewHideRecommended", true);
	localStorage.setItem("viewHideSponsored", true);

	localStorage.setItem("reblogPostAs", "queue");
	localStorage.setItem("reblogAutoSubmit", true);
	localStorage.setItem("reblogAutoLike", true);
}

function toggleReblogOptions() {
	var total = parseInt(localStorage.getItem("blogsTotal"));
	if (total > 0) {
		$('#options_reblog').removeClass('disabled');
		$('#options_reblog select, #options_reblog input').prop('disabled', false);
	} else {
		$('#options_reblog').addClass('disabled');
		$('#options_reblog select, #options_reblog input').prop('disabled', true);
	}
}

function defaultSchedule() {
	var day = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][(new Date()).getDay()].toLowerCase();
	return "next "+day+", 10am";
}

function initBlog(id) {
	var newBlog = "blog"+id;
	$('#keys').show();
	$('#blank').clone().attr("id", newBlog).appendTo($('#keys'));
	if (id == 9) {
		$('#'+newBlog+' .key').text("0");
	} else {
		$('#'+newBlog+' .key').text(id+1);
	}
	$('#'+newBlog+' input.userName').focus();
	// edit/save button actions
	$('#blog'+id+' .btn.edit').click(function() {
		var $myBlog = $(this).parent().parent().parent();
		if ($myBlog.hasClass('open')) {
			// save
			var userName = $myBlog.find('input.userName').val().trim();
			if (userName != "") {
				$myBlog.find('.title').text(userName);
				$myBlog.find('input.userName').val(userName);
			}
			$myBlog.find('textarea').each(function () {
				cleanUpTags($(this));
			});
			saveBlogsData();
			// close
			$myBlog.removeClass('open');
			$myBlog.find('.details').hide();
		} else {
			// open
			$myBlog.addClass('open');
			$myBlog.find('.details').show();
		}
		toggleSortable();
	});
	// remove button actions
	$('#blog'+id+' .btn.delete').click(function() {
		var $myBlog = $(this).parent().parent().parent();
		$myBlog.remove();
		var total = $('#blogs .blog').length;
		reorderBlogs();
		saveBlogsData();
		toggleSortable();
	});
	// hit return on username saves blog data
	$('#blog'+id+' .username').keydown(function(e) {
		// console.log("keydown "+e.which);
		if (e.which == 13) { // Enter
			var $myBlog = $(this).parent().parent().parent();
			$myBlog.find('.btn.edit').click();
		}
	});
}

var sortableActivated = false;

function initSortable() {
	// $('#keys').sortable("destroy");
	$('#keys').sortable({
		cursor: "move",
		placeholder: "sortable-placeholder",
		forcePlaceholderSize: true,
		start: function(e, ui) {
			ui.placeholder.css("height", ui.item.height()+2+"px");
		},
		change: function(e, ui) {
			var pt = ui.placeholder.offset().top;
			$('#blogs .blog:not(.ui-sortable-helper)').each(function(i) {
				if ($(this).offset().top > pt) var i = i+1;
				$(this).find('.key').text(i+1);
				if (i+1 == 10) $(this).find('.key').text("0");
			});
			var pi = ui.placeholder.index();
			var ii = ui.item.index();
			if (pi < ii) {
				ui.item.find('.key').text(pi+1);
			} else {
				ui.item.find('.key').text(pi);
			}
			if (ui.item.find('.key').text() == 10) ui.item.find('.key').text("0");
		},
		update: function(e, ui) {
			reorderBlogs();
			saveBlogsData();
		}
	});
	sortableActivated = true;
}

function toggleSortable() {
	var tb = $('#blogs .blog').length;
	var to = $('#blogs .blog.open').length;
	if (sortableActivated) {
		if (tb > 1 && to == 0) {
			$('#keys').sortable("enable");
		} else {
			$('#keys').sortable("disable");
		}
	}
	if (tb < 10) {
		$('#addBlogButton').show();
	} else {
		$('#addBlogButton').hide();
	}
}

function reorderBlogs() {
	$('#blogs .blog').each(function(){
		var i = $(this).index();
		if (i == 9) {
			$(this).find('.key').text("0");
		} else {
			$(this).find('.key').text(i+1);
		}
		$(this).attr('id', "blog"+i);
	});
}
