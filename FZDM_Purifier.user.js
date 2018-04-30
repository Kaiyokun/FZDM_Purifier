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

function loadMangaUrl($img) {
    // 加载漫画页面
    var $iframe = $('<iframe />').load($img.attr('pageUrl'), () => {
        // 执行页面动态创建漫画脚本
        $img.attr('src', 'http://' + eval('"use strict";' +
            $iframe.find('script:contains(" mhurl ")').text() + ';mhpicurl;'));
    });
}

function loadNextPage($imgContainer) {
    // 返回漫画页面导航栏
    var $div = $('<div />').load(
        $imgContainer.find('img:last').attr('pageUrl') +
        ' div.navigation>a.button-success~a',
        () => {
            // 没有下一页了
            if ($div.children().length < 2) {
                $imgContainer.find('img:last')
                    .wrap($div.find('a:last').empty());
                return;
            }

            // 添加从当前页的下一页到最后一页的漫画
            $div.find('a:not(.pure-button-primary)').each((_, a) => {
                // 异步加载漫画
                loadMangaUrl($('<img />', {
                    alt: '第' + a.innerText.replace(/[^\d]/g, '') + '页',
                    pageUrl: a.href
                }).appendTo($imgContainer));

                // 单列显示每一页
                $imgContainer.append('<br /><br />');
            });

            // 访问最后一页
            loadNextPage($imgContainer);
        });
}

(function showChapter() {
    // 获取页面导航栏
    var pageCollection = $('div.navigation>a:not(.pure-button-primary)');
    // 清空原有页面并阻止未执行完的 document.write 影响新页面
    document.write('<clear />');

    // 居中所有漫画
    var $center = $('<center />').appendTo('body');
    // 添加第一页到最后一页的漫画
    pageCollection.each((_, a) => {
        // 异步加载漫画
        loadMangaUrl($('<img />', {
            alt: '第' + a.innerText.replace(/[^\d]/g, '') + '页',
            pageUrl: a.href
        }).appendTo($center));

        // 单列显示每一页
        $center.append('<br /><br />');
    });

    // 访问最后一页
    loadNextPage($center);
})();