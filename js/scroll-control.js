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
            
            // 在當前容器中查找selection元素
            const selections = container.querySelectorAll('.swiper-wrapper .selection, .selection');
            console.log(`在 ${container.id} 中找到 ${selections.length} 個selection元素:`, selections);
            
            // 對每個selection元素添加滾動監聽器
            selections.forEach((selection, index) => {
                // 檢查是否已經添加過監聽器（避免重複添加）
                if (!selection.hasAttribute('data-scroll-initialized')) {
                    console.log(`為 ${container.id} 中第${index + 1}個selection元素添加滾動監聽器:`, selection);
                    
                    selection.addEventListener('wheel', (event) => {
                        event.preventDefault(); // 阻止默認滾動行為

                        const delta = event.deltaY; // 獲取滾動方向
                        const scrollDirection = delta > 0 ? 1 : -1; // 正數向下，負數向上
                        const scrollAmount = scrollStep * scrollDirection; // 計算滾動距離

                        // 計算目標滾動位置（對齊到最近的行）
                        const currentScroll = selection.scrollTop;
                        const targetScroll = Math.round((currentScroll + scrollAmount) / scrollStep) * scrollStep;

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