var notify_colors = ["#e1fd58", "#a5edfe", "#eacffe", "#ffcbcb"];

$(document).ready(function() {

	console.log("GeoTumblr Popover Activated!");

	loadGlobalData();
	loadBlogsData();

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

	$('#toolbar input:checkbox').change(function() {
		advancedBatch();
	});

	$('#toolbar input:text, #toolbar textarea').blur(function() {
		advancedBatch();
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
		localStorage.removeItem("blog"+i+".description");
		localStorage.removeItem("blog"+i+".tagsCommon");
		localStorage.removeItem("blog"+i+".tagsAdd");
		localStorage.removeItem("blog"+i+".placeSignature");
		localStorage.removeItem("blog"+i+".signature");
		localStorage.removeItem("blog"+i+".useCustom");
		localStorage.removeItem("blog"+i+".customPostAs");
		localStorage.removeItem("blog"+i+".customSchedule");
		localStorage.removeItem("blog"+i+".customAutoSubmit");
		localStorage.removeItem("blog"+i+".customAutoLike");
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
		var description = $("#blog"+i+' input.description').val();
		var tagsCommon = $("#blog"+i+' textarea.tagsCommon').val();
		var tagsAdd = $("#blog"+i+' textarea.tagsAdd').val();
		var placeSignature = $("#blog"+i+' .signature input:checkbox:checked').attr('class');
		var signature = $("#blog"+i+' .signature textarea').val();
		var useCustom = $("#blog"+i+' .reblogOptions input:radio:checked').val();
		localStorage.setItem("blog"+i+".userName", userName);
		localStorage.setItem("blog"+i+".description", description);
		localStorage.setItem("blog"+i+".tagsCommon", tagsCommon);
		localStorage.setItem("blog"+i+".tagsAdd", tagsAdd);
		localStorage.setItem("blog"+i+".tagsAdd", tagsAdd);
		localStorage.setItem("blog"+i+".useCustom", useCustom);
		if (!placeSignature) {
			localStorage.removeItem("blog"+i+".placeSignature");
			// localStorage.removeItem("blog"+i+".signature");
			// $("#blog"+i+' .signature textarea').val("");
		} else {
			localStorage.setItem("blog"+i+".placeSignature", placeSignature);
			localStorage.setItem("blog"+i+".signature", signature);
		}
		if (description) {
			$('#blog'+i+' .title').text(description);
		} else {
			$('#blog'+i+' .title').text(userName);
		}
		if (parseVal(useCustom)) {
			var customPostAs = $("#blog"+i+' .reblogOptions select.customPostAs').val();
			var customSchedule = $("#blog"+i+' .reblogOptions input.customSchedule').val();
			localStorage.setItem("blog"+i+".customPostAs", customPostAs);
			localStorage.setItem("blog"+i+".customSchedule", customSchedule);
			if ($("#blog"+i+' .reblogOptions input.customAutoSubmit').is(':checked')) {
				localStorage.setItem("blog"+i+".customAutoSubmit", "true");
			} else {
				localStorage.setItem("blog"+i+".customAutoSubmit", "false");
			}
			if ($("#blog"+i+' .reblogOptions input.customAutoLike').is(':checked')) {
				localStorage.setItem("blog"+i+".customAutoLike", "true");
			} else {
				localStorage.setItem("blog"+i+".customAutoLike", "false");
			}
		} else {
			localStorage.removeItem("blog"+i+".customPostAs");
			localStorage.removeItem("blog"+i+".customSchedule");
			localStorage.removeItem("blog"+i+".customAutoSubmit");
			localStorage.removeItem("blog"+i+".customAutoLike");
		}
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
	advancedBatch();
}

function loadBlogsData() {
	if (!supportsLocalStorage()) { return false; }
	var total = parseInt(localStorage.getItem("blogsTotal"));
	if (total > 0) {
		for (var i = 0; i < total; i++) {
			// create a new element
			initBlog(i);
			// get details
			var userName = localStorage.getItem("blog"+i+".userName");
			var description = localStorage.getItem("blog"+i+".description");
			var tagsCommon = localStorage.getItem("blog"+i+".tagsCommon");
			var tagsAdd = localStorage.getItem("blog"+i+".tagsAdd");
			var placeSignature = parseVal(localStorage.getItem("blog"+i+".placeSignature"));
			var signature = localStorage.getItem("blog"+i+".signature");
			var useCustom = parseVal(localStorage.getItem("blog"+i+".useCustom"));
			// fill in details
			$('#blog'+i+' .key').text(i+1);
			if (i == 9) $('#blog'+i+' .key').text("0");
			if (description) {
				$('#blog'+i+' .title').text(description);
			} else {
				$('#blog'+i+' .title').text(userName);
			}
			$('#blog'+i+' input.userName').val(userName);
			$('#blog'+i+' input.description').val(description);
			$('#blog'+i+' textarea.tagsCommon').val(tagsCommon);
			$('#blog'+i+' textarea.tagsAdd').val(tagsAdd);
			$('#blog'+i+' .signature input:checkbox.'+placeSignature).prop("checked", true);
			$('#blog'+i+' .signature textarea').val(signature);
			$('#blog'+i+' form input[value="'+useCustom+'"]:radio').prop("checked", true);
			$('#blog'+i+' input').blur();
			if (placeSignature) {
				$('#blog'+i+' .signature textarea').show();
			} else {
				$('#blog'+i+' .signature textarea').hide();
			}
			if (useCustom) {
				$('#blog'+i+' .reblogOptions .customOptions').show();
				var customPostAs = localStorage.getItem("blog"+i+".customPostAs");
				var customSchedule = localStorage.getItem("blog"+i+".customSchedule");
				var customAutoSubmit = parseVal(localStorage.getItem("blog"+i+".customAutoSubmit"));
				var customAutoLike = parseVal(localStorage.getItem("blog"+i+".customAutoLike"));
				$('#blog'+i+' .reblogOptions select.customPostAs').val(customPostAs);
				$('#blog'+i+' .reblogOptions input.customAutoSubmit').prop('checked', customAutoSubmit);
				$('#blog'+i+' .reblogOptions input.customAutoLike').prop('checked', customAutoLike);
				if (customPostAs == "schedule") {
					$('#blog'+i+' .customSchedule').show();
					if (customSchedule) {
						$('#blog'+i+' .reblogOptions input.customSchedule').val(customSchedule);
					} else {
						$('#blog'+i+' .customSchedule').val(defaultSchedule());
					}
				} else {
					$('#blog'+i+' .customSchedule').hide();
				}
			} else {
				$('#blog'+i+' .reblogOptions .customOptions').hide();
			}
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
	// sort button actions
	$('#blog'+id+' .btn.sort').click(function() {
		cleanUpTags($(this).parent().parent().find('textarea'), true);
	});
	// hit return on username saves blog data
	$('#blog'+id+' .username').keydown(function(e) {
		// console.log("keydown "+e.which);
		if (e.which == 13) { // Enter
			var $myBlog = $(this).parent().parent().parent();
			$myBlog.find('.btn.edit').click();
		}
	});
	// signature checkbox actions
	$('#blog'+id+' .radiocb.signature input:checkbox').change(function() {
		if ($(this).prop('checked') == true) {
			$(this).parent().siblings().find('input:checkbox').each(function() {
				if ($(this).prop('checked') == true) $(this).click();
			});
		}
		if ($(this).parents('.radiocb').find('input:checkbox:checked').length > 0) {
			$(this).parents('.radiocb').find('textarea').show();
		} else {
			$(this).parents('.radiocb').find('textarea').hide();
		}
	});
	// custom options checkbox actions
	$('#blog'+id+' .customPostAs').change(function() {
		var val = $(this).val();
		if (val == "schedule") {
			$(this).parent().find('.customSchedule').show();
			if ($(this).parent().find('.customSchedule').val() == "") {
				$(this).parent().find('.customSchedule').val(defaultSchedule());
			}
		} else {
			$(this).parent().find('.customSchedule').hide();
		}
	});
	$('#blog'+id+' .reblogOptions input:radio').change(function() {
		if ($(this).attr('value') == "true" && $(this).prop('checked') == true) {
			$(this).parents('form').find('.customOptions').show();
			if ($(this).parents('form').find('.customPostAs').val() == "schedule") {
				$(this).parents('form').find('.customSchedule').show();
				if (!$(this).parents('form').find('.customSchedule').val()) {
					$('#blog'+i+' .customSchedule').val(defaultSchedule());
				}
			} else {
				$(this).parents('form').find('.customSchedule').hide();
			}
		} else {
			$(this).parents('form').find('.customOptions').hide();
		}
	});
	$('#blog'+id+' .customOptions').hide();
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

function cleanUpTags(el, sort) {
	var $el = el;
	var tags = $el.val().split(',');
	var cleanTags = new Array();
	for (var i = 0; i < tags.length; i++) {
		tags[i] = tags[i].trim();
		if (cleanTags.indexOf(tags[i]) === -1) cleanTags.push(tags[i]);
	}
	if (sort) cleanTags.sort();
	cleanTags = cleanTags.join(', ');
	$el.val(cleanTags);
}

function advancedBatch() {
	var allowCrawl = false;
	if ($('#batchToNext').prop('checked') || $('#batchToPrev').prop('checked')) {
		if ($('#tagsFind').val() != "" && $('#tagsReplace').val() != "" && $('#batchAutoFnR').prop('checked')) {
			allowCrawl = true;
		} else if ($('#tagsAdd').val() != "" && $('#batchAutoAdd').prop('checked')) {
			allowCrawl = true;
		} else if ($('#tagsRemove').val() != "" && $('#batchAutoRemove').prop('checked')) {
			allowCrawl = true;
		}
	}
	if (allowCrawl) {
		$('#batchCrawl').prop('disabled', false);
		$('#batchCrawl').parent().removeClass('disabled');
		$('#batchCrawlAlert').hide();
	} else {
		$('#batchCrawl').prop('disabled', true);
		$('#batchCrawl').prop('checked', false);
		$('#batchCrawl').parent().addClass('disabled');
		$('#batchCrawlAlert').show();
		localStorage.removeItem("batchCrawl");
	}
}
