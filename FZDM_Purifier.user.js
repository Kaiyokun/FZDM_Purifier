// ==UserScript==
// @name         FZDM_Purifier
// @namespace    https://github.com/Kaiyokun/FZDM_Purifier/
// @version      0.5
// @author       Kaiyokun
// @description  Purify your reading experience of manga at https://manhua.fzdm.com/
// @updateURL    https://raw.githubusercontent.com/Kaiyokun/FZDM_Purifier/master/FZDM_Purifier.user.js
// @downloadURL  https://raw.githubusercontent.com/Kaiyokun/FZDM_Purifier/master/FZDM_Purifier.user.js
// @supportURL   https://github.com/Kaiyokun/FZDM_Purifier/issues
// @match        https://manhua.fzdm.com/*/*/
// @require      http://code.jquery.com/jquery-latest.js
// @run-at       document-start
// @grant        none
// ==/UserScript==

function loadMangaUrl($img, pageUrl) {
    // 加载漫画页面
    var $iframe = $('<iframe />').load(pageUrl, () => {
        // 执行页面动态创建漫画脚本
        $img.attr('src', 'http://' + eval('"use strict";' + $iframe
                .find('script:contains(" mhurl")').text() + ';mhpicurl;'))
            // 使图片与窗口同宽
            .css('width', $(window).width())
            // 手动重新加载页面
            .on('click', () => {
                $img.attr('src', $img.attr('src') + '?timestamp=' +
                    new Date().getTime());
            });
    });
}

function loadPage($imgContainer, pageUrl) {
    // 返回漫画页面导航栏
    var $div = $('<div />').load((pageUrl || location.href) + (pageUrl ?
            ' div.navigation>a.button-success~a' :
            ' div.navigation>a:not(.pure-button-primary)'),
        () => {
            // 没有下一页了
            if ($div.children().length < 2) {
                // 点击最后一页进入下一话，或者在最后一话返回章节列表
                $imgContainer.find('img:last').wrap($('<a href="' +
                    ($div.find('a:last').attr('href') || '..') + '" />'));
                return;
            }

            // 添加从当前页的下一页到最后一页的漫画
            $div.find('a:not(.pure-button-primary)').each((_, a) => {
                // 更新页面 URL
                pageUrl = a.href;

                // 异步加载漫画
                loadMangaUrl($('<img />', {
                    alt: '第' + a.innerText.replace(/[^\d]/g, '') + '页'
                }).appendTo($imgContainer), pageUrl);

                // 单列显示每一页
                $imgContainer.append('<br /><br />');
            });

            // 访问最后一页
            loadPage($imgContainer, pageUrl);
        });
}

(() => {
    // FIXME: 硬编码getCookie在loadMangaUrl中eval的使用
    getCookie = (key) => { return "183.91.33.78/p1.xiaoshidi.net"; };

    // 清空原有页面并阻止未执行完的 document.write 影响新页面
    document.write('<clear hidden />');

    // 递归添加所有页
    loadPage($('<center />').appendTo('body'));

    // 使图片宽度始终保持与窗口同宽
    $(window).resize(() => { $('img').css('width', $(window).width()); });
})();
