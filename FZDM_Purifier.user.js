// ==UserScript==
// @name         FZDM_Purifier
// @namespace    https://github.com/Kaiyokun/FZDM_Purifier/
// @version      0.1
// @author       Kaiyokun
// @description  Purify your reading experience of manga at https://manhua.fzdm.com/
// @updateURL    https://raw.githubusercontent.com/Kaiyokun/FZDM_Purifier/master/FZDM_Purifier.user.js
// @downloadURL  https://raw.githubusercontent.com/Kaiyokun/FZDM_Purifier/master/FZDM_Purifier.user.js
// @supportURL   https://github.com/Kaiyokun/FZDM_Purifier/issues
// @match        https://manhua.fzdm.com/*/*
// @require      http://code.jquery.com/jquery-latest.js
// @grant        none
// ==/UserScript==

function traversePages(pageUrl, pageCollection, onloadAllPages) {
    // 返回页面导航栏 a tag collection
    var div = $('<div/>').load(
        pageUrl + ' div.navigation>a.button-success~a',
        () => {
            // 没有下一页了
            if (div.children().length < 2) {
                onloadAllPages(
                    pageCollection.children(),
                    div.find('a:last-child').attr('href') || '..');
                return;
            }

            // 添加从当前页的下一页到最后一页的链接
            pageCollection.append(div.find('a:not(.pure-button-primary)'));
            // 访问最后一页的链接
            traversePages(
                pageCollection.find('a:last-child').attr('href'),
                pageCollection,
                onloadAllPages);
        });
}

function loadAllPages(onloadAllPages) {
    // 章节首页
    var pageCollection = $('<div/>').append(
        $('div.navigation>a:not(.pure-button-primary)'));
    // 遍历章节全部页面
    traversePages(
        pageCollection.find('a:last-child').attr('href'),
        pageCollection,
        onloadAllPages);
}

function loadMangaUrl(pageUrl, onloadMangaUrl) {
    // 加载漫画页面
    var iframe = $('<iframe/>').load(
        pageUrl,
        () => {
            // 执行页面动态创建漫画 img tag 脚本
            onloadMangaUrl('http://' + eval(
                '"use strict";' +
                iframe.find('script:contains(" mhurl ")').text() +
                ';mhpicurl;'));
        });
}

(function showChapter() {
    // 居中章节所有页
    var center = $('<center/>');
    // 加载所有页
    loadAllPages((allPages, nextChapterUrl) => {
        // 遍历页 a tag
        allPages.each((_, page) => {
            // 加载漫画页面
            loadMangaUrl(page.href, (mangaUrl) => {
                // 加载图片
                center.append($('<img/>', {
                    src: mangaUrl,
                    alt: '第' + page.innerText.replace(/[^\d]/g, '') + '页'
                }));

                // 全部图片加载完毕
                if (allPages.length === center.children().length) {
                    var imgMaxWidth = 0;

                    center
                        .children()
                        // 按照页码排序
                        .sort((a, b) => {
                            return parseInt(a.alt.replace(/[^\d]/g, '')) -
                                parseInt(b.alt.replace(/[^\d]/g, ''));
                        })
                        // 每一张图片后均换行
                        .each((_, img) => {
                            // 记录图片宽度的最大值
                            imgMaxWidth = Math.max(
                                imgMaxWidth, img.naturalWidth);
                            // 添加图片
                            center.append(img).append('<br /><br />');
                        })
                        .last()
                        .wrap('<a href=' + nextChapterUrl + ' />');

                    // 替换页面
                    $('body').empty().append(center);
                    // 使所有图片同宽
                    $('img').css('width', Math.min(
                        $(window).width(), imgMaxWidth));

                    // 监听窗口变化
                    $(window).resize(() => {
                        $('img').css('width', Math.min(
                            $(window).width(), imgMaxWidth));
                    });
                }
            });
        });
    });
})();