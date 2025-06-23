document.addEventListener('DOMContentLoaded', () => {
    const rowHeight = 40; // 每行標籤高度
    const gap = 8; // 標籤間距
    const scrollStep = rowHeight + gap; // 每次滾動距離（48px）
    
    // 初始化滾動控制
    function initScrollControl() {
        // 查找當前顯示的容器
        const visibleContainers = document.querySelectorAll('[id^="container-"]:not([style*="display: none"])');
        console.log('找到的可見容器:', visibleContainers);
        
        visibleContainers.forEach(container => {
            console.log('檢查容器:', container.id);
            
            // 多種選擇器策略，適應不同的結構
            const selectionSelectors = [
                '.swiper-wrapper .swiper-slide .axd_selections.selection',  // 手機版 swiper 結構
                '.swiper-wrapper .selection',  // 原始結構
                '.selection_scroll .swiper-slide .selection',  // 另一種可能結構
                '.selection',  // 直接查找 selection
                '.axd_selections.selection'  // 具體的 selection 類
            ];
            
            let selections = [];
            
            // 嘗試每種選擇器
            for (const selector of selectionSelectors) {
                const elements = container.querySelectorAll(selector);
                if (elements.length > 0) {
                    selections = Array.from(elements);
                    console.log(`在 ${container.id} 中使用選擇器 "${selector}" 找到 ${selections.length} 個selection元素:`, selections);
                    break;
                }
            }
            
            // 如果還是沒找到，嘗試查找所有可滾動元素
            if (selections.length === 0) {
                const scrollableElements = Array.from(container.querySelectorAll('*')).filter(el => {
                    const style = window.getComputedStyle(el);
                    return el.scrollHeight > el.clientHeight && 
                           (style.overflow === 'auto' || style.overflow === 'scroll' || 
                            style.overflowY === 'auto' || style.overflowY === 'scroll');
                });
                
                if (scrollableElements.length > 0) {
                    selections = scrollableElements;
                    console.log(`在 ${container.id} 中找到 ${selections.length} 個可滾動元素:`, selections);
                }
            }
            
            // 對每個selection元素添加滾動監聽器
            selections.forEach((selection, index) => {
                // 檢查是否已經添加過監聽器（避免重複添加）
                if (!selection.hasAttribute('data-scroll-initialized')) {
                    console.log(`為 ${container.id} 中第${index + 1}個selection元素添加滾動監聽器:`, selection);
                    console.log('元素類名:', selection.className);
                    console.log('元素滾動信息:', {
                        scrollHeight: selection.scrollHeight,
                        clientHeight: selection.clientHeight,
                        canScroll: selection.scrollHeight > selection.clientHeight
                    });
                    
                    selection.addEventListener('wheel', (event) => {
                        event.preventDefault(); // 阻止默認滾動行為
                        console.log('滾動事件觸發在元素:', selection.className);

                        const delta = event.deltaY; // 獲取滾動方向
                        const scrollDirection = delta > 0 ? 1 : -1; // 正數向下，負數向上
                        const scrollAmount = scrollStep * scrollDirection; // 計算滾動距離

                        // 計算目標滾動位置（對齊到最近的行）
                        const currentScroll = selection.scrollTop;
                        const maxScroll = selection.scrollHeight - selection.clientHeight;
                        const targetScroll = Math.max(0, Math.min(maxScroll, 
                            Math.round((currentScroll + scrollAmount) / scrollStep) * scrollStep
                        ));
                        
                        console.log(`滾動: 當前=${currentScroll}, 目標=${targetScroll}, 最大=${maxScroll}`);

                        // 執行平滑滾動
                        selection.scrollTo({
                            top: targetScroll,
                            behavior: 'smooth'
                        });
                    });
                    
                    // 標記已初始化
                    selection.setAttribute('data-scroll-initialized', 'true');
                }
            });
            
            if (selections.length === 0) {
                console.warn(`在容器 ${container.id} 中沒有找到任何可滾動的selection元素`);
            }
        });
    }
    
    // 初始化
    initScrollControl();
    
    // 監聽DOM變化，當新容器出現時重新初始化
    const observer = new MutationObserver((mutations) => {
        let shouldReinit = false;
        
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || 
                (mutation.type === 'attributes' && mutation.attributeName === 'style')) {
                // 檢查是否有新的容器顯示
                const newContainers = document.querySelectorAll('[id^="container-"]:not([style*="display: none"])');
                if (newContainers.length > 0) {
                    shouldReinit = true;
                }
            }
        });
        
        if (shouldReinit) {
            console.log('檢測到容器變化，重新初始化滾動控制');
            initScrollControl();
        }
    });
    
    // 開始觀察整個文檔的變化
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
    });
    
    console.log('滾動控制初始化完成，正在監聽容器變化...');
})