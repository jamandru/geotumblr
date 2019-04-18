$(document).ready(function() {

// INITIATE GEOTUMBLR

if (window.top === window) {

	var post = 'ol#posts > .post_container:not(.new_post_buttons_container, .geo_hidden)';
	var post_focus = post+'.geo_focus';
	var submit_button = '.create_post_button';
	var awaitingForm = null;
	var pageIsDashboard = isDashboard();
	var pageIsBlog = isBlog();
	var pageIsShare = isShare();
	var alt = false;
	var loading = true;
	var topGap = $('.l-header').height() + 16;
	// var topPage = $('.notification.single_notification.takeover-container').length;

	if (typeof safari !== 'undefined') {
		console.log("Safari addEventListener");
		safari.self.addEventListener("message", handleMessage, false);
	} else if (typeof chrome !== 'undefined') {
		console.log("Chrome addListener");
		chrome.runtime.onMessage.addListener(function(request) {
			console.log("request n="+request.name+" m="+request.message);
			handleMessage(request);
		});
	}

	console.log("GeoTumblr Activate!");

	messageGlobal("requestSettings");

	$('#left_column, #right_column').hide();

	// if (topPage) console.log("topPage = " + topPage);

	if (isBlog("queue")) {

		$('.elevator-wrapper').clone().insertBefore(".elevator-wrapper").addClass('geo_scroll_to_bottom visible');
		$('.geo_scroll_to_bottom').click(function(event){
			event.preventDefault();
			if ($(this).hasClass('scrolling')) {
				clearInterval(scroll_to_bottom);
				$(this).removeClass('scrolling');
			} else {
				$(this).addClass('scrolling');
				$("html, body").animate({ scrollTop: $(document).height() }, 250);
				scrolling_to_bottom = 0;
				scroll_to_bottom = setInterval(function() {
					if ($('#auto_pagination_loader_loading').attr('style').indexOf('inline') > 0) {
						scrolling_to_bottom = 0;
					} else {
						if (scrolling_to_bottom == 0) {
							$("html, body").animate({ scrollTop: $(document).height() }, 250);
						}
						scrolling_to_bottom++;
					}
					if (scrolling_to_bottom >= 5) {
						clearInterval(scroll_to_bottom);
						$('.geo_scroll_to_bottom').removeClass('scrolling');
						setMarginBottom();
						$("html, body").animate({ scrollTop: $(document).height() }, 250);
					}
				}, 250);
			}
		});
	}

	$(document).keypress(function(e) {
		// console.log("keypress "+e.which);
		if ($(e.target).is('input, textarea, .editor')) return;
		switch(e.which) {
			case 106: // j
				$('body').focus();
				if (isBlog("queue")) nextPost();
				nextPage();
				break;
			case 107: // k
				$('body').focus();
				if (isBlog("queue")) prevPost();
				prevPage();
				break;
			case 109: // m
				markPost();
				break;
			case 181: // ALT-m
				goToMark();
				break;
			case 960: // ALT-p
				publishPosts();
				break;
		}
	});

	$(document).keydown(function(e) {
		// console.log("keydown "+e.which);
		if ($(e.target).is('input, textarea, .editor')) return;
		if (e.which == 82) { // r
			autoLike();
		}
		if (e.which == 18) { // ALT
			alt = true;
		}
	});

	$(document).keyup(function(e) {
		// console.log("keyup "+e.which);
		if ($(e.target).is('input, textarea, .editor')) return;
		switch(e.which) {
			case 18: // ALT
				alt = false;
				break;
			case 86: // v (for view; ALT for full-size)
				viewFocusedPost(alt);
				break;
			case 69: // e
				editPost();
				break;
			case 8: // DELETE
				deletePost();
				break;
		}
		var k = e.which;
		if (k >= 48 && k <= 57) { // keyboard 0-9
			if (k==48) {
				var id = 9;
			} else {
				var id = k - 49;
			}
			if (id < geo_vars.blogs.length) {
				if (isPostForm() || pageIsShare) {
					autoFill(id);
				} else {
					reblogTo(id);
				}
			}
		}
		if (k >= 96 && k <= 105) { // number pad 0-9
			if (k==96) {
				var id = 9;
			} else {
				var id = k - 97;
			}
			if (id < geo_vars.blogs.length) {
				if (isPostForm() || pageIsShare) {
					autoFill(id);
				} else {
					reblogTo(id);
				}
			}
		}
	});

	if (pageIsBlog == true || pageIsDashboard == true) {
		$(window).scroll(function () {
			var fn = null;
			if ($(window).scrollTop() < $(post+':eq(0)').offset().top) {
				fn = 0;
			} else if ($(window).scrollTop() == $(document).height() - $(window).height()) {
				fn = $(post).length-1;
			} else {
				var c = $(window).scrollTop() + topGap;
				$(post).each(function(i) {
					var t = $(this).offset().top;
					var b = t + $(this).height();
					if (c>=t && c<b) fn = i;
				});
			}
			if ($(post+':eq('+fn+')').hasClass('geo_focus') == false) {
				$(post_focus).removeClass('geo_focus');
				$(post+':eq('+fn+')').addClass('geo_focus');
			}
		});
	}
}


// SAFARI EXTENSION MESSAGES

function messageGlobal(n, m) {
	if (typeof safari !== 'undefined') {
		console.log("Safari dispatchMessage { "+n+": "+m+" }");
		safari.self.tab.dispatchMessage(n, m);
	} else if (typeof chrome !== 'undefined') {
		console.log("Chrome dispatchMessage { "+n+": "+m+" }");
		chrome.runtime.sendMessage({name: n, message: m});
	}
}

function handleMessage(event) {
	console.log("handleMessage n="+event.name+" m="+event.message);
	// global
	if (event.name === "returnSettings") {
		propogateSettings(event.message);
	}
	if (event.name === "updateSettings") {
		updateSettings(event.message);
	}
	// toolbar
	if (event.name === "markPost") {
		markPost();
	}
	if (event.name === "goToMark") {
		goToMark(event.message);
	}
}

function propogateSettings(settings) {
	if (settings) geo_vars = settings;
	if (document.URL.indexOf("#bookmark")>=0) goToMark();
	markBookmarks();
	filterContent();
	setMarginBottom();
	if (geo_vars.viewFocusGlow) {
		$('.post_avatar_link, .queued .post_avatar').addClass("geo_glow");
	}
	customColors();
	if (geo_vars.cookies.targetblog >= 0) {
		waitForReblogForm(geo_vars.cookies.targetblog);
	} else {
		autoFocus();
	}
	if (isEditor()) {
		waitForEditForm();
	}
	loading = false;
}

function updateSettings(settings) {
	var view = [
			"viewFocusGlow",
			"viewBookmarkColor",
			"viewHideMine",
			"viewMarkMine",
			"viewMarkMineColor",
			"viewHideReblog",
			"viewMarkReblog",
			"viewMarkReblogColor",
			"viewHideLiked",
			"viewMarkLiked",
			"viewMarkLikedColor",
			"viewHideFollowing",
			"viewHideFollowingSelf",
			"viewHideRecommended",
			"viewHideSponsored",
			"viewSidebarMin",
			"viewSidebarFix"
		];
	var same = true;
	for (var i = 0; i < view.length; i++) {
		if (geo_vars[view[i]] != settings[view[i]]) {
			same = false;
			break;
		}
	};
	if (pageIsDashboard && same == false) {
		location.reload();
	} else {
		geo_vars = settings;
	}
}

// NAVIGATION

function isDashboard() {
	var href = document.location.href;
	if (href.indexOf("www.tumblr.com/dashboard") >= 0) {
		// console.log('is dashboard');
		return true;
	} else {
		return false;
	}
}

function isBlog(section) {
	var href = document.location.href;
	if (href.indexOf("www.tumblr.com/blog") >= 0 || href.indexOf("www.tumblr.com/likes") >= 0) {
		if (section) {
			if (href.indexOf("/"+section) >= 0) {
				// console.log('is blog/'+section);
				return true;
			} else {
				return false;
			}
		} else {
			// console.log('is blog');
			return true;
		}
	} else {
		return false;
	}
}

function isShare() {
	var href = document.location.href;
	if (href.indexOf("www.tumblr.com/share") >= 0) {
		return true;
	} else {
		return false;
	}
}

function isEditor() {
	var href = document.location.href;
	if (href.indexOf("www.tumblr.com/edit") >= 0) {
		// console.log('is editor');
		return true;
	} else {
		return false;
	}
}

function isPostForm() {
	if ($('.post-form').length > 0) {
		// console.log('is reblog form');
		return true;
	} else {
		return false;
	}
}

function indexOfElement(el) {
	return $(el).parent().children(post).index($(el));
}

function nextPost() {
	var id = indexOfElement(post_focus) + 1;
	if (id < $(post).length) {
		$(post_focus+' .image_thumbnail.enlarged').click();
		$(post+':eq('+id+') .image_thumbnail:not(.enlarged)').click();
		var t = $(post+':eq('+id+')').offset().top - topGap;
		$('body,html').animate({ scrollTop: t }, 250, function() {
		    postFocusComplete();
		});
	}
}

function prevPost() {
	var id = indexOfElement(post_focus) - 1;
	if (id >= 0) {
		$(post_focus+' .image_thumbnail.enlarged').click();
		$(post+':eq('+id+') .image_thumbnail:not(.enlarged)').click();
		var t = $(post+':eq('+id+')').offset().top - topGap;
		$('body,html').animate({ scrollTop: t }, 250, function() {
		    postFocusComplete();
		});
	}
}

function nextPage() {
	var id = indexOfElement(post_focus);
	if ($(post).length == 0 || id == $(post).length - 1) {
		messageGlobal("setCookie", { "autofocus" : "first" });
		var href = $('#next_page_link').attr('href');
		if (href) document.location.href = href;
	}
}

function prevPage() {
	var id = indexOfElement(post_focus);
	if ($(post).length == 0 || $(window).scrollTop() <= $(post+':eq(0)').offset().top) {
		if ($('.no_posts_found:not(.geo_notification)').length > 0) {
			messageGlobal("setCookie", { "autofocus" : null });
			var href = "http://www.tumblr.com/dashboard";
		} else {
			messageGlobal("setCookie", { "autofocus" : "last" });
			var href = $('#previous_page_link').attr('href');
		}
		if (href) document.location.href = href;
		if ($('#new_post_buttons').length > 0) {
			$('body,html').animate({ scrollTop: 0 }, 150);
		}
	}
}

function autoFocus(focus) {
	if (pageIsBlog || pageIsDashboard) {
		if (!focus) var focus = geo_vars.cookies.autofocus;
		if (focus) {
			if (focus.indexOf('post_') >= 0) {
				var $el = $('#'+focus).parent();
			} else {
				var fn = null;
				if (focus == "last") {
					fn = $(post).length - 1;
				} else {
					fn = 0;
				}
				var $el = $(post+':eq('+fn+')');
			}
			if ($el.offset()) {
				$el.addClass('geo_focus');
				var t = $el.offset().top - topGap;
				$('body,html').animate({ scrollTop: t }, 150);
			}
			messageGlobal("setCookie", { "autofocus" : null });
		}
	}
}

function viewFocusedPost(image) {
	if ($(post_focus).length > 0) {
		var $el = $(post+'.geo_focus > .post');
		var href = $(post+'.geo_focus .post_permalink').attr('href');
		var imagePost = $el.hasClass("is_photo");
		if (image && imagePost) {
			var ihref = "http://" + $el.attr('data-tumblelog-name') + ".tumblr.com/image/" + $el.attr('data-post-id');
			window.open(ihref);
		} else {
			window.open(href);
		}
	}
}

function setMarginBottom() {
	if (isEditor()) return;
	if ($('.post_container').length <= 0) return;
	var lp = $('body').height() - $('.post_container:last').offset().top;
	var mb = $(window).height() - lp - topGap;
	if (mb > 0) $('.l-container').css('margin-bottom', mb+"px");
}

function filterContent() {
	var container = '.post_container:not(.geo_bookmark)';
	if (pageIsDashboard) {
		// posts that are mine
		if (geo_vars.viewHideMine && geo_vars.blogs.length > 0) {
			$('.post.is_mine:not(.new_post_buttons)').parents(container).remove();
			for (var i = 0; i < geo_vars.blogs.length; i++) {
				$('.post[data-tumblelog="'+geo_vars.blogs[i].userName+'"]').parents(container).remove();
			};
		} else if (geo_vars.viewMarkMine) {
			if (geo_vars.viewMarkMineColor) {
				$('.post.is_mine:not(.new_post_buttons)').addClass('geo_tint geo_custom_mine');
				for (var i = 0; i < geo_vars.blogs.length; i++) {
					$('.post[data-tumblelog="'+geo_vars.blogs[i].userName+'"]').addClass('geo_tint geo_custom_mine');
				};
			} else {
				$('.post.is_mine:not(.new_post_buttons)').addClass('geo_tint geo_mine');
				for (var i = 0; i < geo_vars.blogs.length; i++) {
					$('.post[data-tumblelog="'+geo_vars.blogs[i].userName+'"]').addClass('geo_tint geo_mine');
				};
			}
		}
		// posts that were reblogged from me, reblogged from a blog i am following
		if (geo_vars.viewHideReblog || geo_vars.viewMarkReblog || geo_vars.viewHideFollowing) {
			$(post+' .post_info').each(function() {
				var found = false;
				var $reblog_source = $(this).find('.reblog_source .post_info_link');
				if (geo_vars.viewHideReblog || geo_vars.viewMarkReblog) {
					var info = $(this).text();
					if (info.indexOf('reblogged you') >= 0) {
						found = true;
					} else {
						var info = $reblog_source.text();
						for (var i = 0; i < geo_vars.blogs.length; i++) {
							if (info.indexOf(geo_vars.blogs[i].userName) >= 0) found = true;
						};
					}
					if (found && geo_vars.viewHideReblog) {
						$(this).parents(container).remove();
					} else if (found && geo_vars.viewMarkReblog) {
						if (geo_vars.viewMarkReblogColor) {
							$(this).parents('.post').addClass('geo_tint geo_custom_reblog');
						} else {
							$(this).parents('.post').addClass('geo_tint geo_reblog');
						}
					}
				}
				if (found == false && geo_vars.viewHideFollowing && $reblog_source.length > 0) {
					var following = false;
					var reblogSelf = false;
					if ($reblog_source.attr('data-tumblelog-popover').indexOf('"following":true') >= 0) var following = true;
					if ($reblog_source.html() == $reblog_source.parents('.post_info').find('.post_info_fence > .post_info_link').html()) var reblogSelf = true;
					if (following && reblogSelf == false) {
						$(this).parents(container).remove();
					} else if (following && reblogSelf && geo_vars.viewHideFollowing) {
						$(this).parents(container).remove();
					}
				}
			});
		}
		// posts i've already liked
		if (geo_vars.viewHideLiked) {
			$('.post_control.like.liked').parents(container).remove();
		} else if (geo_vars.viewMarkLiked) {
			if (geo_vars.viewMarkLikedColor) {
				$('.post_control.like.liked').parents('.post').addClass('geo_tint geo_custom_liked');
			} else {
				$('.post_control.like.liked').parents('.post').addClass('geo_tint geo_liked');
			}
		}
		// recommended posts
		if (geo_vars.viewHideRecommended) {
			$('.post.is_recommended').parents(container).remove();
			$('.recommended-unit-container').remove();
		}
		// sponsored posts
		if (geo_vars.viewHideSponsored) {
			$('.notification.single_notification.takeover-container').remove();
			$('.standalone-ad-container').remove();
			$('.post.sponsored_post').parents(container).remove();
			$('.remnantUnitContainer, .remnant-unit-container').remove();
			$('.yamplus-unit-container').remove();
			$('.video-ad-container').remove();
			$('.decision-sidebar-callout').remove();
			$('.dfp-ad-container').remove();
		}
		console.log($('#posts .post_container').length +"/"+ $('.no_posts_found').length);
		if ($('#posts .post_container').length <= 0 && $('.no_posts_found').length <= 0) {
			$('#posts').after('<div class="no_posts_found geo_notification" style="padding-top: 258px; padding-bottom: 258px;"><i class="sprite_icon_post"></i>All posts on this page were removed by GeoTumblr filters.</div>')
		}
	}
	// hide default blog menu
	if (geo_vars.viewSidebarFix) {
		$('#right_column').addClass('geo_fix');
	}
	// sidebar suggestions (but make them visible by clicking label)
	if (geo_vars.viewSidebarMin) {
		$('#right_column').addClass('geo_min');
		$('.recommended_tumblelogs .item').hide();
		$('.recommended-blogs-unit-header').click(function() {
			$('.recommended_tumblelogs .item').toggle();
		});
		$('#tumblr_radar').hide();
		$('.radar_header').click(function() {
			$('#tumblr_radar').toggle();
		});
	}
	if (isEditor()) {
		// hide background dashboard on edit page
		$('.l-container').remove();
	}
	$('#left_column, #right_column').show();
}

function customColorSet(key, color) {
	var set = (
		".geo_focus .geo_custom_"+key+" .geo_glow { box-shadow: 0 1px 8px "+color+"; } "+
		".geo_custom_"+key+", .geo_custom_"+key+" .post_content, .geo_custom_"+key+" .post_footer { "+
		"background-color: "+color+" !important; "+
		"} "+
		".geo_custom_"+key+" .post_avatar::after { "+
		"border-right-color: "+color+" !important; "+
		"} "
	);
	return set;
}

function customColors() {
	if (geo_vars.viewBookmarkColor || geo_vars.viewMarkMineColor || geo_vars.viewMarkReblogColor || geo_vars.viewMarkLikedColor) {
		var colors = "<style> ";
		if (geo_vars.viewBookmarkColor) {
			colors += (
				".geo_focus .geo_glow { box-shadow: 0 1px 8px "+geo_vars.viewBookmarkColor+"; } "+
				".elevator-wrapper.geo_scroll_to_bottom.scrolling .elevator { color: "+geo_vars.viewBookmarkColor+" !important; } "
			);
			colors += customColorSet("bookmarked", geo_vars.viewBookmarkColor);
		}
		if (geo_vars.viewMarkMineColor) {
			colors += customColorSet("mine", geo_vars.viewMarkMineColor);
		}
		if (geo_vars.viewMarkReblogColor) {
			colors += customColorSet("reblog", geo_vars.viewMarkReblogColor);
		}
		if (geo_vars.viewMarkLikedColor) {
			colors += customColorSet("liked", geo_vars.viewMarkLikedColor);
		}
		colors += "</style>";
		$('head').append(colors);
	}
}

function editPost() {
	if (pageIsBlog) {
		$(post_focus+' .post_control_menu').click();
		$(post_focus+' .post_control.edit')[0].click();
	}
}

function deletePost() {
	if (pageIsBlog) $(post_focus+' .post_control.delete').click();
}

function publishPosts(num) {
	if (isBlog("queue") || isBlog("drafts")) {
		if (!num) var num = 10;
		if (num == -1) num = $(post).length;
		var posts = new Array();
		for (var i = 1; i <= num; i++) {
			posts.push($('.post_container:eq('+i+') .post').attr('id'));
		};
		// for (var i = 0; i < posts.length; i++) {
		// 	$('#'+posts[i]+' .post_control.publish').click();
		// };
		var dialog = 0;
		autoOK = setInterval(function() {
			if ($('#dialog_'+dialog).length > 0) {
				$('#dialog_'+dialog+' .ui_button.blue').click();
				dialog++;
			} else {
				$('#'+posts[dialog]+' .post_control.publish').click();
			}
			if (dialog == posts.length) {
				clearInterval(autoOK);
				window.location.reload();
			}
		}, 250);
	}
}

// TOOLS

function goToMark(postid) {
	if (!postid) {
		if (geo_vars.bookmarks.length > 0) {
			var focus = $(post_focus+' > .post').attr('id');
			var search = geo_vars.bookmarks.indexOf(focus);
			var i = 0;
			if (search >= 0) i = search + 1;
			if (i >= geo_vars.bookmarks.length) i = 0;
			postid = geo_vars.bookmarks[i];
		}
	}
	var postnum = parseInt(postid.replace("post_", "")) - 1;
	if (postnum >= 0) {
		messageGlobal("setCookie", { "autofocus" : "last" });
		window.location = "http://www.tumblr.com/dashboard/999999999/-"+postnum;
	}
}

function markPost() {
	if ($(post_focus).length > 0) {
		var mark = $(post_focus+' > .post').attr('id');
		var search = geo_vars.bookmarks.indexOf(mark);
		if (search >= 0) {
			// found in bookmarks and remove
			geo_vars.bookmarks.splice(search, 1);
		} else {
			// not found so add to bookmarks
			geo_vars.bookmarks.unshift(mark);
		}
		// geo_vars.bookmarks.sort().reverse();
		messageGlobal("saveBookmarks", geo_vars.bookmarks);
		markBookmarks();
	}
}

function markBookmarks() {
	$('.geo_bookmark .post').removeClass('geo_tint geo_bookmarked geo_custom_bookmarked');
	$('.geo_bookmark').removeClass('geo_bookmark');
	for (var i = 0; i < geo_vars.bookmarks.length; i++) {
		$('#'+geo_vars.bookmarks[i]).parents('.post_container').addClass('geo_bookmark');
		if (geo_vars.viewBookmarkColor) {
			$('#'+geo_vars.bookmarks[i]).addClass('geo_tint geo_custom_bookmarked');
		} else {
			$('#'+geo_vars.bookmarks[i]).addClass('geo_tint geo_bookmarked');
		}
	};
}

// EDIT FORM

function autoLike(id) {
	if (id && geo_vars.blogs[id].useCustom) {
		var a = geo_vars.blogs[id].customAutoLike;
	} else {
		var a = geo_vars.reblogAutoLike;
	}
	if (a) {
		$(post_focus+' .post_control.like:not(.liked)').click();
	}
}

function reblogTo(id) {
	autoLike(id);
	waitForReblogForm(id);
	$(post_focus+' .post_control.reblog')[0].click();
}

function waitForReblogForm(targetblog) {
	clearInterval(awaitingForm);
	awaitingForm = setInterval(function(){
		// console.log("waiting for reblog form ...");
		if ($(submit_button).length > 0) {
			if (targetblog >= 0) {
				autoFill(targetblog);
			} else {
				$(submit_button).focus();
			}
			clearInterval(awaitingForm);
		}
	}, 500);
}

function waitForEditForm(targetblog) {
	clearInterval(awaitingForm);
	awaitingForm = setInterval(function(){
		// console.log("waiting for edit form ...");
		if ($(submit_button).length > 0) {
			var userName = $('#tumblelog_select .txt.edit').text();
			for (var i = 0; i < geo_vars.blogs.length; i++) {
				if (geo_vars.blogs[i].userName == userName) {
					var id = i;
					break;
				}
			};
			if (id) {
				insertTagsList(id);
			} else {
				$(submit_button).focus();
			}
			// if (geo_vars.editAutoClose) {
				window.onbeforeunload = function() {
					timeout = setTimeout(function(){window.close()}, 25);
				};
				$(submit_button + ', .post-form--close').click(function() {
					window.close();
				});
			// }
			clearInterval(awaitingForm);
		}
	}, 500);
}

function autoFill(id) {
	var userName = geo_vars.blogs[id].userName;
	var reblogAs = geo_vars.reblogPostAs;
	var schedule = geo_vars.reblogSchedule;
	var autoSubmit = geo_vars.reblogAutoSubmit;
	var awaitingTumblelogSelect = false;
	var awaitingSavePostDropdown = false;
	if (pageIsShare) {
		$('#advanced_tab').click();
		$('#channel_id option').each(function(){
			if ($(this).attr("data-blog-url").indexOf(userName) >= 0) $('#channel_id').val($(this).attr('value')).change();
		});
		if (reblogAs == "publish") $('#post_state').val(0).change();
		if (reblogAs == "draft") $('#post_state').val(1).change();
		if (reblogAs == "queue") $('#post_state').val(2).change();
		if (reblogAs == "private") $('#post_state').val("private").change();
		if (reblogAs == "publish" && schedule) $('#post_date').focus().val(schedule).blur();
		if (autoSubmit) $('button:submit').click();
	} else {
		// console.log("auto fill with "+userName);
		if (isEditor() != true) {
			$('.post-form .tumblelog-select').click();
			setTimeout(function(){
				$('.popover--tumblelog-select-dropdown .ts-avatar[alt="'+userName+'"]').parent().click();
			}, 25);
		}
		if (reblogAs) {
			setTimeout(function(){
				$('.post-form .post-form--save-button .dropdown-area').click();
				setTimeout(function(){
					$('.popover--save-post-dropdown .item-option[data-js-'+reblogAs+']').click();
					if (reblogAs == "publish" && schedule) {
						$('.popover--save-post-dropdown input[data-js-scheduletext]').focus().val(schedule).blur();
					}
				}, 25);
			}, 50);
		}
		if (isEditor() == false && autoSubmit) {
			setTimeout(function(){
				$(submit_button).click();
				setTimeout(function(){
					$(post_focus + ' .post_avatar_link').focus();
				}, 1000);
			}, 250);
		}
		if (isEditor() || autoSubmit == false) {
			$('.post-form .tumblelog-select').click(function() {
				// $('#geo_tags').remove();
				setTimeout(function(){
					$('.popover--tumblelog-select-dropdown .item-option').click(function() {
						var userName = $(this).find('img').attr("alt");
						for (var i = 0; i < geo_vars.blogs.length; i++) {
							if (userName == geo_vars.blogs[i].userName) {
								insertTagsList(i);
								break;
							}
						};
					});
				}, 25);
			});

		}
		messageGlobal("setCookie", { "targetblog" : -1 });
	}
}

});
