document.addEventListener('DOMContentLoaded', () => {
    const rowHeight = 40; // 每行標籤高度
    const gap = 8; // 標籤間距
    const scrollStep = rowHeight + gap; // 每次滾動距離（48px）
    
    // 彈窗滾動鎖定管理
    let isModalOpen = false;
    let activeModal = null;
    
    // 檢測彈窗狀態
    function checkModalState() {
        // 常見的彈窗選擇器
        const modalSelectors = [
            '.modal:not([style*="display: none"])',
            '.popup:not([style*="display: none"])',
            '.overlay:not([style*="display: none"])',
            '.dialog:not([style*="display: none"])',
            '[class*="modal"]:not([style*="display: none"])',
            '[class*="popup"]:not([style*="display: none"])'
        ];
        
        let foundModal = null;
        for (const selector of modalSelectors) {
            const modal = document.querySelector(selector);
            if (modal && window.getComputedStyle(modal).display !== 'none') {
                foundModal = modal;
                break;
            }
        }
        
        const wasModalOpen = isModalOpen;
        isModalOpen = !!foundModal;
        activeModal = foundModal;
        
        if (wasModalOpen !== isModalOpen) {
            console.log(`彈窗狀態變化: ${isModalOpen ? '打開' : '關閉'}`, foundModal);
            
            if (isModalOpen) {
                // 彈窗打開時鎖定背景滾動
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.width = '100%';
            } else {
                // 彈窗關閉時恢復背景滾動
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
            }
        }
        
        return isModalOpen;
    }
    
    // 判斷元素是否在彈窗內
    function isElementInModal(element) {
        if (!isModalOpen || !activeModal) return false;
        
        return activeModal.contains(element);
    }
    
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
                    
                    // 對齊滾動位置的函數
                    function alignScrollPosition(element, isGentle = true) {
                        const currentScroll = element.scrollTop;
                        const maxScroll = element.scrollHeight - element.clientHeight;
                        
                        // 計算理想的對齊位置
                        let alignedScroll = Math.round(currentScroll / scrollStep) * scrollStep;
                        
                        // 檢查是否會導致底部內容顯示不完整
                        const remainingHeight = maxScroll - alignedScroll;
                        
                        // 如果剩餘高度不足一個完整的行高，則向上調整到前一個對齊點
                        if (remainingHeight > 0 && remainingHeight < scrollStep * 0.7) {
                            alignedScroll = Math.max(0, alignedScroll - scrollStep);
                            console.log(`底部高度不足，調整對齊位置: ${alignedScroll}, 剩餘高度: ${remainingHeight}`);
                        }
                        
                        // 確保不超出滾動範圍
                        alignedScroll = Math.max(0, Math.min(maxScroll, alignedScroll));
                        
                        // 調整吸附閾值，只有偏差較大時才吸附
                        const threshold = isGentle ? scrollStep * 0.3 : 1; // 溫和模式使用30%閾值
                        const distance = Math.abs(currentScroll - alignedScroll);
                        
                        if (distance > threshold) {
                            console.log(`對齊滾動: 當前=${currentScroll}, 對齊=${alignedScroll}, 距離=${distance}, 最大=${maxScroll}`);
                            
                            // 根據距離調整動畫時長，距離越小動畫越快
                            const animationDuration = Math.min(300, Math.max(100, distance * 3));
                            
                            element.scrollTo({
                                top: alignedScroll,
                                behavior: 'smooth'
                            });
                        }
                    }
                    
                    // 滾輪事件（電腦版）
                    selection.addEventListener('wheel', (event) => {
                        // 檢查彈窗狀態和滾動權限
                        checkModalState();
                        if (isModalOpen && !isElementInModal(selection)) {
                            event.preventDefault();
                            console.log('彈窗打開時阻止背景滾動');
                            return;
                        }
                        
                        event.preventDefault(); // 阻止默認滾動行為
                        console.log('滾輪事件觸發在元素:', selection.className);

                        const delta = event.deltaY; // 獲取滾動方向
                        const scrollDirection = delta > 0 ? 1 : -1; // 正數向下，負數向上
                        const scrollAmount = scrollStep * scrollDirection; // 計算滾動距離

                        // 計算目標滾動位置（對齊到最近的行）
                        const currentScroll = selection.scrollTop;
                        const maxScroll = selection.scrollHeight - selection.clientHeight;
                        let targetScroll = Math.round((currentScroll + scrollAmount) / scrollStep) * scrollStep;
                        
                        // 向下滾動時，檢查是否會導致底部內容顯示不完整
                        if (scrollDirection > 0) {
                            const remainingHeight = maxScroll - targetScroll;
                            
                            // 如果剩餘高度不足一個完整的行高，則不滾動到那個位置
                            if (remainingHeight > 0 && remainingHeight < scrollStep * 0.7) {
                                targetScroll = Math.max(0, targetScroll - scrollStep);
                                console.log(`滾輪向下: 底部高度不足，調整目標位置: ${targetScroll}, 剩餘高度: ${remainingHeight}`);
                            }
                        }
                        
                        // 確保不超出滾動範圍
                        targetScroll = Math.max(0, Math.min(maxScroll, targetScroll));
                        
                        console.log(`滾輪滾動: 當前=${currentScroll}, 目標=${targetScroll}, 最大=${maxScroll}`);

                        // 執行平滑滾動
                        selection.scrollTo({
                            top: targetScroll,
                            behavior: 'smooth'
                        });
                    });
                    
                    // 手機觸摸滾動支持
                    let touchStartY = 0;
                    let touchStartTime = 0;
                    let touchStartScroll = 0;
                    let isScrolling = false;
                    let scrollTimeout = null;
                    let lastScrollTop = 0;
                    let scrollVelocity = 0;
                    let lastScrollTime = Date.now();
                    
                    // 觸摸開始
                    selection.addEventListener('touchstart', (event) => {
                        // 檢查彈窗狀態
                        checkModalState();
                        if (isModalOpen && !isElementInModal(selection)) {
                            event.preventDefault();
                            console.log('彈窗打開時阻止背景觸摸');
                            return;
                        }
                        
                        touchStartY = event.touches[0].clientY;
                        touchStartTime = Date.now();
                        touchStartScroll = selection.scrollTop;
                        isScrolling = false;
                        scrollVelocity = 0;
                        lastScrollTop = selection.scrollTop;
                        lastScrollTime = Date.now();
                        
                        // 清除之前的對齊計時器
                        if (scrollTimeout) {
                            clearTimeout(scrollTimeout);
                        }
                    }, { passive: false }); // 改為非被動模式以支持preventDefault
                    
                    // 觸摸移動
                    selection.addEventListener('touchmove', (event) => {
                        // 檢查彈窗狀態
                        if (isModalOpen && !isElementInModal(selection)) {
                            event.preventDefault();
                            return;
                        }
                        
                        isScrolling = true;
                        
                        // 計算滾動速度
                        const currentTime = Date.now();
                        const currentScroll = selection.scrollTop;
                        const timeDiff = currentTime - lastScrollTime;
                        const scrollDiff = currentScroll - lastScrollTop;
                        
                        if (timeDiff > 0) {
                            scrollVelocity = Math.abs(scrollDiff / timeDiff); // px/ms
                        }
                        
                        lastScrollTop = currentScroll;
                        lastScrollTime = currentTime;
                    }, { passive: false }); // 改為非被動模式以支持preventDefault
                    
                    // 觸摸結束
                    selection.addEventListener('touchend', (event) => {
                        // 檢查彈窗狀態
                        if (isModalOpen && !isElementInModal(selection)) {
                            return;
                        }
                        
                        if (isScrolling) {
                            // 根據滾動速度調整延遲時間
                            // 高速滾動：延遲更長，讓慣性滾動完成
                            // 低速滾動：延遲較短，快速吸附
                            const baseDelay = 50;
                            const velocityDelay = Math.min(400, scrollVelocity * 300);
                            const totalDelay = baseDelay + velocityDelay;
                            
                            console.log(`觸摸結束: 速度=${scrollVelocity.toFixed(3)}, 延遲=${totalDelay}ms`);
                            
                            // 延遲對齊，等待慣性滾動結束
                            scrollTimeout = setTimeout(() => {
                                // 高速滾動時使用溫和吸附，低速滾動時使用精確吸附
                                const isGentle = scrollVelocity > 0.5;
                                alignScrollPosition(selection, isGentle);
                            }, totalDelay);
                        }
                    }, { passive: true });
                    
                    // 監聽滾動事件，處理慣性滾動結束後的對齊
                    let scrollEndTimeout = null;
                    let scrollCheckCount = 0;
                    let lastScrollPosition = 0;
                    
                    selection.addEventListener('scroll', () => {
                        // 檢查彈窗狀態
                        if (isModalOpen && !isElementInModal(selection)) {
                            return;
                        }
                        
                        // 清除之前的計時器
                        if (scrollEndTimeout) {
                            clearTimeout(scrollEndTimeout);
                        }
                        
                        const currentScroll = selection.scrollTop;
                        
                        // 檢查滾動是否真的停止了
                        if (Math.abs(currentScroll - lastScrollPosition) < 1) {
                            scrollCheckCount++;
                        } else {
                            scrollCheckCount = 0;
                        }
                        
                        lastScrollPosition = currentScroll;
                        
                        // 設置新的計時器，在滾動停止後對齊
                        // 如果連續3次檢查都沒有明顯移動，認為滾動已停止
                        const checkDelay = scrollCheckCount >= 3 ? 50 : 200;
                        
                        scrollEndTimeout = setTimeout(() => {
                            // 最終檢查：如果滾動位置沒有變化，進行溫和對齊
                            if (Math.abs(selection.scrollTop - lastScrollPosition) < 2) {
                                alignScrollPosition(selection, true);
                            }
                        }, checkDelay);
                    }, { passive: true });
                    
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
        let shouldCheckModal = false;
        
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || 
                (mutation.type === 'attributes' && mutation.attributeName === 'style')) {
                // 檢查是否有新的容器顯示
                const newContainers = document.querySelectorAll('[id^="container-"]:not([style*="display: none"])');
                if (newContainers.length > 0) {
                    shouldReinit = true;
                }
                
                // 檢查是否有彈窗狀態變化
                shouldCheckModal = true;
            }
        });
        
        if (shouldCheckModal) {
            checkModalState();
        }
        
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
    
    // 定期檢查彈窗狀態（備用機制）
    setInterval(checkModalState, 1000);
    
    console.log('滾動控制初始化完成，正在監聽容器變化...');
})