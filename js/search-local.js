$(document).ready(function () {
    let searchData = [];
    let scroll = null;

    // 加载搜索数据
    $.ajax({
        url: '/search.xml',
        dataType: 'xml',
        success: function(xml) {
            $(xml).find('entry').each(function() {
                let $entry = $(this);
                searchData.push({
                    title: $entry.find('title').text(),
                    url: $entry.find('url').text(),
                    content: $entry.find('content').text()
                });
            });
            console.log('Search data loaded:', searchData.length + ' entries');
        },
        error: function() {
            console.error('Failed to load search data from /search.xml');
        }
    });

    // 搜索函数
    function performSearch(query) {
        if (!query) {
            $('#search-stats').empty();
            $('#search-hits').empty();
            $('#search-pagination').empty();
            return;
        }

        let results = [];
        let lowerQuery = query.toLowerCase();

        searchData.forEach(function(item) {
            let titleMatch = item.title.toLowerCase().indexOf(lowerQuery) !== -1;
            let contentMatch = item.content.toLowerCase().indexOf(lowerQuery) !== -1;

            if (titleMatch || contentMatch) {
                results.push(item);
            }
        });

        displayResults(results, query);
    }

    // 显示搜索结果
    function displayResults(results, query) {
        // 显示统计信息
        let stats = results.length + ' 条相关条目';
        $('#search-stats').html(stats + '<hr/>');

        // 显示搜索结果
        let hitsHtml = '';
        if (results.length === 0) {
            hitsHtml = '<div id="search-hits-empty" class="search-hits-empty">未发现与 「' + query + '」 相关的内容</div>';
        } else {
            results.forEach(function(item) {
                hitsHtml += '<a href="' + item.url + '" class="search-hit-link">' + item.title + '</a>';
            });
        }
        $('#search-hits').html(hitsHtml);

        // 刷新滚动条
        if (scroll) {
            scroll.refresh();
        }
    }

    // 搜索输入事件
    $('#search-input').on('input', 'input', function() {
        performSearch($(this).val());
    });

    // 打开搜索窗口
    $('body').on('click', '.search', function(e) {
        e.stopPropagation();
        $('body').append('<div class="search-cover"></div>').css('overflow', 'hidden');

        $('.search-cover').on('touchmove', function(event){
            event.preventDefault();
        }, false);

        document.body.addEventListener('touchmove', handler, { passive: false });
        $('.search-window').toggle();
        $('#search-input').find('input').focus();

        let height = $('.search-content').outerHeight();
        $('.search-scroll').css('height', 'calc(100% - ' + height + 'px)');
        scroll = new IScroll('.search-scroll', {
            scrollbars: true,
            mouseWheel: true,
            fadeScrollbars: true,
            resizePolling: 60
        });
    });

    // 关闭搜索窗口
    $('body').on('click', '.search-close-icon', function() {
        $('.search-window').hide();
        $('.search-cover').remove();
        document.body.removeEventListener('touchmove', handler, { passive: false });
        $('body').css('overflow', 'auto');
        $('#search-input').find('input').val('');
        $('#search-stats').empty();
        $('#search-hits').empty();
        $('#search-pagination').empty();
        if (scroll) {
            scroll.destroy();
            scroll = null;
        }
    });
});

function handler(event) {
    event.preventDefault();
    event.stopPropagation();
}
