$(document).ready(function () {
    let searchData = [];
    let scroll = null;

    // 加载搜索数据
    $.getJSON('/searchdb.json', function(data) {
        searchData = data;
        window.console.log('Search data loaded:', searchData.length + ' items');
    }).fail(function() {
        window.console.error('Failed to load search data');
    });

    // 搜索函数
    function performSearch(query) {
        if (!query || query.trim() === '') {
            $('#search-stats').empty();
            $('#search-hits').empty();
            $('#search-pagination').empty();
            return;
        }

        let results = [];
        let queryLower = query.toLowerCase();

        searchData.forEach(function(item) {
            let title = item.title || '';
            let content = item.content || '';
            let url = item.url || '';

            // 搜索标题和内容
            if (title.toLowerCase().includes(queryLower) ||
                content.toLowerCase().includes(queryLower)) {

                // 高亮匹配的文本
                let highlightedTitle = highlightText(title, query);
                let highlightedContent = highlightText(content.substring(0, 200), query);

                results.push({
                    title: highlightedTitle,
                    content: highlightedContent,
                    url: url
                });
            }
        });

        displayResults(results, query);
    }

    // 高亮匹配文本
    function highlightText(text, query) {
        if (!text) return '';
        let regex = new RegExp('(' + escapeRegExp(query) + ')', 'gi');
        return text.replace(regex, '<em>$1</em>');
    }

    // 转义正则表达式特殊字符
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // 显示搜索结果
    function displayResults(results, query) {
        let startTime = Date.now();
        let html = '';

        if (results.length === 0) {
            html = '<div id="search-hits-empty" class="search-hits-empty">未发现与 「' + query + '」 相关的内容</div>';
        } else {
            html += '<div class="search-hits">';
            results.forEach(function(item) {
                html += '<div class="search-hit-item">';
                html += '<a href="' + item.url + '" class="search-hit-link">' + item.title + '</a>';
                html += '<div class="search-hit-content">' + item.content + '</div>';
                html += '</div>';
            });
            html += '</div>';
        }

        let endTime = Date.now();
        let statsHtml = results.length + ' 条相关条目，使用了 ' + (endTime - startTime) + ' 毫秒<hr/>';

        $('#search-stats').html(statsHtml);
        $('#search-hits').html(html);
        $('#search-pagination').empty();

        // 刷新滚动条
        if (scroll) {
            scroll.refresh();
        }
    }

    // 防抖函数
    let debounceTimer;
    function debounceSearch(query) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
            performSearch(query);
        }, 300);
    }

    // 打开搜索窗口
    $('body').on('click', '.search', function(e) {
        e.stopPropagation();
        $('body').append('<div class="search-cover"></div>').css('overflow', 'hidden');

        // 移动端防止滚动
        $('.search-cover').on('touchmove', function(event){
            event.preventDefault();
        }, false);

        document.body.addEventListener('touchmove', handler, { passive: false });
        $('.search-window').show();

        // 创建搜索输入框
        createSearchInput();

        // 聚焦输入框
        setTimeout(function() {
            $('#local-search-input').focus();
        }, 100);

        // 初始化滚动条
        let height = $('.search-content').outerHeight();
        $('.search-scroll').css('height', 'calc(100% - ' + height + 'px)');
        scroll = new IScroll('.search-scroll', {
            scrollbars: true,
            mouseWheel: true,
            fadeScrollbars: true,
            resizePolling: 60
        });
    });

    // 创建本地搜索输入框
    function createSearchInput() {
        if ($('#local-search-input').length === 0) {
            let inputHtml = '<input type="text" id="local-search-input" placeholder="搜索" style="width: 100%; padding: 5px 0; background: transparent; outline: none; border: none; color: inherit;">';
            $('#search-input').html(inputHtml);

            // 监听输入事件
            $('#local-search-input').on('input', function() {
                debounceSearch($(this).val());
            });

            // 监听回车键
            $('#local-search-input').on('keypress', function(e) {
                if (e.which === 13) {
                    performSearch($(this).val());
                }
            });
        }
    }

    // 关闭搜索窗口
    $('body').on('click', '.search-close-icon', function() {
        $('.search-window').hide();
        $('.search-cover').remove();
        document.body.removeEventListener('touchmove', handler, { passive: false });
        $('body').css('overflow', 'auto');

        // 清空搜索
        $('#local-search-input').val('');
        $('#search-stats').empty();
        $('#search-hits').empty();
        $('#search-pagination').empty();

        // 销毁滚动条
        if (scroll) {
            scroll.destroy();
            scroll = null;
        }
    });

    // 触摸事件处理器
    function handler(event) {
        event.preventDefault();
        event.stopPropagation();
    }
});
